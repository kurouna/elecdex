; Made by e16c from lib/kit.e16.ts, lib/sound.e16.ts, view.e16.ts, fx.e16.ts, shots.e16.ts, ship.e16.ts, foes.e16.ts, level.e16.ts, boss.e16.ts, score.e16.ts, audio.e16.ts, weapons.e16.ts, foes2.e16.ts, eleclance.e16.ts, scenes.e16.ts, best.e16.ts, title.e16.ts, round.e16.ts, assets.e16.ts: do not edit.

; sprN at 0x0880
; sprShown at 0x0882
; padIs at 0x0884
; padWas at 0x0886
; padDown at 0x0888
; seed at 0x0acc
; muted at 0x0c8e
; opTook at 0x0c90
; scrolled at 0x0c92
; scrollSpeed at 0x0c94
; scrollFrac at 0x0c96
; loadedTop at 0x0c98
; holdTop at 0x0c9a
; holdRows at 0x0c9c
; logicalTop at 0x0c9e
; sway at 0x0ca0
; shakeLeft at 0x0ca2
; shakeX at 0x0ca4
; shakeY at 0x0ca6
; flashLeft at 0x0ca8
; waveLeft at 0x0caa
; wavePhase at 0x0cac
; waveSize at 0x0cae
; fxNext at 0x0e30
; itNext at 0x1012
; magnetNow at 0x101e
; buNext at 0x1438
; bulletCount at 0x143a
; bulletBoost at 0x143c
; bulletsMade at 0x143e
; targetX at 0x1440
; targetY at 0x1442
; grazes at 0x1444
; hitShip at 0x1446
; shipState at 0x14d8
; shipX at 0x14da
; shipY at 0x14dc
; tilt at 0x14de
; timer at 0x14e0
; guard at 0x14e2
; holdA at 0x14e4
; cooldown at 0x14e6
; tick at 0x14e8
; lives at 0x14ea
; bombs at 0x14ec
; volt at 0x14ee
; overdrive at 0x14f0
; bombing at 0x14f2
; lancing at 0x14f4
; lanceTop at 0x14f6
; power at 0x14f8
; round at 0x1728
; rank at 0x172a
; foePal at 0x172c
; killed at 0x172e
; killWorth at 0x1730
; killX at 0x1732
; killY at 0x1734
; lanceVictim at 0x1736
; bossBombed at 0x1738
; scriptAt at 0x173a
; scriptArg at 0x173c
; level at 0x173e
; bossFiring at 0x1752
; bossOn at 0x1754
; bossPhase at 0x1756
; bX at 0x1758
; bY at 0x175a
; bT at 0x175c
; spin at 0x175e
; chain at 0x1786
; chainLeft at 0x1788
; maxChain at 0x178a
; skims at 0x178c
; nextExtend at 0x178e
; shownLo at 0x1790
; shownHi at 0x1792
; shownChain at 0x1794
; shownSkims at 0x1796
; shownLives at 0x1798
; shownBombs at 0x179a
; shownVolt at 0x179c
; shownPower at 0x179e
; links at 0x17f4
; ringX at 0x17f6
; ringY at 0x17f8
; ringMax at 0x17fa
; ringT at 0x17fc
; seen at 0x1906
; frame at 0x1908
; banner at 0x1942
; warning at 0x1944
; clearT at 0x1946
; bossOnWas at 0x1948
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
fxKind = 0x0cb0 ; 64 bytes
fxX = 0x0cf0 ; 64 bytes
fxY = 0x0d30 ; 64 bytes
fxVX = 0x0d70 ; 64 bytes
fxVY = 0x0db0 ; 64 bytes
fxT = 0x0df0 ; 64 bytes
itKind = 0x0e32 ; 80 bytes
itX = 0x0e82 ; 80 bytes
itY = 0x0ed2 ; 80 bytes
itVX = 0x0f22 ; 80 bytes
itVY = 0x0f72 ; 80 bytes
itT = 0x0fc2 ; 80 bytes
caught = 0x1014 ; 10 bytes
farX = 0x1020 ; 20 bytes
farY = 0x1034 ; 20 bytes
buKind = 0x1048 ; 144 bytes
buX = 0x10d8 ; 144 bytes
buY = 0x1168 ; 144 bytes
buVX = 0x11f8 ; 144 bytes
buVY = 0x1288 ; 144 bytes
buLive = 0x1318 ; 144 bytes
buGrazed = 0x13a8 ; 144 bytes
sX = 0x1448 ; 36 bytes
sY = 0x146c ; 36 bytes
sVX = 0x1490 ; 36 bytes
sLive = 0x14b4 ; 36 bytes
fK = 0x14fa ; 48 bytes
fX = 0x152a ; 48 bytes
fY = 0x155a ; 48 bytes
fVX = 0x158a ; 48 bytes
fVY = 0x15ba ; 48 bytes
fHP = 0x15ea ; 48 bytes
fT = 0x161a ; 48 bytes
fP = 0x164a ; 48 bytes
fFlash = 0x167a ; 48 bytes
fBombed = 0x16aa ; 48 bytes
HALF = 0x16da ; 26 bytes
LIFE = 0x16f4 ; 26 bytes
WORTH = 0x170e ; 26 bytes
lv = 0x1740 ; 18 bytes
life = 0x1760 ; 6 bytes
flash = 0x1766 ; 6 bytes
PX = 0x176c ; 6 bytes
PY = 0x1772 ; 6 bytes
PHALF = 0x1778 ; 6 bytes
score = 0x177e ; 4 bytes
best = 0x1782 ; 4 bytes
mX = 0x17a0 ; 12 bytes
mY = 0x17ac ; 12 bytes
mVX = 0x17b8 ; 12 bytes
mVY = 0x17c4 ; 12 bytes
mT = 0x17d0 ; 12 bytes
linkFrom = 0x17dc ; 12 bytes
linkTo = 0x17e8 ; 12 bytes
serpentHead = 0x17fe ; 4 bytes
trail = 0x1802 ; 256 bytes
trailAt = 0x1902 ; 4 bytes
letters = 0x190a ; 6 bytes
bestScore = 0x1910 ; 20 bytes
bestName = 0x1924 ; 30 bytes

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
  ; scrolled = 0
  sw zero, 0x0c92(zero)
  ; scrollSpeed = 8
  li t0, 8
  sw t0, 0x0c94(zero)
  ; scrollFrac = 0
  sw zero, 0x0c96(zero)
  ; loadedTop = 0
  sw zero, 0x0c98(zero)
  ; holdTop = 0
  sw zero, 0x0c9a(zero)
  ; holdRows = 0
  sw zero, 0x0c9c(zero)
  ; logicalTop = 0
  sw zero, 0x0c9e(zero)
  ; sway = 0
  sw zero, 0x0ca0(zero)
  ; shakeLeft = 0
  sw zero, 0x0ca2(zero)
  ; shakeX = 0
  sw zero, 0x0ca4(zero)
  ; shakeY = 0
  sw zero, 0x0ca6(zero)
  ; flashLeft = 0
  sw zero, 0x0ca8(zero)
  ; waveLeft = 0
  sw zero, 0x0caa(zero)
  ; wavePhase = 0
  sw zero, 0x0cac(zero)
  ; waveSize = 0
  sw zero, 0x0cae(zero)
  ; fxNext = 0
  sw zero, 0x0e30(zero)
  ; itNext = 0
  sw zero, 0x1012(zero)
  ; magnetNow = 0
  sw zero, 0x101e(zero)
  ; buNext = 0
  sw zero, 0x1438(zero)
  ; bulletCount = 0
  sw zero, 0x143a(zero)
  ; bulletBoost = 0
  sw zero, 0x143c(zero)
  ; bulletsMade = 0
  sw zero, 0x143e(zero)
  ; targetX = 2560
  li t0, 2560
  sw t0, 0x1440(zero)
  ; targetY = 3800
  li t0, 3800
  sw t0, 0x1442(zero)
  ; grazes = 0
  sw zero, 0x1444(zero)
  ; hitShip = 0
  sw zero, 0x1446(zero)
  ; shipState = 0
  sw zero, 0x14d8(zero)
  ; shipX = 2560
  li t0, 2560
  sw t0, 0x14da(zero)
  ; shipY = 5000
  li t0, 5000
  sw t0, 0x14dc(zero)
  ; tilt = 0
  sw zero, 0x14de(zero)
  ; timer = 0
  sw zero, 0x14e0(zero)
  ; guard = 0
  sw zero, 0x14e2(zero)
  ; holdA = 0
  sw zero, 0x14e4(zero)
  ; cooldown = 0
  sw zero, 0x14e6(zero)
  ; tick = 0
  sw zero, 0x14e8(zero)
  ; lives = 3
  li t0, 3
  sw t0, 0x14ea(zero)
  ; bombs = 3
  li t0, 3
  sw t0, 0x14ec(zero)
  ; volt = 0
  sw zero, 0x14ee(zero)
  ; overdrive = 0
  sw zero, 0x14f0(zero)
  ; bombing = 0
  sw zero, 0x14f2(zero)
  ; lancing = 0
  sw zero, 0x14f4(zero)
  ; lanceTop = 0
  sw zero, 0x14f6(zero)
  ; power = 0
  sw zero, 0x14f8(zero)
  ; round = 1
  li t0, 1
  sw t0, 0x1728(zero)
  ; rank = 0
  sw zero, 0x172a(zero)
  ; foePal = 0
  sw zero, 0x172c(zero)
  ; killed = 0
  sw zero, 0x172e(zero)
  ; killWorth = 0
  sw zero, 0x1730(zero)
  ; killX = 0
  sw zero, 0x1732(zero)
  ; killY = 0
  sw zero, 0x1734(zero)
  ; lanceVictim = 65535
  li t0, 65535
  sw t0, 0x1736(zero)
  ; bossBombed = 0
  sw zero, 0x1738(zero)
  ; scriptAt = 0
  sw zero, 0x173a(zero)
  ; scriptArg = 0
  sw zero, 0x173c(zero)
  ; level = 1
  li t0, 1
  sw t0, 0x173e(zero)
  ; bossFiring = 0
  sw zero, 0x1752(zero)
  ; bossOn = 0
  sw zero, 0x1754(zero)
  ; bossPhase = 0
  sw zero, 0x1756(zero)
  ; bX = 0
  sw zero, 0x1758(zero)
  ; bY = 0
  sw zero, 0x175a(zero)
  ; bT = 0
  sw zero, 0x175c(zero)
  ; spin = 0
  sw zero, 0x175e(zero)
  ; chain = 0
  sw zero, 0x1786(zero)
  ; chainLeft = 0
  sw zero, 0x1788(zero)
  ; maxChain = 0
  sw zero, 0x178a(zero)
  ; skims = 0
  sw zero, 0x178c(zero)
  ; nextExtend = 5000
  li t0, 5000
  sw t0, 0x178e(zero)
  ; shownLo = 65535
  li t0, 65535
  sw t0, 0x1790(zero)
  ; shownHi = 65535
  li t0, 65535
  sw t0, 0x1792(zero)
  ; shownChain = 65535
  li t0, 65535
  sw t0, 0x1794(zero)
  ; shownSkims = 65535
  li t0, 65535
  sw t0, 0x1796(zero)
  ; shownLives = 65535
  li t0, 65535
  sw t0, 0x1798(zero)
  ; shownBombs = 65535
  li t0, 65535
  sw t0, 0x179a(zero)
  ; shownVolt = 65535
  li t0, 65535
  sw t0, 0x179c(zero)
  ; shownPower = 65535
  li t0, 65535
  sw t0, 0x179e(zero)
  ; links = 0
  sw zero, 0x17f4(zero)
  ; ringX = 0
  sw zero, 0x17f6(zero)
  ; ringY = 0
  sw zero, 0x17f8(zero)
  ; ringMax = 0
  sw zero, 0x17fa(zero)
  ; ringT = 0
  sw zero, 0x17fc(zero)
  ; seen = 0
  sw zero, 0x1906(zero)
  ; frame = 0
  sw zero, 0x1908(zero)
  ; banner = 0
  sw zero, 0x1942(zero)
  ; warning = 0
  sw zero, 0x1944(zero)
  ; clearT = 0
  sw zero, 0x1946(zero)
  ; bossOnWas = 0
  sw zero, 0x1948(zero)
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
  ; fxKind, fxX, fxY, fxVX, fxVY, fxT: 384 bytes of 0
  li t0, 0x0cb0
  li t1, 384
  mset t0, zero, t1
  ; itKind, itX, itY, itVX, itVY, itT: 480 bytes of 0
  li t0, 0x0e32
  li t1, 480
  mset t0, zero, t1
  ; caught: 10 bytes of 0
  li t0, 0x1014
  li t1, 10
  mset t0, zero, t1
  ; farX, farY, buKind, buX, buY, buVX, buVY, buLive, buGrazed: 1048 bytes of 0
  li t0, 0x1020
  li t1, 1048
  mset t0, zero, t1
  ; sX, sY, sVX, sLive: 144 bytes of 0
  li t0, 0x1448
  li t1, 144
  mset t0, zero, t1
  ; fK, fX, fY, fVX, fVY, fHP, fT, fP, fFlash, fBombed, HALF, LIFE, WORTH: 558 bytes of 0
  li t0, 0x14fa
  li t1, 558
  mset t0, zero, t1
  ; lv: 18 bytes of 0
  li t0, 0x1740
  li t1, 18
  mset t0, zero, t1
  ; life, flash, PX, PY, PHALF, score, best: 38 bytes of 0
  li t0, 0x1760
  li t1, 38
  mset t0, zero, t1
  ; mX, mY, mVX, mVY, mT, linkFrom, linkTo: 84 bytes of 0
  li t0, 0x17a0
  li t1, 84
  mset t0, zero, t1
  ; serpentHead, trail, trailAt: 264 bytes of 0
  li t0, 0x17fe
  li t1, 264
  mset t0, zero, t1
  ; letters, bestScore, bestName: 56 bytes of 0
  li t0, 0x190a
  li t1, 56
  mset t0, zero, t1
  ret

; lib/kit.e16.ts:95 bank(b) at -O1
;   b in a0
;   old in a1
bank:
  ; lib/kit.e16.ts:96  const old = peek16(IO_BANK)
  li t0, 65284
  lw a1, 0(t0)
  ; lib/kit.e16.ts:97  poke16(IO_BANK, b)
  li t0, 65284
  sw a0, 0(t0)
  ; lib/kit.e16.ts:98  return old
  mv a0, a1
.return:
  ret

; lib/kit.e16.ts:102 vpoke(at, v) at -O1
;   at in a0
;   v in a1
vpoke:
  ; lib/kit.e16.ts:103  poke16(VPAGE, at >> 12)
  srli t0, a0, 12
  li t1, 63490
  sw t0, 0(t1)
  ; lib/kit.e16.ts:104  poke16(VWIN + (at & 0xfff), v)
  andi t0, a0, 4095
  sw a1, -8192(t0)
.return:
  ret

; lib/kit.e16.ts:108 vfill(at, v, n) at -O1
;   at in a0
;   v in a1
;   n in a2
;   p in s1
;   k in a3
vfill:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/kit.e16.ts:109  while (n > 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:110  poke16(VPAGE, at >> 12)
  srli t0, a0, 12
  li t1, 63490
  sw t0, 0(t1)
  ; lib/kit.e16.ts:111  let p = VWIN + (at & 0xfff)
  andi t0, a0, 4095
  addi s1, t0, -8192
  ; lib/kit.e16.ts:112  let k = div(0x1000 - (at & 0xfff), 2)
  andi t0, a0, 4095
  li t1, 4096
  sub t1, t1, t0
  srli a3, t1, 1
  ; lib/kit.e16.ts:113  if (k > n) k = n
  bgeu a2, a3, .L5
  ; lib/kit.e16.ts:113  k = n
  mv a3, a2 ; k
.L5:
  ; lib/kit.e16.ts:114  n = wrap16(n - k)
  sub a2, a2, a3
  ; lib/kit.e16.ts:115  at = wrap16(at + k * 2)
  slli t0, a3, 1
  add a0, a0, t0
  ; lib/kit.e16.ts:116  while (k > 0) {
  j .L8
.L6:
  ; lib/kit.e16.ts:117  poke16(p, v)
  sw a1, 0(s1)
  ; lib/kit.e16.ts:118  p = wrap16(p + 2)
  addi s1, s1, 2
  ; lib/kit.e16.ts:119  k--
  addi a3, a3, -1
.L8:
  bltu zero, a3, .L6
.L3:
  bltu zero, a2, .L1
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/kit.e16.ts:125 dma(src, dst, len) at -O1
;   src in a0
;   dst in a1
;   len in a2
dma:
  ; lib/kit.e16.ts:126  poke16(DMASRC, src)
  li t0, 63536
  sw a0, 0(t0)
  ; lib/kit.e16.ts:127  poke16(DMADST, dst)
  li t0, 63538
  sw a1, 0(t0)
  ; lib/kit.e16.ts:128  poke16(DMALEN, len)
  li t0, 63540
  sw a2, 0(t0)
  ; lib/kit.e16.ts:129  poke16(DMACTRL, 1)
  li t0, 1
  li t1, 63542
  sw t0, 0(t1)
.return:
  ret

; lib/kit.e16.ts:136 load(b, src, dst, len) at -O1
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
  ; lib/kit.e16.ts:137  const old = bank(b)
  mv a0, s3
  call bank
  sw a0, 4(fp) ; old
  ; lib/kit.e16.ts:138  while (len > 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:139  let n = wrap16(0xe000 - src)
  lw t0, 0(fp) ; src
  li t1, 57344
  sub s2, t1, t0
  ; lib/kit.e16.ts:140  if (n > len) n = len
  bgeu s1, s2, .L5
  ; lib/kit.e16.ts:140  n = len
  mv s2, s1 ; n
.L5:
  ; lib/kit.e16.ts:141  dma(src, dst, n)
  lw a0, 0(fp)
  lw a1, 2(fp)
  mv a2, s2
  call dma
  ; lib/kit.e16.ts:142  len = wrap16(len - n)
  sub s1, s1, s2
  ; lib/kit.e16.ts:143  dst = wrap16(dst + n)
  lw t0, 2(fp) ; dst
  add t0, t0, s2
  sw t0, 2(fp) ; dst
  ; lib/kit.e16.ts:144  b++
  addi s3, s3, 1
  ; lib/kit.e16.ts:145  poke16(IO_BANK, b)
  li t0, 65284
  sw s3, 0(t0)
  ; lib/kit.e16.ts:146  src = WINDOW
  li t0, 49152
  sw t0, 0(fp) ; src
.L3:
  bltu zero, s1, .L1
  ; lib/kit.e16.ts:148  poke16(IO_BANK, old)
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

; lib/kit.e16.ts:152 palette(row, slot) at -O1
;   row in s1
;   slot in s2
palette:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; row
  mv s2, a1 ; slot
  ; lib/kit.e16.ts:153  load(PALETTES_BANK, PALETTES_AT + row * 32, PALS + slot * 32, 32)
  slli t0, s1, 5
  li t1, 49730
  add t1, t1, t0
  slli t0, s2, 5
  li t2, 50176
  add t2, t2, t0
  li a0, 261
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

; lib/kit.e16.ts:157 colour(slot, k, rgb) at -O1
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
  ; lib/kit.e16.ts:158  vpoke(PALS + slot * 32 + k * 2, rgb)
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

; lib/kit.e16.ts:165 palKeep(row, slot) at -O1
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
  ; lib/kit.e16.ts:166  const old = bank(PALETTES_BANK)
  li a0, 261
  call bank
  mv s0, a0 ; old
  ; lib/kit.e16.ts:167  let k: u16 = 0
  li s1, 0 ; k
  ; lib/kit.e16.ts:168  while (k < 16) {
  j .L3
.L1:
  ; lib/kit.e16.ts:169  palCopy[slot * 16 + k] = peek16(PALETTES_AT + row * 32 + k * 2)
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
  ; lib/kit.e16.ts:170  k++
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
  ; lib/kit.e16.ts:172  poke16(IO_BANK, old)
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

; lib/kit.e16.ts:179 palMix(slot, rgb, t) at -O1
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
  ; lib/kit.e16.ts:180  const u = 16 - t
  li t0, 16
  sub s1, t0, a2
  ; lib/kit.e16.ts:181  const r = (rgb & 31) * t
  andi t0, a1, 31
  mul t0, t0, a2
  sw t0, 0(fp) ; r
  ; lib/kit.e16.ts:182  const g = ((rgb >> 5) & 31) * t
  srli t0, a1, 5
  andi t0, t0, 31
  mul t0, t0, a2
  sw t0, 2(fp) ; g
  ; lib/kit.e16.ts:183  const b = ((rgb >> 10) & 31) * t
  srli t0, a1, 10
  andi t0, t0, 31
  mul t0, t0, a2
  sw t0, 4(fp) ; b
  ; lib/kit.e16.ts:184  poke16(VPAGE, (PALS + slot * 32) >> 12)
  slli t0, a0, 5
  li t1, 50176
  add t1, t1, t0
  srli t1, t1, 12
  li t0, 63490
  sw t1, 0(t0)
  ; lib/kit.e16.ts:185  let p = VWIN + ((PALS + slot * 32 + 2) & 0xfff)
  slli t0, a0, 5
  li t1, 50176
  add t1, t1, t0
  addi t1, t1, 2
  andi t1, t1, 4095
  addi s2, t1, -8192
  ; lib/kit.e16.ts:186  let k = slot * 16 + 1
  slli t0, a0, 4
  addi a3, t0, 1
  ; lib/kit.e16.ts:187  const end = slot * 16 + 16
  slli t0, a0, 4
  addi t0, t0, 16
  sw t0, 6(fp) ; end
  ; lib/kit.e16.ts:188  while (k < end) {
  j .L3
.L1:
  ; lib/kit.e16.ts:189  const c = palCopy[k]
  slli t0, a3, 1
  lw s3, palCopy(t0)
  ; lib/kit.e16.ts:190  const mr = ((c & 31) * u + r) >> 4
  andi t0, s3, 31
  mul t0, t0, s1
  lw t1, 0(fp) ; r
  add t0, t0, t1
  srli t0, t0, 4
  sw t0, 8(fp) ; mr
  ; lib/kit.e16.ts:191  const mg = (((c >> 5) & 31) * u + g) >> 4
  srli t0, s3, 5
  andi t0, t0, 31
  mul t0, t0, s1
  lw t1, 2(fp) ; g
  add t0, t0, t1
  srli t0, t0, 4
  sw t0, 10(fp) ; mg
  ; lib/kit.e16.ts:192  const mb = (((c >> 10) & 31) * u + b) >> 4
  srli t0, s3, 10
  andi t0, t0, 31
  mul t0, t0, s1
  lw t1, 4(fp) ; b
  add t0, t0, t1
  srli t0, t0, 4
  sw t0, 12(fp) ; mb
  ; lib/kit.e16.ts:193  poke16(p, mr | (mg << 5) | (mb << 10))
  lw t0, 10(fp) ; mg
  slli t0, t0, 5
  lw t1, 8(fp) ; mr
  or t1, t1, t0
  lw t0, 12(fp) ; mb
  slli t0, t0, 10
  or t1, t1, t0
  sw t1, 0(s2)
  ; lib/kit.e16.ts:194  p = wrap16(p + 2)
  addi s2, s2, 2
  ; lib/kit.e16.ts:195  k++
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

; lib/kit.e16.ts:200 mix(a, b, t) at -O1
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
  ; lib/kit.e16.ts:201  const r = mixPart(a & 31, b & 31, t)
  andi t0, s1, 31
  andi t1, s2, 31
  mv a0, t0
  mv a1, t1
  mv a2, s3
  call mixPart
  sw a0, 0(fp) ; r
  ; lib/kit.e16.ts:202  const g = mixPart((a >> 5) & 31, (b >> 5) & 31, t)
  srli t0, s1, 5
  andi t0, t0, 31
  srli t1, s2, 5
  andi t1, t1, 31
  mv a0, t0
  mv a1, t1
  mv a2, s3
  call mixPart
  sw a0, 2(fp) ; g
  ; lib/kit.e16.ts:203  const bl = mixPart((a >> 10) & 31, (b >> 10) & 31, t)
  srli t0, s1, 10
  andi t0, t0, 31
  srli t1, s2, 10
  andi t1, t1, 31
  mv a0, t0
  mv a1, t1
  mv a2, s3
  call mixPart
  sw a0, 4(fp) ; bl
  ; lib/kit.e16.ts:204  return r | (g << 5) | (bl << 10)
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

; lib/kit.e16.ts:207 mixPart(a, b, t) at -O1
;   a in a0
;   b in a1
;   t in a2
mixPart:
  ; lib/kit.e16.ts:208  return (a * (16 - t) + b * t) >> 4
  li t0, 16
  sub t0, t0, a2
  mul t0, a0, t0
  mul t1, a1, a2
  add t0, t0, t1
  srli a0, t0, 4
.return:
  ret

; lib/kit.e16.ts:214 cellAt(layer, x, y) at -O1
;   layer in a0
;   x in a1
;   y in a2
cellAt:
  ; lib/kit.e16.ts:215  return (layer === 0 ? MAP0 : MAP1) + ((y & 63) << 7) + ((x & 63) << 1)
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

; lib/kit.e16.ts:222 mapRow(b, src, layer, y) at -O1
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
  ; lib/kit.e16.ts:223  const old = bank(b)
  mv a0, s1
  call bank
  sw a0, 2(fp) ; old
  ; lib/kit.e16.ts:224  dma(src, cellAt(layer, 0, y), 128)
  mv a0, s3
  li a1, 0
  lw a2, 0(fp)
  call cellAt
  mv a1, a0
  mv a0, s2
  li a2, 128
  call dma
  ; lib/kit.e16.ts:225  poke16(IO_BANK, old)
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

; lib/kit.e16.ts:229 text(at, s, font) at -O1
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
  ; lib/kit.e16.ts:230  let c = peek(s)
  lbu s3, 0(s1)
  ; lib/kit.e16.ts:231  while (c !== 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:232  vpoke(at, font + c - 32)
  add t0, s0, s3
  mv a0, s2
  addi a1, t0, -32
  call vpoke
  ; lib/kit.e16.ts:233  at = wrap16(at + 2)
  addi s2, s2, 2
  ; lib/kit.e16.ts:234  s++
  addi s1, s1, 1
  ; lib/kit.e16.ts:235  c = peek(s)
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

; lib/kit.e16.ts:240 number(at, n, digits, zero) at -O1
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
  ; lib/kit.e16.ts:241  at = wrap16(at + digits * 2)
  slli t0, s2, 1
  add s1, s1, t0
  ; lib/kit.e16.ts:242  while (digits > 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:243  at = wrap16(at - 2)
  addi s1, s1, -2
  ; lib/kit.e16.ts:245  const q = div(n, 10)
  li t0, 10
  divu t0, s3, t0
  sw t0, 0(fp) ; q
  ; lib/kit.e16.ts:246  vpoke(at, wrap16(zero + n - q * 10))
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
  ; lib/kit.e16.ts:247  n = q
  lw s3, 0(fp) ; q
  ; lib/kit.e16.ts:248  digits--
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

; lib/kit.e16.ts:260 sprBegin() at -O1
sprBegin:
  ; lib/kit.e16.ts:261  sprN = 0
  sw zero, 0x0880(zero)
.return:
  ret

; lib/kit.e16.ts:265 spr(x, y, tile, size) at -O1
;   x in a0
;   y in a1
;   tile in a2
;   size in a3
;   k in s1
spr:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/kit.e16.ts:266  if (sprN >= 128) return
  lw t0, 0x0880(zero)
  li t1, 128
  bltu t0, t1, .L1
  ; lib/kit.e16.ts:266  return
  j .return
.L1:
  ; lib/kit.e16.ts:267  const k = sprN << 2
  lw t0, 0x0880(zero)
  slli s1, t0, 2
  ; lib/kit.e16.ts:268  oam[k] = u16(x)
  slli t0, s1, 1
  sw a0, oam(t0)
  ; lib/kit.e16.ts:269  oam[k + 1] = u16(y)
  addi t0, s1, 1
  slli t0, t0, 1
  sw a1, oam(t0)
  ; lib/kit.e16.ts:270  oam[k + 2] = tile
  addi t0, s1, 2
  slli t0, t0, 1
  sw a2, oam(t0)
  ; lib/kit.e16.ts:271  oam[k + 3] = size
  addi t0, s1, 3
  slli t0, t0, 1
  sw a3, oam(t0)
  ; lib/kit.e16.ts:272  sprN++
  lw t0, 0x0880(zero)
  addi t0, t0, 1
  sw t0, 0x0880(zero)
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/kit.e16.ts:276 sprCount() at -O1
sprCount:
  ; lib/kit.e16.ts:277  return sprN
  lw a0, 0x0880(zero)
.return:
  ret

; lib/kit.e16.ts:285 sprShow() at -O1
;   k in s1
;   was in s2
;   n in s3
sprShow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; lib/kit.e16.ts:286  let k = sprN
  lw s1, 0x0880(zero)
  ; lib/kit.e16.ts:287  const was = sprShown
  lw s2, 0x0882(zero)
  ; lib/kit.e16.ts:288  while (k < was) {
  j .L3
.L1:
  ; lib/kit.e16.ts:289  oam[(k << 2) + 3] = S_NONE
  slli t0, s1, 2
  addi t0, t0, 3
  slli t0, t0, 1
  li t1, 3
  sw t1, oam(t0)
  ; lib/kit.e16.ts:290  k++
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
  ; lib/kit.e16.ts:292  sprShown = sprN
  lw t0, 0x0880(zero)
  sw t0, 0x0882(zero)
  ; lib/kit.e16.ts:293  const n = sprN > was ? sprN : was
  lw t0, 0x0880(zero)
  bgeu s2, t0, .L5
  lw t0, 0x0880(zero)
  j .L6
.L5:
  mv t0, s2
.L6:
  mv s3, t0 ; n
  ; lib/kit.e16.ts:294  if (n > 0) dma(addr(oam), OAM, n << 3)
  bgeu zero, s3, .L7
  ; lib/kit.e16.ts:294  dma(addr(oam), OAM, n << 3)
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

; lib/kit.e16.ts:308 padRead() at -O1
;   hit in a0
padRead:
  ; lib/kit.e16.ts:309  const hit = peek16(PADHIT)
  li t0, 63506
  lw a0, 0(t0)
  ; lib/kit.e16.ts:310  poke16(PADHIT, hit)
  li t0, 63506
  sw a0, 0(t0)
  ; lib/kit.e16.ts:311  padWas = padIs
  lw t0, 0x0884(zero)
  sw t0, 0x0886(zero)
  ; lib/kit.e16.ts:312  padIs = peek16(PAD)
  li t0, 63504
  lw t0, 0(t0)
  sw t0, 0x0884(zero)
  ; lib/kit.e16.ts:313  padDown = (hit | padIs) & ~padWas
  lw t0, 0x0884(zero)
  or t0, a0, t0
  lw t1, 0x0886(zero)
  not t1, t1
  and t0, t0, t1
  sw t0, 0x0888(zero)
.return:
  ret

; lib/kit.e16.ts:317 held(mask) at -O1
;   mask in a0
held:
  ; lib/kit.e16.ts:318  return (padIs & mask) === mask
  lw t0, 0x0884(zero)
  and t0, t0, a0
  sub t0, t0, a0
  seqz a0, t0
.return:
  ret

; lib/kit.e16.ts:322 pressed(mask) at -O1
;   mask in a0
pressed:
  ; lib/kit.e16.ts:323  return (padDown & mask) !== 0
  lw t0, 0x0888(zero)
  and t0, t0, a0
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; lib/kit.e16.ts:327 padNow() at -O1
padNow:
  ; lib/kit.e16.ts:328  return padIs
  lw a0, 0x0884(zero)
.return:
  ret

; lib/kit.e16.ts:340 kitInit() at -O1
;   old in s2
;   k in s1
kitInit:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; lib/kit.e16.ts:341  const old = bank(KIT_TABLES_BANK)
  li a0, 261
  call bank
  mv s2, a0 ; old
  ; lib/kit.e16.ts:342  let k: u16 = 0
  li s1, 0 ; k
  ; lib/kit.e16.ts:343  while (k < 256) {
  j .L3
.L1:
  ; lib/kit.e16.ts:344  sines[k] = peek16(KIT_SIN_AT + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  li t2, 49152
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, sines(t0)
  ; lib/kit.e16.ts:345  k++
  addi s1, s1, 1
.L3:
  li t0, 256
  bltu s1, t0, .L1
  ; lib/kit.e16.ts:347  k = 0
  li s1, 0 ; k
  ; lib/kit.e16.ts:348  while (k < 33) {
  j .L7
.L5:
  ; lib/kit.e16.ts:349  atans[k] = peek16(KIT_ATAN_AT + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  li t2, 49664
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, atans(t0)
  ; lib/kit.e16.ts:350  k++
  addi s1, s1, 1
.L7:
  li t0, 33
  bltu s1, t0, .L5
  ; lib/kit.e16.ts:352  poke16(IO_BANK, old)
  li t0, 65284
  sw s2, 0(t0)
  ; lib/kit.e16.ts:355  padIs = peek16(PAD)
  li t0, 63504
  lw t0, 0(t0)
  sw t0, 0x0884(zero)
  ; lib/kit.e16.ts:356  padWas = padIs
  sw t0, 0x0886(zero)
  ; lib/kit.e16.ts:357  padDown = 0
  sw zero, 0x0888(zero)
  ; lib/kit.e16.ts:358  poke16(PADHIT, 0xfff)
  li t0, 4095
  li t1, 63506
  sw t0, 0(t1)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; lib/kit.e16.ts:362 sin(a) at -O1
;   a in a0
sin:
  ; lib/kit.e16.ts:363  return i16(sines[a & 255])
  andi t0, a0, 255
  slli t0, t0, 1
  lw a0, sines(t0)
.return:
  ret

; lib/kit.e16.ts:367 cos(a) at -O1
;   a in a0
cos:
  ; lib/kit.e16.ts:368  return i16(sines[(a + 64) & 255])
  addi t0, a0, 64
  andi t0, t0, 255
  slli t0, t0, 1
  lw a0, sines(t0)
.return:
  ret

; lib/kit.e16.ts:372 aim(dx, dy) at -O1
;   dx in a0
;   dy in a1
;   ax in a2
;   ay in a3
;   a in s1
aim:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/kit.e16.ts:373  let ax = dx < 0 ? u16(-dx) : u16(dx)
  bge a0, zero, .L1
  neg t0, a0
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a2, t0 ; ax
  ; lib/kit.e16.ts:374  let ay = dy < 0 ? u16(-dy) : u16(dy)
  bge a1, zero, .L3
  neg t0, a1
  j .L4
.L3:
  mv t0, a1
.L4:
  mv a3, t0 ; ay
  ; lib/kit.e16.ts:375  if (ax === 0 && ay === 0) return 64
  bne a2, zero, .L8
  bne a3, zero, .L8
  ; lib/kit.e16.ts:375  return 64
  li a0, 64
  j .return
  ; lib/kit.e16.ts:378  while (ax >= 1024 || ay >= 1024) {
.L6:
  ; lib/kit.e16.ts:379  ax = ax >> 1
  srli a2, a2, 1
  ; lib/kit.e16.ts:380  ay = ay >> 1
  srli a3, a3, 1
.L8:
  li t0, 1024
  bgeu a2, t0, .L6
  li t0, 1024
  bgeu a3, t0, .L6
  ; lib/kit.e16.ts:383  let a: u16 = 0
  li s1, 0 ; a
  ; lib/kit.e16.ts:384  if (ax >= ay) a = atans[div(ay * 32 + (ax >> 1), ax)]
  bltu a2, a3, .L10
  ; lib/kit.e16.ts:384  a = atans[div(ay * 32 + (ax >> 1), ax)]
  slli t0, a3, 5
  srli t1, a2, 1
  add t0, t0, t1
  divu t0, t0, a2
  slli t0, t0, 1
  lw s1, atans(t0)
  j .L11
.L10:
  ; lib/kit.e16.ts:385  a = 64 - atans[div(ax * 32 + (ay >> 1), ay)]
  slli t0, a2, 5
  srli t1, a3, 1
  add t0, t0, t1
  divu t0, t0, a3
  slli t0, t0, 1
  lw t0, atans(t0)
  li t1, 64
  sub s1, t1, t0
.L11:
  ; lib/kit.e16.ts:386  if (dx < 0) a = 128 - a
  bge a0, zero, .L12
  ; lib/kit.e16.ts:386  a = 128 - a
  li t0, 128
  sub s1, t0, s1
.L12:
  ; lib/kit.e16.ts:387  if (dy < 0) a = wrap16(256 - a)
  bge a1, zero, .L13
  ; lib/kit.e16.ts:387  a = wrap16(256 - a)
  li t0, 256
  sub s1, t0, s1
.L13:
  ; lib/kit.e16.ts:388  return a & 255
  andi a0, s1, 255
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/kit.e16.ts:392 rand() at -O1
;   x in a0
rand:
  ; lib/kit.e16.ts:393  let x = seed
  lw a0, 0x0acc(zero)
  ; lib/kit.e16.ts:394  x = wrap16(x ^ (x << 7))
  slli t0, a0, 7
  xor a0, a0, t0
  ; lib/kit.e16.ts:395  x = x ^ (x >> 9)
  srli t0, a0, 9
  xor a0, a0, t0
  ; lib/kit.e16.ts:396  x = wrap16(x ^ (x << 8))
  slli t0, a0, 8
  xor a0, a0, t0
  ; lib/kit.e16.ts:397  seed = x
  sw a0, 0x0acc(zero)
  ; lib/kit.e16.ts:398  return x
.return:
  ret

; lib/kit.e16.ts:402 randBelow(n) at -O1
;   n in s1
randBelow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; lib/kit.e16.ts:403  return u16(mulShift(i16(rand() >> 8), i16(n), 8))
  call rand
  srli t0, a0, 8
  mulq a0, t0, s1, 8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; lib/kit.e16.ts:407 randSeed(s) at -O1
;   s in a0
randSeed:
  ; lib/kit.e16.ts:408  seed = s === 0 ? 0x1d2b : s
  bne a0, zero, .L1
  li t0, 7467
  j .L2
.L1:
  mv t0, a0
.L2:
  sw t0, 0x0acc(zero)
.return:
  ret

; lib/kit.e16.ts:414 scoreAdd(at, n) at -O1
;   at in a0
;   n in a1
;   lo in a2
;   hi in a3
scoreAdd:
  ; lib/kit.e16.ts:415  let lo = peek16(at) + n
  lw t0, 0(a0)
  add a2, t0, a1
  ; lib/kit.e16.ts:416  let hi = peek16(at + 2)
  lw a3, 2(a0)
  ; lib/kit.e16.ts:417  while (lo >= 10000) {
  j .L3
.L1:
  ; lib/kit.e16.ts:418  lo = lo - 10000
  li t0, 10000
  sub a2, a2, t0
  ; lib/kit.e16.ts:419  hi++
  addi a3, a3, 1
.L3:
  li t0, 10000
  bgeu a2, t0, .L1
  ; lib/kit.e16.ts:421  if (hi > 9999) {
  li t0, 9999
  bgeu t0, a3, .L5
  ; lib/kit.e16.ts:422  hi = 9999
  li a3, 9999 ; hi
  ; lib/kit.e16.ts:423  lo = 9999
  li a2, 9999 ; lo
.L5:
  ; lib/kit.e16.ts:425  poke16(at, lo)
  sw a2, 0(a0)
  ; lib/kit.e16.ts:426  poke16(at + 2, hi)
  sw a3, 2(a0)
.return:
  ret

; lib/kit.e16.ts:430 scoreMore(a, b) at -O1
;   a in a0
;   b in a1
;   ah in a2
;   bh in a3
scoreMore:
  ; lib/kit.e16.ts:431  const ah = peek16(a + 2)
  lw a2, 2(a0)
  ; lib/kit.e16.ts:432  const bh = peek16(b + 2)
  lw a3, 2(a1)
  ; lib/kit.e16.ts:433  return ah > bh || (ah === bh && peek16(a) > peek16(b))
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

; lib/kit.e16.ts:437 scoreShow(cell, at, zero) at -O1
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
  ; lib/kit.e16.ts:438  number(cell, peek16(at + 2), 4, zero)
  lw t0, 2(s2)
  mv a0, s1
  mv a1, t0
  li a2, 4
  mv a3, s3
  call number
  ; lib/kit.e16.ts:439  number(wrap16(cell + 8), peek16(at), 4, zero)
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

; lib/kit.e16.ts:445 saveRead(off) at -O1
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
  ; lib/kit.e16.ts:446  const old = bank(SAVE_BANK)
  li a0, 128
  call bank
  mv s2, a0 ; old
  ; lib/kit.e16.ts:447  const v = peek16(WINDOW + (off & SAVE_MASK))
  andi t0, s1, 8190
  li t1, 49152
  add t1, t1, t0
  lw s3, 0(t1)
  ; lib/kit.e16.ts:448  poke16(IO_BANK, old)
  li t0, 65284
  sw s2, 0(t0)
  ; lib/kit.e16.ts:449  return v
  mv a0, s3
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; lib/kit.e16.ts:453 saveWrite(off, v) at -O1
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
  ; lib/kit.e16.ts:454  const old = bank(SAVE_BANK)
  li a0, 128
  call bank
  mv s3, a0 ; old
  ; lib/kit.e16.ts:455  poke16(WINDOW + (off & SAVE_MASK), v)
  andi t0, s1, 8190
  li t1, 49152
  add t1, t1, t0
  sw s2, 0(t1)
  ; lib/kit.e16.ts:456  poke16(IO_BANK, old)
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

; view.e16.ts:95 palettesIn() at -O1
palettesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; view.e16.ts:96  slot(PAL_SPACE, SL_SPACE)
  li a0, 8
  li a1, 0
  call slot
  ; view.e16.ts:97  slot(PAL_NEBULA, SL_NEBULA)
  li a0, 9
  li a1, 1
  call slot
  ; view.e16.ts:98  slot(PAL_STATION, SL_STATION)
  li a0, 10
  li a1, 2
  call slot
  ; view.e16.ts:99  slot(PAL_HULL, SL_HULL)
  li a0, 11
  li a1, 3
  call slot
  ; view.e16.ts:100  slot(PAL_PANEL, SL_PANEL)
  li a0, 12
  li a1, 4
  call slot
  ; view.e16.ts:101  slot(PAL_TEXT, SL_TEXT)
  li a0, 13
  li a1, 5
  call slot
  ; view.e16.ts:102  slot(PAL_TEXT_GOLD, SL_GOLD)
  li a0, 14
  li a1, 6
  call slot
  ; view.e16.ts:103  slot(PAL_TEXT_RED, SL_RED)
  li a0, 15
  li a1, 7
  call slot
  ; view.e16.ts:104  slot(PAL_SHIP, SL_SHIP)
  li a0, 0
  li a1, 8
  call slot
  ; view.e16.ts:105  slot(PAL_SHOT, SL_SHOT)
  li a0, 1
  li a1, 9
  call slot
  ; view.e16.ts:106  slot(PAL_ENEMY, SL_ENEMY)
  li a0, 2
  li a1, 10
  call slot
  ; view.e16.ts:107  slot(PAL_HEAVY, SL_HEAVY)
  li a0, 3
  li a1, 11
  call slot
  ; view.e16.ts:108  slot(PAL_BULLET, SL_BULLET)
  li a0, 4
  li a1, 12
  call slot
  ; view.e16.ts:109  slot(PAL_FIRE, SL_FIRE)
  li a0, 5
  li a1, 13
  call slot
  ; view.e16.ts:110  slot(PAL_ITEM, SL_ITEM)
  li a0, 6
  li a1, 14
  call slot
  ; view.e16.ts:111  slot(PAL_FLASH, SL_FLASH)
  li a0, 7
  li a1, 15
  call slot
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; view.e16.ts:114 slot(row, s) at -O1
;   row in s1
;   s in s2
slot:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; row
  mv s2, a1 ; s
  ; view.e16.ts:115  palette(row, s)
  mv a0, s1
  mv a1, s2
  call palette
  ; view.e16.ts:116  palKeep(row, s)
  mv a0, s1
  mv a1, s2
  call palKeep
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; view.e16.ts:120 screenOn() at -O1
screenOn:
  ; view.e16.ts:121  poke16(VCTRL, 3)
  li t0, 3
  li t1, 63488
  sw t0, 0(t1)
  ; view.e16.ts:122  poke16(LAYERS, 7)
  li t0, 7
  li t1, 63528
  sw t0, 0(t1)
  ; view.e16.ts:123  poke16(BG0X, 0)
  li t0, 63520
  sw zero, 0(t0)
  ; view.e16.ts:124  poke16(BG0Y, 0)
  li t0, 63522
  sw zero, 0(t0)
  ; view.e16.ts:125  poke16(BG1X, 0)
  li t0, 63524
  sw zero, 0(t0)
  ; view.e16.ts:126  poke16(BG1Y, 0)
  li t0, 63526
  sw zero, 0(t0)
.return:
  ret

; view.e16.ts:130 mapsClear() at -O1
mapsClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; view.e16.ts:131  vfill(cellAt(0, 0, 0), STAGE_TILE, 4096)
  li a0, 32768
  li a1, 576
  li a2, 4096
  call vfill
  ; view.e16.ts:132  vfill(cellAt(1, 0, 0), PANELS_TILE, 4096)
  li a0, 40960
  li a1, 776
  li a2, 4096
  call vfill
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; view.e16.ts:136 bgTilesIn() at -O1
bgTilesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; view.e16.ts:137  load(STAGE_TILES_BANK, STAGE_TILES_AT, STAGE_TILE * 32, STAGE_TILES_BYTES)
  li a0, 265
  li a1, 49152
  li a2, 18432
  li a3, 5696
  call load
  ; view.e16.ts:138  load(PANELS_TILES_BANK, PANELS_TILES_AT, PANELS_TILE * 32, PANELS_TILES_BYTES)
  li a0, 275
  li a1, 53248
  li a2, 24832
  li a3, 544
  call load
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; view.e16.ts:142 panelsIn() at -O1
;   y in s1
panelsIn:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; view.e16.ts:143  let y: u16 = 0
  li s1, 0 ; y
  ; view.e16.ts:144  while (y < PANELS_H) {
  j .L3
.L1:
  ; view.e16.ts:145  mapRow(PANELS_MAP_BANK, WINDOW + y * MAP_ROW, 1, y)
  slli t0, s1, 7
  li t1, 49152
  add t1, t1, t0
  li a0, 276
  mv a1, t1
  li a2, 1
  mv a3, s1
  call mapRow
  ; view.e16.ts:146  y++
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; view.e16.ts:170 sourceRow(r) at -O1
;   r in a0
;   d in a1
sourceRow:
  ; view.e16.ts:171  const d = wrap16(holdTop - r)
  lw t0, 0x0c9a(zero)
  sub a1, t0, a0
  ; view.e16.ts:172  if (holdRows === 0 || d === 0 || d > 0x8000) return r
  lw t0, 0x0c9c(zero)
  beq t0, zero, .L2
  beq a1, zero, .L2
  li t0, 32768
  bgeu t0, a1, .L1
.L2:
  ; view.e16.ts:172  return r
  ret
.L1:
  ; view.e16.ts:173  return holdTop + holdRows - 1 - ((d - 1) % holdRows)
  lw t0, 0x0c9a(zero)
  lw t1, 0x0c9c(zero)
  add t0, t0, t1
  lw t1, 0x0c9c(zero)
  addi t2, a1, -1
  remu t2, t2, t1
  addi t0, t0, -1
  sub a0, t0, t2
.return:
  ret

; view.e16.ts:177 stageRow(r) at -O1
;   r in s1
;   src in s2
;   b in s3
stageRow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; r
  ; view.e16.ts:178  const src = sourceRow(r)
  mv a0, s1
  call sourceRow
  mv s2, a0 ; src
  ; view.e16.ts:179  const b = STAGE_MAP_BANK + div(src, STAGE_ROWS_PER_BANK)
  srli t0, s2, 6
  addi s3, t0, 266
  ; view.e16.ts:180  mapRow(b, WINDOW + (src % STAGE_ROWS_PER_BANK) * MAP_ROW, 0, r & 63)
  andi t0, s2, 63
  slli t0, t0, 7
  li t1, 49152
  add t1, t1, t0
  andi t0, s1, 63
  mv a0, s3
  mv a1, t1
  li a2, 0
  mv a3, t0
  call mapRow
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; view.e16.ts:184 stageStart() at -O1
;   r in s1
stageStart:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; view.e16.ts:185  scrolled = 0
  sw zero, 0x0c92(zero)
  ; view.e16.ts:186  scrollFrac = 0
  sw zero, 0x0c96(zero)
  ; view.e16.ts:187  holdRows = 0
  sw zero, 0x0c9c(zero)
  ; view.e16.ts:188  scrollSpeed = 8
  li t0, 8
  sw t0, 0x0c94(zero)
  ; view.e16.ts:189  const top = STAGE_H - 36
  ; view.e16.ts:190  logicalTop = top
  li t0, 572
  sw t0, 0x0c9e(zero)
  ; view.e16.ts:191  let r = top - 2
  li s1, 570 ; r
  ; view.e16.ts:192  while (r < STAGE_H) {
  j .L3
.L1:
  ; view.e16.ts:193  stageRow(r)
  mv a0, s1
  call stageRow
  ; view.e16.ts:194  r++
  addi s1, s1, 1
.L3:
  li t0, 608
  bltu s1, t0, .L1
  ; view.e16.ts:196  loadedTop = top - 2
  li t0, 570
  sw t0, 0x0c98(zero)
  ; view.e16.ts:197  stageScroll()
  call stageScroll
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; view.e16.ts:201 stageHold(top) at -O1
;   top in a0
stageHold:
  ; view.e16.ts:202  holdTop = top
  sw a0, 0x0c9a(zero)
  ; view.e16.ts:203  holdRows = 64
  li t0, 64
  sw t0, 0x0c9c(zero)
.return:
  ret

; view.e16.ts:210 stageRelease() at -O1
;   laps in a0
stageRelease:
  ; view.e16.ts:211  const laps = u16(i16(wrap16(holdTop - logicalTop)) >> 6)
  lw t0, 0x0c9a(zero)
  lw t1, 0x0c9e(zero)
  sub t0, t0, t1
  srai a0, t0, 6
  ; view.e16.ts:212  scrolled = wrap16(scrolled - laps * 512)
  lw t0, 0x0c92(zero)
  slli t1, a0, 9
  sub t0, t0, t1
  sw t0, 0x0c92(zero)
  ; view.e16.ts:213  loadedTop = wrap16(loadedTop + laps * 64)
  lw t0, 0x0c98(zero)
  slli t1, a0, 6
  add t0, t0, t1
  sw t0, 0x0c98(zero)
  ; view.e16.ts:214  logicalTop = wrap16(logicalTop + laps * 64)
  lw t0, 0x0c9e(zero)
  slli t1, a0, 6
  add t0, t0, t1
  sw t0, 0x0c9e(zero)
  ; view.e16.ts:215  holdRows = 0
  sw zero, 0x0c9c(zero)
.return:
  ret

; view.e16.ts:219 stageStep() at -O1
;   pixelTop in s1
stageStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; view.e16.ts:220  scrollFrac = scrollFrac + scrollSpeed
  lw t0, 0x0c96(zero)
  lw t1, 0x0c94(zero)
  add t0, t0, t1
  sw t0, 0x0c96(zero)
  ; view.e16.ts:221  scrolled = scrolled + (scrollFrac >> 4)
  lw t0, 0x0c92(zero)
  lw t1, 0x0c96(zero)
  srli t1, t1, 4
  add t0, t0, t1
  sw t0, 0x0c92(zero)
  ; view.e16.ts:222  scrollFrac = scrollFrac & 15
  lw t0, 0x0c96(zero)
  andi t0, t0, 15
  sw t0, 0x0c96(zero)
  ; view.e16.ts:224  const pixelTop = wrap16(STAGE_H * 8 - 288 - scrolled)
  lw t0, 0x0c92(zero)
  li t1, 4576
  sub s1, t1, t0
  ; view.e16.ts:225  logicalTop = u16(i16(pixelTop) >> 3)
  srai t0, s1, 3
  sw t0, 0x0c9e(zero)
  ; view.e16.ts:227  while (i16(wrap16(loadedTop - logicalTop)) > -2) {
  j .L3
.L1:
  ; view.e16.ts:228  loadedTop = wrap16(loadedTop - 1)
  lw t0, 0x0c98(zero)
  addi t0, t0, -1
  sw t0, 0x0c98(zero)
  ; view.e16.ts:229  stageRow(loadedTop)
  mv a0, t0
  call stageRow
.L3:
  lw t0, 0x0c98(zero)
  lw t1, 0x0c9e(zero)
  sub t0, t0, t1
  li t1, 65534
  blt t1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; view.e16.ts:234 stageSpeed(s) at -O1
;   s in a0
stageSpeed:
  ; view.e16.ts:235  scrollSpeed = s
  sw a0, 0x0c94(zero)
.return:
  ret

; view.e16.ts:245 stageScroll() at -O1
;   y in a0
stageScroll:
  ; view.e16.ts:246  const y = wrap16(STAGE_H * 8 - 288 - scrolled)
  lw t0, 0x0c92(zero)
  li t1, 4576
  sub a0, t1, t0
  ; view.e16.ts:247  poke16(BG0Y, (y + u16(shakeY)) & 511)
  lw t0, 0x0ca6(zero)
  add t0, a0, t0
  andi t0, t0, 511
  li t1, 63522
  sw t0, 0(t1)
  ; view.e16.ts:248  if (waveLeft === 0) poke16(BG0X, u16(sway + shakeX) & 511)
  lw t0, 0x0caa(zero)
  bne t0, zero, .L1
  ; view.e16.ts:248  poke16(BG0X, u16(sway + shakeX) & 511)
  lw t0, 0x0ca0(zero)
  lw t1, 0x0ca4(zero)
  add t0, t0, t1
  andi t0, t0, 511
  li t1, 63520
  sw t0, 0(t1)
.L1:
.return:
  ret

; view.e16.ts:252 stageSway(shipX) at -O1
;   shipX in a0
stageSway:
  ; view.e16.ts:253  sway = (shipX - 160) >> 3
  addi t0, a0, -160
  srai t0, t0, 3
  sw t0, 0x0ca0(zero)
.return:
  ret

; view.e16.ts:257 shake(frames) at -O1
;   frames in a0
shake:
  ; view.e16.ts:258  if (frames > shakeLeft) shakeLeft = frames
  lw t0, 0x0ca2(zero)
  bgeu t0, a0, .L1
  ; view.e16.ts:258  shakeLeft = frames
  sw a0, 0x0ca2(zero)
.L1:
.return:
  ret

; view.e16.ts:262 shakeStep() at -O1
;   r in a0
;   size in a1
shakeStep:
  ; view.e16.ts:263  if (shakeLeft === 0) {
  lw t0, 0x0ca2(zero)
  bne t0, zero, .L1
  ; view.e16.ts:264  shakeX = 0
  sw zero, 0x0ca4(zero)
  ; view.e16.ts:265  shakeY = 0
  sw zero, 0x0ca6(zero)
  ; view.e16.ts:266  return
  ret
.L1:
  ; view.e16.ts:268  shakeLeft--
  lw t0, 0x0ca2(zero)
  addi t0, t0, -1
  sw t0, 0x0ca2(zero)
  ; view.e16.ts:269  const r = shakeLeft & 3
  andi a0, t0, 3
  ; view.e16.ts:270  const size: i16 = shakeLeft > 8 ? 3 : shakeLeft > 3 ? 2 : 1
  lw t0, 0x0ca2(zero)
  li t1, 8
  bgeu t1, t0, .L2
  li t0, 3
  j .L3
.L2:
  lw t0, 0x0ca2(zero)
  li t1, 3
  bgeu t1, t0, .L4
  li t0, 2
  j .L5
.L4:
  li t0, 1
.L5:
.L3:
  mv a1, t0 ; size
  ; view.e16.ts:271  shakeX = r === 0 ? size : r === 2 ? -size : 0
  bne a0, zero, .L6
  mv t0, a1
  j .L7
.L6:
  li t0, 2
  bne a0, t0, .L8
  neg t0, a1
  j .L9
.L8:
  li t0, 0
.L9:
.L7:
  sw t0, 0x0ca4(zero)
  ; view.e16.ts:272  shakeY = r === 1 ? size : r === 3 ? -size : 0
  li t0, 1
  bne a0, t0, .L10
  mv t0, a1
  j .L11
.L10:
  li t0, 3
  bne a0, t0, .L12
  neg t0, a1
  j .L13
.L12:
  li t0, 0
.L13:
.L11:
  sw t0, 0x0ca6(zero)
.return:
  ret

; view.e16.ts:275 shakeDX() at -O1
shakeDX:
  ; view.e16.ts:276  return shakeX
  lw a0, 0x0ca4(zero)
.return:
  ret

; view.e16.ts:279 shakeDY() at -O1
shakeDY:
  ; view.e16.ts:280  return shakeY
  lw a0, 0x0ca6(zero)
.return:
  ret

; view.e16.ts:288 flashScreen(frames) at -O1
;   frames in a0
flashScreen:
  ; view.e16.ts:289  flashLeft = frames > 16 ? 16 : frames
  li t0, 16
  bgeu t0, a0, .L1
  li t0, 16
  j .L2
.L1:
  mv t0, a0
.L2:
  sw t0, 0x0ca8(zero)
.return:
  ret

; view.e16.ts:293 flashStep() at -O1
;   s in s1
flashStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; view.e16.ts:294  if (flashLeft === 0) return
  lw t0, 0x0ca8(zero)
  bne t0, zero, .L1
  ; view.e16.ts:294  return
  j .return
.L1:
  ; view.e16.ts:295  flashLeft--
  lw t0, 0x0ca8(zero)
  addi t0, t0, -1
  sw t0, 0x0ca8(zero)
  ; view.e16.ts:296  let s: u16 = 0
  li s1, 0 ; s
  ; view.e16.ts:297  while (s < 16) {
  j .L4
.L2:
  ; view.e16.ts:299  if (s < 4 || s >= 8) palMix(s, 0x7fff, flashLeft)
  li t0, 4
  bltu s1, t0, .L7
  li t0, 8
  bltu s1, t0, .L6
.L7:
  ; view.e16.ts:299  palMix(s, 0x7fff, flashLeft)
  lw t0, 0x0ca8(zero)
  mv a0, s1
  li a1, 32767
  mv a2, t0
  call palMix
.L6:
  ; view.e16.ts:300  s++
  addi s1, s1, 1
.L4:
  li t0, 16
  bltu s1, t0, .L2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; view.e16.ts:314 wave(frames, size) at -O1
;   frames in s1
;   size in s2
wave:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; frames
  mv s2, a1 ; size
  ; view.e16.ts:315  waveLeft = frames
  sw s1, 0x0caa(zero)
  ; view.e16.ts:316  waveSize = size
  sw s2, 0x0cae(zero)
  ; view.e16.ts:317  waveFill()
  call waveFill
  ; view.e16.ts:318  raster(1)
  li a0, 1
  call raster
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; view.e16.ts:322 waveStep() at -O1
waveStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; view.e16.ts:323  if (waveLeft === 0) return
  lw t0, 0x0caa(zero)
  bne t0, zero, .L1
  ; view.e16.ts:323  return
  j .return
.L1:
  ; view.e16.ts:324  waveLeft--
  lw t0, 0x0caa(zero)
  addi t0, t0, -1
  sw t0, 0x0caa(zero)
  ; view.e16.ts:325  wavePhase = wavePhase + 5
  lw t0, 0x0cac(zero)
  addi t0, t0, 5
  sw t0, 0x0cac(zero)
  ; view.e16.ts:326  if (waveLeft === 0) {
  lw t0, 0x0caa(zero)
  bne t0, zero, .L2
  ; view.e16.ts:327  raster(0)
  li a0, 0
  call raster
  ; view.e16.ts:328  return
  j .return
.L2:
  ; view.e16.ts:330  waveFill()
  call waveFill
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; view.e16.ts:337 waveFill() at -O1
;   base in s2
;   fade in s3
;   k in s1
;   s in 0(fp)
;   off in 2(fp)
waveFill:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; view.e16.ts:338  const base = u16(sway + shakeX) & 511
  lw t0, 0x0ca0(zero)
  lw t1, 0x0ca4(zero)
  add t0, t0, t1
  andi s2, t0, 511
  ; view.e16.ts:339  const fade = i16(waveLeft < 16 ? waveLeft : 16)
  lw t0, 0x0caa(zero)
  li t1, 16
  bgeu t0, t1, .L1
  lw t0, 0x0caa(zero)
  j .L2
.L1:
  li t0, 16
.L2:
  mv s3, t0 ; fade
  ; view.e16.ts:340  let k: u16 = 0
  li s1, 0 ; k
  ; view.e16.ts:341  while (k < RASTER_BANDS) {
  j .L5
.L3:
  ; view.e16.ts:342  const s = sin(wavePhase + k * 14)
  lw t0, 0x0cac(zero)
  li t1, 14
  mul t1, s1, t1
  add a0, t0, t1
  call sin
  sw a0, 0(fp) ; s
  ; view.e16.ts:343  const off = mulShift(mulShift(s, i16(waveSize), 4), fade, 8)
  lw t0, 0x0cae(zero)
  lw t1, 0(fp) ; s
  mulq t1, t1, t0, 4
  mulq t1, t1, s3, 8
  sw t1, 2(fp) ; off
  ; view.e16.ts:344  poke16(RASTER + k * 2, (base + u16(off)) & 511)
  slli t0, s1, 1
  lw t1, 2(fp) ; off
  add t1, s2, t1
  andi t1, t1, 511
  sw t1, 528(t0)
  ; view.e16.ts:345  k++
  addi s1, s1, 1
.L5:
  li t0, 36
  bltu s1, t0, .L3
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; view.e16.ts:352 say(x, y, s, sl) at -O1
;   x in s1
;   y in s2
;   s in s3
;   sl in s0
say:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; s
  mv s0, a3 ; sl
  ; view.e16.ts:353  text(cellAt(1, x, y), s, FONT_TILE | (sl << 10) | 0x8000)
  li a0, 1
  mv a1, s1
  mv a2, s2
  call cellAt
  slli t0, s0, 10
  li t1, 437
  or t1, t1, t0
  li t0, 32768
  or t1, t1, t0
  mv a1, s3
  mv a2, t1
  call text
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; view.e16.ts:357 unsay(x, y, n) at -O1
;   x in s1
;   y in s2
;   n in s3
unsay:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; n
  ; view.e16.ts:358  vfill(cellAt(1, x, y), PANELS_TILE, n)
  li a0, 1
  mv a1, s1
  mv a2, s2
  call cellAt
  li a1, 776
  mv a2, s3
  call vfill
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; view.e16.ts:362 fieldClear() at -O1
;   y in s1
fieldClear:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; view.e16.ts:363  let y: u16 = 1
  li s1, 1 ; y
  ; view.e16.ts:364  while (y < 36) {
  j .L3
.L1:
  ; view.e16.ts:365  unsay(6, y, 28)
  li a0, 6
  mv a1, s1
  li a2, 28
  call unsay
  ; view.e16.ts:366  y++
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; view.e16.ts:371 reached(row) at -O1
;   row in a0
reached:
  ; view.e16.ts:372  return i16(wrap16(logicalTop - row)) <= 0
  lw t0, 0x0c9e(zero)
  sub t0, t0, a0
  slt t0, zero, t0
  xori a0, t0, 1
.return:
  ret

; fx.e16.ts:37 fx(kind, x, y, v) at -O1
;   kind in a0
;   x in a1
;   y in a2
;   v in a3
;   k in s1
fx:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; fx.e16.ts:38  const k = fxNext
  lw s1, 0x0e30(zero)
  ; fx.e16.ts:39  fxNext = (fxNext + 1) & 31
  lw t0, 0x0e30(zero)
  addi t0, t0, 1
  andi t0, t0, 31
  sw t0, 0x0e30(zero)
  ; fx.e16.ts:40  fxKind[k] = kind
  slli t0, s1, 1
  sw a0, fxKind(t0)
  ; fx.e16.ts:41  fxX[k] = u16(x)
  slli t0, s1, 1
  sw a1, fxX(t0)
  ; fx.e16.ts:42  fxY[k] = u16(y)
  slli t0, s1, 1
  sw a2, fxY(t0)
  ; fx.e16.ts:43  fxT[k] = 0
  slli t0, s1, 1
  sw zero, fxT(t0)
  ; fx.e16.ts:45  fxVX[k] = u16(i16(v) >> 8)
  slli t0, s1, 1
  srai t1, a3, 8
  sw t1, fxVX(t0)
  ; fx.e16.ts:46  fxVY[k] = u16(i16(v << 8) >> 8)
  slli t0, s1, 1
  slli t1, a3, 8
  srai t1, t1, 8
  sw t1, fxVY(t0)
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; fx.e16.ts:50 vel(vx, vy) at -O1
;   vx in a0
;   vy in a1
vel:
  ; fx.e16.ts:51  return ((u16(vx) & 255) << 8) | (u16(vy) & 255)
  andi t0, a0, 255
  slli t0, t0, 8
  andi t1, a1, 255
  or a0, t0, t1
.return:
  ret

; fx.e16.ts:55 burst(x, y, big) at -O1
;   x in s2
;   y in s3
;   big in 0(fp)
;   n in 2(fp)
;   vx/s in s1
;   vy in 4(fp)
burst:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; x
  mv s3, a1 ; y
  sw a2, 0(fp) ; big
  ; fx.e16.ts:56  fx(big ? FX_BIG : FX_SMALL, x, y, 0)
  lw t0, 0(fp) ; big
  beqz t0, .L1
  li t0, 2
  j .L2
.L1:
  li t0, 1
.L2:
  mv a0, t0
  mv a1, s2
  mv a2, s3
  li a3, 0
  call fx
  ; fx.e16.ts:57  let n: u16 = big ? 6 : 3
  lw t0, 0(fp) ; big
  beqz t0, .L3
  li t0, 6
  j .L4
.L3:
  li t0, 3
.L4:
  sw t0, 2(fp) ; n
  ; fx.e16.ts:58  while (n > 0) {
  j .L7
.L5:
  ; fx.e16.ts:59  const vx = i16(randBelow(48)) - 24
  li a0, 48
  call randBelow
  addi s1, a0, -24
  ; fx.e16.ts:60  const vy = i16(randBelow(48)) - 30
  li a0, 48
  call randBelow
  addi t0, a0, -30
  sw t0, 4(fp) ; vy
  ; fx.e16.ts:61  fx(FX_BIT, x, y, vel(vx, vy))
  mv a0, s1
  lw a1, 4(fp)
  call vel
  mv a1, s2
  mv a2, s3
  mv a3, a0
  li a0, 3
  call fx
  ; fx.e16.ts:62  n--
  lw t0, 2(fp) ; n
  addi t0, t0, -1
  sw t0, 2(fp) ; n
.L7:
  lw t0, 2(fp) ; n
  bltu zero, t0, .L5
  ; fx.e16.ts:64  let s: u16 = big ? 4 : 2
  lw t0, 0(fp) ; big
  beqz t0, .L9
  li t0, 4
  j .L10
.L9:
  li t0, 2
.L10:
  mv s1, t0 ; vx/s
  ; fx.e16.ts:65  while (s > 0) {
  j .L13
.L11:
  ; fx.e16.ts:66  fx(FX_SPARK, x + i16(randBelow(160)) - 80, y + i16(randBelow(160)) - 80, 0)
  li a0, 160
  call randBelow
  add t0, s2, a0
  addi t0, t0, -80
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 160
  call randBelow
  add t0, s3, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  li a0, 4
  mv a1, t1
  addi a2, t0, -80
  li a3, 0
  call fx
  ; fx.e16.ts:67  s--
  addi s1, s1, -1
.L13:
  bltu zero, s1, .L11
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; fx.e16.ts:72 floatNumber(x, y, n) at -O1
;   x in s1
;   y in s2
;   n in s3
floatNumber:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; n
  ; fx.e16.ts:73  fx(FX_NUMBER, x, y, n)
  li a0, 5
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call fx
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:77 floatWord(x, y, kind) at -O1
;   x in s1
;   y in s2
;   kind in s3
floatWord:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; kind
  ; fx.e16.ts:78  fx(FX_WORD, x, y, kind)
  li a0, 6
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call fx
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:82 fxStep() at -O1
;   k in s1
fxStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; fx.e16.ts:83  let k: u16 = 0
  li s1, 0 ; k
  ; fx.e16.ts:84  while (k < FX_N) {
  j .L3
.L1:
  ; fx.e16.ts:85  if (fxKind[k] !== 0) fxOne(k)
  slli t0, s1, 1
  lw t0, fxKind(t0)
  beq t0, zero, .L5
  ; fx.e16.ts:85  fxOne(k)
  mv a0, s1
  call fxOne
.L5:
  ; fx.e16.ts:86  k++
  addi s1, s1, 1
.L3:
  li t0, 32
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; fx.e16.ts:90 fxOne(k) at -O1
;   k in s1
;   kind in s2
;   t in s3
fxOne:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  ; fx.e16.ts:91  const kind = fxKind[k]
  slli t0, s1, 1
  lw s2, fxKind(t0)
  ; fx.e16.ts:92  const t = fxT[k] + 1
  slli t0, s1, 1
  lw t0, fxT(t0)
  addi s3, t0, 1
  ; fx.e16.ts:93  fxT[k] = t
  slli t0, s1, 1
  sw s3, fxT(t0)
  ; fx.e16.ts:94  if (kind === FX_BIT) {
  li t0, 3
  bne s2, t0, .L1
  ; fx.e16.ts:95  fxX[k] = fxX[k] + fxVX[k]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fxX(t1)
  slli t2, s1, 1
  lw t2, fxVX(t2)
  add t1, t1, t2
  sw t1, fxX(t0)
  ; fx.e16.ts:96  fxY[k] = fxY[k] + fxVY[k]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fxY(t1)
  slli t2, s1, 1
  lw t2, fxVY(t2)
  add t1, t1, t2
  sw t1, fxY(t0)
  ; fx.e16.ts:98  if ((t & 3) === 0) fxVY[k] = fxVY[k] + 1
  andi t0, s3, 3
  bne t0, zero, .L3
  ; fx.e16.ts:98  fxVY[k] = fxVY[k] + 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fxVY(t1)
  addi t1, t1, 1
  sw t1, fxVY(t0)
  j .L3
.L1:
  ; fx.e16.ts:99  if (kind >= FX_NUMBER) fxY[k] = fxY[k] - 6
  li t0, 5
  bltu s2, t0, .L4
  ; fx.e16.ts:99  fxY[k] = fxY[k] - 6
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fxY(t1)
  addi t1, t1, -6
  sw t1, fxY(t0)
.L4:
.L3:
  ; fx.e16.ts:100  if (t > fxLife(kind)) fxKind[k] = 0
  mv a0, s2
  call fxLife
  bgeu a0, s3, .L5
  ; fx.e16.ts:100  fxKind[k] = 0
  slli t0, s1, 1
  sw zero, fxKind(t0)
  j .L6
.L5:
  ; fx.e16.ts:101  fxDraw(k, kind, t)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call fxDraw
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:105 fxLife(kind) at -O1
;   kind in a0
fxLife:
  ; fx.e16.ts:106  if (kind === FX_BIT) return 36
  li t0, 3
  bne a0, t0, .L1
  ; fx.e16.ts:106  return 36
  li a0, 36
  ret
.L1:
  ; fx.e16.ts:107  if (kind === FX_WORD) return 60
  li t0, 6
  bne a0, t0, .L2
  ; fx.e16.ts:107  return 60
  li a0, 60
  ret
.L2:
  ; fx.e16.ts:108  if (kind === FX_NUMBER) return 40
  li t0, 5
  bne a0, t0, .L3
  ; fx.e16.ts:108  return 40
  li a0, 40
  ret
.L3:
  ; fx.e16.ts:109  if (kind === FX_SMALL) return 17
  li t0, 1
  bne a0, t0, .L4
  ; fx.e16.ts:109  return 17
  li a0, 17
  ret
.L4:
  ; fx.e16.ts:110  if (kind === FX_BIG) return 31
  li t0, 2
  bne a0, t0, .L5
  ; fx.e16.ts:110  return 31
  li a0, 31
  ret
.L5:
  ; fx.e16.ts:111  return 9
  li a0, 9
.return:
  ret

; fx.e16.ts:114 fxDraw(k, kind, t) at -O1
;   k in 0(fp)
;   kind in 2(fp)
;   t in s1
;   x in s2
;   y in s3
fxDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 0(fp) ; k
  sw a1, 2(fp) ; kind
  mv s1, a2 ; t
  ; fx.e16.ts:115  const x = (i16(fxX[k]) >> 4) + shakeDX()
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw t0, fxX(t0)
  srai t0, t0, 4
  ; view.e16.ts:276  return shakeX
  lw t1, 0x0ca4(zero)
  add s2, t0, t1
  ; fx.e16.ts:116  const y = (i16(fxY[k]) >> 4) + shakeDY()
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw t0, fxY(t0)
  srai t0, t0, 4
  ; view.e16.ts:280  return shakeY
  lw t1, 0x0ca6(zero)
  add s3, t0, t1
  ; fx.e16.ts:117  const pal = (SL_FIRE - 8) << 10
  ; fx.e16.ts:118  if (kind === FX_SMALL) spr(x - 8, y - 8, (BLAST_SMALL_TILE + div(t, 3) * 4) | pal, S16)
  li t0, 1
  lw t1, 2(fp) ; kind
  bne t1, t0, .L1
  ; fx.e16.ts:118  spr(x - 8, y - 8, (BLAST_SMALL_TILE + div(t, 3) * 4) | pal, S16)
  li t0, 3
  divu t0, s1, t0
  slli t0, t0, 2
  addi t0, t0, 230
  ori t0, t0, 5120
  addi a0, s2, -8
  addi a1, s3, -8
  mv a2, t0
  li a3, 1
  call spr
  j .L2
.L1:
  ; fx.e16.ts:119  if (kind === FX_BIG) spr(x - 16, y - 16, (BLAST_BIG_TILE + (t >> 2) * 16) | pal, S32)
  li t0, 2
  lw t1, 2(fp) ; kind
  bne t1, t0, .L3
  ; fx.e16.ts:119  spr(x - 16, y - 16, (BLAST_BIG_TILE + (t >> 2) * 16) | pal, S32)
  srli t0, s1, 2
  slli t0, t0, 4
  addi t0, t0, 254
  ori t0, t0, 5120
  addi a0, s2, -16
  addi a1, s3, -16
  mv a2, t0
  li a3, 2
  call spr
  j .L4
.L3:
  ; fx.e16.ts:120  if (kind === FX_BIT) spr(x - 4, y - 4, (BITS_TILE + ((t >> 2) & 3)) | pal, S8)
  li t0, 3
  lw t1, 2(fp) ; kind
  bne t1, t0, .L5
  ; fx.e16.ts:120  spr(x - 4, y - 4, (BITS_TILE + ((t >> 2) & 3)) | pal, S8)
  srli t0, s1, 2
  andi t0, t0, 3
  addi t0, t0, 382
  ori t0, t0, 5120
  addi a0, s2, -4
  addi a1, s3, -4
  mv a2, t0
  li a3, 0
  call spr
  j .L6
.L5:
  ; fx.e16.ts:121  if (kind === FX_SPARK) spr(x - 4, y - 4, (BITS_TILE + 4 + (t > 4 ? 1 : 0)) | pal, S8)
  li t0, 4
  lw t1, 2(fp) ; kind
  bne t1, t0, .L7
  ; fx.e16.ts:121  spr(x - 4, y - 4, (BITS_TILE + 4 + (t > 4 ? 1 : 0)) | pal, S8)
  addi t0, s2, -4
  addi t1, s3, -4
  li t2, 386
  mv t3, s1
  li a1, 4
  bgeu a1, t3, .L8
  li t3, 1
  j .L9
.L8:
  li t3, 0
.L9:
  add t2, t2, t3
  ori t2, t2, 5120
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 0
  call spr
  j .L10
.L7:
  ; fx.e16.ts:122  if (kind === FX_NUMBER) numberDraw(x, y, (fxVX[k] << 8) | (fxVY[k] & 255))
  li t0, 5
  lw t1, 2(fp) ; kind
  bne t1, t0, .L11
  ; fx.e16.ts:122  numberDraw(x, y, (fxVX[k] << 8) | (fxVY[k] & 255))
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw t0, fxVX(t0)
  slli t0, t0, 8
  lw t1, 0(fp) ; k
  slli t1, t1, 1
  lw t1, fxVY(t1)
  andi t1, t1, 255
  or t0, t0, t1
  mv a0, s2
  mv a1, s3
  mv a2, t0
  call numberDraw
  j .L12
.L11:
  ; fx.e16.ts:123  if (t < 44 || (t & 2) !== 0) wordDraw(x, y, fxVY[k])
  li t0, 44
  bltu s1, t0, .L14
  andi t0, s1, 2
  beq t0, zero, .L13
.L14:
  ; fx.e16.ts:123  wordDraw(x, y, fxVY[k])
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw t0, fxVY(t0)
  mv a0, s2
  mv a1, s3
  mv a2, t0
  call wordDraw
.L13:
.L12:
.L10:
.L6:
.L4:
.L2:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fx.e16.ts:127 wordDraw(x, y, kind) at -O1
;   x in 4(fp)
;   y in 6(fp)
;   kind in 0(fp)
;   s in 2(fp)
;   n in s1
;   at in s3
;   k in s2
wordDraw:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 4(fp) ; x
  sw a1, 6(fp) ; y
  sw a2, 0(fp) ; kind
  ; fx.e16.ts:128  const s = kind === IT_BOMB ? str('BOMB+1') : kind === IT_LIFE ? str('1UP') : str('POWER UP')
  li t0, 2
  lw t1, 0(fp) ; kind
  bne t1, t0, .L1
  la t0, str_0
  j .L2
.L1:
  li t0, 3
  lw t1, 0(fp) ; kind
  bne t1, t0, .L3
  la t0, str_1
  j .L4
.L3:
  la t0, str_2
.L4:
.L2:
  sw t0, 2(fp) ; s
  ; fx.e16.ts:129  let n: u16 = 0
  li s1, 0 ; n
  ; fx.e16.ts:130  while (peek(s + n) !== 0) n++
  j .L7
.L5:
  ; fx.e16.ts:130  n++
  addi s1, s1, 1
.L7:
  lw t0, 2(fp) ; s
  add t0, t0, s1
  lbu t0, 0(t0)
  bne t0, zero, .L5
  ; fx.e16.ts:131  let at = x - i16(n * 4)
  slli t0, s1, 2
  lw t1, 4(fp) ; x
  sub s3, t1, t0
  ; fx.e16.ts:132  const tile = (FONT_TILE - 32) | ((SL_ITEM - 8) << 10)
  ; fx.e16.ts:133  let k: u16 = 0
  li s2, 0 ; k
  ; fx.e16.ts:134  while (k < n) {
  j .L11
.L9:
  ; fx.e16.ts:135  spr(at, y - 4, tile + peek(s + k), S8)
  lw t0, 6(fp) ; y
  lw t1, 2(fp) ; s
  add t1, t1, s2
  lbu t1, 0(t1)
  mv a0, s3
  addi a1, t0, -4
  addi a2, t1, 6549
  li a3, 0
  call spr
  ; fx.e16.ts:136  at = at + 8
  addi s3, s3, 8
  ; fx.e16.ts:137  k++
  addi s2, s2, 1
.L11:
  bltu s2, s1, .L9
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; fx.e16.ts:142 numberDraw(x, y, n) at -O1
;   x in 2(fp)
;   y in 0(fp)
;   n in s1
;   digits in s2
;   at in s3
numberDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 2(fp) ; x
  sw a1, 0(fp) ; y
  mv s1, a2 ; n
  ; fx.e16.ts:143  const tile = (FONT_TILE - 32) | ((SL_ITEM - 8) << 10)
  ; fx.e16.ts:144  let digits: u16 = n >= 100 ? 3 : n >= 10 ? 2 : 1
  li t0, 100
  bltu s1, t0, .L1
  li t0, 3
  j .L2
.L1:
  li t0, 10
  bltu s1, t0, .L3
  li t0, 2
  j .L4
.L3:
  li t0, 1
.L4:
.L2:
  mv s2, t0 ; digits
  ; fx.e16.ts:145  let at = x + i16(digits * 4) - 4
  slli t0, s2, 2
  lw t1, 2(fp) ; x
  add t1, t1, t0
  addi s3, t1, -4
  ; fx.e16.ts:146  spr(at - i16(digits * 8) - 4, y, tile + 88, S8)
  slli t0, s2, 3
  sub t0, s3, t0
  addi a0, t0, -4
  lw a1, 0(fp)
  li a2, 6637
  li a3, 0
  call spr
  ; fx.e16.ts:147  while (digits > 0) {
  j .L7
.L5:
  ; fx.e16.ts:148  spr(at, y, tile + 48 + (n % 10), S8)
  li t0, 10
  remu t0, s1, t0
  mv a0, s3
  lw a1, 0(fp)
  addi a2, t0, 6597
  li a3, 0
  call spr
  ; fx.e16.ts:149  n = div(n, 10)
  li t0, 10
  divu s1, s1, t0
  ; fx.e16.ts:150  at = at - 8
  addi s3, s3, -8
  ; fx.e16.ts:151  digits--
  addi s2, s2, -1
.L7:
  bltu zero, s2, .L5
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fx.e16.ts:172 item(kind, x, y) at -O1
;   kind in s2
;   x in s3
;   y in s0
;   k in s1
item:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; kind
  mv s3, a1 ; x
  mv s0, a2 ; y
  ; fx.e16.ts:173  const k = itNext
  lw s1, 0x1012(zero)
  ; fx.e16.ts:174  itNext = itNext + 1 === IT_N ? 0 : itNext + 1
  lw t0, 0x1012(zero)
  li t1, 40
  addi t0, t0, 1
  bne t0, t1, .L1
  li t0, 0
  j .L2
.L1:
  lw t0, 0x1012(zero)
  addi t0, t0, 1
.L2:
  sw t0, 0x1012(zero)
  ; fx.e16.ts:175  itKind[k] = kind
  slli t0, s1, 1
  sw s2, itKind(t0)
  ; fx.e16.ts:176  itX[k] = u16(x)
  slli t0, s1, 1
  sw s3, itX(t0)
  ; fx.e16.ts:177  itY[k] = u16(y)
  slli t0, s1, 1
  sw s0, itY(t0)
  ; fx.e16.ts:178  itVX[k] = u16(i16(randBelow(64)) - 32)
  slli t0, s1, 1
  addi t0, t0, itVX
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 64
  call randBelow
  addi t0, a0, -32
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; fx.e16.ts:179  itVY[k] = u16(i16(randBelow(40)) - 40)
  slli t0, s1, 1
  addi t0, t0, itVY
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 40
  call randBelow
  addi t0, a0, -40
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; fx.e16.ts:180  itT[k] = 0
  slli t0, s1, 1
  sw zero, itT(t0)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; fx.e16.ts:189 itemsStep(sx, sy, magnet) at -O1
;   sx in s2
;   sy in s3
;   magnet in s0
;   k in s1
itemsStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; sx
  mv s3, a1 ; sy
  mv s0, a2 ; magnet
  ; fx.e16.ts:190  magnetNow = magnet
  sw s0, 0x101e(zero)
  ; fx.e16.ts:191  caught[1] = 0
  sw zero, caught+2(zero)
  ; fx.e16.ts:192  caught[2] = 0
  sw zero, caught+4(zero)
  ; fx.e16.ts:193  caught[3] = 0
  sw zero, caught+6(zero)
  ; fx.e16.ts:194  caught[4] = 0
  sw zero, caught+8(zero)
  ; fx.e16.ts:195  let k: u16 = 0
  li s1, 0 ; k
  ; fx.e16.ts:196  while (k < IT_N) {
  j .L3
.L1:
  ; fx.e16.ts:197  if (itKind[k] !== 0) itemOne(k, sx, sy)
  slli t0, s1, 1
  lw t0, itKind(t0)
  beq t0, zero, .L5
  ; fx.e16.ts:197  itemOne(k, sx, sy)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call itemOne
.L5:
  ; fx.e16.ts:198  k++
  addi s1, s1, 1
.L3:
  li t0, 40
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; fx.e16.ts:202 itemOne(k, sx, sy) at -O1
;   k in s1
;   sx in 8(fp)
;   sy in 10(fp)
;   t in s2
;   x in 0(fp)
;   y in 2(fp)
;   dx in 4(fp)
;   dy in 6(fp)
;   kind in s3
itemOne:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 8(fp) ; sx
  sw a2, 10(fp) ; sy
  ; fx.e16.ts:203  const t = itT[k] + 1
  slli t0, s1, 1
  lw t0, itT(t0)
  addi s2, t0, 1
  ; fx.e16.ts:204  itT[k] = t
  slli t0, s1, 1
  sw s2, itT(t0)
  ; fx.e16.ts:205  const x = i16(itX[k])
  slli t0, s1, 1
  lw t0, itX(t0)
  sw t0, 0(fp) ; x
  ; fx.e16.ts:206  const y = i16(itY[k])
  slli t0, s1, 1
  lw t0, itY(t0)
  sw t0, 2(fp) ; y
  ; fx.e16.ts:207  const dx = sx - x
  lw t0, 0(fp) ; x
  lw t1, 8(fp) ; sx
  sub t1, t1, t0
  sw t1, 4(fp) ; dx
  ; fx.e16.ts:208  const dy = sy - y
  lw t0, 2(fp) ; y
  lw t1, 10(fp) ; sy
  sub t1, t1, t0
  sw t1, 6(fp) ; dy
  ; fx.e16.ts:209  const kind = itKind[k]
  slli t0, s1, 1
  lw s3, itKind(t0)
  ; fx.e16.ts:210  itemSteer(k, t, dx, dy)
  mv a0, s1
  mv a1, s2
  lw a2, 4(fp)
  lw a3, 6(fp)
  call itemSteer
  ; fx.e16.ts:211  itX[k] = u16(x + i16(itVX[k]))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, itVX(t1)
  lw t2, 0(fp) ; x
  add t2, t2, t1
  sw t2, itX(t0)
  ; fx.e16.ts:212  itY[k] = u16(y + i16(itVY[k]))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, itVY(t1)
  lw t2, 2(fp) ; y
  add t2, t2, t1
  sw t2, itY(t0)
  ; fx.e16.ts:213  if (abs(dx) < 224 && abs(dy) < 224) {
  lw a0, 4(fp)
  call abs
  li t0, 224
  bge a0, t0, .L1
  lw a0, 6(fp)
  call abs
  li t0, 224
  bge a0, t0, .L1
  ; fx.e16.ts:214  caught[kind] = caught[kind] + 1
  slli t0, s3, 1
  slli t1, s3, 1
  lw t1, caught(t1)
  addi t1, t1, 1
  sw t1, caught(t0)
  ; fx.e16.ts:215  itKind[k] = 0
  slli t0, s1, 1
  sw zero, itKind(t0)
  ; fx.e16.ts:216  return
  j .return
.L1:
  ; fx.e16.ts:218  if (i16(itY[k]) > 4800 || t > 900) {
  slli t0, s1, 1
  lw t0, itY(t0)
  li t1, 4800
  blt t1, t0, .L3
  li t0, 900
  bgeu t0, s2, .L2
.L3:
  ; fx.e16.ts:219  itKind[k] = 0
  slli t0, s1, 1
  sw zero, itKind(t0)
  ; fx.e16.ts:220  return
  j .return
.L2:
  ; fx.e16.ts:222  itemDraw(k, kind, t)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call itemDraw
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; fx.e16.ts:229 itemSteer(k, t, dx, dy) at -O1
;   k in s1
;   t in s3
;   dx in 0(fp)
;   dy in 2(fp)
;   pull in s2
itemSteer:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  mv s3, a1 ; t
  sw a2, 0(fp) ; dx
  sw a3, 2(fp) ; dy
  ; fx.e16.ts:230  if (itKind[k] !== IT_STAR) {
  slli t0, s1, 1
  lw t0, itKind(t0)
  li t1, 1
  beq t0, t1, .L1
  ; fx.e16.ts:231  itVY[k] = 10
  slli t0, s1, 1
  li t1, 10
  sw t1, itVY(t0)
  ; fx.e16.ts:232  itVX[k] = u16((t & 64) !== 0 ? 6 : -6)
  slli t0, s1, 1
  andi t1, s3, 64
  addi t0, t0, itVX
  li t2, 0
  beq t1, t2, .L2
  li t1, 6
  j .L3
.L2:
  li t1, 65530
.L3:
  sw t1, 0(t0)
  ; fx.e16.ts:233  return
  j .return
.L1:
  ; fx.e16.ts:235  if (t <= 16 && magnetNow === 0) {
  li t0, 16
  bltu t0, s3, .L4
  lw t0, 0x101e(zero)
  bne t0, zero, .L4
  ; fx.e16.ts:236  itVY[k] = u16(i16(itVY[k]) + 2)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, itVY(t1)
  addi t1, t1, 2
  sw t1, itVY(t0)
  ; fx.e16.ts:237  return
  j .return
.L4:
  ; fx.e16.ts:239  const pull: i16 = t > 40 ? 6 : 3
  li t0, 40
  bgeu t0, s3, .L5
  li t0, 6
  j .L6
.L5:
  li t0, 3
.L6:
  mv s2, t0 ; pull
  ; fx.e16.ts:240  itVX[k] = u16(clamp(i16(itVX[k]) + (dx > 0 ? pull : -pull), 96))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, itVX(t1)
  addi t0, t0, itVX
  lw t2, 0(fp)
  li t3, 0
  bge t3, t2, .L7
  mv t2, s2
  j .L8
.L7:
  neg t2, s2
.L8:
  add t1, t1, t2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  li a1, 96
  call clamp
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; fx.e16.ts:241  itVY[k] = u16(clamp(i16(itVY[k]) + (dy > 0 ? pull : -pull), 96))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, itVY(t1)
  addi t0, t0, itVY
  lw t2, 2(fp)
  li t3, 0
  bge t3, t2, .L9
  mv t2, s2
  j .L10
.L9:
  neg t2, s2
.L10:
  add t1, t1, t2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  li a1, 96
  call clamp
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fx.e16.ts:244 itemDraw(k, kind, t) at -O1
;   k in s2
;   kind in s1
;   t in s3
;   x in 0(fp)
;   y in 2(fp)
;   which in 4(fp)
itemDraw:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; k
  mv s1, a1 ; kind
  mv s3, a2 ; t
  ; fx.e16.ts:245  const x = (i16(itX[k]) >> 4) + shakeDX()
  slli t0, s2, 1
  lw t0, itX(t0)
  srai t0, t0, 4
  ; view.e16.ts:276  return shakeX
  lw t1, 0x0ca4(zero)
  add t0, t0, t1
  sw t0, 0(fp) ; x
  ; fx.e16.ts:246  const y = (i16(itY[k]) >> 4) + shakeDY()
  slli t0, s2, 1
  lw t0, itY(t0)
  srai t0, t0, 4
  ; view.e16.ts:280  return shakeY
  lw t1, 0x0ca6(zero)
  add t0, t0, t1
  sw t0, 2(fp) ; y
  ; fx.e16.ts:247  const pal = (SL_ITEM - 8) << 10
  ; fx.e16.ts:248  if (kind === IT_STAR) spr(x - 4, y - 4, (STARS_TILE + ((t >> 2) & 3)) | pal, S8)
  li t0, 1
  bne s1, t0, .L1
  ; fx.e16.ts:248  spr(x - 4, y - 4, (STARS_TILE + ((t >> 2) & 3)) | pal, S8)
  lw t0, 0(fp) ; x
  lw t1, 2(fp) ; y
  srli t2, s3, 2
  andi t2, t2, 3
  addi t2, t2, 388
  ori t2, t2, 6144
  addi a0, t0, -4
  addi a1, t1, -4
  mv a2, t2
  li a3, 0
  call spr
  j .L2
.L1:
  ; fx.e16.ts:251  const which: u16 = kind === IT_BOMB ? 0 : kind === IT_LIFE ? 8 : 16
  li t0, 2
  bne s1, t0, .L3
  li t0, 0
  j .L4
.L3:
  li t0, 3
  bne s1, t0, .L5
  li t0, 8
  j .L6
.L5:
  li t0, 16
.L6:
.L4:
  sw t0, 4(fp) ; which
  ; fx.e16.ts:252  spr(x - 8, y - 8, (PICKUPS_TILE + which + ((t >> 3) & 1) * 4) | pal, S16)
  lw t0, 0(fp) ; x
  lw t1, 2(fp) ; y
  lw t2, 4(fp) ; which
  srli t3, s3, 3
  andi t3, t3, 1
  slli t3, t3, 2
  addi t2, t2, 413
  add t2, t2, t3
  ori t2, t2, 6144
  addi a0, t0, -8
  addi a1, t1, -8
  mv a2, t2
  li a3, 1
  call spr
.L2:
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; fx.e16.ts:257 itemsAll() at -O1
;   k in a0
itemsAll:
  ; fx.e16.ts:258  let k: u16 = 0
  li a0, 0 ; k
  ; fx.e16.ts:259  while (k < IT_N) {
  j .L3
.L1:
  ; fx.e16.ts:260  itT[k] = 41
  slli t0, a0, 1
  li t1, 41
  sw t1, itT(t0)
  ; fx.e16.ts:261  k++
  addi a0, a0, 1
.L3:
  li t0, 40
  bltu a0, t0, .L1
.return:
  ret

; fx.e16.ts:265 itemsClear() at -O1
;   k in a0
itemsClear:
  ; fx.e16.ts:266  let k: u16 = 0
  li a0, 0 ; k
  ; fx.e16.ts:267  while (k < IT_N) {
  j .L3
.L1:
  ; fx.e16.ts:268  itKind[k] = 0
  slli t0, a0, 1
  sw zero, itKind(t0)
  ; fx.e16.ts:269  k++
  addi a0, a0, 1
.L3:
  li t0, 40
  bltu a0, t0, .L1
  ; fx.e16.ts:271  k = 0
  li a0, 0 ; k
  ; fx.e16.ts:272  while (k < FX_N) {
  j .L7
.L5:
  ; fx.e16.ts:273  fxKind[k] = 0
  slli t0, a0, 1
  sw zero, fxKind(t0)
  ; fx.e16.ts:274  k++
  addi a0, a0, 1
.L7:
  li t0, 32
  bltu a0, t0, .L5
.return:
  ret

; fx.e16.ts:278 clamp(v, m) at -O1
;   v in a0
;   m in a1
clamp:
  ; fx.e16.ts:279  if (v > m) return m
  bge a1, a0, .L1
  ; fx.e16.ts:279  return m
  mv a0, a1
  ret
.L1:
  ; fx.e16.ts:280  if (v < -m) return -m
  neg t0, a1
  bge a0, t0, .L2
  ; fx.e16.ts:280  return -m
  neg a0, a1
.L2:
  ; fx.e16.ts:281  return v
.return:
  ret

; fx.e16.ts:284 abs(v) at -O1
;   v in a0
abs:
  ; fx.e16.ts:285  return v < 0 ? -v : v
  bge a0, zero, .L1
  neg t0, a0
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a0, t0
.return:
  ret

; fx.e16.ts:294 farStarsInit() at -O1
;   k in s1
farStarsInit:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; fx.e16.ts:295  let k: u16 = 0
  li s1, 0 ; k
  ; fx.e16.ts:296  while (k < 10) {
  j .L3
.L1:
  ; fx.e16.ts:297  farX[k] = FIELD_X + randBelow(FIELD_W)
  slli t0, s1, 1
  addi t0, t0, farX
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 224
  call randBelow
  addi t0, a0, 48
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; fx.e16.ts:298  farY[k] = randBelow(255) + (rand() & 31)
  slli t0, s1, 1
  addi t0, t0, farY
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 255
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  call rand
  andi t0, a0, 31
  lw t1, 0(sp)
  addi sp, sp, 2
  add t1, t1, t0
  lw t0, 0(sp)
  addi sp, sp, 2
  sw t1, 0(t0)
  ; fx.e16.ts:299  k++
  addi s1, s1, 1
.L3:
  li t0, 10
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; fx.e16.ts:304 farStarsStep(speed, frame) at -O1
;   speed in s3
;   frame in 0(fp)
;   k in s1
;   depth in s2
;   every in 2(fp)
farStarsStep:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; speed
  sw a1, 0(fp) ; frame
  ; fx.e16.ts:305  let k: u16 = 0
  li s1, 0 ; k
  ; fx.e16.ts:306  while (k < 10) {
  j .L3
.L1:
  ; fx.e16.ts:307  const depth = k % 3
  li t0, 3
  remu s2, s1, t0
  ; fx.e16.ts:309  const every: u16 = depth === 0 ? 3 : depth === 1 ? 1 : 0
  bne s2, zero, .L5
  li t0, 3
  j .L6
.L5:
  li t0, 1
  bne s2, t0, .L7
  li t0, 1
  j .L8
.L7:
  li t0, 0
.L8:
.L6:
  sw t0, 2(fp) ; every
  ; fx.e16.ts:310  if ((frame & every) === 0 && speed > 0) farY[k] = farY[k] + 1
  lw t0, 2(fp) ; every
  lw t1, 0(fp) ; frame
  and t1, t1, t0
  bne t1, zero, .L9
  bgeu zero, s3, .L9
  ; fx.e16.ts:310  farY[k] = farY[k] + 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, farY(t1)
  addi t1, t1, 1
  sw t1, farY(t0)
.L9:
  ; fx.e16.ts:311  if (farY[k] > 288) {
  slli t0, s1, 1
  lw t0, farY(t0)
  li t1, 288
  bgeu t1, t0, .L10
  ; fx.e16.ts:312  farY[k] = 0
  slli t0, s1, 1
  sw zero, farY(t0)
  ; fx.e16.ts:313  farX[k] = FIELD_X + randBelow(FIELD_W)
  slli t0, s1, 1
  addi t0, t0, farX
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 224
  call randBelow
  addi t0, a0, 48
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
.L10:
  ; fx.e16.ts:315  spr(
  slli t0, s1, 1
  lw t0, farX(t0)
  slli t1, s1, 1
  lw t1, farY(t1)
  addi t2, s2, 410
  ori t2, t2, 6144
  li t3, 32768
  or t2, t2, t3
  addi a0, t0, -3
  addi a1, t1, -3
  mv a2, t2
  li a3, 0
  call spr
  ; fx.e16.ts:321  k++
  addi s1, s1, 1
.L3:
  li t0, 10
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; shots.e16.ts:40 boost(n) at -O1
;   n in a0
boost:
  ; shots.e16.ts:41  bulletBoost = n
  sw a0, 0x143c(zero)
.return:
  ret

; shots.e16.ts:45 sk(speed, kind) at -O1
;   speed in a0
;   kind in a1
sk:
  ; shots.e16.ts:46  return (kind << 8) | (speed & 255)
  slli t0, a1, 8
  andi t1, a0, 255
  or a0, t0, t1
.return:
  ret

; shots.e16.ts:53 bullet(x, y, a, speedKind) at -O1
;   x in s1
;   y in s2
;   a in s3
;   speedKind in s0
bullet:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; a
  mv s0, a3 ; speedKind
  ; shots.e16.ts:54  if (volleyGoes()) place(x, y, a, speedKind)
  call volleyGoes
  beqz a0, .L1
  ; shots.e16.ts:54  place(x, y, a, speedKind)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  mv a3, s0
  call place
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; shots.e16.ts:61 place(x, y, a, speedKind) at -O1
;   x in 4(fp)
;   y in 6(fp)
;   a in s3
;   speedKind in 0(fp)
;   speed in 8(fp)
;   kind in 10(fp)
;   tries in s2
;   k in s1
;   v in 2(fp)
place:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s3, 14(sp)
  sw s2, 16(sp)
  sw s1, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  sw a0, 4(fp) ; x
  sw a1, 6(fp) ; y
  mv s3, a2 ; a
  sw a3, 0(fp) ; speedKind
  ; shots.e16.ts:62  const speed = speedKind & 255
  lw t0, 0(fp) ; speedKind
  andi t0, t0, 255
  sw t0, 8(fp) ; speed
  ; shots.e16.ts:63  const kind = speedKind >> 8
  lw t0, 0(fp) ; speedKind
  srli t0, t0, 8
  sw t0, 10(fp) ; kind
  ; shots.e16.ts:65  let tries: u16 = B_N
  li s2, 72 ; tries
  ; shots.e16.ts:66  while (buLive[buNext] !== 0 && tries > 0) {
  j .L3
.L1:
  ; shots.e16.ts:67  buNext = buNext + 1 === B_N ? 0 : buNext + 1
  lw t0, 0x1438(zero)
  li t1, 72
  addi t0, t0, 1
  bne t0, t1, .L5
  li t0, 0
  j .L6
.L5:
  lw t0, 0x1438(zero)
  addi t0, t0, 1
.L6:
  sw t0, 0x1438(zero)
  ; shots.e16.ts:68  tries--
  addi s2, s2, -1
.L3:
  lw t0, 0x1438(zero)
  slli t0, t0, 1
  lw t0, buLive(t0)
  beq t0, zero, .L7
  bltu zero, s2, .L1
.L7:
  ; shots.e16.ts:70  if (tries === 0) return
  bne s2, zero, .L8
  ; shots.e16.ts:70  return
  j .return
.L8:
  ; shots.e16.ts:71  const k = buNext
  lw s1, 0x1438(zero)
  ; shots.e16.ts:72  const v = i16(volleySpeed(speed + bulletBoost))
  lw t0, 0x143c(zero)
  lw t1, 8(fp) ; speed
  add a0, t1, t0
  call volleySpeed
  sw a0, 2(fp) ; v
  ; shots.e16.ts:73  buKind[k] = kind
  slli t0, s1, 1
  lw t1, 10(fp) ; kind
  sw t1, buKind(t0)
  ; shots.e16.ts:74  buX[k] = u16(x)
  slli t0, s1, 1
  lw t1, 4(fp) ; x
  sw t1, buX(t0)
  ; shots.e16.ts:75  buY[k] = u16(y)
  slli t0, s1, 1
  lw t1, 6(fp) ; y
  sw t1, buY(t0)
  ; shots.e16.ts:76  buVX[k] = u16(mulShift(cos(a), v, 8))
  slli t0, s1, 1
  addi t0, t0, buVX
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  call cos
  lw t0, 2(fp) ; v
  mulq t0, a0, t0, 8
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; shots.e16.ts:77  buVY[k] = u16(mulShift(sin(a), v, 8))
  slli t0, s1, 1
  addi t0, t0, buVY
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  call sin
  lw t0, 2(fp) ; v
  mulq t0, a0, t0, 8
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; shots.e16.ts:78  buLive[k] = 1 + (a & 255)
  slli t0, s1, 1
  andi t1, s3, 255
  addi t1, t1, 1
  sw t1, buLive(t0)
  ; shots.e16.ts:79  buGrazed[k] = 0
  slli t0, s1, 1
  sw zero, buGrazed(t0)
  ; shots.e16.ts:80  bulletsMade++
  lw t0, 0x143e(zero)
  addi t0, t0, 1
  sw t0, 0x143e(zero)
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s3, 14(sp)
  lw s2, 16(sp)
  lw s1, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; shots.e16.ts:87 target(x, y) at -O1
;   x in a0
;   y in a1
target:
  ; shots.e16.ts:88  targetX = x
  sw a0, 0x1440(zero)
  ; shots.e16.ts:89  targetY = y
  sw a1, 0x1442(zero)
.return:
  ret

; shots.e16.ts:93 aimed(x, y) at -O1
;   x in s1
;   y in s2
aimed:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  ; shots.e16.ts:94  return aim(targetX - x, targetY - y)
  lw t0, 0x1440(zero)
  sub t0, t0, s1
  lw t1, 0x1442(zero)
  sub t1, t1, s2
  mv a0, t0
  mv a1, t1
  call aim
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; shots.e16.ts:98 fan(x, y, a, nStepSpeedKind) at -O1
;   x in 4(fp)
;   y in 6(fp)
;   a in 8(fp)
;   nStepSpeedKind in s1
;   n in 0(fp)
;   step in 2(fp)
;   speed in 10(fp)
;   kind in 12(fp)
;   d in s2
;   k in s3
fan:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s1, 16(sp)
  sw s2, 18(sp)
  sw s3, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  sw a0, 4(fp) ; x
  sw a1, 6(fp) ; y
  sw a2, 8(fp) ; a
  mv s1, a3 ; nStepSpeedKind
  ; shots.e16.ts:99  if (!volleyGoes()) return
  call volleyGoes
  bnez a0, .L1
  ; shots.e16.ts:99  return
  j .return
.L1:
  ; shots.e16.ts:101  const n = volleyCount(nStepSpeedKind >> 12, 1)
  srli a0, s1, 12
  li a1, 1
  call volleyCount
  sw a0, 0(fp) ; n
  ; shots.e16.ts:102  const step = (nStepSpeedKind >> 8) & 15
  srli t0, s1, 8
  andi t0, t0, 15
  sw t0, 2(fp) ; step
  ; shots.e16.ts:103  const speed = ((nStepSpeedKind >> 2) & 63) * 2
  srli t0, s1, 2
  andi t0, t0, 63
  slli t0, t0, 1
  sw t0, 10(fp) ; speed
  ; shots.e16.ts:104  const kind = nStepSpeedKind & 3
  andi t0, s1, 3
  sw t0, 12(fp) ; kind
  ; shots.e16.ts:105  let d = wrap16(a + 256 - div((n - 1) * step, 2))
  lw t0, 8(fp) ; a
  lw t1, 0(fp) ; n
  lw t2, 2(fp) ; step
  addi t1, t1, -1
  mul t1, t1, t2
  srli t1, t1, 1
  addi t0, t0, 256
  sub s2, t0, t1
  ; shots.e16.ts:106  let k: u16 = 0
  li s3, 0 ; k
  ; shots.e16.ts:107  while (k < n) {
  j .L4
.L2:
  ; shots.e16.ts:108  place(x, y, d & 255, sk(speed, kind))
  andi t0, s2, 255
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 10(fp)
  lw a1, 12(fp)
  call sk
  lw t0, 0(sp)
  addi sp, sp, 2
  lw a1, 6(fp)
  mv a2, t0
  mv a3, a0
  lw a0, 4(fp)
  call place
  ; shots.e16.ts:109  d = d + step
  lw t0, 2(fp) ; step
  add s2, s2, t0
  ; shots.e16.ts:110  k++
  addi s3, s3, 1
.L4:
  lw t0, 0(fp) ; n
  bltu s3, t0, .L2
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s1, 16(sp)
  lw s2, 18(sp)
  lw s3, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; shots.e16.ts:115 fanOf(n, step, speed, kind) at -O1
;   n in a0
;   step in a1
;   speed in a2
;   kind in a3
fanOf:
  ; shots.e16.ts:116  return (n << 12) | (step << 8) | ((speed >> 1) << 2) | kind
  slli t0, a0, 12
  slli t1, a1, 8
  or t0, t0, t1
  srli t1, a2, 1
  slli t1, t1, 2
  or t0, t0, t1
  or a0, t0, a3
.return:
  ret

; shots.e16.ts:120 ring(x, y, a, nSpeedKind) at -O1
;   x in 2(fp)
;   y in 4(fp)
;   a in 6(fp)
;   nSpeedKind in s1
;   n in 0(fp)
;   speed in 8(fp)
;   kind in 10(fp)
;   step in 12(fp)
;   d in s2
;   k in s3
ring:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s1, 16(sp)
  sw s2, 18(sp)
  sw s3, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  sw a0, 2(fp) ; x
  sw a1, 4(fp) ; y
  sw a2, 6(fp) ; a
  mv s1, a3 ; nSpeedKind
  ; shots.e16.ts:121  if (!volleyGoes()) return
  call volleyGoes
  bnez a0, .L1
  ; shots.e16.ts:121  return
  j .return
.L1:
  ; shots.e16.ts:122  const n = volleyCount(nSpeedKind >> 10, 4)
  srli a0, s1, 10
  li a1, 4
  call volleyCount
  sw a0, 0(fp) ; n
  ; shots.e16.ts:123  const speed = (nSpeedKind >> 3) & 127
  srli t0, s1, 3
  andi t0, t0, 127
  sw t0, 8(fp) ; speed
  ; shots.e16.ts:124  const kind = nSpeedKind & 7
  andi t0, s1, 7
  sw t0, 10(fp) ; kind
  ; shots.e16.ts:125  const step = div(256, n)
  lw t0, 0(fp) ; n
  li t1, 256
  divu t1, t1, t0
  sw t1, 12(fp) ; step
  ; shots.e16.ts:126  let d = a
  lw s2, 6(fp) ; a
  ; shots.e16.ts:127  let k: u16 = 0
  li s3, 0 ; k
  ; shots.e16.ts:128  while (k < n) {
  j .L4
.L2:
  ; shots.e16.ts:129  place(x, y, d & 255, sk(speed, kind))
  andi t0, s2, 255
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 8(fp)
  lw a1, 10(fp)
  call sk
  lw t0, 0(sp)
  addi sp, sp, 2
  lw a1, 4(fp)
  mv a2, t0
  mv a3, a0
  lw a0, 2(fp)
  call place
  ; shots.e16.ts:130  d = d + step
  lw t0, 12(fp) ; step
  add s2, s2, t0
  ; shots.e16.ts:131  k++
  addi s3, s3, 1
.L4:
  lw t0, 0(fp) ; n
  bltu s3, t0, .L2
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s1, 16(sp)
  lw s2, 18(sp)
  lw s3, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; shots.e16.ts:136 ringOf(n, speed, kind) at -O1
;   n in a0
;   speed in a1
;   kind in a2
ringOf:
  ; shots.e16.ts:137  return (n << 10) | (speed << 3) | kind
  slli t0, a0, 10
  slli t1, a1, 3
  or t0, t0, t1
  or a0, t0, a2
.return:
  ret

; shots.e16.ts:148 bulletsStep(sx, sy, vulnerable) at -O1
;   sx in s2
;   sy in s3
;   vulnerable in s0
;   k in s1
bulletsStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; sx
  mv s3, a1 ; sy
  mv s0, a2 ; vulnerable
  ; shots.e16.ts:149  grazes = 0
  sw zero, 0x1444(zero)
  ; shots.e16.ts:150  hitShip = false
  sw zero, 0x1446(zero)
  ; shots.e16.ts:151  bulletCount = 0
  sw zero, 0x143a(zero)
  ; shots.e16.ts:152  let k: u16 = 0
  li s1, 0 ; k
  ; shots.e16.ts:153  while (k < B_N) {
  j .L3
.L1:
  ; shots.e16.ts:154  if (buLive[k] !== 0) bulletOne(k, sx, sy, vulnerable)
  slli t0, s1, 1
  lw t0, buLive(t0)
  beq t0, zero, .L5
  ; shots.e16.ts:154  bulletOne(k, sx, sy, vulnerable)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  mv a3, s0
  call bulletOne
.L5:
  ; shots.e16.ts:155  k++
  addi s1, s1, 1
.L3:
  li t0, 72
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; shots.e16.ts:159 bulletOne(k, sx, sy, vulnerable) at -O1
;   k in s1
;   sx in 0(fp)
;   sy in 2(fp)
;   vulnerable in 4(fp)
;   x in s2
;   y in s3
;   dx in 6(fp)
;   dy in 8(fp)
;   big in 12(fp)
;   reach in 10(fp)
bulletOne:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s1, 16(sp)
  sw s2, 18(sp)
  sw s3, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 0(fp) ; sx
  sw a2, 2(fp) ; sy
  sw a3, 4(fp) ; vulnerable
  ; shots.e16.ts:160  const x = i16(buX[k]) + i16(buVX[k])
  slli t0, s1, 1
  lw t0, buX(t0)
  slli t1, s1, 1
  lw t1, buVX(t1)
  add s2, t0, t1
  ; shots.e16.ts:161  const y = i16(buY[k]) + i16(buVY[k])
  slli t0, s1, 1
  lw t0, buY(t0)
  slli t1, s1, 1
  lw t1, buVY(t1)
  add s3, t0, t1
  ; shots.e16.ts:162  buX[k] = u16(x)
  slli t0, s1, 1
  sw s2, buX(t0)
  ; shots.e16.ts:163  buY[k] = u16(y)
  slli t0, s1, 1
  sw s3, buY(t0)
  ; shots.e16.ts:164  if (x < (FIELD_X - 16) * 16 || x > (FIELD_X + 240) * 16 || y < -256 || y > 4864) {
  li t0, 512
  blt s2, t0, .L2
  li t0, 4608
  blt t0, s2, .L2
  li t0, 65280
  blt s3, t0, .L2
  li t0, 4864
  bge t0, s3, .L1
.L2:
  ; shots.e16.ts:165  buLive[k] = 0
  slli t0, s1, 1
  sw zero, buLive(t0)
  ; shots.e16.ts:166  return
  j .return
.L1:
  ; shots.e16.ts:168  bulletCount++
  lw t0, 0x143a(zero)
  addi t0, t0, 1
  sw t0, 0x143a(zero)
  ; shots.e16.ts:169  const dx = abs(x - sx)
  lw t0, 0(fp) ; sx
  sub a0, s2, t0
  call abs
  sw a0, 6(fp) ; dx
  ; shots.e16.ts:170  const dy = abs(y - sy)
  lw t0, 2(fp) ; sy
  sub a0, s3, t0
  call abs
  sw a0, 8(fp) ; dy
  ; shots.e16.ts:171  const big = buKind[k] >= BK_ORB
  slli t0, s1, 1
  lw t0, buKind(t0)
  li t1, 4
  sltu t0, t0, t1
  xori t0, t0, 1
  sw t0, 12(fp) ; big
  ; shots.e16.ts:172  const reach: i16 = big ? 80 : 40
  lw t0, 12(fp) ; big
  beqz t0, .L3
  li t0, 80
  j .L4
.L3:
  li t0, 40
.L4:
  sw t0, 10(fp) ; reach
  ; shots.e16.ts:173  if (vulnerable && dx < reach && dy < reach) hitShip = true
  lw t0, 4(fp) ; vulnerable
  beqz t0, .L5
  lw t0, 10(fp) ; reach
  lw t1, 6(fp) ; dx
  bge t1, t0, .L5
  lw t0, 10(fp) ; reach
  lw t1, 8(fp) ; dy
  bge t1, t0, .L5
  ; shots.e16.ts:173  hitShip = true
  li t0, 1
  sw t0, 0x1446(zero)
  j .L6
.L5:
  ; shots.e16.ts:174  if (vulnerable && buGrazed[k] === 0 && dx < 192 && dy < 192) {
  lw t0, 4(fp) ; vulnerable
  beqz t0, .L7
  slli t0, s1, 1
  lw t0, buGrazed(t0)
  bne t0, zero, .L7
  li t0, 192
  lw t1, 6(fp) ; dx
  bge t1, t0, .L7
  li t0, 192
  lw t1, 8(fp) ; dy
  bge t1, t0, .L7
  ; shots.e16.ts:175  buGrazed[k] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, buGrazed(t0)
  ; shots.e16.ts:176  grazes++
  lw t0, 0x1444(zero)
  addi t0, t0, 1
  sw t0, 0x1444(zero)
  ; shots.e16.ts:177  fx(FX_SPARK, (x + sx) >> 1, (y + sy) >> 1, 0)
  lw t0, 0(fp) ; sx
  add t0, s2, t0
  srai t0, t0, 1
  lw t1, 2(fp) ; sy
  add t1, s3, t1
  srai t1, t1, 1
  li a0, 4
  mv a1, t0
  mv a2, t1
  li a3, 0
  call fx
.L7:
.L6:
  ; shots.e16.ts:179  bulletDraw(k, x, y)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call bulletDraw
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s1, 16(sp)
  lw s2, 18(sp)
  lw s3, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; shots.e16.ts:182 bulletDraw(k, x16, y16) at -O1
;   k in s2
;   x16 in 2(fp)
;   y16 in 4(fp)
;   kind in s1
;   x in s3
;   y in 0(fp)
;   pulse in 6(fp)
bulletDraw:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s2, a0 ; k
  sw a1, 2(fp) ; x16
  sw a2, 4(fp) ; y16
  ; shots.e16.ts:183  const kind = buKind[k]
  slli t0, s2, 1
  lw s1, buKind(t0)
  ; shots.e16.ts:184  const x = (x16 >> 4) + shakeDX()
  lw t0, 2(fp) ; x16
  srai t0, t0, 4
  ; view.e16.ts:276  return shakeX
  lw t1, 0x0ca4(zero)
  add s3, t0, t1
  ; shots.e16.ts:185  const y = (y16 >> 4) + shakeDY()
  lw t0, 4(fp) ; y16
  srai t0, t0, 4
  ; view.e16.ts:280  return shakeY
  lw t1, 0x0ca6(zero)
  add t0, t0, t1
  sw t0, 0(fp) ; y
  ; shots.e16.ts:186  const pal = (SL_BULLET - 8) << 10
  ; shots.e16.ts:187  if (kind >= BK_ORB) {
  li t0, 4
  bltu s1, t0, .L1
  ; shots.e16.ts:188  const pulse = (buLive[k] + u16(x16 >> 6)) & 1
  slli t0, s2, 1
  lw t0, buLive(t0)
  lw t1, 2(fp) ; x16
  srai t1, t1, 6
  add t0, t0, t1
  andi t0, t0, 1
  sw t0, 6(fp) ; pulse
  ; shots.e16.ts:189  spr(x - 8, y - 8, (ORBS_TILE + (kind - BK_ORB) * 8 + pulse * 4) | pal, S16)
  lw t0, 0(fp) ; y
  addi t1, s1, -4
  slli t1, t1, 3
  lw t2, 6(fp) ; pulse
  slli t2, t2, 2
  addi t1, t1, 214
  add t1, t1, t2
  ori t1, t1, 4096
  addi a0, s3, -8
  addi a1, t0, -8
  mv a2, t1
  li a3, 1
  call spr
  j .L2
.L1:
  ; shots.e16.ts:190  if (kind === BK_NEEDLE) spr(x - 4, y - 4, needleTile(buLive[k] - 1) | pal, S8)
  li t0, 3
  bne s1, t0, .L3
  ; shots.e16.ts:190  spr(x - 4, y - 4, needleTile(buLive[k] - 1) | pal, S8)
  lw t0, 0(fp) ; y
  slli t1, s2, 1
  lw t1, buLive(t1)
  addi t0, t0, -4
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, t1, -1
  call needleTile
  ori t0, a0, 4096
  lw t1, 0(sp)
  addi sp, sp, 2
  addi a0, s3, -4
  mv a1, t1
  mv a2, t0
  li a3, 0
  call spr
  j .L4
.L3:
  ; shots.e16.ts:191  spr(x - 4, y - 4, (BULLETS_TILE + kind * 2 + (u16(y16 >> 7) & 1)) | pal, S8)
  lw t0, 0(fp) ; y
  slli t1, s1, 1
  lw t2, 4(fp) ; y16
  srai t2, t2, 7
  andi t2, t2, 1
  addi t1, t1, 203
  add t1, t1, t2
  ori t1, t1, 4096
  addi a0, s3, -4
  addi a1, t0, -4
  mv a2, t1
  li a3, 0
  call spr
.L4:
.L2:
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s2, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; shots.e16.ts:195 needleTile(a) at -O1
;   a in a0
;   q in a1
needleTile:
  ; shots.e16.ts:197  const q = ((a + 8) >> 4) & 7
  addi t0, a0, 8
  srli t0, t0, 4
  andi a1, t0, 7
  ; shots.e16.ts:198  const base = BULLETS_TILE + 6
  ; shots.e16.ts:199  if (q <= 4) return base + q
  li t0, 4
  bltu t0, a1, .L1
  ; shots.e16.ts:199  return base + q
  addi a0, a1, 209
  ret
.L1:
  ; shots.e16.ts:200  return (base + 8 - q) | FLIP_H
  li t0, 217
  sub t0, t0, a1
  li t1, 8192
  or a0, t0, t1
.return:
  ret

; shots.e16.ts:204 cancelWithin(x, y, r) at -O1
;   x in s2
;   y in s3
;   r in s0
;   k in s1
cancelWithin:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; x
  mv s3, a1 ; y
  mv s0, a2 ; r
  ; shots.e16.ts:205  let k: u16 = 0
  li s1, 0 ; k
  ; shots.e16.ts:206  while (k < B_N) {
  j .L3
.L1:
  ; shots.e16.ts:207  if (buLive[k] !== 0 && inside(i16(buX[k]) - x, i16(buY[k]) - y, r)) cancelOne(k)
  slli t0, s1, 1
  lw t0, buLive(t0)
  beq t0, zero, .L5
  slli t0, s1, 1
  lw t0, buX(t0)
  sub t0, t0, s2
  slli t1, s1, 1
  lw t1, buY(t1)
  sub t1, t1, s3
  mv a0, t0
  mv a1, t1
  mv a2, s0
  call inside
  beqz a0, .L5
  ; shots.e16.ts:207  cancelOne(k)
  mv a0, s1
  call cancelOne
.L5:
  ; shots.e16.ts:208  k++
  addi s1, s1, 1
.L3:
  li t0, 72
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; shots.e16.ts:213 cancelAll() at -O1
;   n in s2
;   k in s1
cancelAll:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; shots.e16.ts:214  let n: u16 = 0
  li s2, 0 ; n
  ; shots.e16.ts:215  let k: u16 = 0
  li s1, 0 ; k
  ; shots.e16.ts:216  while (k < B_N) {
  j .L3
.L1:
  ; shots.e16.ts:217  if (buLive[k] !== 0) {
  slli t0, s1, 1
  lw t0, buLive(t0)
  beq t0, zero, .L5
  ; shots.e16.ts:218  cancelOne(k)
  mv a0, s1
  call cancelOne
  ; shots.e16.ts:219  n++
  addi s2, s2, 1
.L5:
  ; shots.e16.ts:221  k++
  addi s1, s1, 1
.L3:
  li t0, 72
  bltu s1, t0, .L1
  ; shots.e16.ts:223  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; shots.e16.ts:227 cancelNear(x, y, r) at -O1
;   x in s3
;   y in s0
;   r in s2
;   k in s1
cancelNear:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; x
  mv s0, a1 ; y
  mv s2, a2 ; r
  ; shots.e16.ts:228  let k: u16 = 0
  li s1, 0 ; k
  ; shots.e16.ts:229  while (k < B_N) {
  j .L3
.L1:
  ; shots.e16.ts:230  if (buLive[k] !== 0 && abs(i16(buX[k]) - x) < r && abs(i16(buY[k]) - y) < r) cancelOne(k)
  slli t0, s1, 1
  lw t0, buLive(t0)
  beq t0, zero, .L5
  slli t0, s1, 1
  lw t0, buX(t0)
  sub a0, t0, s3
  call abs
  bge a0, s2, .L5
  slli t0, s1, 1
  lw t0, buY(t0)
  sub a0, t0, s0
  call abs
  bge a0, s2, .L5
  ; shots.e16.ts:230  cancelOne(k)
  mv a0, s1
  call cancelOne
.L5:
  ; shots.e16.ts:231  k++
  addi s1, s1, 1
.L3:
  li t0, 72
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; shots.e16.ts:235 cancelOne(k) at -O1
;   k in s1
;   x in s2
;   y in s3
cancelOne:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  ; shots.e16.ts:236  buLive[k] = 0
  slli t0, s1, 1
  sw zero, buLive(t0)
  ; shots.e16.ts:237  const x = i16(buX[k])
  slli t0, s1, 1
  lw s2, buX(t0)
  ; shots.e16.ts:238  const y = i16(buY[k])
  slli t0, s1, 1
  lw s3, buY(t0)
  ; shots.e16.ts:239  fx(FX_SPARK, x, y, 0)
  li a0, 4
  mv a1, s2
  mv a2, s3
  li a3, 0
  call fx
  ; shots.e16.ts:240  item(IT_STAR, x, y)
  li a0, 1
  mv a1, s2
  mv a2, s3
  call item
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; shots.e16.ts:243 bulletsClear() at -O1
;   k in a0
bulletsClear:
  ; shots.e16.ts:244  let k: u16 = 0
  li a0, 0 ; k
  ; shots.e16.ts:245  while (k < B_N) {
  j .L3
.L1:
  ; shots.e16.ts:246  buLive[k] = 0
  slli t0, a0, 1
  sw zero, buLive(t0)
  ; shots.e16.ts:247  k++
  addi a0, a0, 1
.L3:
  li t0, 72
  bltu a0, t0, .L1
.return:
  ret

; shots.e16.ts:260 shot(x, y, lean) at -O1
;   x in a0
;   y in a1
;   lean in a2
;   k in a3
shot:
  ; shots.e16.ts:261  let k: u16 = 0
  li a3, 0 ; k
  ; shots.e16.ts:262  while (k < S_N && sLive[k] !== 0) k++
  j .L3
.L1:
  ; shots.e16.ts:262  k++
  addi a3, a3, 1
.L3:
  li t0, 18
  bgeu a3, t0, .L5
  slli t0, a3, 1
  lw t0, sLive(t0)
  bne t0, zero, .L1
.L5:
  ; shots.e16.ts:263  if (k === S_N) return
  li t0, 18
  bne a3, t0, .L6
  ; shots.e16.ts:263  return
  ret
.L6:
  ; shots.e16.ts:264  sX[k] = u16(x)
  slli t0, a3, 1
  sw a0, sX(t0)
  ; shots.e16.ts:265  sY[k] = u16(y)
  slli t0, a3, 1
  sw a1, sY(t0)
  ; shots.e16.ts:266  sVX[k] = u16(lean * 40)
  slli t0, a3, 1
  slli t2, a2, 5
  slli t1, a2, 3
  add t1, t1, t2
  sw t1, sVX(t0)
  ; shots.e16.ts:267  sLive[k] = u16(lean + 3)
  slli t0, a3, 1
  addi t1, a2, 3
  sw t1, sLive(t0)
.return:
  ret

; shots.e16.ts:271 shotsStep(damage) at -O1
;   damage in s2
;   k in s1
shotsStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; damage
  ; shots.e16.ts:272  let k: u16 = 0
  li s1, 0 ; k
  ; shots.e16.ts:273  while (k < S_N) {
  j .L3
.L1:
  ; shots.e16.ts:274  if (sLive[k] !== 0) shotOne(k, damage)
  slli t0, s1, 1
  lw t0, sLive(t0)
  beq t0, zero, .L5
  ; shots.e16.ts:274  shotOne(k, damage)
  mv a0, s1
  mv a1, s2
  call shotOne
.L5:
  ; shots.e16.ts:275  k++
  addi s1, s1, 1
.L3:
  li t0, 18
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; shots.e16.ts:279 shotOne(k, damage) at -O1
;   k in s1
;   damage in 2(fp)
;   x in s3
;   y in s2
;   lean in 0(fp)
;   tile in 4(fp)
;   flip in 6(fp)
shotOne:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 2(fp) ; damage
  ; shots.e16.ts:280  const x = i16(sX[k]) + i16(sVX[k])
  slli t0, s1, 1
  lw t0, sX(t0)
  slli t1, s1, 1
  lw t1, sVX(t1)
  add s3, t0, t1
  ; shots.e16.ts:281  const y = i16(sY[k]) - 200
  slli t0, s1, 1
  lw t0, sY(t0)
  addi s2, t0, -200
  ; shots.e16.ts:282  sX[k] = u16(x)
  slli t0, s1, 1
  sw s3, sX(t0)
  ; shots.e16.ts:283  sY[k] = u16(y)
  slli t0, s1, 1
  sw s2, sY(t0)
  ; shots.e16.ts:284  if (y < -128) {
  li t0, 65408
  bge s2, t0, .L1
  ; shots.e16.ts:285  sLive[k] = 0
  slli t0, s1, 1
  sw zero, sLive(t0)
  ; shots.e16.ts:286  return
  j .return
.L1:
  ; shots.e16.ts:288  if (foeHit(x, y, damage, false)) {
  mv a0, s3
  mv a1, s2
  lw a2, 2(fp)
  li a3, 0
  call foeHit
  beqz a0, .L2
  ; shots.e16.ts:289  sLive[k] = 0
  slli t0, s1, 1
  sw zero, sLive(t0)
  ; shots.e16.ts:290  fx(FX_SPARK, x, y + 64, 0)
  li a0, 4
  mv a1, s3
  addi a2, s2, 64
  li a3, 0
  call fx
  ; shots.e16.ts:291  return
  j .return
.L2:
  ; shots.e16.ts:294  const lean = sLive[k]
  slli t0, s1, 1
  lw t0, sLive(t0)
  sw t0, 0(fp) ; lean
  ; shots.e16.ts:295  const tile = lean === 3 ? SHOT_TILE + (u16(y >> 6) & 1) : SHOT_TILE + 2
  li t0, 3
  lw t1, 0(fp) ; lean
  bne t1, t0, .L3
  srai t0, s2, 6
  andi t0, t0, 1
  addi t0, t0, 32
  j .L4
.L3:
  li t0, 34
.L4:
  sw t0, 4(fp) ; tile
  ; shots.e16.ts:296  const flip = lean < 3 ? FLIP_H : 0
  li t0, 3
  lw t1, 0(fp) ; lean
  bgeu t1, t0, .L5
  li t0, 8192
  j .L6
.L5:
  li t0, 0
.L6:
  sw t0, 6(fp) ; flip
  ; shots.e16.ts:297  spr((x >> 4) - 4 + shakeDX(), (y >> 4) - 4 + shakeDY(), tile | ((SL_SHOT - 8) << 10) | flip, S8)
  srai t0, s3, 4
  ; view.e16.ts:276  return shakeX
  lw t1, 0x0ca4(zero)
  addi t0, t0, -4
  add t0, t0, t1
  srai t1, s2, 4
  ; view.e16.ts:280  return shakeY
  lw t2, 0x0ca6(zero)
  addi t1, t1, -4
  add t1, t1, t2
  lw t2, 4(fp) ; tile
  ori t2, t2, 1024
  lw t3, 6(fp) ; flip
  or t2, t2, t3
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 0
  call spr
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; shots.e16.ts:300 shotsClear() at -O1
;   k in a0
shotsClear:
  ; shots.e16.ts:301  let k: u16 = 0
  li a0, 0 ; k
  ; shots.e16.ts:302  while (k < S_N) {
  j .L3
.L1:
  ; shots.e16.ts:303  sLive[k] = 0
  slli t0, a0, 1
  sw zero, sLive(t0)
  ; shots.e16.ts:304  k++
  addi a0, a0, 1
.L3:
  li t0, 18
  bltu a0, t0, .L1
.return:
  ret

; ship.e16.ts:60 shipNew() at -O1
shipNew:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ship.e16.ts:61  lives = levelLives()
  call levelLives
  sw a0, 0x14ea(zero)
  ; ship.e16.ts:62  bombs = levelBombs()
  call levelBombs
  sw a0, 0x14ec(zero)
  ; ship.e16.ts:63  volt = 0
  sw zero, 0x14ee(zero)
  ; ship.e16.ts:64  overdrive = 0
  sw zero, 0x14f0(zero)
  ; ship.e16.ts:65  power = 0
  sw zero, 0x14f8(zero)
  ; ship.e16.ts:66  shipEnter()
  call shipEnter
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ship.e16.ts:70 shipEnter() at -O1
shipEnter:
  ; ship.e16.ts:71  shipState = SH_ENTER
  sw zero, 0x14d8(zero)
  ; ship.e16.ts:72  shipX = (FIELD_X + 112) * 16
  li t0, 2560
  sw t0, 0x14da(zero)
  ; ship.e16.ts:73  shipY = 5000
  li t0, 5000
  sw t0, 0x14dc(zero)
  ; ship.e16.ts:74  tilt = 0
  sw zero, 0x14de(zero)
  ; ship.e16.ts:75  timer = 0
  sw zero, 0x14e0(zero)
  ; ship.e16.ts:76  guard = 180
  li t0, 180
  sw t0, 0x14e2(zero)
  ; ship.e16.ts:77  holdA = 0
  sw zero, 0x14e4(zero)
  ; ship.e16.ts:78  bombing = 0
  sw zero, 0x14f2(zero)
  ; ship.e16.ts:79  lancing = false
  sw zero, 0x14f4(zero)
.return:
  ret

; ship.e16.ts:83 shipStep() at -O1
shipStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ship.e16.ts:84  tick++
  lw t0, 0x14e8(zero)
  addi t0, t0, 1
  sw t0, 0x14e8(zero)
  ; ship.e16.ts:85  if (guard > 0) guard--
  lw t0, 0x14e2(zero)
  bgeu zero, t0, .L1
  ; ship.e16.ts:85  guard--
  lw t0, 0x14e2(zero)
  addi t0, t0, -1
  sw t0, 0x14e2(zero)
.L1:
  ; ship.e16.ts:86  if (overdrive > 0) overdrive--
  lw t0, 0x14f0(zero)
  bgeu zero, t0, .L2
  ; ship.e16.ts:86  overdrive--
  lw t0, 0x14f0(zero)
  addi t0, t0, -1
  sw t0, 0x14f0(zero)
.L2:
  ; ship.e16.ts:87  if (bombing > 0) bombStep()
  lw t0, 0x14f2(zero)
  bgeu zero, t0, .L3
  ; ship.e16.ts:87  bombStep()
  call bombStep
.L3:
  ; ship.e16.ts:88  if (shipState === SH_ENTER) enterStep()
  lw t0, 0x14d8(zero)
  bne t0, zero, .L4
  ; ship.e16.ts:88  enterStep()
  call enterStep
  j .L5
.L4:
  ; ship.e16.ts:89  if (shipState === SH_PLAY) playStep()
  lw t0, 0x14d8(zero)
  li t1, 1
  bne t0, t1, .L6
  ; ship.e16.ts:89  playStep()
  call playStep
  j .L7
.L6:
  ; ship.e16.ts:90  if (shipState === SH_DEAD) deadStep()
  lw t0, 0x14d8(zero)
  li t1, 2
  bne t0, t1, .L8
  ; ship.e16.ts:90  deadStep()
  call deadStep
.L8:
.L7:
.L5:
  ; ship.e16.ts:91  target(shipX, shipY)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  mv a0, t0
  mv a1, t1
  call target
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ship.e16.ts:94 enterStep() at -O1
;   step in a0
enterStep:
  ; ship.e16.ts:95  timer++
  lw t0, 0x14e0(zero)
  addi t0, t0, 1
  sw t0, 0x14e0(zero)
  ; ship.e16.ts:96  const step: i16 = timer < 40 ? 40 : 12
  li t1, 40
  bgeu t0, t1, .L1
  li t0, 40
  j .L2
.L1:
  li t0, 12
.L2:
  mv a0, t0 ; step
  ; ship.e16.ts:97  shipY = shipY - step
  lw t0, 0x14dc(zero)
  sub t0, t0, a0
  sw t0, 0x14dc(zero)
  ; ship.e16.ts:98  if (shipY <= 3800) shipState = SH_PLAY
  li t1, 3800
  blt t1, t0, .L3
  ; ship.e16.ts:98  shipState = SH_PLAY
  li t0, 1
  sw t0, 0x14d8(zero)
.L3:
.return:
  ret

; ship.e16.ts:101 playStep() at -O1
playStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ship.e16.ts:102  move()
  call move
  ; ship.e16.ts:103  fire()
  call fire
  ; ship.e16.ts:104  if (pressed(B_B) && bombs > 0 && bombing === 0) bomb()
  li a0, 32
  call pressed
  beqz a0, .L1
  lw t0, 0x14ec(zero)
  bgeu zero, t0, .L1
  lw t0, 0x14f2(zero)
  bne t0, zero, .L1
  ; ship.e16.ts:104  bomb()
  call bomb
.L1:
  ; ship.e16.ts:105  if (pressed(B_X | B_R) && volt >= VOLT_FULL && overdrive === 0) {
  li a0, 576
  call pressed
  beqz a0, .L2
  lw t0, 0x14ee(zero)
  li t1, 1024
  bltu t0, t1, .L2
  lw t0, 0x14f0(zero)
  bne t0, zero, .L2
  ; ship.e16.ts:106  overdrive = OVERDRIVE_FRAMES
  li t0, 480
  sw t0, 0x14f0(zero)
  ; ship.e16.ts:107  volt = 0
  sw zero, 0x14ee(zero)
  ; ship.e16.ts:108  sfxOverdrive()
  call sfxOverdrive
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ship.e16.ts:113 move() at -O1
;   speed in s3
;   dx in s1
;   dy in s2
;   want in s0
move:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  ; ship.e16.ts:114  const speed: i16 = lancing ? 20 : 40
  lw t0, 0x14f4(zero)
  beqz t0, .L1
  li t0, 20
  j .L2
.L1:
  li t0, 40
.L2:
  mv s3, t0 ; speed
  ; ship.e16.ts:115  let dx: i16 = 0
  li s1, 0 ; dx
  ; ship.e16.ts:116  let dy: i16 = 0
  li s2, 0 ; dy
  ; ship.e16.ts:117  if (held(B_LEFT)) dx = -speed
  li a0, 4
  call held
  beqz a0, .L3
  ; ship.e16.ts:117  dx = -speed
  neg s1, s3
.L3:
  ; ship.e16.ts:118  if (held(B_RIGHT)) dx = speed
  li a0, 8
  call held
  beqz a0, .L4
  ; ship.e16.ts:118  dx = speed
  mv s1, s3 ; dx
.L4:
  ; ship.e16.ts:119  if (held(B_UP)) dy = -speed
  li a0, 1
  call held
  beqz a0, .L5
  ; ship.e16.ts:119  dy = -speed
  neg s2, s3
.L5:
  ; ship.e16.ts:120  if (held(B_DOWN)) dy = speed
  li a0, 2
  call held
  beqz a0, .L6
  ; ship.e16.ts:120  dy = speed
  mv s2, s3 ; dy
.L6:
  ; ship.e16.ts:122  if (dx !== 0 && dy !== 0) {
  beq s1, zero, .L7
  beq s2, zero, .L7
  ; ship.e16.ts:123  dx = mulShift(dx, 11, 4)
  li t0, 11
  mulq s1, s1, t0, 4
  ; ship.e16.ts:124  dy = mulShift(dy, 11, 4)
  li t0, 11
  mulq s2, s2, t0, 4
.L7:
  ; ship.e16.ts:126  shipX = shipX + dx
  lw t0, 0x14da(zero)
  add t0, t0, s1
  sw t0, 0x14da(zero)
  ; ship.e16.ts:127  shipY = shipY + dy
  lw t0, 0x14dc(zero)
  add t0, t0, s2
  sw t0, 0x14dc(zero)
  ; ship.e16.ts:128  const left = (FIELD_X + 8) * 16
  ; ship.e16.ts:129  const right = (FIELD_X + FIELD_W - 8) * 16
  ; ship.e16.ts:130  if (shipX < left) shipX = left
  lw t0, 0x14da(zero)
  li t1, 896
  bge t0, t1, .L8
  ; ship.e16.ts:130  shipX = left
  li t0, 896
  sw t0, 0x14da(zero)
.L8:
  ; ship.e16.ts:131  if (shipX > right) shipX = right
  lw t0, 0x14da(zero)
  li t1, 4224
  bge t1, t0, .L9
  ; ship.e16.ts:131  shipX = right
  li t0, 4224
  sw t0, 0x14da(zero)
.L9:
  ; ship.e16.ts:132  if (shipY < 16 * 16) shipY = 16 * 16
  lw t0, 0x14dc(zero)
  li t1, 256
  bge t0, t1, .L10
  ; ship.e16.ts:132  shipY = 16 * 16
  li t0, 256
  sw t0, 0x14dc(zero)
.L10:
  ; ship.e16.ts:133  if (shipY > 276 * 16) shipY = 276 * 16
  lw t0, 0x14dc(zero)
  li t1, 4416
  bge t1, t0, .L11
  ; ship.e16.ts:133  shipY = 276 * 16
  li t0, 4416
  sw t0, 0x14dc(zero)
.L11:
  ; ship.e16.ts:134  let want: i16 = 0
  li s0, 0 ; want
  ; ship.e16.ts:135  if (dx < 0) want = -16
  bge s1, zero, .L12
  ; ship.e16.ts:135  want = -16
  li s0, 65520 ; want
.L12:
  ; ship.e16.ts:136  if (dx > 0) want = 16
  bge zero, s1, .L13
  ; ship.e16.ts:136  want = 16
  li s0, 16 ; want
.L13:
  ; ship.e16.ts:137  if (tilt < want) tilt = tilt + 2
  lw t0, 0x14de(zero)
  bge t0, s0, .L14
  ; ship.e16.ts:137  tilt = tilt + 2
  lw t0, 0x14de(zero)
  addi t0, t0, 2
  sw t0, 0x14de(zero)
.L14:
  ; ship.e16.ts:138  if (tilt > want) tilt = tilt - 2
  lw t0, 0x14de(zero)
  bge s0, t0, .L15
  ; ship.e16.ts:138  tilt = tilt - 2
  lw t0, 0x14de(zero)
  addi t0, t0, -2
  sw t0, 0x14de(zero)
.L15:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; ship.e16.ts:142 fire() at -O1
;   every in s1
fire:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; ship.e16.ts:143  if (held(B_A)) holdA++
  li a0, 16
  call held
  beqz a0, .L1
  ; ship.e16.ts:143  holdA++
  lw t0, 0x14e4(zero)
  addi t0, t0, 1
  sw t0, 0x14e4(zero)
  j .L2
.L1:
  ; ship.e16.ts:144  holdA = 0
  sw zero, 0x14e4(zero)
.L2:
  ; ship.e16.ts:145  lancing = holdA >= 12
  lw t0, 0x14e4(zero)
  li t1, 12
  sltu t0, t0, t1
  xori t0, t0, 1
  sw t0, 0x14f4(zero)
  ; ship.e16.ts:146  if (cooldown > 0) cooldown--
  lw t0, 0x14e6(zero)
  bgeu zero, t0, .L3
  ; ship.e16.ts:146  cooldown--
  lw t0, 0x14e6(zero)
  addi t0, t0, -1
  sw t0, 0x14e6(zero)
.L3:
  ; ship.e16.ts:148  const every: u16 = power >= 4 ? 15 : 30
  lw t0, 0x14f8(zero)
  li t1, 4
  bltu t0, t1, .L4
  li t0, 15
  j .L5
.L4:
  li t0, 30
.L5:
  mv s1, t0 ; every
  ; ship.e16.ts:149  if (holdA > 0 && power >= 3 && tick % every === 0) missilesFire(shipX, shipY)
  lw t0, 0x14e4(zero)
  bgeu zero, t0, .L6
  lw t0, 0x14f8(zero)
  li t1, 3
  bltu t0, t1, .L6
  lw t0, 0x14e8(zero)
  remu t0, t0, s1
  bne t0, zero, .L6
  ; ship.e16.ts:149  missilesFire(shipX, shipY)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  mv a0, t0
  mv a1, t1
  la t0, missilesFire
  li t1, 259
  call far_call
.L6:
  ; ship.e16.ts:150  if (holdA === 0 || lancing || cooldown > 0) return
  lw t0, 0x14e4(zero)
  beq t0, zero, .L8
  lw t0, 0x14f4(zero)
  bnez t0, .L8
  lw t0, 0x14e6(zero)
  bgeu zero, t0, .L7
.L8:
  ; ship.e16.ts:150  return
  j .return
.L7:
  ; ship.e16.ts:151  cooldown = 4
  li t0, 4
  sw t0, 0x14e6(zero)
  ; ship.e16.ts:152  volley()
  call volley
  ; ship.e16.ts:153  sfxShot()
  call sfxShot
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; ship.e16.ts:160 volley() at -O1
volley:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ship.e16.ts:161  shot(shipX - 64, shipY - 96, 0)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  addi a0, t0, -64
  addi a1, t1, -96
  li a2, 0
  call shot
  ; ship.e16.ts:162  shot(shipX + 64, shipY - 96, 0)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  addi a0, t0, 64
  addi a1, t1, -96
  li a2, 0
  call shot
  ; ship.e16.ts:163  if (power >= 1 || (tick & 4) === 0 || overdrive > 0) {
  lw t0, 0x14f8(zero)
  li t1, 1
  bgeu t0, t1, .L2
  lw t0, 0x14e8(zero)
  andi t0, t0, 4
  beq t0, zero, .L2
  lw t0, 0x14f0(zero)
  bgeu zero, t0, .L1
.L2:
  ; ship.e16.ts:164  shot(shipX - 96, shipY - 64, -1)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  addi a0, t0, -96
  addi a1, t1, -64
  li a2, 65535
  call shot
  ; ship.e16.ts:165  shot(shipX + 96, shipY - 64, 1)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  addi a0, t0, 96
  addi a1, t1, -64
  li a2, 1
  call shot
.L1:
  ; ship.e16.ts:167  if (power >= 2) {
  lw t0, 0x14f8(zero)
  li t1, 2
  bltu t0, t1, .L3
  ; ship.e16.ts:168  shot(shipX - 128, shipY - 32, -2)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  addi a0, t0, -128
  addi a1, t1, -32
  li a2, 65534
  call shot
  ; ship.e16.ts:169  shot(shipX + 128, shipY - 32, 2)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  addi a0, t0, 128
  addi a1, t1, -32
  li a2, 2
  call shot
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ship.e16.ts:174 powerAdd() at -O1
powerAdd:
  ; ship.e16.ts:175  if (power >= POWER_MAX) return false
  lw t0, 0x14f8(zero)
  li t1, 4
  bltu t0, t1, .L1
  ; ship.e16.ts:175  return false
  li a0, 0
  ret
.L1:
  ; ship.e16.ts:176  power++
  lw t0, 0x14f8(zero)
  addi t0, t0, 1
  sw t0, 0x14f8(zero)
  ; ship.e16.ts:177  return true
  li a0, 1
.return:
  ret

; ship.e16.ts:184 bomb() at -O1
bomb:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ship.e16.ts:185  bombs--
  lw t0, 0x14ec(zero)
  addi t0, t0, -1
  sw t0, 0x14ec(zero)
  ; ship.e16.ts:186  bombing = BOMB_FRAMES
  li t0, 120
  sw t0, 0x14f2(zero)
  ; ship.e16.ts:187  guard = BOMB_FRAMES
  li t0, 120
  sw t0, 0x14e2(zero)
  ; ship.e16.ts:188  ringStart(shipX, shipY, 80 + power * 32)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  lw t2, 0x14f8(zero)
  slli t2, t2, 5
  mv a0, t0
  mv a1, t1
  addi a2, t2, 80
  la t0, ringStart
  li t1, 259
  call far_call
  ; ship.e16.ts:189  itemsAll()
  call itemsAll
  ; ship.e16.ts:190  shake(30)
  li a0, 30
  call shake
  ; ship.e16.ts:191  wave(90, 12)
  li a0, 90
  li a1, 12
  call wave
  ; ship.e16.ts:192  sfxBomb()
  call sfxBomb
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ship.e16.ts:195 bombStep() at -O1
bombStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ship.e16.ts:196  bombing--
  lw t0, 0x14f2(zero)
  addi t0, t0, -1
  sw t0, 0x14f2(zero)
  ; ship.e16.ts:197  ringStep()
  la t0, ringStep
  li t1, 259
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ship.e16.ts:201 shipHit() at -O1
shipHit:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ship.e16.ts:202  shipState = SH_DEAD
  li t0, 2
  sw t0, 0x14d8(zero)
  ; ship.e16.ts:203  timer = 0
  sw zero, 0x14e0(zero)
  ; ship.e16.ts:204  lancing = false
  sw zero, 0x14f4(zero)
  ; ship.e16.ts:205  overdrive = 0
  sw zero, 0x14f0(zero)
  ; ship.e16.ts:206  burst(shipX, shipY, 1)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  mv a0, t0
  mv a1, t1
  li a2, 1
  call burst
  ; ship.e16.ts:207  burst(shipX - 160, shipY + 80, 0)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  addi a0, t0, -160
  addi a1, t1, 80
  li a2, 0
  call burst
  ; ship.e16.ts:208  burst(shipX + 160, shipY - 80, 0)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  addi a0, t0, 160
  addi a1, t1, -80
  li a2, 0
  call burst
  ; ship.e16.ts:209  shake(24)
  li a0, 24
  call shake
  ; ship.e16.ts:210  sfxDie()
  call sfxDie
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ship.e16.ts:213 deadStep() at -O1
deadStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ship.e16.ts:214  timer++
  lw t0, 0x14e0(zero)
  addi t0, t0, 1
  sw t0, 0x14e0(zero)
  ; ship.e16.ts:215  if (timer === 20) burst(shipX, shipY - 200, 0)
  li t1, 20
  bne t0, t1, .L1
  ; ship.e16.ts:215  burst(shipX, shipY - 200, 0)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  mv a0, t0
  addi a1, t1, -200
  li a2, 0
  call burst
.L1:
  ; ship.e16.ts:216  if (timer < 90) return
  lw t0, 0x14e0(zero)
  li t1, 90
  bgeu t0, t1, .L2
  ; ship.e16.ts:216  return
  j .return
.L2:
  ; ship.e16.ts:217  if (lives === 0) {
  lw t0, 0x14ea(zero)
  bne t0, zero, .L3
  ; ship.e16.ts:218  shipState = SH_GONE
  li t0, 3
  sw t0, 0x14d8(zero)
  ; ship.e16.ts:219  return
  j .return
.L3:
  ; ship.e16.ts:221  lives--
  lw t0, 0x14ea(zero)
  addi t0, t0, -1
  sw t0, 0x14ea(zero)
  ; ship.e16.ts:222  bombs = levelBombs()
  call levelBombs
  sw a0, 0x14ec(zero)
  ; ship.e16.ts:224  if (power > 0) power--
  lw t0, 0x14f8(zero)
  bgeu zero, t0, .L4
  ; ship.e16.ts:224  power--
  lw t0, 0x14f8(zero)
  addi t0, t0, -1
  sw t0, 0x14f8(zero)
.L4:
  ; ship.e16.ts:225  cancelAll()
  call cancelAll
  ; ship.e16.ts:226  shipEnter()
  call shipEnter
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ship.e16.ts:230 shipVulnerable() at -O1
shipVulnerable:
  ; ship.e16.ts:231  return shipState === SH_PLAY && guard === 0
  lw t0, 0x14d8(zero)
  li t1, 1
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  lw t0, 0x14e2(zero)
  sub t0, t0, zero
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; ship.e16.ts:238 lanceStep(damage) at -O1
;   damage in s2
;   now in s1
lanceStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; damage
  ; ship.e16.ts:239  if (!lancing || shipState !== SH_PLAY) return
  lw t0, 0x14f4(zero)
  beqz t0, .L2
  lw t0, 0x14d8(zero)
  li t1, 1
  beq t0, t1, .L1
.L2:
  ; ship.e16.ts:239  return
  j .return
.L1:
  ; ship.e16.ts:240  const now: u16 = (tick & 1) === 0 ? damage : 0
  lw t0, 0x14e8(zero)
  andi t0, t0, 1
  bne t0, zero, .L3
  mv t0, s2
  j .L4
.L3:
  li t0, 0
.L4:
  mv s1, t0 ; now
  ; ship.e16.ts:241  lanceTop = foeLance(shipX, shipY - 192, now)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  mv a0, t0
  addi a1, t1, -192
  mv a2, s1
  call foeLance
  sw a0, 0x14f6(zero)
  ; ship.e16.ts:242  if (power >= 2 && lanceVictim !== 0xffff) chainFrom(lanceVictim, power >= 4 ? 2 : 1, now)
  lw t0, 0x14f8(zero)
  li t1, 2
  bltu t0, t1, .L5
  lw t0, 0x1736(zero)
  li t1, 65535
  beq t0, t1, .L5
  ; ship.e16.ts:242  chainFrom(lanceVictim, power >= 4 ? 2 : 1, now)
  lw t0, 0x1736(zero)
  lw t1, 0x14f8(zero)
  li t2, 4
  bltu t1, t2, .L6
  li t1, 2
  j .L7
.L6:
  li t1, 1
.L7:
  mv a0, t0
  mv a1, t1
  mv a2, s1
  la t0, chainFrom
  li t1, 259
  call far_call
.L5:
  ; ship.e16.ts:243  if (lanceTop > 0 && (tick & 3) === 0) fx(FX_SPARK, shipX + i16(tick & 7) * 16 - 64, lanceTop, 0)
  lw t0, 0x14f6(zero)
  bge zero, t0, .L8
  lw t0, 0x14e8(zero)
  andi t0, t0, 3
  bne t0, zero, .L8
  ; ship.e16.ts:243  fx(FX_SPARK, shipX + i16(tick & 7) * 16 - 64, lanceTop, 0)
  lw t0, 0x14da(zero)
  lw t1, 0x14e8(zero)
  andi t1, t1, 7
  slli t1, t1, 4
  add t0, t0, t1
  lw t1, 0x14f6(zero)
  li a0, 4
  addi a1, t0, -64
  mv a2, t1
  li a3, 0
  call fx
.L8:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; ship.e16.ts:247 shipDraw() at -O1
;   x in s1
;   y in s2
;   pose in s3
shipDraw:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; ship.e16.ts:248  if (shipState === SH_DEAD || shipState === SH_GONE) return
  lw t0, 0x14d8(zero)
  li t1, 2
  beq t0, t1, .L2
  lw t0, 0x14d8(zero)
  li t1, 3
  bne t0, t1, .L1
.L2:
  ; ship.e16.ts:248  return
  j .return
.L1:
  ; ship.e16.ts:249  ringDraw()
  la t0, ringDraw
  li t1, 259
  call far_call
  ; ship.e16.ts:250  const x = (shipX >> 4) + shakeDX()
  lw t0, 0x14da(zero)
  srai t0, t0, 4
  ; view.e16.ts:276  return shakeX
  lw t1, 0x0ca4(zero)
  add s1, t0, t1
  ; ship.e16.ts:251  const y = (shipY >> 4) + shakeDY()
  lw t0, 0x14dc(zero)
  srai t0, t0, 4
  ; view.e16.ts:280  return shakeY
  lw t1, 0x0ca6(zero)
  add s2, t0, t1
  ; ship.e16.ts:253  if (guard > 0 && bombing === 0 && (tick & 4) !== 0) return
  lw t0, 0x14e2(zero)
  bgeu zero, t0, .L3
  lw t0, 0x14f2(zero)
  bne t0, zero, .L3
  lw t0, 0x14e8(zero)
  andi t0, t0, 4
  beq t0, zero, .L3
  ; ship.e16.ts:253  return
  j .return
.L3:
  ; ship.e16.ts:254  const pose = u16((tilt + 16 + 4) >> 3)
  lw t0, 0x14de(zero)
  addi t0, t0, 20
  srai s3, t0, 3
  ; ship.e16.ts:255  spr(x - 8, y - 8, (SHIP_TILE + (pose > 4 ? 4 : pose) * 4) | ((SL_SHIP - 8) << 10), S16)
  addi t0, s1, -8
  addi t1, s2, -8
  li t2, 0
  mv t3, s3
  li a1, 4
  bgeu a1, t3, .L4
  li t3, 4
  j .L5
.L4:
  mv t3, s3
.L5:
  slli t3, t3, 2
  add t2, t2, t3
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call spr
  ; ship.e16.ts:256  spr(x - 8, y + 6, (FLAME_TILE + ((tick >> 1) % 3) * 4) | ((SL_SHIP - 8) << 10), S16)
  lw t0, 0x14e8(zero)
  srli t0, t0, 1
  li t1, 3
  remu t0, t0, t1
  slli t0, t0, 2
  addi a0, s1, -8
  addi a1, s2, 6
  addi a2, t0, 20
  li a3, 1
  call spr
  ; ship.e16.ts:257  if (lancing && shipState === SH_PLAY) lanceDraw(x, y)
  lw t0, 0x14f4(zero)
  beqz t0, .L6
  lw t0, 0x14d8(zero)
  li t1, 1
  bne t0, t1, .L6
  ; ship.e16.ts:257  lanceDraw(x, y)
  mv a0, s1
  mv a1, s2
  call lanceDraw
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; ship.e16.ts:260 lanceDraw(x, y) at -O1
;   x in s3
;   y in 0(fp)
;   top in 2(fp)
;   at in s1
;   k in s2
lanceDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; x
  sw a1, 0(fp) ; y
  ; ship.e16.ts:261  const pal = (SL_SHOT - 8) << 10
  ; ship.e16.ts:262  const top = (lanceTop >> 4) + shakeDY()
  lw t0, 0x14f6(zero)
  srai t0, t0, 4
  ; view.e16.ts:280  return shakeY
  lw t1, 0x0ca6(zero)
  add t0, t0, t1
  sw t0, 2(fp) ; top
  ; ship.e16.ts:263  let at = y - 24
  lw t0, 0(fp) ; y
  addi s1, t0, -24
  ; ship.e16.ts:264  let k: u16 = 0
  li s2, 0 ; k
  ; ship.e16.ts:265  while (at > top - 8 && k < 18) {
  j .L3
.L1:
  ; ship.e16.ts:266  spr(x - 8, at - 8, (LANCE_TILE + ((tick + k) & 3) * 4) | pal, S16)
  lw t0, 0x14e8(zero)
  add t0, t0, s2
  andi t0, t0, 3
  slli t0, t0, 2
  addi t0, t0, 35
  ori t0, t0, 1024
  addi a0, s3, -8
  addi a1, s1, -8
  mv a2, t0
  li a3, 1
  call spr
  ; ship.e16.ts:267  at = at - 16
  addi s1, s1, -16
  ; ship.e16.ts:268  k++
  addi s2, s2, 1
.L3:
  lw t0, 2(fp) ; top
  addi t0, t0, -8
  bge t0, s1, .L5
  li t0, 18
  bltu s2, t0, .L1
.L5:
  ; ship.e16.ts:270  spr(x - 8, y - 22, (LANCE_ENDS_TILE + ((tick >> 1) & 1) * 4) | pal, S16)
  lw t0, 0(fp) ; y
  lw t1, 0x14e8(zero)
  srli t1, t1, 1
  andi t1, t1, 1
  slli t1, t1, 2
  addi t1, t1, 51
  ori t1, t1, 1024
  addi a0, s3, -8
  addi a1, t0, -22
  mv a2, t1
  li a3, 1
  call spr
  ; ship.e16.ts:271  if (lanceTop > 0) spr(x - 8, top - 8, (LANCE_ENDS_TILE + 8 + ((tick >> 1) & 1) * 4) | pal, S16)
  lw t0, 0x14f6(zero)
  bge zero, t0, .L6
  ; ship.e16.ts:271  spr(x - 8, top - 8, (LANCE_ENDS_TILE + 8 + ((tick >> 1) & 1) * 4) | pal, S16)
  lw t0, 2(fp) ; top
  lw t1, 0x14e8(zero)
  srli t1, t1, 1
  andi t1, t1, 1
  slli t1, t1, 2
  addi t1, t1, 59
  ori t1, t1, 1024
  addi a0, s3, -8
  addi a1, t0, -8
  mv a2, t1
  li a3, 1
  call spr
.L6:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; ship.e16.ts:275 voltAdd(n) at -O1
;   n in a0
voltAdd:
  ; ship.e16.ts:276  if (overdrive > 0) return
  lw t0, 0x14f0(zero)
  bgeu zero, t0, .L1
  ; ship.e16.ts:276  return
  ret
.L1:
  ; ship.e16.ts:277  volt = volt + n > VOLT_FULL ? VOLT_FULL : volt + n
  lw t0, 0x14ee(zero)
  add t0, t0, a0
  li t1, 1024
  bgeu t1, t0, .L2
  li t0, 1024
  j .L3
.L2:
  lw t0, 0x14ee(zero)
  add t0, t0, a0
.L3:
  sw t0, 0x14ee(zero)
.return:
  ret

; ship.e16.ts:281 bombsAdd() at -O1
bombsAdd:
  ; ship.e16.ts:282  if (bombs < 5) bombs++
  lw t0, 0x14ec(zero)
  li t1, 5
  bgeu t0, t1, .L1
  ; ship.e16.ts:282  bombs++
  lw t0, 0x14ec(zero)
  addi t0, t0, 1
  sw t0, 0x14ec(zero)
.L1:
.return:
  ret

; ship.e16.ts:286 livesAdd() at -O1
livesAdd:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ship.e16.ts:287  if (lives < 5) lives++
  lw t0, 0x14ea(zero)
  li t1, 5
  bgeu t0, t1, .L1
  ; ship.e16.ts:287  lives++
  lw t0, 0x14ea(zero)
  addi t0, t0, 1
  sw t0, 0x14ea(zero)
.L1:
  ; ship.e16.ts:288  sfxExtend()
  call sfxExtend
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; foes.e16.ts:62 foesInit() at -O1
foesInit:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; foes.e16.ts:63  kindIs(K_MOTE, 7, 5, 10)
  li a0, 1
  li a1, 7
  li a2, 5
  li a3, 10
  call kindIs
  ; foes.e16.ts:64  kindIs(K_DART, 7, 7, 15)
  li a0, 2
  li a1, 7
  li a2, 7
  li a3, 15
  call kindIs
  ; foes.e16.ts:65  kindIs(K_PIKE, 7, 16, 30)
  li a0, 3
  li a1, 7
  li a2, 16
  li a3, 30
  call kindIs
  ; foes.e16.ts:66  kindIs(K_HALBERD, 15, 90, 200)
  li a0, 4
  li a1, 15
  li a2, 90
  li a3, 200
  call kindIs
  ; foes.e16.ts:67  kindIs(K_WARDEN, 15, 130, 300)
  li a0, 5
  li a1, 15
  li a2, 130
  li a3, 300
  call kindIs
  ; foes.e16.ts:68  kindIs(K_ROCK, 14, 32, 50)
  li a0, 6
  li a1, 14
  li a2, 32
  li a3, 50
  call kindIs
  ; foes.e16.ts:69  kindIs(K_PEBBLE, 7, 6, 10)
  li a0, 7
  li a1, 7
  li a2, 6
  li a3, 10
  call kindIs
  ; foes.e16.ts:70  kindIs(K_TURRET, 7, 20, 40)
  li a0, 8
  li a1, 7
  li a2, 20
  li a3, 40
  call kindIs
  ; foes.e16.ts:71  kindIs(K_PRISM, 7, 18, 40)
  li a0, 9
  li a1, 7
  li a2, 18
  li a3, 40
  call kindIs
  ; foes.e16.ts:72  kindIs(K_SERPENT, 7, 40, 150)
  li a0, 10
  li a1, 7
  li a2, 40
  li a3, 150
  call kindIs
  ; foes.e16.ts:73  kindIs(K_SEGMENT, 7, 8, 10)
  li a0, 11
  li a1, 7
  li a2, 8
  li a3, 10
  call kindIs
  ; foes.e16.ts:74  kindIs(K_SPINNER, 7, 8, 20)
  li a0, 12
  li a1, 7
  li a2, 8
  li a3, 20
  call kindIs
  ; foes.e16.ts:75  foesClear()
  call foesClear
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; foes.e16.ts:78 kindIs(k, half, life, worth) at -O1
;   k in a0
;   half in a1
;   life in a2
;   worth in a3
kindIs:
  ; foes.e16.ts:79  HALF[k] = half
  slli t0, a0, 1
  sw a1, HALF(t0)
  ; foes.e16.ts:80  LIFE[k] = life
  slli t0, a0, 1
  sw a2, LIFE(t0)
  ; foes.e16.ts:81  WORTH[k] = worth
  slli t0, a0, 1
  sw a3, WORTH(t0)
.return:
  ret

; foes.e16.ts:84 foesClear() at -O1
;   k in s1
foesClear:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; foes.e16.ts:85  let k: u16 = 0
  li s1, 0 ; k
  ; foes.e16.ts:86  while (k < F_N) {
  j .L3
.L1:
  ; foes.e16.ts:87  fK[k] = 0
  slli t0, s1, 1
  sw zero, fK(t0)
  ; foes.e16.ts:88  k++
  addi s1, s1, 1
.L3:
  li t0, 24
  bltu s1, t0, .L1
  ; foes.e16.ts:90  serpentsClear()
  la t0, serpentsClear
  li t1, 259
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; foes.e16.ts:98 roundIs(r) at -O1
;   r in a0
roundIs:
  ; foes.e16.ts:99  round = r
  sw a0, 0x1728(zero)
.return:
  ret

; foes.e16.ts:103 rankReset() at -O1
rankReset:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; foes.e16.ts:104  rank = levelRank()
  call levelRank
  sw a0, 0x172a(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; foes.e16.ts:108 rankUp() at -O1
rankUp:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; foes.e16.ts:109  if (rank < levelTop()) rank++
  lw t0, 0x172a(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call levelTop
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L1
  ; foes.e16.ts:109  rank++
  lw t0, 0x172a(zero)
  addi t0, t0, 1
  sw t0, 0x172a(zero)
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; foes.e16.ts:113 foe(kind, x, y, p) at -O1
;   kind in a0
;   x in a1
;   y in a2
;   p in s2
;   k in s1
foe:
  addi sp, sp, -4
  sw s2, 0(sp)
  sw s1, 2(sp)
  mv s2, a3 ; p
  ; foes.e16.ts:114  let k: u16 = 0
  li s1, 0 ; k
  ; foes.e16.ts:115  while (k < F_N && fK[k] !== 0) k++
  j .L3
.L1:
  ; foes.e16.ts:115  k++
  addi s1, s1, 1
.L3:
  li t0, 24
  bgeu s1, t0, .L5
  slli t0, s1, 1
  lw t0, fK(t0)
  bne t0, zero, .L1
.L5:
  ; foes.e16.ts:116  if (k === F_N) return 0xffff
  li t0, 24
  bne s1, t0, .L6
  ; foes.e16.ts:116  return 0xffff
  li a0, 65535
  j .return
.L6:
  ; foes.e16.ts:117  fK[k] = kind
  slli t0, s1, 1
  sw a0, fK(t0)
  ; foes.e16.ts:118  fX[k] = u16(x * 16)
  slli t0, s1, 1
  slli t1, a1, 4
  sw t1, fX(t0)
  ; foes.e16.ts:119  fY[k] = u16(y * 16)
  slli t0, s1, 1
  slli t1, a2, 4
  sw t1, fY(t0)
  ; foes.e16.ts:120  fVX[k] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; foes.e16.ts:121  fVY[k] = 0
  slli t0, s1, 1
  sw zero, fVY(t0)
  ; foes.e16.ts:122  fHP[k] = LIFE[kind] + (round > 1 ? LIFE[kind] >> 1 : 0)
  slli t0, s1, 1
  slli t1, a0, 1
  lw t1, LIFE(t1)
  lw t2, 0x1728(zero)
  addi t0, t0, fHP
  li t3, 1
  bgeu t3, t2, .L7
  slli t2, a0, 1
  lw t2, LIFE(t2)
  srli t2, t2, 1
  j .L8
.L7:
  li t2, 0
.L8:
  add t1, t1, t2
  sw t1, 0(t0)
  ; foes.e16.ts:123  fT[k] = 0
  slli t0, s1, 1
  sw zero, fT(t0)
  ; foes.e16.ts:124  fP[k] = p
  slli t0, s1, 1
  sw s2, fP(t0)
  ; foes.e16.ts:125  fFlash[k] = 0
  slli t0, s1, 1
  sw zero, fFlash(t0)
  ; foes.e16.ts:126  return k
  mv a0, s1
.return:
  lw s2, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; foes.e16.ts:130 foesStep(scroll) at -O1
;   scroll in s2
;   k in s1
foesStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; scroll
  ; foes.e16.ts:131  let k: u16 = 0
  li s1, 0 ; k
  ; foes.e16.ts:132  while (k < F_N) {
  j .L3
.L1:
  ; foes.e16.ts:133  if (fK[k] !== 0) foeOne(k, scroll)
  slli t0, s1, 1
  lw t0, fK(t0)
  beq t0, zero, .L5
  ; foes.e16.ts:133  foeOne(k, scroll)
  mv a0, s1
  mv a1, s2
  call foeOne
.L5:
  ; foes.e16.ts:134  k++
  addi s1, s1, 1
.L3:
  li t0, 24
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; foes.e16.ts:138 foeOne(k, scroll) at -O1
;   k in s1
;   scroll in 2(fp)
;   t in s3
;   switch1/x in s2
;   y in 0(fp)
foeOne:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 2(fp) ; scroll
  ; foes.e16.ts:139  const t = fT[k] + 1
  slli t0, s1, 1
  lw t0, fT(t0)
  addi s3, t0, 1
  ; foes.e16.ts:140  fT[k] = t
  slli t0, s1, 1
  sw s3, fT(t0)
  ; foes.e16.ts:141  switch (fK[k]) {
  slli t0, s1, 1
  lw s2, fK(t0)
  li t0, 1
  beq s2, t0, .L2
  li t0, 2
  beq s2, t0, .L3
  li t0, 3
  beq s2, t0, .L4
  li t0, 4
  beq s2, t0, .L5
  li t0, 5
  beq s2, t0, .L6
  li t0, 8
  beq s2, t0, .L7
  li t0, 9
  beq s2, t0, .L8
  li t0, 10
  beq s2, t0, .L9
  li t0, 11
  beq s2, t0, .L10
  li t0, 12
  beq s2, t0, .L11
  li t0, 6
  beq s2, t0, .L12
  j .L1
.L2:
  ; foes.e16.ts:143  moteMove(k, t)
  mv a0, s1
  mv a1, s3
  la t0, moteMove
  li t1, 259
  call far_call
  ; foes.e16.ts:144  break
  j .L1
.L3:
  ; foes.e16.ts:146  dartMove(k, t)
  mv a0, s1
  mv a1, s3
  la t0, dartMove
  li t1, 259
  call far_call
  ; foes.e16.ts:147  break
  j .L1
.L4:
  ; foes.e16.ts:149  pikeMove(k, t)
  mv a0, s1
  mv a1, s3
  la t0, pikeMove
  li t1, 259
  call far_call
  ; foes.e16.ts:150  break
  j .L1
.L5:
  ; foes.e16.ts:152  halberdMove(k, t)
  mv a0, s1
  mv a1, s3
  la t0, halberdMove
  li t1, 259
  call far_call
  ; foes.e16.ts:153  break
  j .L1
.L6:
  ; foes.e16.ts:155  wardenMove(k, t)
  mv a0, s1
  mv a1, s3
  la t0, wardenMove
  li t1, 259
  call far_call
  ; foes.e16.ts:156  break
  j .L1
.L7:
  ; foes.e16.ts:158  fVY[k] = scroll
  slli t0, s1, 1
  lw t1, 2(fp) ; scroll
  sw t1, fVY(t0)
  ; foes.e16.ts:159  if (t % (70 - rank * 2) === 0 && i16(fY[k]) > 320 && i16(fY[k]) < 3200)
  lw t0, 0x172a(zero)
  slli t0, t0, 1
  li t1, 70
  sub t1, t1, t0
  remu t1, s3, t1
  bne t1, zero, .L1
  slli t0, s1, 1
  lw t0, fY(t0)
  li t1, 320
  bge t1, t0, .L1
  slli t0, s1, 1
  lw t0, fY(t0)
  li t1, 3200
  bge t0, t1, .L1
  ; foes.e16.ts:160  shootAimed(k, BK_NEEDLE, 40)
  mv a0, s1
  li a1, 3
  li a2, 40
  la t0, shootAimed
  li t1, 259
  call far_call
  ; foes.e16.ts:161  break
  j .L1
.L8:
.L9:
.L10:
.L11:
  ; foes.e16.ts:166  newFoeMove(k, t)
  mv a0, s1
  mv a1, s3
  la t0, newFoeMove
  li t1, 259
  call far_call
  ; foes.e16.ts:167  break
  j .L1
.L12:
  ; foes.e16.ts:170  fVY[k] = scroll + 12
  slli t0, s1, 1
  lw t1, 2(fp) ; scroll
  addi t1, t1, 12
  sw t1, fVY(t0)
  ; foes.e16.ts:171  break
  ; foes.e16.ts:174  break
.L1:
  ; foes.e16.ts:176  const x = i16(fX[k]) + i16(fVX[k])
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fVX(t1)
  add s2, t0, t1
  ; foes.e16.ts:177  const y = i16(fY[k]) + i16(fVY[k])
  slli t0, s1, 1
  lw t0, fY(t0)
  slli t1, s1, 1
  lw t1, fVY(t1)
  add t0, t0, t1
  sw t0, 0(fp) ; y
  ; foes.e16.ts:178  fX[k] = u16(x)
  slli t0, s1, 1
  sw s2, fX(t0)
  ; foes.e16.ts:179  fY[k] = u16(y)
  slli t0, s1, 1
  lw t1, 0(fp) ; y
  sw t1, fY(t0)
  ; foes.e16.ts:181  if (y > 4900 || y < -1200 || x < (FIELD_X - 48) * 16 || x > (FIELD_X + 272) * 16) {
  li t0, 4900
  lw t1, 0(fp) ; y
  blt t0, t1, .L16
  li t0, 64336
  lw t1, 0(fp) ; y
  blt t1, t0, .L16
  blt s2, zero, .L16
  li t0, 5120
  bge t0, s2, .L15
.L16:
  ; foes.e16.ts:183  if (fK[k] === K_SERPENT) serpentGone(fP[k] >> 8)
  slli t0, s1, 1
  lw t0, fK(t0)
  li t1, 10
  bne t0, t1, .L17
  ; foes.e16.ts:183  serpentGone(fP[k] >> 8)
  slli t0, s1, 1
  lw t0, fP(t0)
  srli a0, t0, 8
  la t0, serpentGone
  li t1, 259
  call far_call
.L17:
  ; foes.e16.ts:184  fK[k] = 0
  slli t0, s1, 1
  sw zero, fK(t0)
  ; foes.e16.ts:185  return
  j .return
.L15:
  ; foes.e16.ts:187  foeDraw(k, x, y, t)
  mv a0, s1
  mv a1, s2
  lw a2, 0(fp)
  mv a3, s3
  call foeDraw
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes.e16.ts:190 foeDraw(k, x16, y16, t) at -O1
;   k in 4(fp)
;   x16 in 8(fp)
;   y16 in 10(fp)
;   t in s2
;   kind in s1
;   half in 6(fp)
;   x in s3
;   y in 0(fp)
;   pal in 2(fp)
;   bank_ in 12(fp)
;   lean in 14(fp)
foeDraw:
  addi sp, sp, -26
  sw ra, 16(sp)
  sw s2, 18(sp)
  sw s1, 20(sp)
  sw s3, 22(sp)
  sw s0, 24(sp)
  mv fp, sp
  sw a0, 4(fp) ; k
  sw a1, 8(fp) ; x16
  sw a2, 10(fp) ; y16
  mv s2, a3 ; t
  ; foes.e16.ts:191  const kind = fK[k]
  lw t0, 4(fp) ; k
  slli t0, t0, 1
  lw s1, fK(t0)
  ; foes.e16.ts:192  const half = i16(HALF[kind])
  slli t0, s1, 1
  lw t0, HALF(t0)
  sw t0, 6(fp) ; half
  ; foes.e16.ts:193  const x = (x16 >> 4) - half + shakeDX()
  lw t0, 8(fp) ; x16
  srai t0, t0, 4
  lw t1, 6(fp) ; half
  sub t0, t0, t1
  ; view.e16.ts:276  return shakeX
  lw t1, 0x0ca4(zero)
  add s3, t0, t1
  ; foes.e16.ts:194  const y = (y16 >> 4) - half + shakeDY()
  lw t0, 10(fp) ; y16
  srai t0, t0, 4
  lw t1, 6(fp) ; half
  sub t0, t0, t1
  ; view.e16.ts:280  return shakeY
  lw t1, 0x0ca6(zero)
  add t0, t0, t1
  sw t0, 0(fp) ; y
  ; foes.e16.ts:195  const pal = foeColours(k, kind, t)
  lw a0, 4(fp)
  mv a1, s1
  mv a2, s2
  call foeColours
  sw a0, 2(fp) ; pal
  ; foes.e16.ts:196  foePal = pal
  lw t0, 2(fp) ; pal
  sw t0, 0x172c(zero)
  ; foes.e16.ts:197  switch (kind) {
  li t0, 1
  beq s1, t0, .L2
  li t0, 2
  beq s1, t0, .L3
  li t0, 3
  beq s1, t0, .L4
  li t0, 8
  beq s1, t0, .L5
  li t0, 4
  beq s1, t0, .L6
  li t0, 5
  beq s1, t0, .L7
  li t0, 6
  beq s1, t0, .L8
  li t0, 7
  beq s1, t0, .L9
  j .L10
.L2:
  ; foes.e16.ts:199  spr(x, y, (MOTE_TILE + ((t >> 2) & 3) * 4) | pal, S16)
  srli t0, s2, 2
  andi t0, t0, 3
  slli t0, t0, 2
  lw t1, 2(fp) ; pal
  addi t0, t0, 67
  or t0, t0, t1
  mv a0, s3
  lw a1, 0(fp)
  mv a2, t0
  li a3, 1
  call spr
  ; foes.e16.ts:200  break
  j .L1
.L3:
  ; foes.e16.ts:202  const bank_ = i16(fVX[k]) > 8 ? FLIP_H : 0
  lw t0, 4(fp) ; k
  slli t0, t0, 1
  lw t0, fVX(t0)
  li t1, 8
  bge t1, t0, .L11
  li t0, 8192
  j .L12
.L11:
  li t0, 0
.L12:
  sw t0, 12(fp) ; bank_
  ; foes.e16.ts:203  const lean = abs(i16(fVX[k])) > 8 ? 0 : 4
  lw t0, 4(fp) ; k
  slli t0, t0, 1
  lw a0, fVX(t0)
  call abs
  li t0, 8
  bge t0, a0, .L13
  li t0, 0
  j .L14
.L13:
  li t0, 4
.L14:
  sw t0, 14(fp) ; lean
  ; foes.e16.ts:204  spr(x, y, (DART_TILE + lean) | pal | bank_, S16)
  lw t0, 14(fp) ; lean
  lw t1, 2(fp) ; pal
  addi t0, t0, 83
  or t0, t0, t1
  lw t1, 12(fp) ; bank_
  or t0, t0, t1
  mv a0, s3
  lw a1, 0(fp)
  mv a2, t0
  li a3, 1
  call spr
  ; foes.e16.ts:205  break
  j .L1
.L4:
.L5:
  ; foes.e16.ts:209  spr(x, y, (PIKE_TILE + (t % 50 > 40 ? 4 : 0)) | pal, S16)
  li t0, 50
  remu t0, s2, t0
  lw t1, 0(fp)
  li t2, 91
  mv t3, t0
  mv t0, s3
  li a1, 40
  bgeu a1, t3, .L15
  li t3, 4
  j .L16
.L15:
  li t3, 0
.L16:
  add t2, t2, t3
  lw t3, 2(fp) ; pal
  or t2, t2, t3
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call spr
  ; foes.e16.ts:210  break
  j .L1
.L6:
  ; foes.e16.ts:212  spr(x, y, (HALBERD_TILE + ((t >> 2) & 1) * 16) | pal, S32)
  srli t0, s2, 2
  andi t0, t0, 1
  slli t0, t0, 4
  lw t1, 2(fp) ; pal
  addi t0, t0, 139
  or t0, t0, t1
  mv a0, s3
  lw a1, 0(fp)
  mv a2, t0
  li a3, 2
  call spr
  ; foes.e16.ts:213  break
  j .L1
.L7:
  ; foes.e16.ts:215  spr(x, y, (WARDEN_TILE + (t % 80 > 30 && t % 80 < 50 ? 16 : 0)) | pal, S32)
  li t0, 80
  remu t0, s2, t0
  lw t1, 0(fp)
  li t2, 171
  mv t3, t0
  mv t0, s3
  li a1, 30
  bgeu a1, t3, .L17
  li t3, 80
  remu t3, s2, t3
  li a1, 50
  bgeu t3, a1, .L17
  li t3, 16
  j .L18
.L17:
  li t3, 0
.L18:
  add t2, t2, t3
  lw t3, 2(fp) ; pal
  or t2, t2, t3
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 2
  call spr
  ; foes.e16.ts:216  break
  j .L1
.L8:
  ; foes.e16.ts:218  spr(x, y, (ROCK_BIG_TILE + ((t >> 5) & 1) * 16) | pal, S32)
  srli t0, s2, 5
  andi t0, t0, 1
  slli t0, t0, 4
  lw t1, 2(fp) ; pal
  addi t0, t0, 99
  or t0, t0, t1
  mv a0, s3
  lw a1, 0(fp)
  mv a2, t0
  li a3, 2
  call spr
  ; foes.e16.ts:219  break
  j .L1
.L9:
  ; foes.e16.ts:221  spr(x, y, (ROCK_SMALL_TILE + ((t >> 4) & 1) * 4) | pal, S16)
  srli t0, s2, 4
  andi t0, t0, 1
  slli t0, t0, 2
  lw t1, 2(fp) ; pal
  addi t0, t0, 131
  or t0, t0, t1
  mv a0, s3
  lw a1, 0(fp)
  mv a2, t0
  li a3, 1
  call spr
  ; foes.e16.ts:222  break
  j .L1
.L10:
  ; foes.e16.ts:224  newFoeDraw(k, x, y, t)
  lw a0, 4(fp)
  mv a1, s3
  lw a2, 0(fp)
  mv a3, s2
  la t0, newFoeDraw
  li t1, 259
  call far_call
.L1:
.return:
  mv sp, fp
  lw ra, 16(sp)
  lw s2, 18(sp)
  lw s1, 20(sp)
  lw s3, 22(sp)
  lw s0, 24(sp)
  addi sp, sp, 26
  ret

; foes.e16.ts:232 foeColours(k, kind, t) at -O1
;   k in s2
;   kind in s1
;   t in 0(fp)
;   flash in s3
;   heavy in 2(fp)
foeColours:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; k
  mv s1, a1 ; kind
  sw a2, 0(fp) ; t
  ; foes.e16.ts:233  let flash = false
  li s3, 0 ; flash
  ; foes.e16.ts:234  if (fFlash[k] > 0) {
  slli t0, s2, 1
  lw t0, fFlash(t0)
  bgeu zero, t0, .L1
  ; foes.e16.ts:235  fFlash[k] = fFlash[k] - 1
  slli t0, s2, 1
  slli t1, s2, 1
  lw t1, fFlash(t1)
  addi t1, t1, -1
  sw t1, fFlash(t0)
  ; foes.e16.ts:236  flash = true
  li s3, 1 ; flash
.L1:
  ; foes.e16.ts:238  const heavy = kind === K_HALBERD || kind === K_WARDEN || kind === K_PRISM
  li t0, 4
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 5
  sub t0, s1, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 9
  sub t0, s1, t0
  seqz t0, t0
.L2:
  sw t0, 2(fp) ; heavy
  ; foes.e16.ts:239  if (heavy && (t & 2) !== 0 && foeCharging(kind, t)) flash = true
  lw t0, 2(fp) ; heavy
  beqz t0, .L4
  lw t0, 0(fp) ; t
  andi t0, t0, 2
  beq t0, zero, .L4
  mv a0, s1
  lw a1, 0(fp)
  la t0, foeCharging
  li t1, 259
  call far_call
  beqz a0, .L4
  ; foes.e16.ts:239  flash = true
  li s3, 1 ; flash
.L4:
  ; foes.e16.ts:240  return ((flash ? SL_FLASH : heavy ? SL_HEAVY : SL_ENEMY) - 8) << 10
  beqz s3, .L5
  li t0, 15
  j .L6
.L5:
  lw t0, 2(fp) ; heavy
  beqz t0, .L7
  li t0, 11
  j .L8
.L7:
  li t0, 10
.L8:
.L6:
  addi t0, t0, -8
  slli a0, t0, 10
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes.e16.ts:255 foeHit(x, y, damage, byLance) at -O1
;   x in s2
;   y in s3
;   damage in 0(fp)
;   byLance in 2(fp)
;   k in s1
foeHit:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; x
  mv s3, a1 ; y
  sw a2, 0(fp) ; damage
  sw a3, 2(fp) ; byLance
  ; foes.e16.ts:256  let k: u16 = 0
  li s1, 0 ; k
  ; foes.e16.ts:257  while (k < F_N) {
  j .L3
.L1:
  ; foes.e16.ts:258  if (fK[k] !== 0 && within(k, x, y, 0)) {
  slli t0, s1, 1
  lw t0, fK(t0)
  beq t0, zero, .L5
  mv a0, s1
  mv a1, s2
  mv a2, s3
  li a3, 0
  call within
  beqz a0, .L5
  ; foes.e16.ts:259  hurt(k, damage, byLance)
  mv a0, s1
  lw a1, 0(fp)
  lw a2, 2(fp)
  call hurt
  ; foes.e16.ts:260  return true
  li a0, 1
  j .return
.L5:
  ; foes.e16.ts:262  k++
  addi s1, s1, 1
.L3:
  li t0, 24
  bltu s1, t0, .L1
  ; foes.e16.ts:264  return bossHit(x, y, damage, byLance)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  lw a3, 2(fp)
  la t0, bossHit
  li t1, 257
  call far_call
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes.e16.ts:267 within(k, x, y, more) at -O1
;   k in s1
;   x in s3
;   y in 0(fp)
;   more in 2(fp)
;   r in s2
within:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  mv s3, a1 ; x
  sw a2, 0(fp) ; y
  sw a3, 2(fp) ; more
  ; foes.e16.ts:268  const r = i16(HALF[fK[k]]) * 16 + more
  slli t0, s1, 1
  lw t0, fK(t0)
  slli t0, t0, 1
  lw t0, HALF(t0)
  slli t0, t0, 4
  lw t1, 2(fp) ; more
  add s2, t0, t1
  ; foes.e16.ts:269  return abs(i16(fX[k]) - x) < r && abs(i16(fY[k]) - y) < r && i16(fY[k]) > -64
  slli t0, s1, 1
  lw t0, fX(t0)
  sub a0, t0, s3
  call abs
  slt t0, a0, s2
  mv t1, t0
  beqz t1, .L2
  slli t0, s1, 1
  lw t0, fY(t0)
  lw t1, 0(fp) ; y
  sub a0, t0, t1
  call abs
  slt t0, a0, s2
.L2:
  mv t1, t0
  beqz t1, .L1
  slli t0, s1, 1
  lw t0, fY(t0)
  li t1, 65472
  slt t0, t1, t0
.L1:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes.e16.ts:276 foeLance(x, y, damage) at -O1
;   x in 2(fp)
;   y in 8(fp)
;   damage in 4(fp)
;   best in s2
;   bestY in s3
;   k in s1
;   r/boss in 0(fp)
;   fy in 6(fp)
foeLance:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 2(fp) ; x
  sw a1, 8(fp) ; y
  sw a2, 4(fp) ; damage
  ; foes.e16.ts:277  let best: u16 = 0xffff
  li s2, 65535 ; best
  ; foes.e16.ts:278  let bestY: i16 = 0
  li s3, 0 ; bestY
  ; foes.e16.ts:279  let k: u16 = 0
  li s1, 0 ; k
  ; foes.e16.ts:280  while (k < F_N) {
  j .L3
.L1:
  ; foes.e16.ts:281  if (fK[k] !== 0) {
  slli t0, s1, 1
  lw t0, fK(t0)
  beq t0, zero, .L5
  ; foes.e16.ts:282  const r = i16(HALF[fK[k]]) * 16 + 64
  slli t0, s1, 1
  lw t0, fK(t0)
  slli t0, t0, 1
  lw t0, HALF(t0)
  slli t0, t0, 4
  addi t0, t0, 64
  sw t0, 0(fp) ; r/boss
  ; foes.e16.ts:283  const fy = i16(fY[k]) + i16(HALF[fK[k]]) * 16
  slli t0, s1, 1
  lw t0, fY(t0)
  slli t1, s1, 1
  lw t1, fK(t1)
  slli t1, t1, 1
  lw t1, HALF(t1)
  slli t1, t1, 4
  add t0, t0, t1
  sw t0, 6(fp) ; fy
  ; foes.e16.ts:284  if (abs(i16(fX[k]) - x) < r && fy < y && fy > bestY) {
  slli t0, s1, 1
  lw t0, fX(t0)
  lw t1, 2(fp) ; x
  sub a0, t0, t1
  call abs
  lw t0, 0(fp) ; r/boss
  bge a0, t0, .L6
  lw t0, 8(fp) ; y
  lw t1, 6(fp) ; fy
  bge t1, t0, .L6
  lw t0, 6(fp) ; fy
  bge s3, t0, .L6
  ; foes.e16.ts:285  best = k
  mv s2, s1 ; best
  ; foes.e16.ts:286  bestY = fy
  lw s3, 6(fp) ; fy
.L6:
.L5:
  ; foes.e16.ts:289  k++
  addi s1, s1, 1
.L3:
  li t0, 24
  bltu s1, t0, .L1
  ; foes.e16.ts:291  lanceVictim = 0xffff
  li t0, 65535
  sw t0, 0x1736(zero)
  ; foes.e16.ts:292  const boss = bossLance(x, y)
  lw a0, 2(fp)
  lw a1, 8(fp)
  la t0, bossLance
  li t1, 257
  call far_call
  sw a0, 0(fp) ; r/boss
  ; foes.e16.ts:293  if (boss > bestY) {
  lw t0, 0(fp) ; r/boss
  bge s3, t0, .L7
  ; foes.e16.ts:294  bossHit(x, boss - 32, damage, true)
  lw t0, 0(fp) ; r/boss
  lw a0, 2(fp)
  addi a1, t0, -32
  lw a2, 4(fp)
  li a3, 1
  la t0, bossHit
  li t1, 257
  call far_call
  ; foes.e16.ts:295  return boss
  lw a0, 0(fp)
  j .return
.L7:
  ; foes.e16.ts:297  if (best === 0xffff) return 0
  li t0, 65535
  bne s2, t0, .L8
  ; foes.e16.ts:297  return 0
  li a0, 0
  j .return
.L8:
  ; foes.e16.ts:299  if (fK[best] === K_PRISM) {
  slli t0, s2, 1
  lw t0, fK(t0)
  li t1, 9
  bne t0, t1, .L9
  ; foes.e16.ts:300  fFlash[best] = 1
  slli t0, s2, 1
  li t1, 1
  sw t1, fFlash(t0)
  ; foes.e16.ts:301  return bestY
  mv a0, s3
  j .return
.L9:
  ; foes.e16.ts:303  lanceVictim = best
  sw s2, 0x1736(zero)
  ; foes.e16.ts:304  if (damage > 0) hurt(best, damage, true)
  lw t0, 4(fp) ; damage
  bgeu zero, t0, .L10
  ; foes.e16.ts:304  hurt(best, damage, true)
  mv a0, s2
  lw a1, 4(fp)
  li a2, 1
  call hurt
.L10:
  ; foes.e16.ts:305  return bestY
  mv a0, s3
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; foes.e16.ts:312 foesBombReset() at -O1
;   k in a0
foesBombReset:
  ; foes.e16.ts:313  let k: u16 = 0
  li a0, 0 ; k
  ; foes.e16.ts:314  while (k < F_N) {
  j .L3
.L1:
  ; foes.e16.ts:315  fBombed[k] = 0
  slli t0, a0, 1
  sw zero, fBombed(t0)
  ; foes.e16.ts:316  k++
  addi a0, a0, 1
.L3:
  li t0, 24
  bltu a0, t0, .L1
  ; foes.e16.ts:318  bossBombed = 0
  sw zero, 0x1738(zero)
.return:
  ret

; foes.e16.ts:324 foesBombWithin(x, y, r) at -O1
;   x in s3
;   y in s0
;   r in s2
;   k in s1
foesBombWithin:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; x
  mv s0, a1 ; y
  mv s2, a2 ; r
  ; foes.e16.ts:325  let k: u16 = 0
  li s1, 0 ; k
  ; foes.e16.ts:326  while (k < F_N) {
  j .L3
.L1:
  ; foes.e16.ts:327  if (
  slli t0, s1, 1
  lw t0, fK(t0)
  beq t0, zero, .L5
  slli t0, s1, 1
  lw t0, fBombed(t0)
  bne t0, zero, .L5
  slli t0, s1, 1
  lw t0, fY(t0)
  bge zero, t0, .L5
  slli t0, s1, 1
  lw t0, fX(t0)
  sub t0, t0, s3
  slli t1, s1, 1
  lw t1, fY(t1)
  sub t1, t1, s0
  mv a0, t0
  mv a1, t1
  mv a2, s2
  call inside
  beqz a0, .L5
  ; foes.e16.ts:333  fBombed[k] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fBombed(t0)
  ; foes.e16.ts:334  hurt(k, 40, false)
  mv a0, s1
  li a1, 40
  li a2, 0
  call hurt
.L5:
  ; foes.e16.ts:336  k++
  addi s1, s1, 1
.L3:
  li t0, 24
  bltu s1, t0, .L1
  ; foes.e16.ts:338  if (bossBombed === 0 && r > 160 * 16) {
  lw t0, 0x1738(zero)
  bne t0, zero, .L6
  li t0, 2560
  bge t0, s2, .L6
  ; foes.e16.ts:339  bossBombed = 1
  li t0, 1
  sw t0, 0x1738(zero)
  ; foes.e16.ts:340  bossBomb()
  la t0, bossBomb
  li t1, 257
  call far_call
.L6:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; foes.e16.ts:345 inside(ox, oy, r) at -O1
;   ox in 0(fp)
;   oy in 2(fp)
;   r in s3
;   dx in s1
;   dy in s2
;   big in 4(fp)
;   small in 6(fp)
inside:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 0(fp) ; ox
  sw a1, 2(fp) ; oy
  mv s3, a2 ; r
  ; foes.e16.ts:346  const dx = abs(ox)
  lw a0, 0(fp)
  call abs
  mv s1, a0 ; dx
  ; foes.e16.ts:347  const dy = abs(oy)
  lw a0, 2(fp)
  call abs
  mv s2, a0 ; dy
  ; foes.e16.ts:348  if (dx > r || dy > r) return false
  blt s3, s1, .L2
  bge s3, s2, .L1
.L2:
  ; foes.e16.ts:348  return false
  li a0, 0
  j .return
.L1:
  ; foes.e16.ts:349  const big = dx > dy ? dx : dy
  bge s2, s1, .L3
  mv t0, s1
  j .L4
.L3:
  mv t0, s2
.L4:
  sw t0, 4(fp) ; big
  ; foes.e16.ts:350  const small = dx > dy ? dy : dx
  bge s2, s1, .L5
  mv t0, s2
  j .L6
.L5:
  mv t0, s1
.L6:
  sw t0, 6(fp) ; small
  ; foes.e16.ts:351  return big + (small >> 1) < r
  lw t0, 6(fp) ; small
  srai t0, t0, 1
  lw t1, 4(fp) ; big
  add t1, t1, t0
  slt a0, t1, s3
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; foes.e16.ts:357 foeX(k) at -O1
;   k in a0
foeX:
  ; foes.e16.ts:358  return i16(fX[k])
  slli t0, a0, 1
  lw a0, fX(t0)
.return:
  ret

; foes.e16.ts:361 foeY(k) at -O1
;   k in a0
foeY:
  ; foes.e16.ts:362  return i16(fY[k])
  slli t0, a0, 1
  lw a0, fY(t0)
.return:
  ret

; foes.e16.ts:366 foeHurt(k, damage) at -O1
;   k in s1
;   damage in s2
foeHurt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; damage
  ; foes.e16.ts:367  if (fK[k] !== 0) hurt(k, damage, false)
  slli t0, s1, 1
  lw t0, fK(t0)
  beq t0, zero, .L1
  ; foes.e16.ts:367  hurt(k, damage, false)
  mv a0, s1
  mv a1, s2
  li a2, 0
  call hurt
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; foes.e16.ts:371 foeNearest(x, y, except) at -O1
;   x in 2(fp)
;   y in 4(fp)
;   except in 6(fp)
;   best in s2
;   bestD in s3
;   k in s1
;   d in 0(fp)
foeNearest:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s1, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 2(fp) ; x
  sw a1, 4(fp) ; y
  sw a2, 6(fp) ; except
  ; foes.e16.ts:372  let best: u16 = 0xffff
  li s2, 65535 ; best
  ; foes.e16.ts:373  let bestD: i16 = 32000
  li s3, 32000 ; bestD
  ; foes.e16.ts:374  let k: u16 = 0
  li s1, 0 ; k
  ; foes.e16.ts:375  while (k < F_N) {
  j .L3
.L1:
  ; foes.e16.ts:376  if (fK[k] !== 0 && k !== except && i16(fY[k]) > 0) {
  slli t0, s1, 1
  lw t0, fK(t0)
  beq t0, zero, .L5
  lw t0, 6(fp) ; except
  beq s1, t0, .L5
  slli t0, s1, 1
  lw t0, fY(t0)
  bge zero, t0, .L5
  ; foes.e16.ts:377  const d = abs(i16(fX[k]) - x) + abs(i16(fY[k]) - y)
  slli t0, s1, 1
  lw t0, fX(t0)
  lw t1, 2(fp) ; x
  sub a0, t0, t1
  call abs
  slli t0, s1, 1
  lw t0, fY(t0)
  lw t1, 4(fp) ; y
  sub t0, t0, t1
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  call abs
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 0(fp) ; d
  ; foes.e16.ts:378  if (d < bestD) {
  lw t0, 0(fp) ; d
  bge t0, s3, .L6
  ; foes.e16.ts:379  best = k
  mv s2, s1 ; best
  ; foes.e16.ts:380  bestD = d
  lw s3, 0(fp) ; d
.L6:
.L5:
  ; foes.e16.ts:383  k++
  addi s1, s1, 1
.L3:
  li t0, 24
  bltu s1, t0, .L1
  ; foes.e16.ts:385  return best
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

; foes.e16.ts:388 hurt(k, damage, byLance) at -O1
;   k in s1
;   damage in s2
;   byLance in s3
hurt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; damage
  mv s3, a2 ; byLance
  ; foes.e16.ts:389  fFlash[k] = 2
  slli t0, s1, 1
  li t1, 2
  sw t1, fFlash(t0)
  ; foes.e16.ts:390  if (fHP[k] > damage) {
  slli t0, s1, 1
  lw t0, fHP(t0)
  bgeu s2, t0, .L1
  ; foes.e16.ts:391  fHP[k] = fHP[k] - damage
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fHP(t1)
  sub t1, t1, s2
  sw t1, fHP(t0)
  ; foes.e16.ts:392  return
  j .return
.L1:
  ; foes.e16.ts:394  kill(k, byLance)
  mv a0, s1
  mv a1, s3
  call kill
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; foes.e16.ts:397 kill(k, byLance) at -O1
;   k in 0(fp)
;   byLance in 6(fp)
;   kind in s3
;   x in s1
;   y in s2
;   big in 2(fp)
;   stars in 4(fp)
kill:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 0(fp) ; k
  sw a1, 6(fp) ; byLance
  ; foes.e16.ts:398  const kind = fK[k]
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw s3, fK(t0)
  ; foes.e16.ts:399  const x = i16(fX[k])
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw s1, fX(t0)
  ; foes.e16.ts:400  const y = i16(fY[k])
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw s2, fY(t0)
  ; foes.e16.ts:401  fK[k] = 0
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  sw zero, fK(t0)
  ; foes.e16.ts:402  const big = kind === K_HALBERD || kind === K_WARDEN || kind === K_ROCK
  li t0, 4
  sub t0, s3, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L2
  li t0, 5
  sub t0, s3, t0
  seqz t0, t0
.L2:
  mv t1, t0
  bnez t1, .L1
  li t0, 6
  sub t0, s3, t0
  seqz t0, t0
.L1:
  sw t0, 2(fp) ; big
  ; foes.e16.ts:403  burst(x, y, big ? 1 : 0)
  mv t0, s1
  mv t1, s2
  lw t2, 2(fp)
  beqz t2, .L3
  li t2, 1
  j .L4
.L3:
  li t2, 0
.L4:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call burst
  ; foes.e16.ts:404  if (big) shake(10)
  lw t0, 2(fp) ; big
  beqz t0, .L5
  ; foes.e16.ts:404  shake(10)
  li a0, 10
  call shake
.L5:
  ; foes.e16.ts:406  if (kind === K_HALBERD || kind === K_WARDEN) item(IT_POWER, x, y)
  li t0, 4
  beq s3, t0, .L7
  li t0, 5
  bne s3, t0, .L6
.L7:
  ; foes.e16.ts:406  item(IT_POWER, x, y)
  li a0, 4
  mv a1, s1
  mv a2, s2
  call item
.L6:
  ; foes.e16.ts:407  newFoeDies(k, kind, x, y)
  lw a0, 0(fp)
  mv a1, s3
  mv a2, s1
  mv a3, s2
  la t0, newFoeDies
  li t1, 259
  call far_call
  ; foes.e16.ts:409  let stars: u16 = (big ? 6 : 1) + (byLance ? 2 : 0)
  lw t0, 2(fp) ; big
  beqz t0, .L8
  li t0, 6
  j .L9
.L8:
  li t0, 1
.L9:
  lw t1, 6(fp)
  beqz t1, .L10
  li t1, 2
  j .L11
.L10:
  li t1, 0
.L11:
  add t0, t0, t1
  sw t0, 4(fp) ; stars
  ; foes.e16.ts:410  while (stars > 0) {
  j .L14
.L12:
  ; foes.e16.ts:411  item(IT_STAR, x, y)
  li a0, 1
  mv a1, s1
  mv a2, s2
  call item
  ; foes.e16.ts:412  stars--
  lw t0, 4(fp) ; stars
  addi t0, t0, -1
  sw t0, 4(fp) ; stars
.L14:
  lw t0, 4(fp) ; stars
  bltu zero, t0, .L12
  ; foes.e16.ts:414  if (kind === K_ROCK) {
  li t0, 6
  bne s3, t0, .L16
  ; foes.e16.ts:415  pebble(foe(K_PEBBLE, (x >> 4) - 6, y >> 4, 0), -20)
  srai t0, s1, 4
  srai t1, s2, 4
  li a0, 7
  addi a1, t0, -6
  mv a2, t1
  li a3, 0
  call foe
  li a1, 65516
  call pebble
  ; foes.e16.ts:416  pebble(foe(K_PEBBLE, (x >> 4) + 6, y >> 4, 0), 20)
  srai t0, s1, 4
  srai t1, s2, 4
  li a0, 7
  addi a1, t0, 6
  mv a2, t1
  li a3, 0
  call foe
  li a1, 20
  call pebble
.L16:
  ; foes.e16.ts:418  if (overdriveOn()) cancelNear(x, y, 960)
  call overdriveOn
  beqz a0, .L17
  ; foes.e16.ts:418  cancelNear(x, y, 960)
  mv a0, s1
  mv a1, s2
  li a2, 960
  call cancelNear
.L17:
  ; foes.e16.ts:420  if (round > 1) bullet(x, y, aimed(x, y), sk(40, BK_PINK))
  lw t0, 0x1728(zero)
  li t1, 1
  bgeu t1, t0, .L18
  ; foes.e16.ts:420  bullet(x, y, aimed(x, y), sk(40, BK_PINK))
  mv a0, s1
  mv a1, s2
  call aimed
  mv a1, s2
  mv a2, a0
  mv a0, s1
  li a3, 40
  call bullet
.L18:
  ; foes.e16.ts:421  killed++
  lw t0, 0x172e(zero)
  addi t0, t0, 1
  sw t0, 0x172e(zero)
  ; foes.e16.ts:422  killWorth = killWorth + WORTH[kind]
  lw t0, 0x1730(zero)
  slli t1, s3, 1
  lw t1, WORTH(t1)
  add t0, t0, t1
  sw t0, 0x1730(zero)
  ; foes.e16.ts:423  killX = x
  sw s1, 0x1732(zero)
  ; foes.e16.ts:424  killY = y
  sw s2, 0x1734(zero)
  ; foes.e16.ts:425  sfxKill(big)
  lw a0, 2(fp)
  call sfxKill
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; foes.e16.ts:429 pebble(k, vx) at -O1
;   k in a0
;   vx in a1
pebble:
  ; foes.e16.ts:430  if (k === 0xffff) return
  li t0, 65535
  bne a0, t0, .L1
  ; foes.e16.ts:430  return
  ret
.L1:
  ; foes.e16.ts:431  fVX[k] = u16(vx)
  slli t0, a0, 1
  sw a1, fVX(t0)
  ; foes.e16.ts:432  fVY[k] = 30
  slli t0, a0, 1
  li t1, 30
  sw t1, fVY(t0)
.return:
  ret

; foes.e16.ts:436 killsReset() at -O1
killsReset:
  ; foes.e16.ts:437  killed = 0
  sw zero, 0x172e(zero)
  ; foes.e16.ts:438  killWorth = 0
  sw zero, 0x1730(zero)
.return:
  ret

; foes.e16.ts:445 scriptStart() at -O1
scriptStart:
  ; foes.e16.ts:446  scriptAt = STAGE_SCRIPT_AT
  li t0, 53050
  sw t0, 0x173a(zero)
.return:
  ret

; foes.e16.ts:450 scriptSend(kind, x, p) at -O1
;   kind in s1
;   x in s3
;   p in s2
;   k in 0(fp)
;   spawnY.p in 2(fp)
scriptSend:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; kind
  mv s3, a1 ; x
  mv s2, a2 ; p
  ; foes.e16.ts:451  if (kind === C_PICKUP) {
  li t0, 23
  bne s1, t0, .L1
  ; foes.e16.ts:452  item(p === 0 ? IT_BOMB : p === 1 ? IT_LIFE : IT_POWER, i16(x) * 16, 0)
  bne s2, zero, .L2
  li t0, 2
  j .L3
.L2:
  li t0, 1
  bne s2, t0, .L4
  li t0, 3
  j .L5
.L4:
  li t0, 4
.L5:
.L3:
  slli t1, s3, 4
  mv a0, t0
  mv a1, t1
  li a2, 0
  call item
  ; foes.e16.ts:453  return
  j .return
.L1:
  ; foes.e16.ts:455  if (kind === K_SERPENT && !serpentRoom()) return
  li t0, 10
  bne s1, t0, .L6
  la t0, serpentRoom
  li t1, 259
  call far_call
  bnez a0, .L6
  ; foes.e16.ts:455  return
  j .return
.L6:
  ; foes.e16.ts:456  const k = foe(kind, i16(x), spawnY(p), p & 255)
  sw s2, 2(fp) ; spawnY.p
  ; foes.e16.ts:486  return p >> 8 !== 0 ? i16(p >> 8) : -16
  lw t0, 2(fp) ; spawnY.p
  srli t0, t0, 8
  mv t1, s3
  mv t2, t0
  mv t0, s1
  li t3, 0
  beq t2, t3, .I1.L1
  lw t2, 2(fp) ; spawnY.p
  srli t2, t2, 8
  j .I1_end
.I1.L1:
  li t2, 65520
.I1_end:
  andi t3, s2, 255
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call foe
  sw a0, 0(fp) ; k
  ; foes.e16.ts:457  if (kind === K_SERPENT && k !== 0xffff) serpentBorn(k)
  li t0, 10
  bne s1, t0, .L7
  li t0, 65535
  lw t1, 0(fp) ; k
  beq t1, t0, .L7
  ; foes.e16.ts:457  serpentBorn(k)
  lw a0, 0(fp)
  la t0, serpentBorn
  li t1, 259
  call far_call
.L7:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes.e16.ts:461 scriptStep() at -O1
;   old in 2(fp)
;   cmd in s2
;   row in s3
;   kind in s1
;   x in 0(fp)
;   p in 4(fp)
scriptStep:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  ; foes.e16.ts:462  const old = bank(STAGE_SCRIPT_BANK)
  li a0, 279
  call bank
  sw a0, 2(fp) ; old
  ; foes.e16.ts:463  let cmd: u16 = 0
  li s2, 0 ; cmd
  ; foes.e16.ts:464  for (;;) {
.L1:
  ; foes.e16.ts:465  const row = peek16(scriptAt)
  lw t0, 0x173a(zero)
  lw s3, 0(t0)
  ; foes.e16.ts:466  if (row === 0xffff || !reached(row)) break
  li t0, 65535
  beq s3, t0, .L4
  mv a0, s3
  call reached
  bnez a0, .L5
  ; foes.e16.ts:466  break
  j .L4
.L5:
  ; foes.e16.ts:467  const kind = peek16(scriptAt + 2)
  lw t0, 0x173a(zero)
  lw s1, 2(t0)
  ; foes.e16.ts:468  const x = peek16(scriptAt + 4)
  lw t0, 0x173a(zero)
  lw t0, 4(t0)
  sw t0, 0(fp) ; x
  ; foes.e16.ts:469  const p = peek16(scriptAt + 6)
  lw t0, 0x173a(zero)
  lw t0, 6(t0)
  sw t0, 4(fp) ; p
  ; foes.e16.ts:470  scriptAt = scriptAt + 8
  lw t0, 0x173a(zero)
  addi t0, t0, 8
  sw t0, 0x173a(zero)
  ; foes.e16.ts:471  if (kind < C_SPEED || kind === C_PICKUP) scriptSend(kind, x, p)
  li t0, 20
  bltu s1, t0, .L8
  li t0, 23
  bne s1, t0, .L7
.L8:
  ; foes.e16.ts:471  scriptSend(kind, x, p)
  mv a0, s1
  lw a1, 0(fp)
  lw a2, 4(fp)
  call scriptSend
  j .L1
.L7:
  ; foes.e16.ts:473  cmd = kind
  mv s2, s1 ; cmd
  ; foes.e16.ts:474  scriptArg = x
  lw t0, 0(fp) ; x
  sw t0, 0x173c(zero)
  ; foes.e16.ts:475  break
.L4:
  ; foes.e16.ts:478  bank(old)
  lw a0, 2(fp)
  call bank
  ; foes.e16.ts:479  return cmd
  mv a0, s2
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; level.e16.ts:40 levelSet(l) at -O1
;   l in s2
;   old in s3
;   k in s1
levelSet:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; l
  ; level.e16.ts:41  level = l > LV_HARD ? LV_NORMAL : l
  li t0, 2
  bgeu t0, s2, .L1
  li t0, 1
  j .L2
.L1:
  mv t0, s2
.L2:
  sw t0, 0x173e(zero)
  ; level.e16.ts:42  const old = bank(DIFFICULTY_BANK)
  li a0, 279
  call bank
  mv s3, a0 ; old
  ; level.e16.ts:43  let k: u16 = 0
  li s1, 0 ; k
  ; level.e16.ts:44  while (k < ROW) {
  j .L5
.L3:
  ; level.e16.ts:45  lv[k] = peek16(DIFFICULTY_AT + (level * ROW + k) * 2)
  slli t0, s1, 1
  lw t1, 0x173e(zero)
  slli t2, t1, 3
  add t1, t2, t1
  add t1, t1, s1
  slli t1, t1, 1
  li t2, 54402
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, lv(t0)
  ; level.e16.ts:46  k++
  addi s1, s1, 1
.L5:
  li t0, 9
  bltu s1, t0, .L3
  ; level.e16.ts:48  poke16(IO_BANK, old)
  li t0, 65284
  sw s3, 0(t0)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; level.e16.ts:51 levelLives() at -O1
levelLives:
  ; level.e16.ts:52  return lv[D_LIVES]
  lw a0, lv(zero)
.return:
  ret

; level.e16.ts:55 levelBombs() at -O1
levelBombs:
  ; level.e16.ts:56  return lv[D_BOMBS]
  lw a0, lv+2(zero)
.return:
  ret

; level.e16.ts:59 levelRank() at -O1
levelRank:
  ; level.e16.ts:60  return lv[D_RANK]
  lw a0, lv+14(zero)
.return:
  ret

; level.e16.ts:63 levelTop() at -O1
levelTop:
  ; level.e16.ts:64  return lv[D_TOP]
  lw a0, lv+16(zero)
.return:
  ret

; level.e16.ts:68 levelBoss(on) at -O1
;   on in a0
levelBoss:
  ; level.e16.ts:69  bossFiring = on
  sw a0, 0x1752(zero)
.return:
  ret

; level.e16.ts:73 rising(base) at -O1
;   base in a0
;   v in a1
rising:
  ; level.e16.ts:74  const v = base + u16(mulShift(i16(rank), i16(lv[D_RISE]), 2))
  lw t0, 0x172a(zero)
  lw t1, lv+8(zero)
  mulq t0, t0, t1, 2
  add a1, a0, t0
  ; level.e16.ts:75  return v > 16 ? 16 : v
  li t0, 16
  bgeu t0, a1, .L1
  li t0, 16
  j .L2
.L1:
  mv t0, a1
.L2:
  mv a0, t0
.return:
  ret

; level.e16.ts:79 volleyGoes() at -O1
;   share in s1
volleyGoes:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; level.e16.ts:80  const share = rising(lv[bossFiring ? D_BOSS : D_RATE])
  lw t1, 0x1752(zero)
  la t0, lv
  beqz t1, .L1
  li t1, 3
  j .L2
.L1:
  li t1, 2
.L2:
  slli t1, t1, 1
  add t0, t0, t1
  lw a0, 0(t0)
  call rising
  mv s1, a0 ; share
  ; level.e16.ts:81  return share >= 16 || randBelow(16) < share
  li t0, 16
  sltu t0, s1, t0
  xori t0, t0, 1
  mv t1, t0
  bnez t1, .L3
  li a0, 16
  call randBelow
  sltu t0, a0, s1
.L3:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; level.e16.ts:85 volleyCount(n, least) at -O1
;   n in s1
;   least in s2
;   share in s3
;   v in s0
volleyCount:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; n
  mv s2, a1 ; least
  ; level.e16.ts:86  const share = rising(lv[D_COUNT])
  lw a0, lv+10(zero)
  call rising
  mv s3, a0 ; share
  ; level.e16.ts:87  if (share >= 16) return n
  li t0, 16
  bltu s3, t0, .L1
  ; level.e16.ts:87  return n
  mv a0, s1
  j .return
.L1:
  ; level.e16.ts:88  const v = (n * share + 8) >> 4
  mul t0, s1, s3
  addi t0, t0, 8
  srli s0, t0, 4
  ; level.e16.ts:89  if (v >= least) return v
  bltu s0, s2, .L2
  ; level.e16.ts:89  return v
  mv a0, s0
  j .return
.L2:
  ; level.e16.ts:90  return n < least ? n : least
  bgeu s1, s2, .L3
  mv t0, s1
  j .L4
.L3:
  mv t0, s2
.L4:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; level.e16.ts:94 volleySpeed(v) at -O1
;   v in a0
volleySpeed:
  ; level.e16.ts:95  return u16(mulShift(i16(v), i16(lv[D_SPEED]), 4))
  lw t0, lv+12(zero)
  mulq a0, a0, t0, 4
.return:
  ret

; score.e16.ts:28 multiplier() at -O1
;   m in a0
multiplier:
  ; score.e16.ts:29  const m = 1 + (chain >> 3)
  lw t0, 0x1786(zero)
  srli t0, t0, 3
  addi a0, t0, 1
  ; score.e16.ts:30  return m > 8 ? 8 : m
  li t0, 8
  bgeu t0, a0, .L1
  li t0, 8
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a0, t0
.return:
  ret

; score.e16.ts:33 scoreNew() at -O1
scoreNew:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; score.e16.ts:34  score[0] = 0
  sw zero, score(zero)
  ; score.e16.ts:35  score[1] = 0
  sw zero, score+2(zero)
  ; score.e16.ts:36  chain = 0
  sw zero, 0x1786(zero)
  ; score.e16.ts:37  chainLeft = 0
  sw zero, 0x1788(zero)
  ; score.e16.ts:38  maxChain = 0
  sw zero, 0x178a(zero)
  ; score.e16.ts:39  skims = 0
  sw zero, 0x178c(zero)
  ; score.e16.ts:40  nextExtend = 5000
  li t0, 5000
  sw t0, 0x178e(zero)
  ; score.e16.ts:41  hudReset()
  call hudReset
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; score.e16.ts:45 points(tens) at -O1
;   tens in s3
;   left in s1
;   n in s2
points:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; tens
  ; score.e16.ts:46  let left = tens
  mv s1, s3 ; left
  ; score.e16.ts:47  while (left > 0) {
  j .L3
.L1:
  ; score.e16.ts:48  const n = left > 9000 ? 9000 : left
  li t0, 9000
  bgeu t0, s1, .L5
  li t0, 9000
  j .L6
.L5:
  mv t0, s1
.L6:
  mv s2, t0 ; n
  ; score.e16.ts:49  scoreAdd(addr(score), n)
  la a0, score
  mv a1, s2
  call scoreAdd
  ; score.e16.ts:50  left = left - n
  sub s1, s1, s2
.L3:
  bltu zero, s1, .L1
  ; score.e16.ts:52  if (scoreMore(addr(score), addr(best))) {
  la a0, score
  la a1, best
  call scoreMore
  beqz a0, .L7
  ; score.e16.ts:53  best[0] = score[0]
  lw t0, score(zero)
  sw t0, best(zero)
  ; score.e16.ts:54  best[1] = score[1]
  lw t0, score+2(zero)
  sw t0, best+2(zero)
.L7:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; score.e16.ts:59 extendDue() at -O1
;   hi in a0
extendDue:
  ; score.e16.ts:60  if (nextExtend === 0) return false
  lw t0, 0x178e(zero)
  bne t0, zero, .L1
  ; score.e16.ts:60  return false
  li a0, 0
  ret
.L1:
  ; score.e16.ts:62  const hi: u16 = nextExtend === 5000 ? 0 : 1
  lw t0, 0x178e(zero)
  li t1, 5000
  bne t0, t1, .L2
  li t0, 0
  j .L3
.L2:
  li t0, 1
.L3:
  mv a0, t0 ; hi
  ; score.e16.ts:63  if (score[1] < hi || (score[1] === hi && score[0] < 5000)) return false
  lw t0, score+2(zero)
  bltu t0, a0, .L5
  lw t0, score+2(zero)
  bne t0, a0, .L4
  lw t0, score(zero)
  li t1, 5000
  bgeu t0, t1, .L4
.L5:
  ; score.e16.ts:63  return false
  li a0, 0
  ret
.L4:
  ; score.e16.ts:64  nextExtend = nextExtend === 5000 ? 15000 : 0
  lw t0, 0x178e(zero)
  li t1, 5000
  bne t0, t1, .L6
  li t0, 15000
  j .L7
.L6:
  li t0, 0
.L7:
  sw t0, 0x178e(zero)
  ; score.e16.ts:65  return true
  li a0, 1
.return:
  ret

; score.e16.ts:69 scoreKills(n, worth, x, y) at -O1
;   n in s1
;   worth in s2
;   x in s3
;   y in s0
scoreKills:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; n
  mv s2, a1 ; worth
  mv s3, a2 ; x
  mv s0, a3 ; y
  ; score.e16.ts:70  if (n === 0) return
  bne s1, zero, .L1
  ; score.e16.ts:70  return
  j .return
.L1:
  ; score.e16.ts:71  chain = chain + n
  lw t0, 0x1786(zero)
  add t0, t0, s1
  sw t0, 0x1786(zero)
  ; score.e16.ts:72  chainLeft = 60
  li t0, 60
  sw t0, 0x1788(zero)
  ; score.e16.ts:73  if (chain > maxChain) maxChain = chain
  lw t0, 0x1786(zero)
  lw t1, 0x178a(zero)
  bgeu t1, t0, .L2
  ; score.e16.ts:73  maxChain = chain
  lw t0, 0x1786(zero)
  sw t0, 0x178a(zero)
.L2:
  ; score.e16.ts:74  points(worth * multiplier())
  call multiplier
  mul a0, s2, a0
  call points
  ; score.e16.ts:75  if (chain >= 4) floatNumber(x, y - 192, chain)
  lw t0, 0x1786(zero)
  li t1, 4
  bltu t0, t1, .L3
  ; score.e16.ts:75  floatNumber(x, y - 192, chain)
  lw t0, 0x1786(zero)
  mv a0, s3
  addi a1, s0, -192
  mv a2, t0
  call floatNumber
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; score.e16.ts:79 chainStep() at -O1
chainStep:
  ; score.e16.ts:80  if (chainLeft === 0) return
  lw t0, 0x1788(zero)
  bne t0, zero, .L1
  ; score.e16.ts:80  return
  ret
.L1:
  ; score.e16.ts:81  chainLeft--
  lw t0, 0x1788(zero)
  addi t0, t0, -1
  sw t0, 0x1788(zero)
  ; score.e16.ts:82  if (chainLeft === 0) chain = 0
  bne t0, zero, .L2
  ; score.e16.ts:82  chain = 0
  sw zero, 0x1786(zero)
.L2:
.return:
  ret

; score.e16.ts:85 scoreSkims(n) at -O1
;   n in s1
scoreSkims:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; score.e16.ts:86  skims = skims + n
  lw t0, 0x178c(zero)
  add t0, t0, s1
  sw t0, 0x178c(zero)
  ; score.e16.ts:87  points(n)
  mv a0, s1
  call points
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; score.e16.ts:90 scoreStars(n, double) at -O1
;   n in s1
;   double in s2
scoreStars:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; n
  mv s2, a1 ; double
  ; score.e16.ts:91  points(n * (double ? 20 : 10))
  mv t0, s1
  mv t1, s2
  beqz t1, .L1
  li t1, 20
  j .L2
.L1:
  li t1, 10
.L2:
  mul a0, t0, t1
  call points
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; score.e16.ts:107 hudReset() at -O1
hudReset:
  ; score.e16.ts:108  shownLo = 0xffff
  li t0, 65535
  sw t0, 0x1790(zero)
  ; score.e16.ts:109  shownHi = 0xffff
  li t0, 65535
  sw t0, 0x1792(zero)
  ; score.e16.ts:110  shownPower = 0xffff
  li t0, 65535
  sw t0, 0x179e(zero)
  ; score.e16.ts:111  shownChain = 0xffff
  li t0, 65535
  sw t0, 0x1794(zero)
  ; score.e16.ts:112  shownSkims = 0xffff
  li t0, 65535
  sw t0, 0x1796(zero)
  ; score.e16.ts:113  shownLives = 0xffff
  li t0, 65535
  sw t0, 0x1798(zero)
  ; score.e16.ts:114  shownBombs = 0xffff
  li t0, 65535
  sw t0, 0x179a(zero)
  ; score.e16.ts:115  shownVolt = 0xffff
  li t0, 65535
  sw t0, 0x179c(zero)
.return:
  ret

; score.e16.ts:119 hudStep(lives, bombs, volt, over) at -O1
;   lives in s1
;   bombs in s2
;   volt in s3
;   over in s0
hudStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; lives
  mv s2, a1 ; bombs
  mv s3, a2 ; volt
  mv s0, a3 ; over
  ; score.e16.ts:120  scoreLine()
  call scoreLine
  ; score.e16.ts:121  chainShow()
  call chainShow
  ; score.e16.ts:122  if (lives !== shownLives) {
  lw t0, 0x1798(zero)
  beq s1, t0, .L1
  ; score.e16.ts:123  shownLives = lives
  sw s1, 0x1798(zero)
  ; score.e16.ts:124  icons(35, 3, lives, 10)
  li a0, 35
  li a1, 3
  mv a2, s1
  li a3, 10
  call icons
.L1:
  ; score.e16.ts:126  if (bombs !== shownBombs) {
  lw t0, 0x179a(zero)
  beq s2, t0, .L2
  ; score.e16.ts:127  shownBombs = bombs
  sw s2, 0x179a(zero)
  ; score.e16.ts:128  icons(35, 8, bombs, 34)
  li a0, 35
  li a1, 8
  mv a2, s2
  li a3, 34
  call icons
.L2:
  ; score.e16.ts:130  voltShow(volt, over)
  mv a0, s3
  mv a1, s0
  call voltShow
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; score.e16.ts:136 powerShow(power) at -O1
;   power in s2
;   k in s1
powerShow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; power
  ; score.e16.ts:137  if (power === shownPower) return
  lw t0, 0x179e(zero)
  bne s2, t0, .L1
  ; score.e16.ts:137  return
  j .return
.L1:
  ; score.e16.ts:138  shownPower = power
  sw s2, 0x179e(zero)
  ; score.e16.ts:139  let k: u16 = 0
  li s1, 0 ; k
  ; score.e16.ts:140  while (k < 4) {
  j .L4
.L2:
  ; score.e16.ts:141  vpoke(cellAt(1, 35 + k, 18), font(SL_GOLD) + (k < power ? 3 : 14))
  li a0, 1
  addi a1, s1, 35
  li a2, 18
  call cellAt
  mv t0, a0
  li t1, 39349
  mv t2, s1
  mv t3, s2
  bgeu t2, t3, .L6
  li t2, 3
  j .L7
.L6:
  li t2, 14
.L7:
  add t1, t1, t2
  mv a0, t0
  mv a1, t1
  call vpoke
  ; score.e16.ts:142  k++
  addi s1, s1, 1
.L4:
  li t0, 4
  bltu s1, t0, .L2
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; score.e16.ts:147 scoreLine() at -O1
;   gold in s1
scoreLine:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; score.e16.ts:148  if (score[0] === shownLo && score[1] === shownHi) return
  lw t0, score(zero)
  lw t1, 0x1790(zero)
  bne t0, t1, .L1
  lw t0, score+2(zero)
  lw t1, 0x1792(zero)
  bne t0, t1, .L1
  ; score.e16.ts:148  return
  j .return
.L1:
  ; score.e16.ts:149  shownLo = score[0]
  lw t0, score(zero)
  sw t0, 0x1790(zero)
  ; score.e16.ts:150  shownHi = score[1]
  lw t0, score+2(zero)
  sw t0, 0x1792(zero)
  ; score.e16.ts:151  const gold = font(SL_GOLD)
  li s1, 39349 ; gold
  ; score.e16.ts:152  scoreShow(cellAt(1, 10, 0), addr(score), gold + DIGITS)
  li a0, 40980
  la a1, score
  addi a2, s1, 16
  call scoreShow
  ; score.e16.ts:153  vpoke(cellAt(1, 18, 0), gold + DIGITS)
  li a0, 40996
  addi a1, s1, 16
  call vpoke
  ; score.e16.ts:154  scoreShow(cellAt(1, 24, 0), addr(best), font(SL_TEXT) + DIGITS)
  li a0, 41008
  la a1, best
  li a2, 38341
  call scoreShow
  ; score.e16.ts:155  vpoke(cellAt(1, 32, 0), font(SL_TEXT) + DIGITS)
  li a0, 41024
  li a1, 38341
  call vpoke
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; score.e16.ts:159 chainShow() at -O1
;   gold in s1
chainShow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; score.e16.ts:160  const gold = font(SL_GOLD)
  li s1, 39349 ; gold
  ; score.e16.ts:161  if (chain !== shownChain) {
  lw t0, 0x1786(zero)
  lw t1, 0x1794(zero)
  beq t0, t1, .L1
  ; score.e16.ts:162  shownChain = chain
  lw t0, 0x1786(zero)
  sw t0, 0x1794(zero)
  ; score.e16.ts:163  number(cellAt(1, 1, 3), chain, 4, gold + DIGITS)
  lw t0, 0x1786(zero)
  li a0, 41346
  mv a1, t0
  li a2, 4
  addi a3, s1, 16
  call number
  ; score.e16.ts:164  vpoke(cellAt(1, 1, 7), gold + 88 - 32)
  li a0, 41858
  addi a1, s1, 56
  call vpoke
  ; score.e16.ts:165  number(cellAt(1, 2, 7), multiplier(), 1, gold + DIGITS)
  call multiplier
  mv a1, a0
  li a0, 41860
  li a2, 1
  addi a3, s1, 16
  call number
.L1:
  ; score.e16.ts:167  if (skims !== shownSkims) {
  lw t0, 0x178c(zero)
  lw t1, 0x1796(zero)
  beq t0, t1, .L2
  ; score.e16.ts:168  shownSkims = skims
  lw t0, 0x178c(zero)
  sw t0, 0x1796(zero)
  ; score.e16.ts:169  number(cellAt(1, 1, 12), skims, 4, font(SL_TEXT) + DIGITS)
  lw t0, 0x178c(zero)
  li a0, 42498
  mv a1, t0
  li a2, 4
  li a3, 38341
  call number
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; score.e16.ts:174 icons(x, y, n, ch) at -O1
;   x in s2
;   y in s3
;   n in 0(fp)
;   ch in 2(fp)
;   k in s1
icons:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; x
  mv s3, a1 ; y
  sw a2, 0(fp) ; n
  sw a3, 2(fp) ; ch
  ; score.e16.ts:175  let k: u16 = 0
  li s1, 0 ; k
  ; score.e16.ts:176  while (k < 5) {
  j .L3
.L1:
  ; score.e16.ts:177  if (k < n) vpoke(cellAt(1, x + k, y), font(SL_GOLD) + ch)
  lw t0, 0(fp) ; n
  bgeu s1, t0, .L5
  ; score.e16.ts:177  vpoke(cellAt(1, x + k, y), font(SL_GOLD) + ch)
  add t0, s2, s1
  li a0, 1
  mv a1, t0
  mv a2, s3
  call cellAt
  lw t0, 2(fp) ; ch
  lw t0, 2(fp) ; ch
  li t1, 39349
  add a1, t1, t0
  call vpoke
  j .L6
.L5:
  ; score.e16.ts:178  unsay(x + k, y, 1)
  add a0, s2, s1
  mv a1, s3
  li a2, 1
  call unsay
.L6:
  ; score.e16.ts:179  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; score.e16.ts:184 voltShow(volt, over) at -O1
;   volt in s3
;   over in s1
;   v in s2
;   full in s0
voltShow:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s3, a0 ; volt
  mv s1, a1 ; over
  ; score.e16.ts:185  const v = over > 0 ? div(over, 96) * 205 : volt
  bgeu zero, s1, .L1
  li t0, 96
  divu t0, s1, t0
  li t1, 205
  mul t0, t0, t1
  j .L2
.L1:
  mv t0, s3
.L2:
  mv s2, t0 ; v
  ; score.e16.ts:186  const full = volt >= 1024 && over === 0
  li t0, 1024
  sltu t0, s3, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L3
  sub t0, s1, zero
  seqz t0, t0
.L3:
  mv s0, t0 ; full
  ; score.e16.ts:188  if (v === shownVolt) return
  lw t0, 0x179c(zero)
  bne s2, t0, .L4
  ; score.e16.ts:188  return
  j .return
.L4:
  ; score.e16.ts:189  shownVolt = v
  sw s2, 0x179c(zero)
  ; score.e16.ts:190  voltCells(v, full ? SL_GOLD : over > 0 ? SL_RED : SL_TEXT)
  mv t0, s2
  mv t1, s0
  beqz t1, .L5
  li t1, 6
  j .L6
.L5:
  mv t1, s1
  li t2, 0
  bgeu t2, t1, .L7
  li t1, 7
  j .L8
.L7:
  li t1, 5
.L8:
.L6:
  mv a0, t0
  mv a1, t1
  call voltCells
  ; score.e16.ts:191  if (over > 0) say(35, 14, str('DRIVE'), SL_RED)
  bgeu zero, s1, .L9
  ; score.e16.ts:191  say(35, 14, str('DRIVE'), SL_RED)
  li a0, 35
  li a1, 14
  la a2, str_3
  li a3, 7
  call say
  j .L10
.L9:
  ; score.e16.ts:192  if (full) say(35, 14, str('READY'), SL_GOLD)
  beqz s0, .L11
  ; score.e16.ts:192  say(35, 14, str('READY'), SL_GOLD)
  li a0, 35
  li a1, 14
  la a2, str_4
  li a3, 6
  call say
  j .L12
.L11:
  ; score.e16.ts:193  unsay(35, 14, 5)
  li a0, 35
  li a1, 14
  li a2, 5
  call unsay
.L12:
.L10:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; score.e16.ts:197 voltCells(v, s) at -O1
;   v in s2
;   s in s3
;   k in s1
;   fill in s0
voltCells:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; v
  mv s3, a1 ; s
  ; score.e16.ts:198  let k: u16 = 0
  li s1, 0 ; k
  ; score.e16.ts:199  while (k < 5) {
  j .L3
.L1:
  ; score.e16.ts:200  const fill = v > (k + 1) * 205 ? 3 : v > k * 205 + 100 ? 26 : 14
  li t0, 205
  addi t1, s1, 1
  mul t1, t1, t0
  bgeu t1, s2, .L5
  li t0, 3
  j .L6
.L5:
  li t0, 205
  mul t0, s1, t0
  addi t0, t0, 100
  bgeu t0, s2, .L7
  li t0, 26
  j .L8
.L7:
  li t0, 14
.L8:
.L6:
  mv s0, t0 ; fill
  ; score.e16.ts:201  vpoke(cellAt(1, 35 + k, 13), font(s) + fill)
  li a0, 1
  addi a1, s1, 35
  li a2, 13
  call cellAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  call font
  add t0, a0, s0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  mv a1, t0
  call vpoke
  ; score.e16.ts:202  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; score.e16.ts:207 font(s) at -O1
;   s in a0
font:
  ; score.e16.ts:208  return FONT_TILE | (s << 10) | 0x8000
  slli t0, a0, 10
  li t1, 437
  or t1, t1, t0
  li t0, 32768
  or a0, t1, t0
.return:
  ret

; audio.e16.ts:57 music(m) at -O1
;   m in s1
;   musicMute.mask in s2
music:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; m
  ; audio.e16.ts:58  musicMute(LAYER)
  li s2, 2048 ; musicMute.mask
  ; lib/sound.e16.ts:116  muted = mask
  sw s2, 0x0c8e(zero)
  ; audio.e16.ts:59  if (m === M_TITLE) play(SONG_TITLE_BANK, SONG_TITLE_AT, true)
  li t0, 1
  bne s1, t0, .L1
  ; audio.e16.ts:59  play(SONG_TITLE_BANK, SONG_TITLE_AT, true)
  li a0, 279
  li a1, 51158
  li a2, 1
  call play
  j .L2
.L1:
  ; audio.e16.ts:60  if (m === M_STAGE) play(SONG_STAGE_BANK, SONG_STAGE_AT, true)
  li t0, 2
  bne s1, t0, .L3
  ; audio.e16.ts:60  play(SONG_STAGE_BANK, SONG_STAGE_AT, true)
  li a0, 278
  li a1, 49152
  li a2, 1
  call play
  j .L4
.L3:
  ; audio.e16.ts:61  if (m === M_BOSS) play(SONG_BOSS_BANK, SONG_BOSS_AT, true)
  li t0, 3
  bne s1, t0, .L5
  ; audio.e16.ts:61  play(SONG_BOSS_BANK, SONG_BOSS_AT, true)
  li a0, 279
  li a1, 49152
  li a2, 1
  call play
  j .L6
.L5:
  ; audio.e16.ts:62  if (m === M_CLEAR) play(SONG_CLEAR_BANK, SONG_CLEAR_AT, true)
  li t0, 4
  bne s1, t0, .L7
  ; audio.e16.ts:62  play(SONG_CLEAR_BANK, SONG_CLEAR_AT, true)
  li a0, 279
  li a1, 51824
  li a2, 1
  call play
  j .L8
.L7:
  ; audio.e16.ts:63  if (m === M_OVER) play(SONG_OVER_BANK, SONG_OVER_AT, true)
  li t0, 5
  bne s1, t0, .L9
  ; audio.e16.ts:63  play(SONG_OVER_BANK, SONG_OVER_AT, true)
  li a0, 279
  li a1, 52114
  li a2, 1
  call play
  j .L10
.L9:
  ; audio.e16.ts:64  if (m === M_ENTRY) play(SONG_ENTRY_BANK, SONG_ENTRY_AT, true)
  li t0, 6
  bne s1, t0, .L11
  ; audio.e16.ts:64  play(SONG_ENTRY_BANK, SONG_ENTRY_AT, true)
  li a0, 279
  li a1, 52200
  li a2, 1
  call play
  j .L12
.L11:
  ; audio.e16.ts:65  musicStop()
  call musicStop
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
  addi sp, sp, 6
  ret

; audio.e16.ts:69 musicLayer(on) at -O1
;   on in a0
;   musicMute.mask in a1
musicLayer:
  ; audio.e16.ts:70  musicMute(on ? 0 : LAYER)
  beqz a0, .L1
  li t0, 0
  j .L2
.L1:
  li t0, 2048
.L2:
  mv a1, t0 ; musicMute.mask
  ; lib/sound.e16.ts:116  muted = mask
  sw a1, 0x0c8e(zero)
.return:
  ret

; audio.e16.ts:73 sfxShot() at -O1
sfxShot:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:74  play(SONG_X_SHOT_BANK, SONG_X_SHOT_AT, false)
  li a0, 279
  li a1, 52568
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:77 sfxSkim() at -O1
sfxSkim:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:78  play(SONG_X_SKIM_BANK, SONG_X_SKIM_AT, false)
  li a0, 279
  li a1, 52596
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:81 sfxKill(big) at -O1
;   big in s1
sfxKill:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; big
  ; audio.e16.ts:82  if (big) play(SONG_X_BOOM_BANK, SONG_X_BOOM_AT, false)
  beqz s1, .L1
  ; audio.e16.ts:82  play(SONG_X_BOOM_BANK, SONG_X_BOOM_AT, false)
  li a0, 279
  li a1, 52708
  li a2, 0
  call play
  j .L2
.L1:
  ; audio.e16.ts:83  play(SONG_X_HIT_BANK, SONG_X_HIT_AT, false)
  li a0, 279
  li a1, 52684
  li a2, 0
  call play
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; audio.e16.ts:86 sfxBomb() at -O1
sfxBomb:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:87  play(SONG_X_BOMB_BANK, SONG_X_BOMB_AT, false)
  li a0, 279
  li a1, 52754
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:90 sfxDie() at -O1
sfxDie:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:91  play(SONG_X_DIE_BANK, SONG_X_DIE_AT, false)
  li a0, 279
  li a1, 52862
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:94 sfxOverdrive() at -O1
sfxOverdrive:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:95  play(SONG_X_DRIVE_BANK, SONG_X_DRIVE_AT, false)
  li a0, 279
  li a1, 52800
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:98 sfxPick() at -O1
sfxPick:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:99  play(SONG_X_PICK_BANK, SONG_X_PICK_AT, false)
  li a0, 279
  li a1, 52624
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:102 sfxExtend() at -O1
sfxExtend:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:103  play(SONG_EXTEND_BANK, SONG_EXTEND_AT, false)
  li a0, 279
  li a1, 52514
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:106 sfxSiren() at -O1
sfxSiren:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:107  play(SONG_X_SIREN_BANK, SONG_X_SIREN_AT, false)
  li a0, 279
  li a1, 52908
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:111 sfxPart() at -O1
sfxPart:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:112  play(SONG_X_PART_BANK, SONG_X_PART_AT, false)
  li a0, 279
  li a1, 52954
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:115 sfxBossDown() at -O1
sfxBossDown:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:116  play(SONG_X_DOWN_BANK, SONG_X_DOWN_AT, false)
  li a0, 279
  li a1, 53004
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:119 sfxSelect() at -O1
sfxSelect:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:120  play(SONG_X_SELECT_BANK, SONG_X_SELECT_AT, false)
  li a0, 279
  li a1, 52652
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; eleclance.e16.ts:81 seenIs(v) at -O1
;   v in a0
seenIs:
  ; eleclance.e16.ts:82  seen = v
  sw a0, 0x1906(zero)
.return:
  ret

; eleclance.e16.ts:85 main() at -O1
main:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; eleclance.e16.ts:86  kitInit()
  call kitInit
  ; eleclance.e16.ts:87  soundInit()
  call soundInit
  ; eleclance.e16.ts:88  screenOn()
  call screenOn
  ; eleclance.e16.ts:89  palettesIn()
  call palettesIn
  ; eleclance.e16.ts:90  spritesIn()
  la t0, spritesIn
  li t1, 260
  call far_call
  ; eleclance.e16.ts:91  bgTilesIn()
  call bgTilesIn
  ; eleclance.e16.ts:92  foesInit()
  call foesInit
  ; eleclance.e16.ts:93  tableLoad()
  la t0, tableLoad
  li t1, 258
  call far_call
  ; eleclance.e16.ts:94  farStarsInit()
  call farStarsInit
  ; eleclance.e16.ts:95  for (;;) {
.L1:
  ; eleclance.e16.ts:96  title()
  la t0, title
  li t1, 260
  call far_call
  ; eleclance.e16.ts:97  game()
  la t0, game
  li t1, 260
  call far_call
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; eleclance.e16.ts:102 frameBegin() at -O1
frameBegin:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; eleclance.e16.ts:103  seen = frame_wait(seen)
  lw a0, 0x1906(zero)
  call frame_wait
  sw a0, 0x1906(zero)
  ; eleclance.e16.ts:104  sprShow()
  call sprShow
  ; eleclance.e16.ts:105  stageScroll()
  call stageScroll
  ; eleclance.e16.ts:106  waveStep()
  call waveStep
  ; eleclance.e16.ts:107  flashStep()
  call flashStep
  ; eleclance.e16.ts:108  padRead()
  call padRead
  ; eleclance.e16.ts:109  soundTick()
  call soundTick
  ; eleclance.e16.ts:110  sprBegin()
  ; lib/kit.e16.ts:261  sprN = 0
  sw zero, 0x0880(zero)
  ; eleclance.e16.ts:111  frame++
  lw t0, 0x1908(zero)
  addi t0, t0, 1
  sw t0, 0x1908(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; eleclance.e16.ts:115 idle(n) at -O1
;   n in s1
idle:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; eleclance.e16.ts:116  while (n > 0) {
  j .L3
.L1:
  ; eleclance.e16.ts:117  frameBegin()
  call frameBegin
  ; eleclance.e16.ts:118  shakeStep()
  call shakeStep
  ; eleclance.e16.ts:119  stageStep()
  call stageStep
  ; eleclance.e16.ts:120  fxStep()
  call fxStep
  ; eleclance.e16.ts:121  farStarsStep(1, frame)
  lw t0, 0x1908(zero)
  li a0, 1
  mv a1, t0
  call farStarsStep
  ; eleclance.e16.ts:122  n--
  addi s1, s1, -1
.L3:
  bltu zero, s1, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; eleclance.e16.ts:130 logoIn() at -O1
;   old in s3
;   y in s1
;   x in s2
logoIn:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  ; eleclance.e16.ts:131  load(LOGO_TILES_BANK, LOGO_TILES_AT, LOGO_TILE * 32, LOGO_TILES_BYTES)
  li a0, 276
  li a1, 53760
  li a2, 26112
  li a3, 2784
  call load
  ; eleclance.e16.ts:132  palette(PAL_LOGO, SL_RED)
  li a0, 16
  li a1, 7
  call palette
  ; eleclance.e16.ts:133  palKeep(PAL_LOGO, SL_RED)
  li a0, 16
  li a1, 7
  call palKeep
  ; eleclance.e16.ts:134  const old = bank(LOGO_MAP_BANK)
  li a0, 277
  call bank
  mv s3, a0 ; old
  ; eleclance.e16.ts:135  let y: u16 = 0
  li s1, 0 ; y
  ; eleclance.e16.ts:136  while (y < LOGO_H) {
  j .L3
.L1:
  ; eleclance.e16.ts:137  let x: u16 = 0
  li s2, 0 ; x
  ; eleclance.e16.ts:138  while (x < LOGO_W) {
  j .L7
.L5:
  ; eleclance.e16.ts:139  vpoke(cellAt(1, 7 + x, 6 + y), peek16(WINDOW + y * MAP_ROW + x * 2) | 0x8000)
  li a0, 1
  addi a1, s2, 7
  addi a2, s1, 6
  call cellAt
  slli t0, s1, 7
  li t1, 49152
  add t1, t1, t0
  slli t0, s2, 1
  add t1, t1, t0
  lw t1, 0(t1)
  li t0, 32768
  or a1, t1, t0
  call vpoke
  ; eleclance.e16.ts:140  x++
  addi s2, s2, 1
.L7:
  li t0, 26
  bltu s2, t0, .L5
  ; eleclance.e16.ts:142  y++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
  ; eleclance.e16.ts:144  poke16(IO_BANK, old)
  li t0, 65284
  sw s3, 0(t0)
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; eleclance.e16.ts:148 play_() at -O1
;   od in s1
play_:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; eleclance.e16.ts:149  shakeStep()
  call shakeStep
  ; eleclance.e16.ts:150  stageStep()
  call stageStep
  ; eleclance.e16.ts:151  stageSway(i16(shipX >> 4))
  lw t0, 0x14da(zero)
  srai a0, t0, 4
  call stageSway
  ; eleclance.e16.ts:152  killsReset()
  call killsReset
  ; eleclance.e16.ts:153  shipStep()
  call shipStep
  ; eleclance.e16.ts:155  musicLayer(overdrive > 0 || bossPhase === 3 ? 1 : 0)
  lw t0, 0x14f0(zero)
  bltu zero, t0, .L3
  lw t0, 0x1756(zero)
  li t1, 3
  bne t0, t1, .L1
.L3:
  li t0, 1
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
  call musicLayer
  ; eleclance.e16.ts:157  const od: u16 = overdrive > 0 ? 1 : 0
  lw t0, 0x14f0(zero)
  bgeu zero, t0, .L4
  li t0, 1
  j .L5
.L4:
  li t0, 0
.L5:
  mv s1, t0 ; od
  ; eleclance.e16.ts:158  lanceStep(1 + od)
  addi a0, s1, 1
  call lanceStep
  ; eleclance.e16.ts:161  bulletsStep(shipX, shipY, shipVulnerable())
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  call shipVulnerable
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  call bulletsStep
  ; eleclance.e16.ts:162  shipDraw()
  call shipDraw
  ; eleclance.e16.ts:163  chainDraw(frame)
  lw a0, 0x1908(zero)
  la t0, chainDraw
  li t1, 259
  call far_call
  ; eleclance.e16.ts:164  fxStep()
  call fxStep
  ; eleclance.e16.ts:165  bossStep()
  la t0, bossStep
  li t1, 257
  call far_call
  ; eleclance.e16.ts:166  foesStep(scrollSpeed)
  lw a0, 0x0c94(zero)
  call foesStep
  ; eleclance.e16.ts:167  shotsStep(2 + od)
  addi a0, s1, 2
  call shotsStep
  ; eleclance.e16.ts:168  missilesStep(3 + od)
  addi a0, s1, 3
  la t0, missilesStep
  li t1, 259
  call far_call
  ; eleclance.e16.ts:169  itemsStep(shipX, shipY, overdrive > 0 ? 1 : 0)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  lw t2, 0x14f0(zero)
  li t3, 0
  bgeu t3, t2, .L6
  li t2, 1
  j .L7
.L6:
  li t2, 0
.L7:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call itemsStep
  ; eleclance.e16.ts:170  farStarsStep(scrollSpeed, frame)
  lw t0, 0x0c94(zero)
  lw t1, 0x1908(zero)
  mv a0, t0
  mv a1, t1
  call farStarsStep
  ; eleclance.e16.ts:171  if (hitShip) shipHit()
  lw t0, 0x1446(zero)
  beqz t0, .L8
  ; eleclance.e16.ts:171  shipHit()
  call shipHit
.L8:
  ; eleclance.e16.ts:172  scorePlay()
  call scorePlay
  ; eleclance.e16.ts:173  if ((frame & 1023) === 0) rankUp()
  lw t0, 0x1908(zero)
  andi t0, t0, 1023
  bne t0, zero, .L9
  ; eleclance.e16.ts:173  rankUp()
  call rankUp
.L9:
  ; eleclance.e16.ts:174  hudStep(lives, bombs, voltNow(), overdrive)
  lw t0, 0x14ea(zero)
  lw t1, 0x14ec(zero)
  ; eleclance.e16.ts:215  return volt
  lw t2, 0x14ee(zero)
  lw t3, 0x14f0(zero)
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call hudStep
  ; eleclance.e16.ts:175  powerShow(power)
  lw a0, 0x14f8(zero)
  call powerShow
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; eleclance.e16.ts:178 scorePlay() at -O1
scorePlay:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; eleclance.e16.ts:179  scoreKills(killed, killWorth, killX, killY)
  lw t0, 0x172e(zero)
  lw t1, 0x1730(zero)
  lw t2, 0x1732(zero)
  lw t3, 0x1734(zero)
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call scoreKills
  ; eleclance.e16.ts:180  chainStep()
  call chainStep
  ; eleclance.e16.ts:181  if (grazes > 0) {
  lw t0, 0x1444(zero)
  bgeu zero, t0, .L1
  ; eleclance.e16.ts:182  scoreSkims(grazes)
  lw a0, 0x1444(zero)
  call scoreSkims
  ; eleclance.e16.ts:183  voltAdd(grazes * 24)
  lw t0, 0x1444(zero)
  slli t1, t0, 4
  slli t0, t0, 3
  add a0, t0, t1
  call voltAdd
  ; eleclance.e16.ts:184  sfxSkim()
  call sfxSkim
.L1:
  ; eleclance.e16.ts:186  if (caught[IT_STAR] > 0) {
  lw t0, caught+2(zero)
  bgeu zero, t0, .L2
  ; eleclance.e16.ts:187  scoreStars(caught[IT_STAR], overdrive > 0)
  lw t0, caught+2(zero)
  lw t1, 0x14f0(zero)
  sltu t1, zero, t1
  mv a0, t0
  mv a1, t1
  call scoreStars
  ; eleclance.e16.ts:188  voltAdd(caught[IT_STAR] * 4)
  lw t0, caught+2(zero)
  slli a0, t0, 2
  call voltAdd
  ; eleclance.e16.ts:189  sfxPick()
  call sfxPick
.L2:
  ; eleclance.e16.ts:192  if (caught[IT_BOMB] > 0) {
  lw t0, caught+4(zero)
  bgeu zero, t0, .L3
  ; eleclance.e16.ts:193  bombsAdd()
  call bombsAdd
  ; eleclance.e16.ts:194  gained(IT_BOMB)
  li a0, 2
  call gained
.L3:
  ; eleclance.e16.ts:197  if (caught[IT_POWER] > 0) {
  lw t0, caught+8(zero)
  bgeu zero, t0, .L4
  ; eleclance.e16.ts:198  if (!powerAdd()) points(1000)
  call powerAdd
  bnez a0, .L5
  ; eleclance.e16.ts:198  points(1000)
  li a0, 1000
  call points
.L5:
  ; eleclance.e16.ts:199  gained(IT_POWER)
  li a0, 4
  call gained
.L4:
  ; eleclance.e16.ts:201  if (caught[IT_LIFE] > 0 || extendDue()) {
  lw t0, caught+6(zero)
  bltu zero, t0, .L7
  call extendDue
  beqz a0, .L6
.L7:
  ; eleclance.e16.ts:202  livesAdd()
  call livesAdd
  ; eleclance.e16.ts:203  gained(IT_LIFE)
  li a0, 3
  call gained
.L6:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; eleclance.e16.ts:208 gained(kind) at -O1
;   kind in s1
gained:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; kind
  ; eleclance.e16.ts:209  floatWord(shipX, shipY - 320, kind)
  lw t0, 0x14da(zero)
  lw t1, 0x14dc(zero)
  mv a0, t0
  addi a1, t1, -320
  mv a2, s1
  call floatWord
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; eleclance.e16.ts:214 voltNow() at -O1
voltNow:
  ; eleclance.e16.ts:215  return volt
  lw a0, 0x14ee(zero)
.return:
  ret

; eleclance.e16.ts:218 overdriveOn() at -O1
overdriveOn:
  ; eleclance.e16.ts:219  return overdrive > 0
  lw t0, 0x14f0(zero)
  sltu a0, zero, t0
.return:
  ret

str_0:
  .byte 66, 79, 77, 66, 43, 49, 0
str_1:
  .byte 49, 85, 80, 0
str_2:
  .byte 80, 79, 87, 69, 82, 32, 85, 80, 0
str_3:
  .byte 68, 82, 73, 86, 69, 0
str_4:
  .byte 82, 69, 65, 68, 89, 0
  .align 2
e16c_fixed_end:

  .bank 1
  .org 0xc000
; boss.e16.ts:48 bossReset() at -O1
bossReset:
  ; boss.e16.ts:49  bossOn = B_NONE
  sw zero, 0x1754(zero)
  ; boss.e16.ts:50  bossPhase = 0
  sw zero, 0x1756(zero)
.return:
  ret

; boss.e16.ts:54 bastionStart() at -O1
bastionStart:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; boss.e16.ts:55  bossBegin(B_BASTION)
  li a0, 1
  call bossBegin
  ; boss.e16.ts:56  life[0] = 320
  li t0, 320
  sw t0, life(zero)
  ; boss.e16.ts:57  life[1] = 110
  li t0, 110
  sw t0, life+2(zero)
  ; boss.e16.ts:58  life[2] = 110
  li t0, 110
  sw t0, life+4(zero)
  ; boss.e16.ts:59  partAt(0, 0, 0, 26)
  li a0, 0
  li a1, 0
  li a2, 0
  li a3, 26
  call partAt
  ; boss.e16.ts:60  partAt(1, -48, 0, 14)
  li a0, 1
  li a1, 65488
  li a2, 0
  li a3, 14
  call partAt
  ; boss.e16.ts:61  partAt(2, 48, 0, 14)
  li a0, 2
  li a1, 48
  li a2, 0
  li a3, 14
  call partAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; boss.e16.ts:65 zenithStart() at -O1
zenithStart:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; boss.e16.ts:66  bossBegin(B_ZENITH)
  li a0, 2
  call bossBegin
  ; boss.e16.ts:67  life[0] = 560
  li t0, 560
  sw t0, life(zero)
  ; boss.e16.ts:68  life[1] = 180
  li t0, 180
  sw t0, life+2(zero)
  ; boss.e16.ts:69  life[2] = 180
  li t0, 180
  sw t0, life+4(zero)
  ; boss.e16.ts:70  partAt(0, 0, 16, 14)
  li a0, 0
  li a1, 0
  li a2, 16
  li a3, 14
  call partAt
  ; boss.e16.ts:71  partAt(1, -48, 32, 14)
  li a0, 1
  li a1, 65488
  li a2, 32
  li a3, 14
  call partAt
  ; boss.e16.ts:72  partAt(2, 48, 32, 14)
  li a0, 2
  li a1, 48
  li a2, 32
  li a3, 14
  call partAt
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; boss.e16.ts:75 bossBegin(which) at -O1
;   which in a0
bossBegin:
  ; boss.e16.ts:76  bossOn = which
  sw a0, 0x1754(zero)
  ; boss.e16.ts:77  bossPhase = 0
  sw zero, 0x1756(zero)
  ; boss.e16.ts:78  bX = (48 + 112) * 16
  li t0, 2560
  sw t0, 0x1758(zero)
  ; boss.e16.ts:79  bY = -1024
  li t0, 64512
  sw t0, 0x175a(zero)
  ; boss.e16.ts:80  bT = 0
  sw zero, 0x175c(zero)
  ; boss.e16.ts:81  flash[0] = 0
  sw zero, flash(zero)
  ; boss.e16.ts:82  flash[1] = 0
  sw zero, flash+2(zero)
  ; boss.e16.ts:83  flash[2] = 0
  sw zero, flash+4(zero)
.return:
  ret

; boss.e16.ts:86 partAt(k, dx, dy, half) at -O1
;   k in a0
;   dx in a1
;   dy in a2
;   half in a3
partAt:
  ; boss.e16.ts:87  PX[k] = u16(dx)
  slli t0, a0, 1
  sw a1, PX(t0)
  ; boss.e16.ts:88  PY[k] = u16(dy)
  slli t0, a0, 1
  sw a2, PY(t0)
  ; boss.e16.ts:89  PHALF[k] = half
  slli t0, a0, 1
  sw a3, PHALF(t0)
.return:
  ret

; boss.e16.ts:93 open(k) at -O1
;   k in a0
open:
  ; boss.e16.ts:94  if (life[k] === 0 || bossPhase === 0 || bossPhase >= 9) return false
  slli t0, a0, 1
  lw t0, life(t0)
  beq t0, zero, .L2
  lw t0, 0x1756(zero)
  beq t0, zero, .L2
  lw t0, 0x1756(zero)
  li t1, 9
  bltu t0, t1, .L1
.L2:
  ; boss.e16.ts:94  return false
  li a0, 0
  ret
.L1:
  ; boss.e16.ts:96  if (bossOn === B_ZENITH && k === 0) return life[1] === 0 && life[2] === 0
  lw t0, 0x1754(zero)
  li t1, 2
  bne t0, t1, .L3
  bne a0, zero, .L3
  ; boss.e16.ts:96  return life[1] === 0 && life[2] === 0
  lw t0, life+2(zero)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L4
  lw t0, life+4(zero)
  sub t0, t0, zero
  seqz t0, t0
.L4:
  mv a0, t0
  ret
.L3:
  ; boss.e16.ts:97  return true
  li a0, 1
.return:
  ret

; boss.e16.ts:101 bossStep() at -O1
bossStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; boss.e16.ts:102  if (bossOn === B_NONE || bossPhase >= 10) return
  lw t0, 0x1754(zero)
  beq t0, zero, .L2
  lw t0, 0x1756(zero)
  li t1, 10
  bltu t0, t1, .L1
.L2:
  ; boss.e16.ts:102  return
  j .return
.L1:
  ; boss.e16.ts:103  levelBoss(1)
  li a0, 1
  call levelBoss
  ; boss.e16.ts:104  bT++
  lw t0, 0x175c(zero)
  addi t0, t0, 1
  sw t0, 0x175c(zero)
  ; boss.e16.ts:105  if (bossPhase === 0) {
  lw t0, 0x1756(zero)
  bne t0, zero, .L3
  ; boss.e16.ts:106  bY = bY + 24
  lw t0, 0x175a(zero)
  addi t0, t0, 24
  sw t0, 0x175a(zero)
  ; boss.e16.ts:107  if (bY >= 72 * 16) {
  li t1, 1152
  blt t0, t1, .L5
  ; boss.e16.ts:108  bossPhase = 1
  li t0, 1
  sw t0, 0x1756(zero)
  ; boss.e16.ts:109  bT = 0
  sw zero, 0x175c(zero)
  j .L5
.L3:
  ; boss.e16.ts:111  if (bossPhase >= 9) dying()
  lw t0, 0x1756(zero)
  li t1, 9
  bltu t0, t1, .L6
  ; boss.e16.ts:111  dying()
  call dying
  j .L7
.L6:
  ; boss.e16.ts:112  if (bossOn === B_BASTION) bastionStep()
  lw t0, 0x1754(zero)
  li t1, 1
  bne t0, t1, .L8
  ; boss.e16.ts:112  bastionStep()
  call bastionStep
  j .L9
.L8:
  ; boss.e16.ts:113  zenithStep()
  call zenithStep
.L9:
.L7:
.L5:
  ; boss.e16.ts:114  levelBoss(0)
  li a0, 0
  call levelBoss
  ; boss.e16.ts:115  bossDraw()
  call bossDraw
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; boss.e16.ts:119 bossSway(size) at -O1
;   size in s1
bossSway:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; size
  ; boss.e16.ts:120  bX = (48 + 112) * 16 + mulShift(sin(bT), size, 8)
  lw a0, 0x175c(zero)
  call sin
  mulq t0, a0, s1, 8
  addi t0, t0, 2560
  sw t0, 0x1758(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; boss.e16.ts:123 bastionStep() at -O1
bastionStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; boss.e16.ts:124  bossSway(40 * 16)
  li a0, 640
  call bossSway
  ; boss.e16.ts:125  if (bT > 3600) flee()
  lw t0, 0x175c(zero)
  li t1, 3600
  bgeu t1, t0, .L1
  ; boss.e16.ts:125  flee()
  call flee
.L1:
  ; boss.e16.ts:126  if (life[1] !== 0 || life[2] !== 0) bastionArms()
  lw t0, life+2(zero)
  bne t0, zero, .L3
  lw t0, life+4(zero)
  beq t0, zero, .L2
.L3:
  ; boss.e16.ts:126  bastionArms()
  call bastionArms
  j .L4
.L2:
  ; boss.e16.ts:127  bastionSpiral()
  call bastionSpiral
.L4:
  ; boss.e16.ts:128  if (life[0] === 0) die()
  lw t0, life(zero)
  bne t0, zero, .L5
  ; boss.e16.ts:128  die()
  call die
.L5:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; boss.e16.ts:132 bastionArms() at -O1
bastionArms:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; boss.e16.ts:133  if (bT % 40 === 0) armFire(1)
  lw t0, 0x175c(zero)
  li t1, 40
  remu t0, t0, t1
  bne t0, zero, .L1
  ; boss.e16.ts:133  armFire(1)
  li a0, 1
  call armFire
.L1:
  ; boss.e16.ts:134  if (bT % 40 === 20) armFire(2)
  lw t0, 0x175c(zero)
  li t1, 40
  remu t0, t0, t1
  li t1, 20
  bne t0, t1, .L2
  ; boss.e16.ts:134  armFire(2)
  li a0, 2
  call armFire
.L2:
  ; boss.e16.ts:135  if (bT % 120 === 60) ring(bX, bY, bT & 255, ringOf(16, 28, BK_ORB))
  lw t0, 0x175c(zero)
  li t1, 120
  remu t0, t0, t1
  li t1, 60
  bne t0, t1, .L3
  ; boss.e16.ts:135  ring(bX, bY, bT & 255, ringOf(16, 28, BK_ORB))
  lw t0, 0x1758(zero)
  lw t1, 0x175a(zero)
  lw t2, 0x175c(zero)
  andi t2, t2, 255
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 16612
  call ring
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; boss.e16.ts:139 bastionSpiral() at -O1
bastionSpiral:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; boss.e16.ts:140  spin = spin + 7
  lw t0, 0x175e(zero)
  addi t0, t0, 7
  sw t0, 0x175e(zero)
  ; boss.e16.ts:141  if (bT % 6 === 0) ring(bX, bY + 128, spin, ringOf(life[0] < 120 ? 6 : 4, 36, BK_PINK))
  lw t0, 0x175c(zero)
  li t1, 6
  remu t0, t0, t1
  bne t0, zero, .L1
  ; boss.e16.ts:141  ring(bX, bY + 128, spin, ringOf(life[0] < 120 ? 6 : 4, 36, BK_PINK))
  lw t0, 0x1758(zero)
  lw t1, 0x175a(zero)
  lw t2, 0x175e(zero)
  lw t3, life(zero)
  addi t1, t1, 128
  li a1, 120
  bgeu t3, a1, .L2
  li t3, 6
  j .L3
.L2:
  li t3, 4
.L3:
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  addi sp, sp, -2
  sw t2, 0(sp)
  mv a0, t3
  li a1, 36
  li a2, 0
  call ringOf
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a1, t1
  mv a2, t0
  mv a3, a0
  mv a0, t2
  call ring
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; boss.e16.ts:144 armFire(k) at -O1
;   k in s1
;   x in s2
;   y in s3
armFire:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  ; boss.e16.ts:145  if (life[k] === 0) return
  slli t0, s1, 1
  lw t0, life(t0)
  bne t0, zero, .L1
  ; boss.e16.ts:145  return
  j .return
.L1:
  ; boss.e16.ts:146  const x = bX + i16(PX[k]) * 16
  lw t0, 0x1758(zero)
  slli t1, s1, 1
  lw t1, PX(t1)
  slli t1, t1, 4
  add s2, t0, t1
  ; boss.e16.ts:147  const y = bY + 160
  lw t0, 0x175a(zero)
  addi s3, t0, 160
  ; boss.e16.ts:148  fan(x, y, aimed(x, y), fanOf(3, 8, 48, BK_AMBER))
  mv a0, s2
  mv a1, s3
  call aimed
  mv a1, s3
  mv a2, a0
  mv a0, s2
  li a3, 14434
  call fan
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; boss.e16.ts:151 zenithStep() at -O1
;   cannons in s1
zenithStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; boss.e16.ts:152  bossSway(56 * 16)
  li a0, 896
  call bossSway
  ; boss.e16.ts:153  if (bT > 7200) flee()
  lw t0, 0x175c(zero)
  li t1, 7200
  bgeu t1, t0, .L1
  ; boss.e16.ts:153  flee()
  call flee
.L1:
  ; boss.e16.ts:154  const cannons = life[1] !== 0 || life[2] !== 0
  lw t0, life+2(zero)
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  bnez t1, .L2
  lw t0, life+4(zero)
  sub t0, t0, zero
  snez t0, t0
.L2:
  mv s1, t0 ; cannons
  ; boss.e16.ts:155  if (cannons) zenithCannons()
  beqz s1, .L3
  ; boss.e16.ts:155  zenithCannons()
  call zenithCannons
  j .L4
.L3:
  ; boss.e16.ts:156  if (life[0] > 200) zenithSpiral()
  lw t0, life(zero)
  li t1, 200
  bgeu t1, t0, .L5
  ; boss.e16.ts:156  zenithSpiral()
  call zenithSpiral
  j .L6
.L5:
  ; boss.e16.ts:157  zenithBurning()
  call zenithBurning
.L6:
.L4:
  ; boss.e16.ts:158  if (life[0] === 0) die()
  lw t0, life(zero)
  bne t0, zero, .L7
  ; boss.e16.ts:158  die()
  call die
.L7:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; boss.e16.ts:162 zenithCannons() at -O1
;   k in s1
;   x in s2
;   y in s3
zenithCannons:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; boss.e16.ts:163  bossPhase = 1
  li t0, 1
  sw t0, 0x1756(zero)
  ; boss.e16.ts:164  let k: u16 = 1
  li s1, 1 ; k
  ; boss.e16.ts:165  while (k < 3) {
  j .L3
.L1:
  ; boss.e16.ts:166  if (life[k] !== 0) {
  slli t0, s1, 1
  lw t0, life(t0)
  beq t0, zero, .L5
  ; boss.e16.ts:167  const x = bX + i16(PX[k]) * 16
  lw t0, 0x1758(zero)
  slli t1, s1, 1
  lw t1, PX(t1)
  slli t1, t1, 4
  add s2, t0, t1
  ; boss.e16.ts:168  const y = bY + i16(PY[k]) * 16 + 256
  lw t0, 0x175a(zero)
  slli t1, s1, 1
  lw t1, PY(t1)
  slli t1, t1, 4
  add t0, t0, t1
  addi s3, t0, 256
  ; boss.e16.ts:169  if ((bT + k * 25) % 50 === 0) fan(x, y, aimed(x, y), fanOf(5, 6, 52, BK_NEEDLE))
  lw t0, 0x175c(zero)
  li t1, 25
  mul t1, s1, t1
  add t0, t0, t1
  li t1, 50
  remu t0, t0, t1
  bne t0, zero, .L6
  ; boss.e16.ts:169  fan(x, y, aimed(x, y), fanOf(5, 6, 52, BK_NEEDLE))
  mv a0, s2
  mv a1, s3
  call aimed
  mv a1, s3
  mv a2, a0
  mv a0, s2
  li a3, 22123
  call fan
.L6:
  ; boss.e16.ts:170  if ((bT + k * 25) % 100 === 70) fan(x, y, 64, fanOf(9, 14, 28, BK_BLUE))
  lw t0, 0x175c(zero)
  li t1, 25
  mul t1, s1, t1
  add t0, t0, t1
  li t1, 100
  remu t0, t0, t1
  li t1, 70
  bne t0, t1, .L7
  ; boss.e16.ts:170  fan(x, y, 64, fanOf(9, 14, 28, BK_BLUE))
  mv a0, s2
  mv a1, s3
  li a2, 64
  li a3, 40505
  call fan
.L7:
.L5:
  ; boss.e16.ts:172  k++
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; boss.e16.ts:177 zenithSpiral() at -O1
;   y in s1
zenithSpiral:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; boss.e16.ts:178  if (bossPhase === 1) {
  lw t0, 0x1756(zero)
  li t1, 1
  bne t0, t1, .L1
  ; boss.e16.ts:179  bossPhase = 2
  li t0, 2
  sw t0, 0x1756(zero)
  ; boss.e16.ts:180  shake(20)
  li a0, 20
  call shake
  ; boss.e16.ts:181  wave(60, 6)
  li a0, 60
  li a1, 6
  call wave
  ; boss.e16.ts:182  sfxPart()
  call sfxPart
.L1:
  ; boss.e16.ts:184  spin = spin + 5
  lw t0, 0x175e(zero)
  addi t0, t0, 5
  sw t0, 0x175e(zero)
  ; boss.e16.ts:185  const y = bY + 16 * 16
  lw t0, 0x175a(zero)
  addi s1, t0, 256
  ; boss.e16.ts:186  if (bT % 5 === 0) {
  lw t0, 0x175c(zero)
  li t1, 5
  remu t0, t0, t1
  bne t0, zero, .L2
  ; boss.e16.ts:187  bullet(bX, y, spin & 255, sk(34, BK_PINK))
  lw t0, 0x1758(zero)
  lw t1, 0x175e(zero)
  andi t1, t1, 255
  mv a0, t0
  mv a1, s1
  mv a2, t1
  li a3, 34
  call bullet
  ; boss.e16.ts:188  bullet(bX, y, (spin + 128) & 255, sk(34, BK_BLUE))
  lw t0, 0x1758(zero)
  lw t1, 0x175e(zero)
  addi t1, t1, 128
  andi t1, t1, 255
  mv a0, t0
  mv a1, s1
  mv a2, t1
  li a3, 290
  call bullet
.L2:
  ; boss.e16.ts:190  if (bT % 90 === 0) ring(bX, y, bT & 255, ringOf(10, 20, BK_ORB_BLUE))
  lw t0, 0x175c(zero)
  li t1, 90
  remu t0, t0, t1
  bne t0, zero, .L3
  ; boss.e16.ts:190  ring(bX, y, bT & 255, ringOf(10, 20, BK_ORB_BLUE))
  lw t0, 0x1758(zero)
  lw t1, 0x175c(zero)
  andi t1, t1, 255
  mv a0, t0
  mv a1, s1
  mv a2, t1
  li a3, 10405
  call ring
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; boss.e16.ts:194 zenithBurning() at -O1
;   y in s1
zenithBurning:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; boss.e16.ts:195  if (bossPhase === 2) {
  lw t0, 0x1756(zero)
  li t1, 2
  bne t0, t1, .L1
  ; boss.e16.ts:196  bossPhase = 3
  li t0, 3
  sw t0, 0x1756(zero)
  ; boss.e16.ts:197  shake(30)
  li a0, 30
  call shake
  ; boss.e16.ts:198  wave(90, 10)
  li a0, 90
  li a1, 10
  call wave
  ; boss.e16.ts:199  sfxPart()
  call sfxPart
.L1:
  ; boss.e16.ts:201  spin = spin + 11
  lw t0, 0x175e(zero)
  addi t0, t0, 11
  sw t0, 0x175e(zero)
  ; boss.e16.ts:202  const y = bY + 16 * 16
  lw t0, 0x175a(zero)
  addi s1, t0, 256
  ; boss.e16.ts:203  if (bT % 14 === 0) ring(bX, y, spin, ringOf(14, 30, BK_PINK))
  lw t0, 0x175c(zero)
  li t1, 14
  remu t0, t0, t1
  bne t0, zero, .L2
  ; boss.e16.ts:203  ring(bX, y, spin, ringOf(14, 30, BK_PINK))
  lw t0, 0x1758(zero)
  lw t1, 0x175e(zero)
  mv a0, t0
  mv a1, s1
  mv a2, t1
  li a3, 14576
  call ring
.L2:
  ; boss.e16.ts:204  if (bT % 40 < 12 && bT % 3 === 0) bullet(bX, y, aimed(bX, y), sk(64, BK_NEEDLE))
  lw t0, 0x175c(zero)
  li t1, 40
  remu t0, t0, t1
  li t1, 12
  bgeu t0, t1, .L3
  lw t0, 0x175c(zero)
  li t1, 3
  remu t0, t0, t1
  bne t0, zero, .L3
  ; boss.e16.ts:204  bullet(bX, y, aimed(bX, y), sk(64, BK_NEEDLE))
  lw t0, 0x1758(zero)
  lw t1, 0x1758(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  mv a1, s1
  call aimed
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, s1
  mv a2, a0
  mv a0, t0
  li a3, 832
  call bullet
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; boss.e16.ts:208 flee() at -O1
flee:
  ; boss.e16.ts:209  bossPhase = 11
  li t0, 11
  sw t0, 0x1756(zero)
  ; boss.e16.ts:210  bossOn = B_NONE
  sw zero, 0x1754(zero)
.return:
  ret

; boss.e16.ts:213 die() at -O1
die:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; boss.e16.ts:214  bossPhase = 9
  li t0, 9
  sw t0, 0x1756(zero)
  ; boss.e16.ts:215  bT = 0
  sw zero, 0x175c(zero)
  ; boss.e16.ts:216  cancelAll()
  call cancelAll
  ; boss.e16.ts:217  flashScreen(6)
  li a0, 6
  call flashScreen
  ; boss.e16.ts:218  sfxBossDown()
  call sfxBossDown
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; boss.e16.ts:222 dying() at -O1
;   dx/k in s1
;   dy/s in s2
dying:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; boss.e16.ts:223  bY = bY + 2
  lw t0, 0x175a(zero)
  addi t0, t0, 2
  sw t0, 0x175a(zero)
  ; boss.e16.ts:224  if (bT % 6 === 0) {
  lw t0, 0x175c(zero)
  li t1, 6
  remu t0, t0, t1
  bne t0, zero, .L1
  ; boss.e16.ts:225  const dx = i16((bT * 37) % 96) - 48
  lw t0, 0x175c(zero)
  li t1, 37
  mul t0, t0, t1
  li t1, 96
  remu t0, t0, t1
  addi s1, t0, -48
  ; boss.e16.ts:226  const dy = i16((bT * 23) % 64) - 32
  lw t0, 0x175c(zero)
  li t1, 23
  mul t0, t0, t1
  andi t0, t0, 63
  addi s2, t0, -32
  ; boss.e16.ts:227  burst(bX + dx * 16, bY + dy * 16, (bT & 8) !== 0 ? 1 : 0)
  lw t0, 0x1758(zero)
  slli t1, s1, 4
  add t0, t0, t1
  lw t1, 0x175a(zero)
  slli t2, s2, 4
  add t1, t1, t2
  lw t2, 0x175c(zero)
  andi t2, t2, 8
  li t3, 0
  beq t2, t3, .L2
  li t2, 1
  j .L3
.L2:
  li t2, 0
.L3:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call burst
  ; boss.e16.ts:228  shake(8)
  li a0, 8
  call shake
.L1:
  ; boss.e16.ts:230  if (bT === 100) {
  lw t0, 0x175c(zero)
  li t1, 100
  bne t0, t1, .L4
  ; boss.e16.ts:231  let k: u16 = 0
  li s1, 0 ; dx/k
  ; boss.e16.ts:232  while (k < 6) {
  j .L7
.L5:
  ; boss.e16.ts:233  burst(bX + i16(k * 20) * 16 - 800, bY + i16(k & 1) * 320, 1)
  lw t0, 0x1758(zero)
  slli t2, s1, 4
  slli t1, s1, 2
  add t1, t1, t2
  slli t1, t1, 4
  add t0, t0, t1
  lw t1, 0x175a(zero)
  andi t2, s1, 1
  slli t3, t2, 8
  slli t2, t2, 6
  add t2, t2, t3
  add t1, t1, t2
  addi a0, t0, -800
  mv a1, t1
  li a2, 1
  call burst
  ; boss.e16.ts:234  k++
  addi s1, s1, 1
.L7:
  li t0, 6
  bltu s1, t0, .L5
  ; boss.e16.ts:236  let s: u16 = 0
  li s2, 0 ; dy/s
  ; boss.e16.ts:237  while (s < 24) {
  j .L11
.L9:
  ; boss.e16.ts:238  item(IT_STAR, bX + i16((s * 13) % 96) * 16 - 768, bY + i16((s * 7) % 48) * 16)
  lw t0, 0x1758(zero)
  li t1, 13
  mul t1, s2, t1
  li t2, 96
  remu t1, t1, t2
  slli t1, t1, 4
  add t0, t0, t1
  lw t1, 0x175a(zero)
  slli t3, s2, 3
  sub t2, t3, s2
  li t3, 48
  remu t2, t2, t3
  slli t2, t2, 4
  add t1, t1, t2
  li a0, 1
  addi a1, t0, -768
  mv a2, t1
  call item
  ; boss.e16.ts:239  s++
  addi s2, s2, 1
.L11:
  li t0, 24
  bltu s2, t0, .L9
  ; boss.e16.ts:241  itemsAll()
  call itemsAll
  ; boss.e16.ts:242  shake(40)
  li a0, 40
  call shake
  ; boss.e16.ts:243  wave(120, 14)
  li a0, 120
  li a1, 14
  call wave
  ; boss.e16.ts:244  flashScreen(16)
  li a0, 16
  call flashScreen
  ; boss.e16.ts:245  bossPhase = 10
  li t0, 10
  sw t0, 0x1756(zero)
  ; boss.e16.ts:246  bossOn = B_NONE
  sw zero, 0x1754(zero)
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; boss.e16.ts:253 bossHit(x, y, damage, byLance) at -O1
;   x in s2
;   y in s3
;   damage in 2(fp)
;   byLance in 4(fp)
;   k in s1
;   r in 0(fp)
;   px in 6(fp)
;   py in 8(fp)
bossHit:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  mv s2, a0 ; x
  mv s3, a1 ; y
  sw a2, 2(fp) ; damage
  sw a3, 4(fp) ; byLance
  ; boss.e16.ts:254  if (bossOn === B_NONE || bossPhase === 0 || bossPhase >= 9) return false
  lw t0, 0x1754(zero)
  beq t0, zero, .L2
  lw t0, 0x1756(zero)
  beq t0, zero, .L2
  lw t0, 0x1756(zero)
  li t1, 9
  bltu t0, t1, .L1
.L2:
  ; boss.e16.ts:254  return false
  li a0, 0
  j .return
.L1:
  ; boss.e16.ts:255  let k: u16 = 0
  li s1, 0 ; k
  ; boss.e16.ts:256  while (k < 3) {
  j .L5
.L3:
  ; boss.e16.ts:257  const r = i16(PHALF[k]) * 16
  slli t0, s1, 1
  lw t0, PHALF(t0)
  slli t0, t0, 4
  sw t0, 0(fp) ; r
  ; boss.e16.ts:258  const px = bX + i16(PX[k]) * 16
  lw t0, 0x1758(zero)
  slli t1, s1, 1
  lw t1, PX(t1)
  slli t1, t1, 4
  add t0, t0, t1
  sw t0, 6(fp) ; px
  ; boss.e16.ts:259  const py = bY + i16(PY[k]) * 16
  lw t0, 0x175a(zero)
  slli t1, s1, 1
  lw t1, PY(t1)
  slli t1, t1, 4
  add t0, t0, t1
  sw t0, 8(fp) ; py
  ; boss.e16.ts:260  if (life[k] !== 0 && abs(px - x) < r && abs(py - y) < r) {
  slli t0, s1, 1
  lw t0, life(t0)
  beq t0, zero, .L7
  lw t0, 6(fp) ; px
  sub a0, t0, s2
  call abs
  lw t0, 0(fp) ; r
  bge a0, t0, .L7
  lw t0, 8(fp) ; py
  sub a0, t0, s3
  call abs
  lw t0, 0(fp) ; r
  bge a0, t0, .L7
  ; boss.e16.ts:261  if (open(k)) hurtPart(k, damage, byLance)
  mv a0, s1
  call open
  beqz a0, .L8
  ; boss.e16.ts:261  hurtPart(k, damage, byLance)
  mv a0, s1
  lw a1, 2(fp)
  lw a2, 4(fp)
  call hurtPart
.L8:
  ; boss.e16.ts:262  return true
  li a0, 1
  j .return
.L7:
  ; boss.e16.ts:264  k++
  addi s1, s1, 1
.L5:
  li t0, 3
  bltu s1, t0, .L3
  ; boss.e16.ts:267  return abs(bX - x) < 40 * 16 && abs(bY - y) < 28 * 16
  lw t0, 0x1758(zero)
  sub a0, t0, s2
  call abs
  slti t0, a0, 640
  mv t1, t0
  beqz t1, .L9
  lw t0, 0x175a(zero)
  sub a0, t0, s3
  call abs
  slti t0, a0, 448
.L9:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; boss.e16.ts:271 bossLance(x, y) at -O1
;   x in 0(fp)
;   y in 4(fp)
;   best in s2
;   k in s1
;   r in 2(fp)
;   bottom in s3
bossLance:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 0(fp) ; x
  sw a1, 4(fp) ; y
  ; boss.e16.ts:272  if (bossOn === B_NONE || bossPhase === 0 || bossPhase >= 9) return 0
  lw t0, 0x1754(zero)
  beq t0, zero, .L2
  lw t0, 0x1756(zero)
  beq t0, zero, .L2
  lw t0, 0x1756(zero)
  li t1, 9
  bltu t0, t1, .L1
.L2:
  ; boss.e16.ts:272  return 0
  li a0, 0
  j .return
.L1:
  ; boss.e16.ts:273  let best: i16 = 0
  li s2, 0 ; best
  ; boss.e16.ts:274  let k: u16 = 0
  li s1, 0 ; k
  ; boss.e16.ts:275  while (k < 3) {
  j .L5
.L3:
  ; boss.e16.ts:276  const r = i16(PHALF[k]) * 16
  slli t0, s1, 1
  lw t0, PHALF(t0)
  slli t0, t0, 4
  sw t0, 2(fp) ; r
  ; boss.e16.ts:277  const bottom = bY + i16(PY[k]) * 16 + r
  lw t0, 0x175a(zero)
  slli t1, s1, 1
  lw t1, PY(t1)
  slli t1, t1, 4
  add t0, t0, t1
  lw t1, 2(fp) ; r
  add s3, t0, t1
  ; boss.e16.ts:278  if (life[k] !== 0 && abs(bX + i16(PX[k]) * 16 - x) < r + 64 && bottom < y && bottom > best)
  slli t0, s1, 1
  lw t0, life(t0)
  beq t0, zero, .L7
  lw t0, 0x1758(zero)
  slli t1, s1, 1
  lw t1, PX(t1)
  slli t1, t1, 4
  add t0, t0, t1
  lw t1, 0(fp) ; x
  sub a0, t0, t1
  call abs
  lw t0, 2(fp) ; r
  addi t0, t0, 64
  bge a0, t0, .L7
  lw t0, 4(fp) ; y
  bge s3, t0, .L7
  bge s2, s3, .L7
  ; boss.e16.ts:279  best = bottom
  mv s2, s3 ; best
.L7:
  ; boss.e16.ts:280  k++
  addi s1, s1, 1
.L5:
  li t0, 3
  bltu s1, t0, .L3
  ; boss.e16.ts:282  if (best === 0 && abs(bX - x) < 40 * 16) best = bY + 28 * 16
  bne s2, zero, .L8
  lw t0, 0x1758(zero)
  lw t1, 0(fp) ; x
  sub a0, t0, t1
  call abs
  li t0, 640
  bge a0, t0, .L8
  ; boss.e16.ts:282  best = bY + 28 * 16
  lw t0, 0x175a(zero)
  addi s2, t0, 448
.L8:
  ; boss.e16.ts:283  return best
  mv a0, s2
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; boss.e16.ts:286 bossBomb() at -O1
;   k in s1
bossBomb:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; boss.e16.ts:287  let k: u16 = 0
  li s1, 0 ; k
  ; boss.e16.ts:288  while (k < 3) {
  j .L3
.L1:
  ; boss.e16.ts:289  if (open(k)) hurtPart(k, 30, false)
  mv a0, s1
  call open
  beqz a0, .L5
  ; boss.e16.ts:289  hurtPart(k, 30, false)
  mv a0, s1
  li a1, 30
  li a2, 0
  call hurtPart
.L5:
  ; boss.e16.ts:290  k++
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; boss.e16.ts:294 hurtPart(k, damage, byLance) at -O1
;   k in s1
;   damage in s2
;   byLance in s3
hurtPart:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; damage
  mv s3, a2 ; byLance
  ; boss.e16.ts:295  flash[k] = 2
  slli t0, s1, 1
  li t1, 2
  sw t1, flash(t0)
  ; boss.e16.ts:296  if (life[k] > damage) {
  slli t0, s1, 1
  lw t0, life(t0)
  bgeu s2, t0, .L1
  ; boss.e16.ts:297  life[k] = life[k] - damage
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, life(t1)
  sub t1, t1, s2
  sw t1, life(t0)
  ; boss.e16.ts:298  if (byLance && (life[k] & 15) === 0) item(IT_STAR, bX + i16(PX[k]) * 16, bY + i16(PY[k]) * 16)
  beqz s3, .L2
  slli t0, s1, 1
  lw t0, life(t0)
  andi t0, t0, 15
  bne t0, zero, .L2
  ; boss.e16.ts:298  item(IT_STAR, bX + i16(PX[k]) * 16, bY + i16(PY[k]) * 16)
  lw t0, 0x1758(zero)
  slli t1, s1, 1
  lw t1, PX(t1)
  slli t1, t1, 4
  add t0, t0, t1
  lw t1, 0x175a(zero)
  slli t2, s1, 1
  lw t2, PY(t2)
  slli t2, t2, 4
  add t1, t1, t2
  li a0, 1
  mv a1, t0
  mv a2, t1
  call item
.L2:
  ; boss.e16.ts:299  return
  j .return
.L1:
  ; boss.e16.ts:301  life[k] = 0
  slli t0, s1, 1
  sw zero, life(t0)
  ; boss.e16.ts:302  if (k !== 0) {
  beq s1, zero, .L3
  ; boss.e16.ts:303  burst(bX + i16(PX[k]) * 16, bY + i16(PY[k]) * 16, 1)
  lw t0, 0x1758(zero)
  slli t1, s1, 1
  lw t1, PX(t1)
  slli t1, t1, 4
  add t0, t0, t1
  lw t1, 0x175a(zero)
  slli t2, s1, 1
  lw t2, PY(t2)
  slli t2, t2, 4
  add t1, t1, t2
  mv a0, t0
  mv a1, t1
  li a2, 1
  call burst
  ; boss.e16.ts:304  shake(16)
  li a0, 16
  call shake
  ; boss.e16.ts:305  sfxPart()
  call sfxPart
  ; boss.e16.ts:307  points(1000)
  li a0, 1000
  call points
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; boss.e16.ts:313 bossDraw() at -O1
;   x in s1
;   y in s2
;   dying_ in s3
bossDraw:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; boss.e16.ts:314  const x = (bX >> 4) + shakeDX()
  lw t0, 0x1758(zero)
  srai t0, t0, 4
  addi sp, sp, -2
  sw t0, 0(sp)
  call shakeDX
  lw t0, 0(sp)
  addi sp, sp, 2
  add s1, t0, a0
  ; boss.e16.ts:315  const y = (bY >> 4) + shakeDY()
  lw t0, 0x175a(zero)
  srai t0, t0, 4
  addi sp, sp, -2
  sw t0, 0(sp)
  call shakeDY
  lw t0, 0(sp)
  addi sp, sp, 2
  add s2, t0, a0
  ; boss.e16.ts:317  const dying_ = bossPhase === 9 && (bT & 2) !== 0
  lw t0, 0x1756(zero)
  li t1, 9
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  beqz t1, .L1
  lw t0, 0x175c(zero)
  andi t0, t0, 2
  sub t0, t0, zero
  snez t0, t0
.L1:
  mv s3, t0 ; dying_
  ; boss.e16.ts:318  if (bossOn === B_BASTION) bastionDraw(x, y, dying_)
  lw t0, 0x1754(zero)
  li t1, 1
  bne t0, t1, .L2
  ; boss.e16.ts:318  bastionDraw(x, y, dying_)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call bastionDraw
  j .L3
.L2:
  ; boss.e16.ts:319  zenithDraw(x, y, dying_)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call zenithDraw
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; boss.e16.ts:322 pal(k, dying_) at -O1
;   k in s1
;   dying_ in s3
;   f in s2
pal:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; k
  mv s3, a1 ; dying_
  ; boss.e16.ts:323  let f = (bT & 2) !== 0 && bossCharging(k)
  lw t0, 0x175c(zero)
  andi t0, t0, 2
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  beqz t1, .L1
  mv a0, s1
  call bossCharging
  mv t0, a0
.L1:
  mv s2, t0 ; f
  ; boss.e16.ts:324  if (flash[k] > 0) {
  slli t0, s1, 1
  lw t0, flash(t0)
  bgeu zero, t0, .L2
  ; boss.e16.ts:325  flash[k] = flash[k] - 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, flash(t1)
  addi t1, t1, -1
  sw t1, flash(t0)
  ; boss.e16.ts:326  f = true
  li s2, 1 ; f
.L2:
  ; boss.e16.ts:328  return ((f || dying_ ? SL_FLASH : SL_HEAVY) - 8) << 10
  bnez s2, .L5
  beqz s3, .L3
.L5:
  li t0, 15
  j .L4
.L3:
  li t0, 11
.L4:
  addi t0, t0, -8
  slli a0, t0, 10
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; boss.e16.ts:335 bossCharging(k) at -O1
;   k in a0
bossCharging:
  ; boss.e16.ts:336  if (bossPhase !== 1 && bossPhase !== 2) return false
  lw t0, 0x1756(zero)
  li t1, 1
  beq t0, t1, .L1
  lw t0, 0x1756(zero)
  li t1, 2
  beq t0, t1, .L1
  ; boss.e16.ts:336  return false
  li a0, 0
  ret
.L1:
  ; boss.e16.ts:337  if (bossOn === B_BASTION)
  lw t0, 0x1754(zero)
  li t1, 1
  bne t0, t1, .L2
  ; boss.e16.ts:338  return k === 0 && life[1] + life[2] !== 0 && bT % 120 >= 44 && bT % 120 < 60
  sub t0, a0, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L5
  lw t0, life+2(zero)
  lw t1, life+4(zero)
  add t0, t0, t1
  sub t0, t0, zero
  snez t0, t0
.L5:
  mv t1, t0
  beqz t1, .L4
  lw t0, 0x175c(zero)
  li t1, 120
  remu t0, t0, t1
  li t1, 44
  sltu t0, t0, t1
  xori t0, t0, 1
.L4:
  mv t1, t0
  beqz t1, .L3
  lw t0, 0x175c(zero)
  li t1, 120
  remu t0, t0, t1
  sltiu t0, t0, 60
.L3:
  mv a0, t0
  ret
.L2:
  ; boss.e16.ts:339  if (k !== 0) return (bT + k * 25) % 100 >= 54 && (bT + k * 25) % 100 < 70
  beq a0, zero, .L6
  ; boss.e16.ts:339  return (bT + k * 25) % 100 >= 54 && (bT + k * 25) % 100 < 70
  lw t0, 0x175c(zero)
  li t1, 25
  mul t1, a0, t1
  add t0, t0, t1
  li t1, 100
  remu t0, t0, t1
  li t1, 54
  sltu t0, t0, t1
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L7
  lw t0, 0x175c(zero)
  li t1, 25
  mul t1, a0, t1
  add t0, t0, t1
  li t1, 100
  remu t0, t0, t1
  sltiu t0, t0, 70
.L7:
  mv a0, t0
  ret
.L6:
  ; boss.e16.ts:340  return bossPhase === 2 && bT % 90 >= 74
  lw t0, 0x1756(zero)
  li t1, 2
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  beqz t1, .L8
  lw t0, 0x175c(zero)
  li t1, 90
  remu t0, t0, t1
  li t1, 74
  sltu t0, t0, t1
  xori t0, t0, 1
.L8:
  mv a0, t0
.return:
  ret

; boss.e16.ts:343 bastionDraw(x, y, dying_) at -O1
;   x in s1
;   y in s2
;   dying_ in s0
;   p in s3
bastionDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s0, a2 ; dying_
  ; boss.e16.ts:344  const p = pal(0, dying_)
  li a0, 0
  mv a1, s0
  call pal
  mv s3, a0 ; p
  ; boss.e16.ts:345  spr(x - 32, y - 32, BASTION_TILE | p, S32)
  li t0, 816
  or t0, t0, s3
  addi a0, s1, -32
  addi a1, s2, -32
  mv a2, t0
  li a3, 2
  call spr
  ; boss.e16.ts:346  spr(x, y - 32, (BASTION_TILE + 16) | p, S32)
  li t0, 832
  or t0, t0, s3
  mv a0, s1
  addi a1, s2, -32
  mv a2, t0
  li a3, 2
  call spr
  ; boss.e16.ts:347  spr(x - 32, y, (BASTION_TILE + 32) | p, S32)
  li t0, 848
  or t0, t0, s3
  addi a0, s1, -32
  mv a1, s2
  mv a2, t0
  li a3, 2
  call spr
  ; boss.e16.ts:348  spr(x, y, (BASTION_TILE + 48) | p, S32)
  li t0, 864
  or t0, t0, s3
  mv a0, s1
  mv a1, s2
  mv a2, t0
  li a3, 2
  call spr
  ; boss.e16.ts:349  if (life[1] !== 0) spr(x - 64, y - 16, (BASTION_TILE + 64) | pal(1, dying_), S32)
  lw t0, life+2(zero)
  beq t0, zero, .L1
  ; boss.e16.ts:349  spr(x - 64, y - 16, (BASTION_TILE + 64) | pal(1, dying_), S32)
  li a0, 1
  mv a1, s0
  call pal
  li t0, 880
  or t0, t0, a0
  addi a0, s1, -64
  addi a1, s2, -16
  mv a2, t0
  li a3, 2
  call spr
.L1:
  ; boss.e16.ts:350  if (life[2] !== 0) spr(x + 32, y - 16, (BASTION_TILE + 64) | pal(2, dying_) | FLIP_H, S32)
  lw t0, life+4(zero)
  beq t0, zero, .L2
  ; boss.e16.ts:350  spr(x + 32, y - 16, (BASTION_TILE + 64) | pal(2, dying_) | FLIP_H, S32)
  li a0, 2
  mv a1, s0
  call pal
  li t0, 880
  or t0, t0, a0
  li t1, 8192
  or t0, t0, t1
  addi a0, s1, 32
  addi a1, s2, -16
  mv a2, t0
  li a3, 2
  call spr
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; boss.e16.ts:353 zenithDraw(x, y, dying_) at -O1
;   x in s1
;   y in s2
;   dying_ in 0(fp)
;   hull in 2(fp)
;   k in s3
;   spread in 4(fp)
;   core in 6(fp)
;   left in 8(fp)
;   right in 10(fp)
zenithDraw:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s1, a0 ; x
  mv s2, a1 ; y
  sw a2, 0(fp) ; dying_
  ; boss.e16.ts:354  const hull = ((dying_ ? SL_FLASH : SL_HEAVY) - 8) << 10
  lw t0, 0(fp) ; dying_
  beqz t0, .L1
  li t0, 15
  j .L2
.L1:
  li t0, 11
.L2:
  addi t0, t0, -8
  slli t0, t0, 10
  sw t0, 2(fp) ; hull
  ; boss.e16.ts:356  let k: u16 = 0
  li s3, 0 ; k
  ; boss.e16.ts:357  while (k < 6) {
  j .L5
.L3:
  ; boss.e16.ts:358  spr(x - 48 + i16(k % 3) * 32, y - 32 + i16(div(k, 3)) * 32, (ZENITH_TILE + k * 16) | hull, S32)
  li t0, 3
  remu t0, s3, t0
  slli t0, t0, 5
  addi t1, s1, -48
  add t1, t1, t0
  li t0, 3
  divu t0, s3, t0
  slli t0, t0, 5
  addi t2, s2, -32
  add t2, t2, t0
  slli t0, s3, 4
  lw t3, 2(fp) ; hull
  addi t0, t0, 816
  or t0, t0, t3
  mv a0, t1
  mv a1, t2
  mv a2, t0
  li a3, 2
  call spr
  ; boss.e16.ts:359  k++
  addi s3, s3, 1
.L5:
  li t0, 6
  bltu s3, t0, .L3
  ; boss.e16.ts:361  const spread = bossPhase >= 2 ? 16 : 0
  lw t0, 0x1756(zero)
  li t1, 2
  bltu t0, t1, .L7
  li t0, 16
  j .L8
.L7:
  li t0, 0
.L8:
  sw t0, 4(fp) ; spread
  ; boss.e16.ts:362  spr(x - 80, y - 32, (ZENITH_TILE + 176 + spread) | hull, S32)
  lw t0, 4(fp) ; spread
  lw t1, 2(fp) ; hull
  addi t0, t0, 992
  or t0, t0, t1
  addi a0, s1, -80
  addi a1, s2, -32
  mv a2, t0
  li a3, 2
  call spr
  ; boss.e16.ts:363  spr(x + 48, y - 32, (ZENITH_TILE + 176 + spread) | hull | FLIP_H, S32)
  lw t0, 4(fp) ; spread
  lw t1, 2(fp) ; hull
  addi t0, t0, 992
  or t0, t0, t1
  li t1, 8192
  or t0, t0, t1
  addi a0, s1, 48
  addi a1, s2, -32
  mv a2, t0
  li a3, 2
  call spr
  ; boss.e16.ts:364  const core = bossPhase >= 3 ? 2 : life[1] === 0 && life[2] === 0 ? 1 : 0
  lw t0, 0x1756(zero)
  li t1, 3
  bltu t0, t1, .L9
  li t0, 2
  j .L10
.L9:
  lw t0, life+2(zero)
  bne t0, zero, .L11
  lw t0, life+4(zero)
  bne t0, zero, .L11
  li t0, 1
  j .L12
.L11:
  li t0, 0
.L12:
.L10:
  sw t0, 6(fp) ; core
  ; boss.e16.ts:365  spr(x - 16, y, (ZENITH_TILE + 96 + core * 16) | pal(0, dying_), S32)
  lw t0, 6(fp) ; core
  slli t0, t0, 4
  addi t0, t0, 912
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 0
  lw a1, 0(fp)
  call pal
  lw t0, 0(sp)
  addi sp, sp, 2
  or t0, t0, a0
  addi a0, s1, -16
  mv a1, s2
  mv a2, t0
  li a3, 2
  call spr
  ; boss.e16.ts:366  const left = life[1] === 0 ? 16 : 0
  lw t0, life+2(zero)
  bne t0, zero, .L13
  li t0, 16
  j .L14
.L13:
  li t0, 0
.L14:
  sw t0, 8(fp) ; left
  ; boss.e16.ts:367  const right = life[2] === 0 ? 16 : 0
  lw t0, life+4(zero)
  bne t0, zero, .L15
  li t0, 16
  j .L16
.L15:
  li t0, 0
.L16:
  sw t0, 10(fp) ; right
  ; boss.e16.ts:368  spr(x - 64, y + 16, (ZENITH_TILE + 144 + left) | pal(1, dying_), S32)
  lw t0, 8(fp) ; left
  addi t0, t0, 960
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 1
  lw a1, 0(fp)
  call pal
  lw t0, 0(sp)
  addi sp, sp, 2
  or t0, t0, a0
  addi a0, s1, -64
  addi a1, s2, 16
  mv a2, t0
  li a3, 2
  call spr
  ; boss.e16.ts:369  spr(x + 32, y + 16, (ZENITH_TILE + 144 + right) | pal(2, dying_) | FLIP_H, S32)
  lw t0, 10(fp) ; right
  addi t0, t0, 960
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 2
  lw a1, 0(fp)
  call pal
  lw t0, 0(sp)
  addi sp, sp, 2
  or t0, t0, a0
  li t1, 8192
  or t0, t0, t1
  addi a0, s1, 32
  addi a1, s2, 16
  mv a2, t0
  li a3, 2
  call spr
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

  .align 2

  .bank 2
  .org 0xc000
; scenes.e16.ts:29 hudLabels() at -O1
hudLabels:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes.e16.ts:30  say(6, 0, str('1UP'), SL_RED)
  li a0, 6
  li a1, 0
  la a2, str_5
  li a3, 7
  call say
  ; scenes.e16.ts:31  say(21, 0, str('HI'), SL_GOLD)
  li a0, 21
  li a1, 0
  la a2, str_6
  li a3, 6
  call say
  ; scenes.e16.ts:32  say(1, 2, str('CHAIN'), SL_TEXT)
  li a0, 1
  li a1, 2
  la a2, str_7
  li a3, 5
  call say
  ; scenes.e16.ts:33  say(1, 6, str('MULT'), SL_TEXT)
  li a0, 1
  li a1, 6
  la a2, str_8
  li a3, 5
  call say
  ; scenes.e16.ts:34  say(1, 11, str('SKIM'), SL_TEXT)
  li a0, 1
  li a1, 11
  la a2, str_9
  li a3, 5
  call say
  ; scenes.e16.ts:35  say(1, 15, str('LEVEL'), SL_TEXT)
  li a0, 1
  li a1, 15
  la a2, str_10
  li a3, 5
  call say
  ; scenes.e16.ts:37  say(
  lw t0, 0x173e(zero)
  li t1, 16
  mv t2, t0
  li t0, 1
  li t3, 0
  bne t2, t3, .L1
  la t2, str_11
  j .L2
.L1:
  lw t2, 0x173e(zero)
  li t3, 2
  bne t2, t3, .L3
  la t2, str_12
  j .L4
.L3:
  la t2, str_13
.L4:
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 6
  call say
  ; scenes.e16.ts:43  say(35, 2, str('SHIP'), SL_TEXT)
  li a0, 35
  li a1, 2
  la a2, str_14
  li a3, 5
  call say
  ; scenes.e16.ts:44  say(35, 7, str('BOMB'), SL_TEXT)
  li a0, 35
  li a1, 7
  la a2, str_15
  li a3, 5
  call say
  ; scenes.e16.ts:45  say(35, 12, str('VOLT'), SL_TEXT)
  li a0, 35
  li a1, 12
  la a2, str_16
  li a3, 5
  call say
  ; scenes.e16.ts:46  say(35, 17, str('POWER'), SL_TEXT)
  li a0, 35
  li a1, 17
  la a2, str_17
  li a3, 5
  call say
  ; scenes.e16.ts:47  hudReset()
  call hudReset
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes.e16.ts:51 warningStep(t) at -O1
;   t in s1
;   pulse in s2
warningStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  ; scenes.e16.ts:52  if (t === 300) {
  li t0, 300
  bne s1, t0, .L1
  ; scenes.e16.ts:53  music(0)
  li a0, 0
  call music
  ; scenes.e16.ts:54  say(10, 14, str('= = = = = = = = ='), SL_RED)
  li a0, 10
  li a1, 14
  la a2, str_18
  li a3, 7
  call say
  ; scenes.e16.ts:55  say(14, 15, str('WARNING'), SL_RED)
  li a0, 14
  li a1, 15
  la a2, str_19
  li a3, 7
  call say
  ; scenes.e16.ts:56  say(8, 16, str('A HUGE ENEMY APPROACHES'), SL_TEXT)
  li a0, 8
  li a1, 16
  la a2, str_20
  li a3, 5
  call say
  ; scenes.e16.ts:57  say(10, 17, str('= = = = = = = = ='), SL_RED)
  li a0, 10
  li a1, 17
  la a2, str_18
  li a3, 7
  call say
.L1:
  ; scenes.e16.ts:59  if (t % 60 === 0) sfxSiren()
  li t0, 60
  remu t0, s1, t0
  bne t0, zero, .L2
  ; scenes.e16.ts:59  sfxSiren()
  call sfxSiren
.L2:
  ; scenes.e16.ts:60  const pulse = t % 60
  li t0, 60
  remu s2, s1, t0
  ; scenes.e16.ts:61  palMix(0, 0x001c, pulse < 30 ? pulse >> 2 : (60 - pulse) >> 2)
  li t0, 0
  li t1, 28
  mv t2, s2
  li t3, 30
  bgeu t2, t3, .L3
  srli t2, s2, 2
  j .L4
.L3:
  li t2, 60
  sub t2, t2, s2
  srli t2, t2, 2
.L4:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call palMix
  ; scenes.e16.ts:62  if (t === 1) {
  li t0, 1
  bne s1, t0, .L5
  ; scenes.e16.ts:63  fieldClear()
  call fieldClear
  ; scenes.e16.ts:64  palettesIn()
  call palettesIn
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:69 pause() at -O1
pause:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes.e16.ts:70  dim(8)
  li a0, 8
  call dim
  ; scenes.e16.ts:71  say(17, 20, str('PAUSED'), SL_GOLD)
  li a0, 17
  li a1, 20
  la a2, str_21
  li a3, 6
  call say
  ; scenes.e16.ts:72  say(12, 22, str('START TO RESUME'), SL_TEXT)
  li a0, 12
  li a1, 22
  la a2, str_22
  li a3, 5
  call say
  ; scenes.e16.ts:73  soundMaster(4)
  li a0, 4
  call soundMaster
  ; scenes.e16.ts:74  for (;;) {
.L1:
  ; scenes.e16.ts:75  seenIs(frame_wait(seen))
  lw a0, 0x1906(zero)
  call frame_wait
  call seenIs
  ; scenes.e16.ts:76  padRead()
  call padRead
  ; scenes.e16.ts:77  if (pressed(B_START)) break
  li a0, 1024
  call pressed
  beqz a0, .L1
  ; scenes.e16.ts:77  break
  ; scenes.e16.ts:79  soundMaster(15)
  li a0, 15
  call soundMaster
  ; scenes.e16.ts:80  unsay(17, 20, 6)
  li a0, 17
  li a1, 20
  li a2, 6
  call unsay
  ; scenes.e16.ts:81  unsay(12, 22, 15)
  li a0, 12
  li a1, 22
  li a2, 15
  call unsay
  ; scenes.e16.ts:82  dim(0)
  li a0, 0
  call dim
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes.e16.ts:86 dim(t) at -O1
;   t in s2
;   s in s1
dim:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; t
  ; scenes.e16.ts:87  let s: u16 = 0
  li s1, 0 ; s
  ; scenes.e16.ts:88  while (s < 16) {
  j .L3
.L1:
  ; scenes.e16.ts:89  if (s < 4 || s >= 8) palMix(s, 0, t)
  li t0, 4
  bltu s1, t0, .L6
  li t0, 8
  bltu s1, t0, .L5
.L6:
  ; scenes.e16.ts:89  palMix(s, 0, t)
  mv a0, s1
  li a1, 0
  mv a2, s2
  call palMix
.L5:
  ; scenes.e16.ts:90  s++
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:95 tally() at -O1
tally:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes.e16.ts:96  music(M_CLEAR)
  li a0, 4
  call music
  ; scenes.e16.ts:97  fieldClear()
  call fieldClear
  ; scenes.e16.ts:98  say(13, 8, str('STAGE CLEAR'), SL_GOLD)
  li a0, 13
  li a1, 8
  la a2, str_23
  li a3, 6
  call say
  ; scenes.e16.ts:99  idle(60)
  li a0, 60
  call idle
  ; scenes.e16.ts:100  say(9, 12, str('MAX CHAIN'), SL_TEXT)
  li a0, 9
  li a1, 12
  la a2, str_24
  li a3, 5
  call say
  ; scenes.e16.ts:101  number_(24, 12, maxChain)
  lw t0, 0x178a(zero)
  li a0, 24
  li a1, 12
  mv a2, t0
  call number_
  ; scenes.e16.ts:102  idle(30)
  li a0, 30
  call idle
  ; scenes.e16.ts:103  say(9, 14, str('SKIM'), SL_TEXT)
  li a0, 9
  li a1, 14
  la a2, str_9
  li a3, 5
  call say
  ; scenes.e16.ts:104  number_(24, 14, skims)
  lw t0, 0x178c(zero)
  li a0, 24
  li a1, 14
  mv a2, t0
  call number_
  ; scenes.e16.ts:105  idle(30)
  li a0, 30
  call idle
  ; scenes.e16.ts:106  say(9, 16, str('BOMBS LEFT'), SL_TEXT)
  li a0, 9
  li a1, 16
  la a2, str_25
  li a3, 5
  call say
  ; scenes.e16.ts:107  number_(24, 16, bombs)
  lw t0, 0x14ec(zero)
  li a0, 24
  li a1, 16
  mv a2, t0
  call number_
  ; scenes.e16.ts:108  idle(30)
  li a0, 30
  call idle
  ; scenes.e16.ts:109  bonus()
  call bonus
  ; scenes.e16.ts:110  hudStep(lives, bombs, voltNow(), 0)
  lw t0, 0x14ea(zero)
  lw t1, 0x14ec(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  call voltNow
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  li a3, 0
  call hudStep
  ; scenes.e16.ts:111  idle(180)
  li a0, 180
  call idle
  ; scenes.e16.ts:112  fieldClear()
  call fieldClear
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes.e16.ts:120 bonus() at -O1
;   hi in s3
;   lo in s2
;   k in s0
;   at in s1
bonus:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  ; scenes.e16.ts:121  let hi = div(maxChain, 100)
  lw t0, 0x178a(zero)
  li t1, 100
  divu s3, t0, t1
  ; scenes.e16.ts:122  let lo = (maxChain % 100) * 100 + bombs * 1000
  lw t0, 0x178a(zero)
  li t1, 100
  remu t0, t0, t1
  li t1, 100
  mul t0, t0, t1
  lw t1, 0x14ec(zero)
  li t2, 1000
  mul t1, t1, t2
  add s2, t0, t1
  ; scenes.e16.ts:123  if (lo >= 10000) {
  li t0, 10000
  bltu s2, t0, .L1
  ; scenes.e16.ts:124  lo = lo - 10000
  li t0, 10000
  sub s2, s2, t0
  ; scenes.e16.ts:125  hi++
  addi s3, s3, 1
.L1:
  ; scenes.e16.ts:127  let k = hi
  mv s0, s3 ; k
  ; scenes.e16.ts:128  while (k > 0) {
  j .L4
.L2:
  ; scenes.e16.ts:129  points(10000)
  li a0, 10000
  call points
  ; scenes.e16.ts:130  k--
  addi s0, s0, -1
.L4:
  bltu zero, s0, .L2
  ; scenes.e16.ts:132  points(lo)
  mv a0, s2
  call points
  ; scenes.e16.ts:133  say(9, 19, str('BONUS'), SL_GOLD)
  li a0, 9
  li a1, 19
  la a2, str_26
  li a3, 6
  call say
  ; scenes.e16.ts:134  let at = cellAt(1, 22, 19)
  li s1, 43436 ; at
  ; scenes.e16.ts:135  if (hi > 0) {
  bgeu zero, s3, .L6
  ; scenes.e16.ts:136  at = numberAt(at, hi)
  mv a0, s1
  mv a1, s3
  call numberAt
  mv s1, a0 ; at
  ; scenes.e16.ts:137  number(at, lo, 4, font(SL_GOLD) + DIGITS)
  mv a0, s1
  mv a1, s2
  li a2, 4
  li a3, 39365
  call number
  ; scenes.e16.ts:138  at = at + 8
  addi s1, s1, 8
  j .L7
.L6:
  ; scenes.e16.ts:139  at = numberAt(at, lo)
  mv a0, s1
  mv a1, s2
  call numberAt
  mv s1, a0 ; at
.L7:
  ; scenes.e16.ts:140  if (hi + lo > 0) vpoke(at, font(SL_GOLD) + DIGITS)
  add t0, s3, s2
  bgeu zero, t0, .L8
  ; scenes.e16.ts:140  vpoke(at, font(SL_GOLD) + DIGITS)
  mv a0, s1
  li a1, 39365
  call vpoke
.L8:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; scenes.e16.ts:143 number_(x, y, n) at -O1
;   x in s1
;   y in s2
;   n in s3
number_:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; n
  ; scenes.e16.ts:144  numberAt(cellAt(1, x, y), n)
  li a0, 1
  mv a1, s1
  mv a2, s2
  call cellAt
  mv a1, s3
  call numberAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; scenes.e16.ts:148 numberAt(at, n) at -O1
;   at in s2
;   n in s1
;   digits in s3
numberAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; at
  mv s1, a1 ; n
  ; scenes.e16.ts:149  const digits: u16 = n >= 10000 ? 5 : n >= 1000 ? 4 : n >= 100 ? 3 : n >= 10 ? 2 : 1
  li t0, 10000
  bltu s1, t0, .L1
  li t0, 5
  j .L2
.L1:
  li t0, 1000
  bltu s1, t0, .L3
  li t0, 4
  j .L4
.L3:
  li t0, 100
  bltu s1, t0, .L5
  li t0, 3
  j .L6
.L5:
  li t0, 10
  bltu s1, t0, .L7
  li t0, 2
  j .L8
.L7:
  li t0, 1
.L8:
.L6:
.L4:
.L2:
  mv s3, t0 ; digits
  ; scenes.e16.ts:150  number(at, n, digits, font(SL_GOLD) + DIGITS)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  li a3, 39365
  call number
  ; scenes.e16.ts:151  return at + digits * 2
  slli t0, s3, 1
  add a0, s2, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; scenes.e16.ts:155 gameOver() at -O1
;   place in s1
gameOver:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; scenes.e16.ts:156  music(M_OVER)
  li a0, 5
  call music
  ; scenes.e16.ts:157  fieldClear()
  call fieldClear
  ; scenes.e16.ts:158  say(15, 15, str('GAME OVER'), SL_RED)
  li a0, 15
  li a1, 15
  la a2, str_27
  li a3, 7
  call say
  ; scenes.e16.ts:159  idle(200)
  li a0, 200
  call idle
  ; scenes.e16.ts:160  const place = tablePlace()
  call tablePlace
  mv s1, a0 ; place
  ; scenes.e16.ts:161  if (place < 5) nameEntry(place)
  li t0, 5
  bgeu s1, t0, .L1
  ; scenes.e16.ts:161  nameEntry(place)
  mv a0, s1
  call nameEntry
.L1:
  ; scenes.e16.ts:162  fieldClear()
  call fieldClear
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes.e16.ts:169 letterStep(k, t) at -O1
;   k in s3
;   t in 0(fp)
;   c in s1
;   j in s2
;   blink in 2(fp)
letterStep:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; k
  sw a1, 0(fp) ; t
  ; scenes.e16.ts:170  let c = letters[k]
  slli t0, s3, 1
  lw s1, letters(t0)
  ; scenes.e16.ts:171  if (pressed(B_UP)) c = c === 90 ? 65 : c + 1
  li a0, 1
  call pressed
  beqz a0, .L1
  ; scenes.e16.ts:171  c = c === 90 ? 65 : c + 1
  li t0, 90
  bne s1, t0, .L2
  li t0, 65
  j .L3
.L2:
  addi t0, s1, 1
.L3:
  mv s1, t0 ; c
.L1:
  ; scenes.e16.ts:172  if (pressed(B_DOWN)) c = c === 65 ? 90 : c - 1
  li a0, 2
  call pressed
  beqz a0, .L4
  ; scenes.e16.ts:172  c = c === 65 ? 90 : c - 1
  li t0, 65
  bne s1, t0, .L5
  li t0, 90
  j .L6
.L5:
  addi t0, s1, -1
.L6:
  mv s1, t0 ; c
.L4:
  ; scenes.e16.ts:173  letters[k] = c
  slli t0, s3, 1
  sw s1, letters(t0)
  ; scenes.e16.ts:174  let j: u16 = 0
  li s2, 0 ; j
  ; scenes.e16.ts:175  while (j < 3) {
  j .L9
.L7:
  ; scenes.e16.ts:176  const blink = j === k && (t & 16) !== 0
  sub t0, s2, s3
  seqz t0, t0
  mv t1, t0
  beqz t1, .L11
  lw t0, 0(fp) ; t
  andi t0, t0, 16
  sub t0, t0, zero
  snez t0, t0
.L11:
  sw t0, 2(fp) ; blink
  ; scenes.e16.ts:177  vpoke(cellAt(1, 18 + j, 15), font(blink ? SL_TEXT : SL_GOLD) + letters[j] - 32)
  li a0, 1
  addi a1, s2, 18
  li a2, 15
  call cellAt
  mv t0, a0
  lw t1, 2(fp)
  beqz t1, .L12
  li t1, 5
  j .L13
.L12:
  li t1, 6
.L13:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  call font
  slli t0, s2, 1
  lw t0, letters(t0)
  add t0, a0, t0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  addi a1, t0, -32
  call vpoke
  ; scenes.e16.ts:178  j++
  addi s2, s2, 1
.L9:
  li t0, 3
  bltu s2, t0, .L7
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; scenes.e16.ts:183 nameEntry(place) at -O1
;   place in s3
;   k in s1
;   t in s2
nameEntry:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; place
  ; scenes.e16.ts:184  music(M_ENTRY)
  li a0, 6
  call music
  ; scenes.e16.ts:185  fieldClear()
  call fieldClear
  ; scenes.e16.ts:186  say(10, 10, str('A NEW BEST SCORE'), SL_GOLD)
  li a0, 10
  li a1, 10
  la a2, str_28
  li a3, 6
  call say
  ; scenes.e16.ts:187  say(12, 12, str('ENTER YOUR NAME'), SL_TEXT)
  li a0, 12
  li a1, 12
  la a2, str_29
  li a3, 5
  call say
  ; scenes.e16.ts:188  letters[0] = 65
  li t0, 65
  sw t0, letters(zero)
  ; scenes.e16.ts:189  letters[1] = 65
  li t0, 65
  sw t0, letters+2(zero)
  ; scenes.e16.ts:190  letters[2] = 65
  li t0, 65
  sw t0, letters+4(zero)
  ; scenes.e16.ts:191  let k: u16 = 0
  li s1, 0 ; k
  ; scenes.e16.ts:192  let t: u16 = 0
  li s2, 0 ; t
  ; scenes.e16.ts:193  while (k < 3 && t < 1800) {
  j .L3
.L1:
  ; scenes.e16.ts:194  frameBegin()
  call frameBegin
  ; scenes.e16.ts:195  fxStep()
  call fxStep
  ; scenes.e16.ts:196  t++
  addi s2, s2, 1
  ; scenes.e16.ts:197  letterStep(k, t)
  mv a0, s1
  mv a1, s2
  call letterStep
  ; scenes.e16.ts:198  if (pressed(B_A)) {
  li a0, 16
  call pressed
  beqz a0, .L5
  ; scenes.e16.ts:199  sfxSelect()
  call sfxSelect
  ; scenes.e16.ts:200  k++
  addi s1, s1, 1
.L5:
.L3:
  li t0, 3
  bgeu s1, t0, .L6
  li t0, 1800
  bltu s2, t0, .L1
.L6:
  ; scenes.e16.ts:203  tableEnter(place, letters[0], letters[1], letters[2])
  lw t0, letters(zero)
  lw t1, letters+2(zero)
  lw t2, letters+4(zero)
  mv a0, s3
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call tableEnter
  ; scenes.e16.ts:204  fieldClear()
  call fieldClear
  ; scenes.e16.ts:205  tableShow(12)
  li a0, 12
  call tableShow
  ; scenes.e16.ts:206  idle(240)
  li a0, 240
  call idle
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; best.e16.ts:26 tableAt(l) at -O1
;   l in a0
tableAt:
  ; best.e16.ts:27  return l === LV_EASY ? 64 : l === LV_HARD ? 128 : 2
  bne a0, zero, .L1
  li t0, 64
  j .L2
.L1:
  li t0, 2
  bne a0, t0, .L3
  li t0, 128
  j .L4
.L3:
  li t0, 2
.L4:
.L2:
  mv a0, t0
.return:
  ret

; best.e16.ts:35 tableLoad() at -O1
tableLoad:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; best.e16.ts:36  if (saveRead(0) !== MAGIC) {
  li a0, 0
  call saveRead
  li t0, 21057
  beq a0, t0, .L1
  ; best.e16.ts:37  saveWrite(0, MAGIC)
  li a0, 0
  li a1, 21057
  call saveWrite
  ; best.e16.ts:38  tableFresh(tableAt(LV_NORMAL))
  li a0, 2
  call tableFresh
  ; best.e16.ts:39  saveWrite(LEVEL_MARK, 0)
  li a0, 42
  li a1, 0
  call saveWrite
.L1:
  ; best.e16.ts:41  if (saveRead(LEVEL_MARK) !== LEVEL_MAGIC) {
  li a0, 42
  call saveRead
  li t0, 22092
  beq a0, t0, .L2
  ; best.e16.ts:42  tableFresh(tableAt(LV_EASY))
  li a0, 64
  call tableFresh
  ; best.e16.ts:43  tableFresh(tableAt(LV_HARD))
  li a0, 128
  call tableFresh
  ; best.e16.ts:44  saveWrite(LEVEL_AT, LV_NORMAL)
  li a0, 44
  li a1, 1
  call saveWrite
  ; best.e16.ts:45  saveWrite(LEVEL_MARK, LEVEL_MAGIC)
  li a0, 42
  li a1, 22092
  call saveWrite
.L2:
  ; best.e16.ts:47  levelSet(saveRead(LEVEL_AT))
  li a0, 44
  call saveRead
  call levelSet
  ; best.e16.ts:48  tableRead()
  call tableRead
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; best.e16.ts:52 levelKeep() at -O1
levelKeep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; best.e16.ts:53  if (saveRead(LEVEL_AT) !== level) saveWrite(LEVEL_AT, level)
  li a0, 44
  call saveRead
  lw t0, 0x173e(zero)
  beq a0, t0, .L1
  ; best.e16.ts:53  saveWrite(LEVEL_AT, level)
  lw t0, 0x173e(zero)
  li a0, 44
  mv a1, t0
  call saveWrite
.L1:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; best.e16.ts:57 tableRead() at -O1
;   from in s0
;   k in s1
;   at in s2
;   ab in s3
tableRead:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  ; best.e16.ts:58  const from = tableAt(level)
  lw a0, 0x173e(zero)
  call tableAt
  mv s0, a0 ; from
  ; best.e16.ts:59  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:60  while (k < 5) {
  j .L3
.L1:
  ; best.e16.ts:61  const at = from + k * ENTRY
  slli t0, s1, 3
  add s2, s0, t0
  ; best.e16.ts:62  bestScore[k * 2] = saveRead(at)
  slli t0, s1, 1
  slli t0, t0, 1
  addi t0, t0, bestScore
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  call saveRead
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; best.e16.ts:63  bestScore[k * 2 + 1] = saveRead(at + 2)
  slli t0, s1, 1
  addi t0, t0, 1
  slli t0, t0, 1
  addi t0, t0, bestScore
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s2, 2
  call saveRead
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; best.e16.ts:64  const ab = saveRead(at + 4)
  addi a0, s2, 4
  call saveRead
  mv s3, a0 ; ab
  ; best.e16.ts:65  bestName[k * 3] = ab & 255
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  andi t1, s3, 255
  sw t1, bestName(t0)
  ; best.e16.ts:66  bestName[k * 3 + 1] = ab >> 8
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 1
  slli t0, t0, 1
  srli t1, s3, 8
  sw t1, bestName(t0)
  ; best.e16.ts:67  bestName[k * 3 + 2] = saveRead(at + 6) & 255
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 2
  slli t0, t0, 1
  addi t0, t0, bestName
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s2, 6
  call saveRead
  andi t0, a0, 255
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; best.e16.ts:68  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
  ; best.e16.ts:70  best[0] = bestScore[0]
  lw t0, bestScore(zero)
  sw t0, best(zero)
  ; best.e16.ts:71  best[1] = bestScore[1]
  lw t0, bestScore+2(zero)
  sw t0, best+2(zero)
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; best.e16.ts:75 tableFresh(from) at -O1
;   from in s3
;   k in s1
;   at in s2
tableFresh:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; from
  ; best.e16.ts:76  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:77  while (k < 5) {
  j .L3
.L1:
  ; best.e16.ts:78  const at = from + k * ENTRY
  slli t0, s1, 3
  add s2, s3, t0
  ; best.e16.ts:79  saveWrite(at, (5 - k) * 1000)
  li t0, 5
  sub t0, t0, s1
  li t1, 1000
  mul t0, t0, t1
  mv a0, s2
  mv a1, t0
  call saveWrite
  ; best.e16.ts:80  saveWrite(at + 2, 0)
  addi a0, s2, 2
  li a1, 0
  call saveWrite
  ; best.e16.ts:81  saveWrite(at + 4, 0x4c45)
  addi a0, s2, 4
  li a1, 19525
  call saveWrite
  ; best.e16.ts:82  saveWrite(at + 6, 0x43)
  addi a0, s2, 6
  li a1, 67
  call saveWrite
  ; best.e16.ts:83  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; best.e16.ts:88 tablePlace() at -O1
;   k in s1
tablePlace:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; best.e16.ts:89  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:90  while (k < 5) {
  j .L3
.L1:
  ; best.e16.ts:91  if (scoreMore(addr(score), addr(bestScore) + k * 4)) return k
  slli t0, s1, 2
  la a0, score
  addi a1, t0, bestScore
  call scoreMore
  beqz a0, .L5
  ; best.e16.ts:91  return k
  mv a0, s1
  j .return
.L5:
  ; best.e16.ts:92  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
  ; best.e16.ts:94  return 5
  li a0, 5
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; best.e16.ts:98 tableEnter(place, a, b, c) at -O1
;   place in s2
;   a in 0(fp)
;   b in 2(fp)
;   c in 4(fp)
;   k in s1
;   from in 6(fp)
;   at in s3
tableEnter:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s2, a0 ; place
  sw a1, 0(fp) ; a
  sw a2, 2(fp) ; b
  sw a3, 4(fp) ; c
  ; best.e16.ts:99  let k: u16 = 4
  li s1, 4 ; k
  ; best.e16.ts:100  while (k > place) {
  j .L3
.L1:
  ; best.e16.ts:101  bestScore[k * 2] = bestScore[k * 2 - 2]
  slli t0, s1, 1
  slli t0, t0, 1
  slli t1, s1, 1
  addi t1, t1, -2
  slli t1, t1, 1
  lw t1, bestScore(t1)
  sw t1, bestScore(t0)
  ; best.e16.ts:102  bestScore[k * 2 + 1] = bestScore[k * 2 - 1]
  slli t0, s1, 1
  addi t0, t0, 1
  slli t0, t0, 1
  slli t1, s1, 1
  addi t1, t1, -1
  slli t1, t1, 1
  lw t1, bestScore(t1)
  sw t1, bestScore(t0)
  ; best.e16.ts:103  bestName[k * 3] = bestName[k * 3 - 3]
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  slli t2, s1, 1
  add t1, t2, s1
  addi t1, t1, -3
  slli t1, t1, 1
  lw t1, bestName(t1)
  sw t1, bestName(t0)
  ; best.e16.ts:104  bestName[k * 3 + 1] = bestName[k * 3 - 2]
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 1
  slli t0, t0, 1
  slli t2, s1, 1
  add t1, t2, s1
  addi t1, t1, -2
  slli t1, t1, 1
  lw t1, bestName(t1)
  sw t1, bestName(t0)
  ; best.e16.ts:105  bestName[k * 3 + 2] = bestName[k * 3 - 1]
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 2
  slli t0, t0, 1
  slli t2, s1, 1
  add t1, t2, s1
  addi t1, t1, -1
  slli t1, t1, 1
  lw t1, bestName(t1)
  sw t1, bestName(t0)
  ; best.e16.ts:106  k--
  addi s1, s1, -1
.L3:
  bltu s2, s1, .L1
  ; best.e16.ts:108  bestScore[place * 2] = score[0]
  slli t0, s2, 1
  slli t0, t0, 1
  lw t1, score(zero)
  sw t1, bestScore(t0)
  ; best.e16.ts:109  bestScore[place * 2 + 1] = score[1]
  slli t0, s2, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, score+2(zero)
  sw t1, bestScore(t0)
  ; best.e16.ts:110  bestName[place * 3] = a
  slli t1, s2, 1
  add t0, t1, s2
  slli t0, t0, 1
  lw t1, 0(fp) ; a
  sw t1, bestName(t0)
  ; best.e16.ts:111  bestName[place * 3 + 1] = b
  slli t1, s2, 1
  add t0, t1, s2
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, 2(fp) ; b
  sw t1, bestName(t0)
  ; best.e16.ts:112  bestName[place * 3 + 2] = c
  slli t1, s2, 1
  add t0, t1, s2
  addi t0, t0, 2
  slli t0, t0, 1
  lw t1, 4(fp) ; c
  sw t1, bestName(t0)
  ; best.e16.ts:113  const from = tableAt(level)
  lw a0, 0x173e(zero)
  call tableAt
  sw a0, 6(fp) ; from
  ; best.e16.ts:114  k = 0
  li s1, 0 ; k
  ; best.e16.ts:115  while (k < 5) {
  j .L7
.L5:
  ; best.e16.ts:116  const at = from + k * ENTRY
  slli t0, s1, 3
  lw t1, 6(fp) ; from
  add s3, t1, t0
  ; best.e16.ts:117  saveWrite(at, bestScore[k * 2])
  slli t0, s1, 1
  slli t0, t0, 1
  lw t0, bestScore(t0)
  mv a0, s3
  mv a1, t0
  call saveWrite
  ; best.e16.ts:118  saveWrite(at + 2, bestScore[k * 2 + 1])
  slli t0, s1, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, bestScore(t0)
  addi a0, s3, 2
  mv a1, t0
  call saveWrite
  ; best.e16.ts:119  saveWrite(at + 4, bestName[k * 3] | (bestName[k * 3 + 1] << 8))
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  lw t0, bestName(t0)
  slli t2, s1, 1
  add t1, t2, s1
  addi t1, t1, 1
  slli t1, t1, 1
  lw t1, bestName(t1)
  slli t1, t1, 8
  or t0, t0, t1
  addi a0, s3, 4
  mv a1, t0
  call saveWrite
  ; best.e16.ts:120  saveWrite(at + 6, bestName[k * 3 + 2])
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 2
  slli t0, t0, 1
  lw t0, bestName(t0)
  addi a0, s3, 6
  mv a1, t0
  call saveWrite
  ; best.e16.ts:121  k++
  addi s1, s1, 1
.L7:
  li t0, 5
  bltu s1, t0, .L5
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s2, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; best.e16.ts:126 tableShow(y) at -O1
;   y in s0
;   k in s1
;   row in s2
;   s in s3
tableShow:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s0, a0 ; y
  ; best.e16.ts:127  unsay(13, y - 2, 14)
  li a0, 13
  addi a1, s0, -2
  li a2, 14
  call unsay
  ; best.e16.ts:128  say(13, y - 2, str('BEST 5'), SL_TEXT)
  li a0, 13
  addi a1, s0, -2
  la a2, str_30
  li a3, 5
  call say
  ; best.e16.ts:129  say(
  lw t0, 0x173e(zero)
  addi t1, s0, -2
  mv t2, t0
  li t0, 20
  li t3, 0
  bne t2, t3, .L1
  la t2, str_11
  j .L2
.L1:
  lw t2, 0x173e(zero)
  li t3, 2
  bne t2, t3, .L3
  la t2, str_12
  j .L4
.L3:
  la t2, str_31
.L4:
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 6
  call say
  ; best.e16.ts:135  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:136  while (k < 5) {
  j .L7
.L5:
  ; best.e16.ts:137  const row = y + k * 2
  slli t0, s1, 1
  add s2, s0, t0
  ; best.e16.ts:138  const s = k === 0 ? SL_GOLD : SL_TEXT
  bne s1, zero, .L9
  li t0, 6
  j .L10
.L9:
  li t0, 5
.L10:
  mv s3, t0 ; s
  ; best.e16.ts:139  vpoke(cellAt(1, 10, row), font(s) + DIGITS + 1 + k)
  li a0, 1
  li a1, 10
  mv a2, s2
  call cellAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  call font
  addi t0, a0, 17
  add t0, t0, s1
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  mv a1, t0
  call vpoke
  ; best.e16.ts:140  vpoke(cellAt(1, 13, row), font(s) + bestName[k * 3] - 32)
  li a0, 1
  li a1, 13
  mv a2, s2
  call cellAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  call font
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  lw t0, bestName(t0)
  add t0, a0, t0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  addi a1, t0, -32
  call vpoke
  ; best.e16.ts:141  vpoke(cellAt(1, 14, row), font(s) + bestName[k * 3 + 1] - 32)
  li a0, 1
  li a1, 14
  mv a2, s2
  call cellAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  call font
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, bestName(t0)
  add t0, a0, t0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  addi a1, t0, -32
  call vpoke
  ; best.e16.ts:142  vpoke(cellAt(1, 15, row), font(s) + bestName[k * 3 + 2] - 32)
  li a0, 1
  li a1, 15
  mv a2, s2
  call cellAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  call font
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 2
  slli t0, t0, 1
  lw t0, bestName(t0)
  add t0, a0, t0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  addi a1, t0, -32
  call vpoke
  ; best.e16.ts:143  scoreShow(cellAt(1, 18, row), addr(bestScore) + k * 4, font(s) + DIGITS)
  li a0, 1
  li a1, 18
  mv a2, s2
  call cellAt
  slli t0, s1, 2
  addi sp, sp, -2
  sw a0, 0(sp)
  addi t0, t0, bestScore
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  call font
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  addi a2, a0, 16
  mv a0, t1
  call scoreShow
  ; best.e16.ts:144  vpoke(cellAt(1, 26, row), font(s) + DIGITS)
  li a0, 1
  li a1, 26
  mv a2, s2
  call cellAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  call font
  lw t0, 0(sp)
  addi sp, sp, 2
  addi a1, a0, 16
  mv a0, t0
  call vpoke
  ; best.e16.ts:145  k++
  addi s1, s1, 1
.L7:
  li t0, 5
  bltu s1, t0, .L5
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

str_5:
  .byte 49, 85, 80, 0
str_6:
  .byte 72, 73, 0
str_7:
  .byte 67, 72, 65, 73, 78, 0
str_8:
  .byte 77, 85, 76, 84, 0
str_9:
  .byte 83, 75, 73, 77, 0
str_10:
  .byte 76, 69, 86, 69, 76, 0
str_11:
  .byte 69, 65, 83, 89, 0
str_12:
  .byte 72, 65, 82, 68, 0
str_13:
  .byte 78, 79, 82, 77, 0
str_14:
  .byte 83, 72, 73, 80, 0
str_15:
  .byte 66, 79, 77, 66, 0
str_16:
  .byte 86, 79, 76, 84, 0
str_17:
  .byte 80, 79, 87, 69, 82, 0
str_18:
  .byte 61, 32, 61, 32, 61, 32, 61, 32, 61, 32, 61, 32, 61, 32, 61, 32, 61, 0
str_19:
  .byte 87, 65, 82, 78, 73, 78, 71, 0
str_20:
  .byte 65, 32, 72, 85, 71, 69, 32, 69, 78, 69, 77, 89, 32, 65, 80, 80, 82, 79, 65, 67, 72, 69, 83, 0
str_21:
  .byte 80, 65, 85, 83, 69, 68, 0
str_22:
  .byte 83, 84, 65, 82, 84, 32, 84, 79, 32, 82, 69, 83, 85, 77, 69, 0
str_23:
  .byte 83, 84, 65, 71, 69, 32, 67, 76, 69, 65, 82, 0
str_24:
  .byte 77, 65, 88, 32, 67, 72, 65, 73, 78, 0
str_25:
  .byte 66, 79, 77, 66, 83, 32, 76, 69, 70, 84, 0
str_26:
  .byte 66, 79, 78, 85, 83, 0
str_27:
  .byte 71, 65, 77, 69, 32, 79, 86, 69, 82, 0
str_28:
  .byte 65, 32, 78, 69, 87, 32, 66, 69, 83, 84, 32, 83, 67, 79, 82, 69, 0
str_29:
  .byte 69, 78, 84, 69, 82, 32, 89, 79, 85, 82, 32, 78, 65, 77, 69, 0
str_30:
  .byte 66, 69, 83, 84, 32, 53, 0
str_31:
  .byte 78, 79, 82, 77, 65, 76, 0
  .align 2

  .bank 3
  .org 0xc000
; weapons.e16.ts:21 missilesFire(x, y) at -O1
;   x in s1
;   y in s2
missilesFire:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  ; weapons.e16.ts:22  missileOne(x - 96, y, -24)
  addi a0, s1, -96
  mv a1, s2
  li a2, 65512
  call missileOne
  ; weapons.e16.ts:23  missileOne(x + 96, y, 24)
  addi a0, s1, 96
  mv a1, s2
  li a2, 24
  call missileOne
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; weapons.e16.ts:26 missileOne(x, y, vx) at -O1
;   x in a0
;   y in a1
;   vx in a2
;   k in a3
missileOne:
  ; weapons.e16.ts:27  let k: u16 = 0
  li a3, 0 ; k
  ; weapons.e16.ts:28  while (k < M_N && mT[k] !== 0) k++
  j .L3
.L1:
  ; weapons.e16.ts:28  k++
  addi a3, a3, 1
.L3:
  li t0, 6
  bgeu a3, t0, .L5
  slli t0, a3, 1
  lw t0, mT(t0)
  bne t0, zero, .L1
.L5:
  ; weapons.e16.ts:29  if (k === M_N) return
  li t0, 6
  bne a3, t0, .L6
  ; weapons.e16.ts:29  return
  ret
.L6:
  ; weapons.e16.ts:30  mX[k] = u16(x)
  slli t0, a3, 1
  sw a0, mX(t0)
  ; weapons.e16.ts:31  mY[k] = u16(y)
  slli t0, a3, 1
  sw a1, mY(t0)
  ; weapons.e16.ts:32  mVX[k] = u16(vx)
  slli t0, a3, 1
  sw a2, mVX(t0)
  ; weapons.e16.ts:33  mVY[k] = u16(-40)
  slli t0, a3, 1
  li t1, 65496
  sw t1, mVY(t0)
  ; weapons.e16.ts:34  mT[k] = 1
  slli t0, a3, 1
  li t1, 1
  sw t1, mT(t0)
.return:
  ret

; weapons.e16.ts:38 missilesStep(damage) at -O1
;   damage in s2
;   k in s1
missilesStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; damage
  ; weapons.e16.ts:39  let k: u16 = 0
  li s1, 0 ; k
  ; weapons.e16.ts:40  while (k < M_N) {
  j .L3
.L1:
  ; weapons.e16.ts:41  if (mT[k] !== 0) missileMove(k, damage)
  slli t0, s1, 1
  lw t0, mT(t0)
  beq t0, zero, .L5
  ; weapons.e16.ts:41  missileMove(k, damage)
  mv a0, s1
  mv a1, s2
  call missileMove
.L5:
  ; weapons.e16.ts:42  k++
  addi s1, s1, 1
.L3:
  li t0, 6
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; weapons.e16.ts:46 missileMove(k, damage) at -O1
;   k in s1
;   damage in 2(fp)
;   t in 0(fp)
;   x in s2
;   y in s3
;   a in 4(fp)
missileMove:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 2(fp) ; damage
  ; weapons.e16.ts:47  const t = mT[k] + 1
  slli t0, s1, 1
  lw t0, mT(t0)
  addi t0, t0, 1
  sw t0, 0(fp) ; t
  ; weapons.e16.ts:48  mT[k] = t
  slli t0, s1, 1
  lw t1, 0(fp) ; t
  sw t1, mT(t0)
  ; weapons.e16.ts:49  let x = i16(mX[k])
  slli t0, s1, 1
  lw s2, mX(t0)
  ; weapons.e16.ts:50  let y = i16(mY[k])
  slli t0, s1, 1
  lw s3, mY(t0)
  ; weapons.e16.ts:52  if (t > 8) steer(k, x, y)
  li t0, 8
  lw t1, 0(fp) ; t
  bgeu t0, t1, .L1
  ; weapons.e16.ts:52  steer(k, x, y)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call steer
.L1:
  ; weapons.e16.ts:53  x = x + i16(mVX[k])
  slli t0, s1, 1
  lw t0, mVX(t0)
  add s2, s2, t0
  ; weapons.e16.ts:54  y = y + i16(mVY[k])
  slli t0, s1, 1
  lw t0, mVY(t0)
  add s3, s3, t0
  ; weapons.e16.ts:55  mX[k] = u16(x)
  slli t0, s1, 1
  sw s2, mX(t0)
  ; weapons.e16.ts:56  mY[k] = u16(y)
  slli t0, s1, 1
  sw s3, mY(t0)
  ; weapons.e16.ts:58  if (t > 150 || y < -256 || y > 4864 || x < (FIELD_X - 16) * 16 || x > (FIELD_X + 240) * 16) {
  li t0, 150
  lw t1, 0(fp) ; t
  bltu t0, t1, .L3
  li t0, 65280
  blt s3, t0, .L3
  li t0, 4864
  blt t0, s3, .L3
  li t0, 512
  blt s2, t0, .L3
  li t0, 4608
  bge t0, s2, .L2
.L3:
  ; weapons.e16.ts:59  mT[k] = 0
  slli t0, s1, 1
  sw zero, mT(t0)
  ; weapons.e16.ts:60  return
  j .return
.L2:
  ; weapons.e16.ts:62  if (foeHit(x, y, damage, false)) {
  mv a0, s2
  mv a1, s3
  lw a2, 2(fp)
  li a3, 0
  call foeHit
  beqz a0, .L4
  ; weapons.e16.ts:63  mT[k] = 0
  slli t0, s1, 1
  sw zero, mT(t0)
  ; weapons.e16.ts:64  fx(FX_SPARK, x, y, 0)
  li a0, 4
  mv a1, s2
  mv a2, s3
  li a3, 0
  call fx
  ; weapons.e16.ts:65  return
  j .return
.L4:
  ; weapons.e16.ts:67  const a = aim(i16(mVX[k]), i16(mVY[k]))
  slli t0, s1, 1
  lw t0, mVX(t0)
  slli t1, s1, 1
  lw t1, mVY(t1)
  mv a0, t0
  mv a1, t1
  call aim
  sw a0, 4(fp) ; a
  ; weapons.e16.ts:68  spr(
  srai t0, s2, 4
  addi t0, t0, -4
  addi sp, sp, -2
  sw t0, 0(sp)
  call shakeDX
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  srai t1, s3, 4
  addi sp, sp, -2
  sw t0, 0(sp)
  addi t1, t1, -4
  addi sp, sp, -2
  sw t1, 0(sp)
  call shakeDY
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 501
  lw a1, 4(fp)
  call pointing
  ori t0, a0, 1024
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a0, t2
  mv a1, t1
  mv a2, t0
  li a3, 0
  call spr
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; weapons.e16.ts:76 steer(k, x, y) at -O1
;   k in s1
;   x in s3
;   y in 0(fp)
;   target in s2
;   dx in 2(fp)
;   dy in 4(fp)
steer:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; k
  mv s3, a1 ; x
  sw a2, 0(fp) ; y
  ; weapons.e16.ts:77  const target = foeNearest(x, y, 0xffff)
  mv a0, s3
  lw a1, 0(fp)
  li a2, 65535
  call foeNearest
  mv s2, a0 ; target
  ; weapons.e16.ts:78  if (target === 0xffff) {
  li t0, 65535
  bne s2, t0, .L1
  ; weapons.e16.ts:79  mVY[k] = u16(clamp(i16(mVY[k]) - 4, 72))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, mVY(t1)
  addi t0, t0, mVY
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, t1, -4
  li a1, 72
  call clamp
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; weapons.e16.ts:80  return
  j .return
.L1:
  ; weapons.e16.ts:82  const dx = foeX(target) - x
  mv a0, s2
  call foeX
  sub t0, a0, s3
  sw t0, 2(fp) ; dx
  ; weapons.e16.ts:83  const dy = foeY(target) - y
  mv a0, s2
  call foeY
  lw t0, 0(fp) ; y
  sub t0, a0, t0
  sw t0, 4(fp) ; dy
  ; weapons.e16.ts:84  mVX[k] = u16(clamp(i16(mVX[k]) + (dx > 0 ? 8 : -8), 72))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, mVX(t1)
  addi t0, t0, mVX
  lw t2, 2(fp)
  li t3, 0
  bge t3, t2, .L2
  li t2, 8
  j .L3
.L2:
  li t2, 65528
.L3:
  add t1, t1, t2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  li a1, 72
  call clamp
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; weapons.e16.ts:85  mVY[k] = u16(clamp(i16(mVY[k]) + (dy > 0 ? 8 : -8), 72))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, mVY(t1)
  addi t0, t0, mVY
  lw t2, 4(fp)
  li t3, 0
  bge t3, t2, .L4
  li t2, 8
  j .L5
.L4:
  li t2, 65528
.L5:
  add t1, t1, t2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  li a1, 72
  call clamp
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; weapons.e16.ts:92 pointing(base, a) at -O1
;   base in a0
;   a in a1
;   quarter in a3
;   within in s1
;   k in a2
pointing:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; weapons.e16.ts:93  const quarter = (a >> 6) & 3
  srli t0, a1, 6
  andi a3, t0, 3
  ; weapons.e16.ts:94  const within = a & 63
  andi s1, a1, 63
  ; weapons.e16.ts:95  const k = (within + 8) >> 4
  addi t0, s1, 8
  srli a2, t0, 4
  ; weapons.e16.ts:96  if (quarter === 0) return base + k
  bne a3, zero, .L1
  ; weapons.e16.ts:96  return base + k
  add a0, a0, a2
  j .return
.L1:
  ; weapons.e16.ts:97  if (quarter === 1) return (base + 4 - k) | FLIP_H
  li t0, 1
  bne a3, t0, .L2
  ; weapons.e16.ts:97  return (base + 4 - k) | FLIP_H
  addi t0, a0, 4
  sub t0, t0, a2
  li t1, 8192
  or a0, t0, t1
  j .return
.L2:
  ; weapons.e16.ts:98  if (quarter === 2) return (base + k) | FLIP_H | FLIP_V
  li t0, 2
  bne a3, t0, .L3
  ; weapons.e16.ts:98  return (base + k) | FLIP_H | FLIP_V
  add t0, a0, a2
  li t1, 8192
  or t0, t0, t1
  li t1, 16384
  or a0, t0, t1
  j .return
.L3:
  ; weapons.e16.ts:99  return (base + 4 - k) | FLIP_V
  addi t0, a0, 4
  sub t0, t0, a2
  li t1, 16384
  or a0, t0, t1
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; weapons.e16.ts:102 missilesClear() at -O1
;   k in a0
missilesClear:
  ; weapons.e16.ts:103  let k: u16 = 0
  li a0, 0 ; k
  ; weapons.e16.ts:104  while (k < M_N) {
  j .L3
.L1:
  ; weapons.e16.ts:105  mT[k] = 0
  slli t0, a0, 1
  sw zero, mT(t0)
  ; weapons.e16.ts:106  k++
  addi a0, a0, 1
.L3:
  li t0, 6
  bltu a0, t0, .L1
.return:
  ret

; weapons.e16.ts:121 chainFrom(first, count, damage) at -O1
;   first in 2(fp)
;   count in 4(fp)
;   damage in 0(fp)
;   at in s1
;   left in s3
;   next in s2
chainFrom:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 2(fp) ; first
  sw a1, 4(fp) ; count
  sw a2, 0(fp) ; damage
  ; weapons.e16.ts:122  links = 0
  sw zero, 0x17f4(zero)
  ; weapons.e16.ts:123  let at = first
  lw s1, 2(fp) ; first
  ; weapons.e16.ts:124  let left = count
  lw s3, 4(fp) ; count
  ; weapons.e16.ts:125  while (left > 0 && at !== 0xffff) {
  j .L3
.L1:
  ; weapons.e16.ts:126  const next = foeNearest(foeX(at), foeY(at), at)
  mv a0, s1
  call foeX
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call foeY
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  mv a2, s1
  call foeNearest
  mv s2, a0 ; next
  ; weapons.e16.ts:127  if (next === 0xffff || !near(at, next)) return
  li t0, 65535
  beq s2, t0, .L6
  mv a0, s1
  mv a1, s2
  call near
  bnez a0, .L5
.L6:
  ; weapons.e16.ts:127  return
  j .return
.L5:
  ; weapons.e16.ts:128  linkFrom[links * 2] = u16(foeX(at))
  lw t0, 0x17f4(zero)
  slli t0, t0, 1
  slli t0, t0, 1
  addi t0, t0, linkFrom
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call foeX
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; weapons.e16.ts:129  linkFrom[links * 2 + 1] = u16(foeY(at))
  lw t0, 0x17f4(zero)
  slli t0, t0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  addi t0, t0, linkFrom
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call foeY
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; weapons.e16.ts:130  linkTo[links * 2] = u16(foeX(next))
  lw t0, 0x17f4(zero)
  slli t0, t0, 1
  slli t0, t0, 1
  addi t0, t0, linkTo
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  call foeX
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; weapons.e16.ts:131  linkTo[links * 2 + 1] = u16(foeY(next))
  lw t0, 0x17f4(zero)
  slli t0, t0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  addi t0, t0, linkTo
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  call foeY
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; weapons.e16.ts:132  links++
  lw t0, 0x17f4(zero)
  addi t0, t0, 1
  sw t0, 0x17f4(zero)
  ; weapons.e16.ts:133  if (damage > 0) foeHurt(next, damage)
  lw t0, 0(fp) ; damage
  bgeu zero, t0, .L7
  ; weapons.e16.ts:133  foeHurt(next, damage)
  mv a0, s2
  lw a1, 0(fp)
  call foeHurt
.L7:
  ; weapons.e16.ts:134  at = next
  mv s1, s2 ; at
  ; weapons.e16.ts:135  left--
  addi s3, s3, -1
.L3:
  bgeu zero, s3, .L8
  li t0, 65535
  bne s1, t0, .L1
.L8:
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; weapons.e16.ts:139 near(a, b) at -O1
;   a in s1
;   b in s2
near:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b
  ; weapons.e16.ts:140  return abs(foeX(a) - foeX(b)) < 96 * 16 && abs(foeY(a) - foeY(b)) < 96 * 16
  mv a0, s1
  call foeX
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call foeX
  lw t0, 0(sp)
  addi sp, sp, 2
  sub a0, t0, a0
  call abs
  slti t0, a0, 1536
  mv t1, t0
  beqz t1, .L1
  mv a0, s1
  call foeY
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call foeY
  lw t0, 0(sp)
  addi sp, sp, 2
  sub a0, t0, a0
  call abs
  slti t0, a0, 1536
.L1:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; weapons.e16.ts:144 chainDraw(tick) at -O1
;   tick in s2
;   k in s1
chainDraw:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; tick
  ; weapons.e16.ts:145  let k: u16 = 0
  li s1, 0 ; k
  ; weapons.e16.ts:146  while (k < links) {
  j .L3
.L1:
  ; weapons.e16.ts:147  linkDraw(k, tick)
  mv a0, s1
  mv a1, s2
  call linkDraw
  ; weapons.e16.ts:148  k++
  addi s1, s1, 1
.L3:
  lw t0, 0x17f4(zero)
  bltu s1, t0, .L1
  ; weapons.e16.ts:150  links = 0
  sw zero, 0x17f4(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; weapons.e16.ts:153 linkDraw(k, tick) at -O1
;   k in s2
;   tick in 2(fp)
;   x0 in s3
;   y0 in 0(fp)
;   dx in 4(fp)
;   dy in 6(fp)
;   s in s1
;   x in 8(fp)
;   y in 10(fp)
linkDraw:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  sw s1, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s2, a0 ; k
  sw a1, 2(fp) ; tick
  ; weapons.e16.ts:154  const x0 = i16(linkFrom[k * 2]) >> 4
  slli t0, s2, 1
  slli t0, t0, 1
  lw t0, linkFrom(t0)
  srai s3, t0, 4
  ; weapons.e16.ts:155  const y0 = i16(linkFrom[k * 2 + 1]) >> 4
  slli t0, s2, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, linkFrom(t0)
  srai t0, t0, 4
  sw t0, 0(fp) ; y0
  ; weapons.e16.ts:156  const dx = (i16(linkTo[k * 2]) >> 4) - x0
  slli t0, s2, 1
  slli t0, t0, 1
  lw t0, linkTo(t0)
  srai t0, t0, 4
  sub t0, t0, s3
  sw t0, 4(fp) ; dx
  ; weapons.e16.ts:157  const dy = (i16(linkTo[k * 2 + 1]) >> 4) - y0
  slli t0, s2, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, linkTo(t0)
  srai t0, t0, 4
  lw t1, 0(fp) ; y0
  sub t0, t0, t1
  sw t0, 6(fp) ; dy
  ; weapons.e16.ts:158  let s: i16 = 1
  li s1, 1 ; s
  ; weapons.e16.ts:159  while (s < 6) {
  j .L3
.L1:
  ; weapons.e16.ts:160  const x = x0 + div(dx * s, 6) - 4
  lw t0, 4(fp) ; dx
  mul t0, t0, s1
  li t1, 6
  div t0, t0, t1
  add t0, s3, t0
  addi t0, t0, -4
  sw t0, 8(fp) ; x
  ; weapons.e16.ts:161  const y = y0 + div(dy * s, 6) - 4
  lw t0, 6(fp) ; dy
  mul t0, t0, s1
  li t1, 6
  div t0, t0, t1
  lw t1, 0(fp) ; y0
  add t1, t1, t0
  addi t1, t1, -4
  sw t1, 10(fp) ; y
  ; weapons.e16.ts:162  spr(
  call shakeDX
  lw t0, 8(fp) ; x
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  call shakeDY
  lw t0, 10(fp) ; y
  add t0, t0, a0
  lw t1, 2(fp) ; tick
  add t1, t1, s1
  andi t1, t1, 3
  addi t1, t1, 506
  ori t1, t1, 1024
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a0, t2
  mv a1, t0
  mv a2, t1
  li a3, 0
  call spr
  ; weapons.e16.ts:168  s++
  addi s1, s1, 1
.L3:
  li t0, 6
  blt s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  lw s1, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; weapons.e16.ts:180 ringStart(x, y, reach) at -O1
;   x in s1
;   y in s2
;   reach in s3
ringStart:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; reach
  ; weapons.e16.ts:181  ringX = x
  sw s1, 0x17f6(zero)
  ; weapons.e16.ts:182  ringY = y
  sw s2, 0x17f8(zero)
  ; weapons.e16.ts:183  ringMax = i16(reach)
  sw s3, 0x17fa(zero)
  ; weapons.e16.ts:184  ringT = 1
  li t0, 1
  sw t0, 0x17fc(zero)
  ; weapons.e16.ts:185  foesBombReset()
  call foesBombReset
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; weapons.e16.ts:189 radius() at -O1
;   r in a0
radius:
  ; weapons.e16.ts:190  const r = i16(ringT) * 8
  lw t0, 0x17fc(zero)
  slli a0, t0, 3
  ; weapons.e16.ts:191  return r > ringMax ? ringMax : r
  lw t0, 0x17fa(zero)
  bge t0, a0, .L1
  lw t0, 0x17fa(zero)
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a0, t0
.return:
  ret

; weapons.e16.ts:195 ringStep() at -O1
;   r in s1
ringStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; weapons.e16.ts:196  if (ringT === 0) return
  lw t0, 0x17fc(zero)
  bne t0, zero, .L1
  ; weapons.e16.ts:196  return
  j .return
.L1:
  ; weapons.e16.ts:197  ringT++
  lw t0, 0x17fc(zero)
  addi t0, t0, 1
  sw t0, 0x17fc(zero)
  ; weapons.e16.ts:198  const r = radius()
  call radius
  mv s1, a0 ; r
  ; weapons.e16.ts:199  cancelWithin(ringX, ringY, r * 16)
  lw t0, 0x17f6(zero)
  lw t1, 0x17f8(zero)
  slli t2, s1, 4
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call cancelWithin
  ; weapons.e16.ts:200  foesBombWithin(ringX, ringY, r * 16)
  lw t0, 0x17f6(zero)
  lw t1, 0x17f8(zero)
  slli t2, s1, 4
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call foesBombWithin
  ; weapons.e16.ts:201  if (ringT > 120) ringT = 0
  lw t0, 0x17fc(zero)
  li t1, 120
  bgeu t1, t0, .L2
  ; weapons.e16.ts:201  ringT = 0
  sw zero, 0x17fc(zero)
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; weapons.e16.ts:205 ringDraw() at -O1
;   x in s2
;   y in s3
;   tile/half in s1
;   a in 0(fp)
;   k in 2(fp)
ringDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; weapons.e16.ts:206  if (ringT === 0) return
  lw t0, 0x17fc(zero)
  bne t0, zero, .L1
  ; weapons.e16.ts:206  return
  j .return
.L1:
  ; weapons.e16.ts:207  const x = (ringX >> 4) + shakeDX()
  lw t0, 0x17f6(zero)
  srai t0, t0, 4
  addi sp, sp, -2
  sw t0, 0(sp)
  call shakeDX
  lw t0, 0(sp)
  addi sp, sp, 2
  add s2, t0, a0
  ; weapons.e16.ts:208  const y = (ringY >> 4) + shakeDY()
  lw t0, 0x17f8(zero)
  srai t0, t0, 4
  addi sp, sp, -2
  sw t0, 0(sp)
  call shakeDY
  lw t0, 0(sp)
  addi sp, sp, 2
  add s3, t0, a0
  ; weapons.e16.ts:209  const pal = (SL_ITEM - 8) << 10
  ; weapons.e16.ts:210  if (ringT < 8) {
  lw t0, 0x17fc(zero)
  li t1, 8
  bgeu t0, t1, .L2
  ; weapons.e16.ts:211  const tile = (RING_TILE + (ringT >> 1) * 4) | pal
  lw t0, 0x17fc(zero)
  srli t0, t0, 1
  slli t0, t0, 2
  addi t0, t0, 394
  ori s1, t0, 6144
  ; weapons.e16.ts:212  spr(x - 16, y - 16, tile, S16)
  addi a0, s2, -16
  addi a1, s3, -16
  mv a2, s1
  li a3, 1
  call spr
  ; weapons.e16.ts:213  spr(x, y - 16, tile | FLIP_H, S16)
  li t0, 8192
  or t0, s1, t0
  mv a0, s2
  addi a1, s3, -16
  mv a2, t0
  li a3, 1
  call spr
  ; weapons.e16.ts:214  spr(x - 16, y, tile | FLIP_V, S16)
  li t0, 16384
  or t0, s1, t0
  addi a0, s2, -16
  mv a1, s3
  mv a2, t0
  li a3, 1
  call spr
  ; weapons.e16.ts:215  spr(x, y, tile | FLIP_H | FLIP_V, S16)
  li t0, 8192
  or t0, s1, t0
  li t1, 16384
  or t0, t0, t1
  mv a0, s2
  mv a1, s3
  mv a2, t0
  li a3, 1
  call spr
  ; weapons.e16.ts:216  return
  j .return
.L2:
  ; weapons.e16.ts:219  if (i16(ringT) * 8 > ringMax + 160 && (ringT & 1) !== 0) return
  lw t0, 0x17fc(zero)
  slli t0, t0, 3
  lw t1, 0x17fa(zero)
  addi t1, t1, 160
  bge t1, t0, .L3
  lw t0, 0x17fc(zero)
  andi t0, t0, 1
  beq t0, zero, .L3
  ; weapons.e16.ts:219  return
  j .return
.L3:
  ; weapons.e16.ts:221  const half = radius() >> 1
  call radius
  srai s1, a0, 1
  ; weapons.e16.ts:222  let a: u16 = ringT * 3
  lw t0, 0x17fc(zero)
  slli t1, t0, 1
  add t0, t1, t0
  sw t0, 0(fp) ; a
  ; weapons.e16.ts:223  let k: u16 = 0
  sw zero, 2(fp) ; k
  ; weapons.e16.ts:224  while (k < 16) {
  j .L6
.L4:
  ; weapons.e16.ts:225  spr(
  lw a0, 0(fp)
  call cos
  mulq t0, a0, s1, 7
  add t0, s2, t0
  addi t0, t0, -8
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 0(fp)
  call sin
  mulq t0, a0, s1, 7
  add t0, s3, t0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  addi a1, t0, -8
  li a2, 6550
  li a3, 1
  call spr
  ; weapons.e16.ts:231  a = a + 16
  lw t0, 0(fp) ; a
  addi t0, t0, 16
  sw t0, 0(fp) ; a
  ; weapons.e16.ts:232  k++
  lw t0, 2(fp) ; k
  addi t0, t0, 1
  sw t0, 2(fp) ; k
.L6:
  li t0, 16
  lw t1, 2(fp) ; k
  bltu t1, t0, .L4
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes2.e16.ts:21 newFoeMove(k, t) at -O1
;   k in s1
;   t in s2
;   kind in s3
newFoeMove:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; t
  ; foes2.e16.ts:22  const kind = fK[k]
  slli t0, s1, 1
  lw s3, fK(t0)
  ; foes2.e16.ts:23  if (kind === K_PRISM) prismMove(k, t)
  li t0, 9
  bne s3, t0, .L1
  ; foes2.e16.ts:23  prismMove(k, t)
  mv a0, s1
  mv a1, s2
  call prismMove
  j .L2
.L1:
  ; foes2.e16.ts:24  if (kind === K_SPINNER) spinnerMove(k, t)
  li t0, 12
  bne s3, t0, .L3
  ; foes2.e16.ts:24  spinnerMove(k, t)
  mv a0, s1
  mv a1, s2
  call spinnerMove
  j .L4
.L3:
  ; foes2.e16.ts:25  if (kind === K_SERPENT) serpentMove(k, t)
  li t0, 10
  bne s3, t0, .L5
  ; foes2.e16.ts:25  serpentMove(k, t)
  mv a0, s1
  mv a1, s2
  call serpentMove
  j .L6
.L5:
  ; foes2.e16.ts:26  segmentMove(k, t)
  mv a0, s1
  mv a1, s2
  call segmentMove
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

; foes2.e16.ts:30 prismMove(k, t) at -O1
;   k in s1
;   t in s2
;   y in s3
prismMove:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; t
  ; foes2.e16.ts:31  const y = i16(fY[k]) >> 4
  slli t0, s1, 1
  lw t0, fY(t0)
  srai s3, t0, 4
  ; foes2.e16.ts:33  fVY[k] = t > 600 ? u16(-16) : y < 60 + i16(fP[k]) ? 20 : 0
  slli t0, s1, 1
  addi t0, t0, fVY
  mv t1, s2
  li t2, 600
  bgeu t2, t1, .L1
  li t1, 65520
  j .L2
.L1:
  slli t1, s1, 1
  lw t1, fP(t1)
  addi t2, t1, 60
  mv t1, s3
  bge t1, t2, .L3
  li t1, 20
  j .L4
.L3:
  li t1, 0
.L4:
.L2:
  sw t1, 0(t0)
  ; foes2.e16.ts:34  fVX[k] = u16(mulShift(cos(t * 2), 24, 8))
  slli t0, s1, 1
  slli t1, s2, 1
  addi t0, t0, fVX
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  call cos
  li t0, 24
  mulq t0, a0, t0, 8
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; foes2.e16.ts:35  if (t % 80 === 40 && y > 30 && t < 600) {
  li t0, 80
  remu t0, s2, t0
  li t1, 40
  bne t0, t1, .L5
  li t0, 30
  bge t0, s3, .L5
  li t0, 600
  bgeu s2, t0, .L5
  ; foes2.e16.ts:36  fan(
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fY(t1)
  slli t2, s1, 1
  lw t2, fX(t2)
  slli t3, s1, 1
  lw t3, fY(t3)
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  mv a0, t2
  mv a1, t3
  call aimed
  lw t0, 0x172a(zero)
  srli t0, t0, 2
  addi sp, sp, -2
  sw a0, 0(sp)
  addi a0, t0, 3
  li a1, 12
  li a2, 30
  li a3, 1
  call fanOf
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a1, t1
  mv a2, t0
  mv a3, a0
  mv a0, t2
  call fan
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; foes2.e16.ts:46 spinnerMove(k, t) at -O1
;   k in a0
;   t in a1
;   dx in a2
;   toward in a3
spinnerMove:
  ; foes2.e16.ts:47  const dx = targetX - i16(fX[k])
  lw t0, 0x1440(zero)
  slli t1, a0, 1
  lw t1, fX(t1)
  sub a2, t0, t1
  ; foes2.e16.ts:48  const toward: i16 = dx > 0 ? 10 : -10
  bge zero, a2, .L1
  li t0, 10
  j .L2
.L1:
  li t0, 65526
.L2:
  mv a3, t0 ; toward
  ; foes2.e16.ts:49  fVX[k] = u16(t < 30 ? 0 : toward)
  slli t0, a0, 1
  addi t0, t0, fVX
  mv t1, a1
  li t2, 30
  bgeu t1, t2, .L3
  li t1, 0
  j .L4
.L3:
  mv t1, a3
.L4:
  sw t1, 0(t0)
  ; foes2.e16.ts:50  fVY[k] = 14
  slli t0, a0, 1
  li t1, 14
  sw t1, fVY(t0)
.return:
  ret

; foes2.e16.ts:54 serpentMove(k, t) at -O1
;   k in s1
;   t in s0
;   slot in s2
;   at in s3
serpentMove:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; k
  mv s0, a1 ; t
  ; foes2.e16.ts:55  fVY[k] = 12
  slli t0, s1, 1
  li t1, 12
  sw t1, fVY(t0)
  ; foes2.e16.ts:56  fVX[k] = u16(mulShift(cos(t * 3), 52, 8))
  slli t0, s1, 1
  slli t2, s0, 1
  add t1, t2, s0
  addi t0, t0, fVX
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  call cos
  li t0, 52
  mulq t0, a0, t0, 8
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; foes2.e16.ts:57  const slot = fP[k] >> 8
  slli t0, s1, 1
  lw t0, fP(t0)
  srli s2, t0, 8
  ; foes2.e16.ts:58  if ((t & 1) === 0) {
  andi t0, s0, 1
  bne t0, zero, .L1
  ; foes2.e16.ts:59  const at = (trailAt[slot] + 1) & 31
  slli t0, s2, 1
  lw t0, trailAt(t0)
  addi t0, t0, 1
  andi s3, t0, 31
  ; foes2.e16.ts:60  trailAt[slot] = at
  slli t0, s2, 1
  sw s3, trailAt(t0)
  ; foes2.e16.ts:61  trail[slot * 64 + at * 2] = fX[k]
  slli t0, s2, 6
  slli t1, s3, 1
  add t0, t0, t1
  slli t0, t0, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  sw t1, trail(t0)
  ; foes2.e16.ts:62  trail[slot * 64 + at * 2 + 1] = fY[k]
  slli t0, s2, 6
  slli t1, s3, 1
  add t0, t0, t1
  addi t0, t0, 1
  slli t0, t0, 1
  slli t1, s1, 1
  lw t1, fY(t1)
  sw t1, trail(t0)
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; foes2.e16.ts:70 segmentMove(k, t) at -O1
;   k in s1
;   t in 2(fp)
;   slot in s2
;   index in s3
;   at in 0(fp)
segmentMove:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 2(fp) ; t
  ; foes2.e16.ts:71  const slot = (fP[k] >> 8) & 1
  slli t0, s1, 1
  lw t0, fP(t0)
  srli t0, t0, 8
  andi s2, t0, 1
  ; foes2.e16.ts:72  const index = fP[k] & 15
  slli t0, s1, 1
  lw t0, fP(t0)
  andi s3, t0, 15
  ; foes2.e16.ts:73  fVX[k] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; foes2.e16.ts:74  fVY[k] = 0
  slli t0, s1, 1
  sw zero, fVY(t0)
  ; foes2.e16.ts:75  if ((fP[k] & 0x80) !== 0) {
  slli t0, s1, 1
  lw t0, fP(t0)
  andi t0, t0, 128
  beq t0, zero, .L1
  ; foes2.e16.ts:77  if (t > index * 5) foeHurt(k, 999)
  slli t1, s3, 2
  add t0, t1, s3
  lw t1, 2(fp) ; t
  bgeu t0, t1, .L2
  ; foes2.e16.ts:77  foeHurt(k, 999)
  mv a0, s1
  li a1, 999
  call foeHurt
.L2:
  ; foes2.e16.ts:78  return
  j .return
.L1:
  ; foes2.e16.ts:80  if ((fP[k] & 0x40) !== 0) {
  slli t0, s1, 1
  lw t0, fP(t0)
  andi t0, t0, 64
  beq t0, zero, .L3
  ; foes2.e16.ts:81  fVY[k] = 32
  slli t0, s1, 1
  li t1, 32
  sw t1, fVY(t0)
  ; foes2.e16.ts:82  return
  j .return
.L3:
  ; foes2.e16.ts:84  const at = (trailAt[slot] + 32 - index * SPACING) & 31
  slli t0, s2, 1
  lw t0, trailAt(t0)
  slli t2, s3, 1
  add t1, t2, s3
  addi t0, t0, 32
  sub t0, t0, t1
  andi t0, t0, 31
  sw t0, 0(fp) ; at
  ; foes2.e16.ts:85  fX[k] = trail[slot * 64 + at * 2]
  slli t0, s1, 1
  slli t1, s2, 6
  lw t2, 0(fp) ; at
  slli t2, t2, 1
  add t1, t1, t2
  slli t1, t1, 1
  lw t1, trail(t1)
  sw t1, fX(t0)
  ; foes2.e16.ts:86  fY[k] = trail[slot * 64 + at * 2 + 1]
  slli t0, s1, 1
  slli t1, s2, 6
  lw t2, 0(fp) ; at
  slli t2, t2, 1
  add t1, t1, t2
  addi t1, t1, 1
  slli t1, t1, 1
  lw t1, trail(t1)
  sw t1, fY(t0)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes2.e16.ts:90 serpentRoom() at -O1
serpentRoom:
  ; foes2.e16.ts:91  return serpentHead[0] === 0 || serpentHead[1] === 0
  lw t0, serpentHead(zero)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  bnez t1, .L1
  lw t0, serpentHead+2(zero)
  sub t0, t0, zero
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; foes2.e16.ts:95 serpentBorn(k) at -O1
;   k in s1
;   slot in s2
;   s in s3
;   i in 0(fp)
;   seg in 2(fp)
serpentBorn:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  ; foes2.e16.ts:96  const slot: u16 = serpentHead[0] === 0 ? 0 : 1
  lw t0, serpentHead(zero)
  bne t0, zero, .L1
  li t0, 0
  j .L2
.L1:
  li t0, 1
.L2:
  mv s2, t0 ; slot
  ; foes2.e16.ts:97  serpentHead[slot] = k + 1
  slli t0, s2, 1
  addi t1, s1, 1
  sw t1, serpentHead(t0)
  ; foes2.e16.ts:98  fP[k] = slot << 8
  slli t0, s1, 1
  slli t1, s2, 8
  sw t1, fP(t0)
  ; foes2.e16.ts:99  let s: u16 = 0
  li s3, 0 ; s
  ; foes2.e16.ts:100  while (s < 32) {
  j .L5
.L3:
  ; foes2.e16.ts:101  trail[slot * 64 + s * 2] = fX[k]
  slli t0, s2, 6
  slli t1, s3, 1
  add t0, t0, t1
  slli t0, t0, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  sw t1, trail(t0)
  ; foes2.e16.ts:102  trail[slot * 64 + s * 2 + 1] = fY[k]
  slli t0, s2, 6
  slli t1, s3, 1
  add t0, t0, t1
  addi t0, t0, 1
  slli t0, t0, 1
  slli t1, s1, 1
  lw t1, fY(t1)
  sw t1, trail(t0)
  ; foes2.e16.ts:103  s++
  addi s3, s3, 1
.L5:
  li t0, 32
  bltu s3, t0, .L3
  ; foes2.e16.ts:105  trailAt[slot] = 0
  slli t0, s2, 1
  sw zero, trailAt(t0)
  ; foes2.e16.ts:106  let i: u16 = 1
  li t0, 1
  sw t0, 0(fp) ; i
  ; foes2.e16.ts:107  while (i <= SEGMENTS) {
  j .L9
.L7:
  ; foes2.e16.ts:108  const seg = foe(K_SEGMENT, i16(fX[k]) >> 4, i16(fY[k]) >> 4, 0)
  slli t0, s1, 1
  lw t0, fX(t0)
  srai t0, t0, 4
  slli t1, s1, 1
  lw t1, fY(t1)
  srai t1, t1, 4
  li a0, 11
  mv a1, t0
  mv a2, t1
  li a3, 0
  call foe
  sw a0, 2(fp) ; seg
  ; foes2.e16.ts:109  if (seg !== 0xffff) fP[seg] = (slot << 8) | i
  li t0, 65535
  lw t1, 2(fp) ; seg
  beq t1, t0, .L11
  ; foes2.e16.ts:109  fP[seg] = (slot << 8) | i
  lw t0, 2(fp) ; seg
  slli t0, t0, 1
  slli t1, s2, 8
  lw t2, 0(fp) ; i
  or t1, t1, t2
  sw t1, fP(t0)
.L11:
  ; foes2.e16.ts:110  i++
  lw t0, 0(fp) ; i
  addi t0, t0, 1
  sw t0, 0(fp) ; i
.L9:
  li t0, 6
  lw t1, 0(fp) ; i
  bgeu t0, t1, .L7
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes2.e16.ts:115 newFoeDies(k, kind, x, y) at -O1
;   k in 2(fp)
;   kind in s3
;   x in s1
;   y in 0(fp)
;   s in s2
newFoeDies:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 2(fp) ; k
  mv s3, a1 ; kind
  mv s1, a2 ; x
  sw a3, 0(fp) ; y
  ; foes2.e16.ts:116  if (kind === K_SPINNER) {
  li t0, 12
  bne s3, t0, .L1
  ; foes2.e16.ts:118  ring(x, y, u16(x >> 4) & 255, ringOf(8 + (rank >> 2), 20, BK_PINK))
  srai t0, s1, 4
  andi t0, t0, 255
  lw t1, 0x172a(zero)
  srli t1, t1, 2
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, t1, 8
  li a1, 20
  li a2, 0
  call ringOf
  lw t0, 0(sp)
  addi sp, sp, 2
  lw a1, 0(fp)
  mv a2, t0
  mv a3, a0
  mv a0, s1
  call ring
  j .L2
.L1:
  ; foes2.e16.ts:119  if (kind === K_SERPENT) {
  li t0, 10
  bne s3, t0, .L3
  ; foes2.e16.ts:120  serpentDown(fP[k] >> 8)
  lw t0, 2(fp) ; k
  slli t0, t0, 1
  lw t0, fP(t0)
  srli a0, t0, 8
  call serpentDown
  ; foes2.e16.ts:121  shake(14)
  li a0, 14
  call shake
  ; foes2.e16.ts:122  let s: u16 = 0
  li s2, 0 ; s
  ; foes2.e16.ts:123  while (s < 4) {
  j .L6
.L4:
  ; foes2.e16.ts:124  item(IT_STAR, x, y)
  li a0, 1
  mv a1, s1
  lw a2, 0(fp)
  call item
  ; foes2.e16.ts:125  s++
  addi s2, s2, 1
.L6:
  li t0, 4
  bltu s2, t0, .L4
.L3:
.L2:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes2.e16.ts:131 serpentDown(slot) at -O1
;   slot in s1
serpentDown:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; slot
  ; foes2.e16.ts:132  segmentsLet(slot, 0x80)
  mv a0, s1
  li a1, 128
  call segmentsLet
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; foes2.e16.ts:136 serpentGone(slot) at -O1
;   slot in s1
serpentGone:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; slot
  ; foes2.e16.ts:137  segmentsLet(slot, 0x40)
  mv a0, s1
  li a1, 64
  call segmentsLet
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; foes2.e16.ts:141 segmentsLet(slot, how) at -O1
;   slot in a0
;   how in a1
;   k in a2
segmentsLet:
  ; foes2.e16.ts:142  serpentHead[slot] = 0
  slli t0, a0, 1
  sw zero, serpentHead(t0)
  ; foes2.e16.ts:143  let k: u16 = 0
  li a2, 0 ; k
  ; foes2.e16.ts:144  while (k < 24) {
  j .L3
.L1:
  ; foes2.e16.ts:145  if (fK[k] === K_SEGMENT && fP[k] >> 8 === slot) {
  slli t0, a2, 1
  lw t0, fK(t0)
  li t1, 11
  bne t0, t1, .L5
  slli t0, a2, 1
  lw t0, fP(t0)
  srli t0, t0, 8
  bne t0, a0, .L5
  ; foes2.e16.ts:146  fP[k] = fP[k] | how
  slli t0, a2, 1
  slli t1, a2, 1
  lw t1, fP(t1)
  or t1, t1, a1
  sw t1, fP(t0)
  ; foes2.e16.ts:147  fT[k] = 0
  slli t0, a2, 1
  sw zero, fT(t0)
.L5:
  ; foes2.e16.ts:149  k++
  addi a2, a2, 1
.L3:
  li t0, 24
  bltu a2, t0, .L1
.return:
  ret

; foes2.e16.ts:156 moteMove(k, t) at -O1
;   k in s1
;   t in s2
;   p in s3
;   dir in 0(fp)
;   sp in 2(fp)
moteMove:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  mv s2, a1 ; t
  ; foes2.e16.ts:157  const p = fP[k]
  slli t0, s1, 1
  lw s3, fP(t0)
  ; foes2.e16.ts:158  if (p === 0) {
  bne s3, zero, .L1
  ; foes2.e16.ts:159  fVY[k] = 22
  slli t0, s1, 1
  li t1, 22
  sw t1, fVY(t0)
  ; foes2.e16.ts:160  fVX[k] = u16((t & 32) !== 0 ? 10 : -10)
  slli t0, s1, 1
  andi t1, s2, 32
  addi t0, t0, fVX
  li t2, 0
  beq t1, t2, .L2
  li t1, 10
  j .L3
.L2:
  li t1, 65526
.L3:
  sw t1, 0(t0)
  j .L4
.L1:
  ; foes2.e16.ts:162  const dir: i16 = p === 1 ? 1 : -1
  li t0, 1
  bne s3, t0, .L5
  li t0, 1
  j .L6
.L5:
  li t0, 65535
.L6:
  sw t0, 0(fp) ; dir
  ; foes2.e16.ts:163  const sp: i16 = t < 60 ? 36 : 20
  li t0, 60
  bgeu s2, t0, .L7
  li t0, 36
  j .L8
.L7:
  li t0, 20
.L8:
  sw t0, 2(fp) ; sp
  ; foes2.e16.ts:164  fVX[k] = u16(dir * sp)
  slli t0, s1, 1
  lw t1, 2(fp) ; sp
  lw t2, 0(fp) ; dir
  mul t2, t2, t1
  sw t2, fVX(t0)
  ; foes2.e16.ts:165  fVY[k] = u16(t < 30 ? 6 : 24)
  slli t0, s1, 1
  addi t0, t0, fVY
  mv t1, s2
  li t2, 30
  bgeu t1, t2, .L9
  li t1, 6
  j .L10
.L9:
  li t1, 24
.L10:
  sw t1, 0(t0)
.L4:
  ; foes2.e16.ts:167  if (t === 50 + (k & 15) && randBelow(16) < 4 + rank) shootAimed(k, BK_PINK, 36)
  andi t0, s1, 15
  addi t0, t0, 50
  bne s2, t0, .L11
  li a0, 16
  call randBelow
  lw t0, 0x172a(zero)
  addi t0, t0, 4
  bgeu a0, t0, .L11
  ; foes2.e16.ts:167  shootAimed(k, BK_PINK, 36)
  mv a0, s1
  li a1, 0
  li a2, 36
  call shootAimed
.L11:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes2.e16.ts:171 dartMove(k, t) at -O1
;   k in s1
;   t in s2
;   away in s3
;   chase.k in s0
dartMove:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; k
  mv s2, a1 ; t
  ; foes2.e16.ts:172  if (t < 40) {
  li t0, 40
  bgeu s2, t0, .L1
  ; foes2.e16.ts:173  fVY[k] = 48
  slli t0, s1, 1
  li t1, 48
  sw t1, fVY(t0)
  ; foes2.e16.ts:174  fVX[k] = u16(chase(k))
  slli t0, s1, 1
  mv s0, s1 ; chase.k
  ; foes2.e16.ts:225  return (targetX - i16(fX[k])) >> 5
  lw t1, 0x1440(zero)
  slli t2, s0, 1
  lw t2, fX(t2)
  sub t1, t1, t2
  srai t1, t1, 5
  sw t1, fVX(t0)
  j .L2
.L1:
  ; foes2.e16.ts:176  const away: i16 = i16(fX[k]) < targetX ? -40 : 40
  slli t0, s1, 1
  lw t0, fX(t0)
  lw t1, 0x1440(zero)
  bge t0, t1, .L3
  li t0, 65496
  j .L4
.L3:
  li t0, 40
.L4:
  mv s3, t0 ; away
  ; foes2.e16.ts:177  fVX[k] = u16(away)
  slli t0, s1, 1
  sw s3, fVX(t0)
  ; foes2.e16.ts:178  fVY[k] = 56
  slli t0, s1, 1
  li t1, 56
  sw t1, fVY(t0)
  ; foes2.e16.ts:179  if (t === 40) shootAimed(k, BK_NEEDLE, 48)
  li t0, 40
  bne s2, t0, .L5
  ; foes2.e16.ts:179  shootAimed(k, BK_NEEDLE, 48)
  mv a0, s1
  li a1, 3
  li a2, 48
  call shootAimed
.L5:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; foes2.e16.ts:184 pikeMove(k, t) at -O1
;   k in s1
;   t in s2
;   stop in s3
;   y in s0
pikeMove:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; k
  mv s2, a1 ; t
  ; foes2.e16.ts:185  const stop = 60 + fP[k]
  slli t0, s1, 1
  lw t0, fP(t0)
  addi s3, t0, 60
  ; foes2.e16.ts:186  if (t < 200) {
  li t0, 200
  bgeu s2, t0, .L1
  ; foes2.e16.ts:187  const y = i16(fY[k]) >> 4
  slli t0, s1, 1
  lw t0, fY(t0)
  srai s0, t0, 4
  ; foes2.e16.ts:188  fVY[k] = y < i16(stop) ? 24 : 0
  slli t0, s1, 1
  addi t0, t0, fVY
  mv t1, s0
  mv t2, s3
  bge t1, t2, .L2
  li t1, 24
  j .L3
.L2:
  li t1, 0
.L3:
  sw t1, 0(t0)
  ; foes2.e16.ts:189  if (y >= i16(stop) && t % 50 === 0) {
  blt s0, s3, .L5
  li t0, 50
  remu t0, s2, t0
  bne t0, zero, .L5
  ; foes2.e16.ts:190  fan(
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fY(t1)
  slli t2, s1, 1
  lw t2, fX(t2)
  slli t3, s1, 1
  lw t3, fY(t3)
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  mv a0, t2
  mv a1, t3
  call aimed
  lw t0, 0x172a(zero)
  srli t0, t0, 2
  addi sp, sp, -2
  sw a0, 0(sp)
  addi a0, t0, 3
  li a1, 10
  li a2, 32
  li a3, 1
  call fanOf
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a1, t1
  mv a2, t0
  mv a3, a0
  mv a0, t2
  call fan
  j .L5
.L1:
  ; foes2.e16.ts:197  fVY[k] = u16(-24)
  slli t0, s1, 1
  li t1, 65512
  sw t1, fVY(t0)
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; foes2.e16.ts:201 halberdMove(k, t) at -O1
;   k in s1
;   t in s2
;   y in s3
;   a in s0
halberdMove:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; k
  mv s2, a1 ; t
  ; foes2.e16.ts:202  const y = i16(fY[k]) >> 4
  slli t0, s1, 1
  lw t0, fY(t0)
  srai s3, t0, 4
  ; foes2.e16.ts:203  fVY[k] = t > 640 ? u16(-16) : y < 70 ? 20 : 0
  slli t0, s1, 1
  addi t0, t0, fVY
  mv t1, s2
  li t2, 640
  bgeu t2, t1, .L1
  li t1, 65520
  j .L2
.L1:
  mv t1, s3
  li t2, 70
  bge t1, t2, .L3
  li t1, 20
  j .L4
.L3:
  li t1, 0
.L4:
.L2:
  sw t1, 0(t0)
  ; foes2.e16.ts:204  fVX[k] = u16((t & 128) !== 0 ? 8 : -8)
  slli t0, s1, 1
  andi t1, s2, 128
  addi t0, t0, fVX
  li t2, 0
  beq t1, t2, .L5
  li t1, 8
  j .L6
.L5:
  li t1, 65528
.L6:
  sw t1, 0(t0)
  ; foes2.e16.ts:205  if (y < 60 || t > 640) return
  li t0, 60
  blt s3, t0, .L8
  li t0, 640
  bgeu t0, s2, .L7
.L8:
  ; foes2.e16.ts:205  return
  j .return
.L7:
  ; foes2.e16.ts:206  if (t % 60 === 0) fan(i16(fX[k]), i16(fY[k]) + 160, 64, fanOf(5 + (rank >> 2), 12, 36, BK_PINK))
  li t0, 60
  remu t0, s2, t0
  bne t0, zero, .L9
  ; foes2.e16.ts:206  fan(i16(fX[k]), i16(fY[k]) + 160, 64, fanOf(5 + (rank >> 2), 12, 36, BK_PINK))
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fY(t1)
  lw t2, 0x172a(zero)
  srli t2, t2, 2
  addi sp, sp, -2
  sw t0, 0(sp)
  addi t1, t1, 160
  addi sp, sp, -2
  sw t1, 0(sp)
  addi a0, t2, 5
  li a1, 12
  li a2, 36
  li a3, 0
  call fanOf
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  li a2, 64
  mv a3, a0
  mv a0, t1
  call fan
.L9:
  ; foes2.e16.ts:207  if (t % 60 === 30) {
  li t0, 60
  remu t0, s2, t0
  li t1, 30
  bne t0, t1, .L10
  ; foes2.e16.ts:208  const a = aimed(i16(fX[k]), i16(fY[k]))
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fY(t1)
  mv a0, t0
  mv a1, t1
  call aimed
  mv s0, a0 ; a
  ; foes2.e16.ts:209  bullet(i16(fX[k]) - 128, i16(fY[k]) + 160, a, sk(52, BK_AMBER))
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fY(t1)
  addi a0, t0, -128
  addi a1, t1, 160
  mv a2, s0
  li a3, 564
  call bullet
  ; foes2.e16.ts:210  bullet(i16(fX[k]) + 128, i16(fY[k]) + 160, a, sk(52, BK_AMBER))
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fY(t1)
  addi a0, t0, 128
  addi a1, t1, 160
  mv a2, s0
  li a3, 564
  call bullet
.L10:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; foes2.e16.ts:215 wardenMove(k, t) at -O1
;   k in s1
;   t in s2
;   y in s3
wardenMove:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  mv s2, a1 ; t
  ; foes2.e16.ts:216  const y = i16(fY[k]) >> 4
  slli t0, s1, 1
  lw t0, fY(t0)
  srai s3, t0, 4
  ; foes2.e16.ts:217  fVY[k] = t > 760 ? u16(-12) : y < 50 ? 16 : 0
  slli t0, s1, 1
  addi t0, t0, fVY
  mv t1, s2
  li t2, 760
  bgeu t2, t1, .L1
  li t1, 65524
  j .L2
.L1:
  mv t1, s3
  li t2, 50
  bge t1, t2, .L3
  li t1, 16
  j .L4
.L3:
  li t1, 0
.L4:
.L2:
  sw t1, 0(t0)
  ; foes2.e16.ts:218  if (y < 40 || t > 760) return
  li t0, 40
  blt s3, t0, .L6
  li t0, 760
  bgeu t0, s2, .L5
.L6:
  ; foes2.e16.ts:218  return
  j .return
.L5:
  ; foes2.e16.ts:219  if (t % 90 === 0) ring(i16(fX[k]), i16(fY[k]), t & 255, ringOf(12 + rank, 24, BK_ORB))
  li t0, 90
  remu t0, s2, t0
  bne t0, zero, .L7
  ; foes2.e16.ts:219  ring(i16(fX[k]), i16(fY[k]), t & 255, ringOf(12 + rank, 24, BK_ORB))
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fY(t1)
  andi t2, s2, 255
  lw t3, 0x172a(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  addi sp, sp, -2
  sw t2, 0(sp)
  addi a0, t3, 12
  li a1, 24
  li a2, 4
  call ringOf
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a1, t1
  mv a2, t0
  mv a3, a0
  mv a0, t2
  call ring
.L7:
  ; foes2.e16.ts:220  if (t % 80 === 40) foe(K_MOTE, i16(fX[k] >> 4), i16(fY[k] >> 4) + 8, 0)
  li t0, 80
  remu t0, s2, t0
  li t1, 40
  bne t0, t1, .L8
  ; foes2.e16.ts:220  foe(K_MOTE, i16(fX[k] >> 4), i16(fY[k] >> 4) + 8, 0)
  slli t0, s1, 1
  lw t0, fX(t0)
  srli t0, t0, 4
  slli t1, s1, 1
  lw t1, fY(t1)
  srli t1, t1, 4
  li a0, 1
  mv a1, t0
  addi a2, t1, 8
  li a3, 0
  call foe
.L8:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; foes2.e16.ts:232 foeCharging(kind, t) at -O1
;   kind in a0
;   t in a1
foeCharging:
  ; foes2.e16.ts:233  if (kind === K_HALBERD) return t % 60 >= 46 && t < 640
  li t0, 4
  bne a0, t0, .L1
  ; foes2.e16.ts:233  return t % 60 >= 46 && t < 640
  li t0, 60
  remu t0, a1, t0
  li t1, 46
  sltu t0, t0, t1
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L2
  sltiu t0, a1, 640
.L2:
  mv a0, t0
  ret
.L1:
  ; foes2.e16.ts:234  if (kind === K_WARDEN) return t % 90 >= 70 && t < 760
  li t0, 5
  bne a0, t0, .L3
  ; foes2.e16.ts:234  return t % 90 >= 70 && t < 760
  li t0, 90
  remu t0, a1, t0
  li t1, 70
  sltu t0, t0, t1
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L4
  sltiu t0, a1, 760
.L4:
  mv a0, t0
  ret
.L3:
  ; foes2.e16.ts:235  return t % 80 >= 26 && t % 80 < 40 && t < 600
  li t0, 80
  remu t0, a1, t0
  li t1, 26
  sltu t0, t0, t1
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L6
  li t0, 80
  remu t0, a1, t0
  sltiu t0, t0, 40
.L6:
  mv t1, t0
  beqz t1, .L5
  sltiu t0, a1, 600
.L5:
  mv a0, t0
.return:
  ret

; foes2.e16.ts:239 shootAimed(k, kind, speed) at -O1
;   k in s1
;   kind in 0(fp)
;   speed in 2(fp)
;   x in s2
;   y in s3
shootAimed:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 0(fp) ; kind
  sw a2, 2(fp) ; speed
  ; foes2.e16.ts:240  const x = i16(fX[k])
  slli t0, s1, 1
  lw s2, fX(t0)
  ; foes2.e16.ts:241  const y = i16(fY[k])
  slli t0, s1, 1
  lw s3, fY(t0)
  ; foes2.e16.ts:242  bullet(x, y, aimed(x, y), sk(speed + rank * 2, kind))
  mv a0, s2
  mv a1, s3
  call aimed
  lw t0, 0x172a(zero)
  slli t0, t0, 1
  lw t1, 2(fp) ; speed
  add t1, t1, t0
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t1
  lw a1, 0(fp)
  call sk
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, s3
  mv a2, t0
  mv a3, a0
  mv a0, s2
  call bullet
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes2.e16.ts:246 newFoeDraw(k, x, y, t) at -O1
;   k in 2(fp)
;   x in s1
;   y in s2
;   t in s3
;   kind in 0(fp)
newFoeDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 2(fp) ; k
  mv s1, a1 ; x
  mv s2, a2 ; y
  mv s3, a3 ; t
  ; foes2.e16.ts:247  const kind = fK[k]
  lw t0, 2(fp) ; k
  slli t0, t0, 1
  lw t0, fK(t0)
  sw t0, 0(fp) ; kind
  ; foes2.e16.ts:248  if (kind === K_PRISM) spr(x, y, (PRISM_TILE + ((t >> 3) & 3) * 4) | foePal, S16)
  li t0, 9
  lw t1, 0(fp) ; kind
  bne t1, t0, .L1
  ; foes2.e16.ts:248  spr(x, y, (PRISM_TILE + ((t >> 3) & 3) * 4) | foePal, S16)
  srli t0, s3, 3
  andi t0, t0, 3
  slli t0, t0, 2
  lw t1, 0x172c(zero)
  addi t0, t0, 510
  or t0, t0, t1
  mv a0, s1
  mv a1, s2
  mv a2, t0
  li a3, 1
  call spr
  j .L2
.L1:
  ; foes2.e16.ts:249  if (kind === K_SPINNER) spr(x, y, (SPINNER_TILE + ((t >> 1) & 3) * 4) | foePal, S16)
  li t0, 12
  lw t1, 0(fp) ; kind
  bne t1, t0, .L3
  ; foes2.e16.ts:249  spr(x, y, (SPINNER_TILE + ((t >> 1) & 3) * 4) | foePal, S16)
  srli t0, s3, 1
  andi t0, t0, 3
  slli t0, t0, 2
  lw t1, 0x172c(zero)
  addi t0, t0, 538
  or t0, t0, t1
  mv a0, s1
  mv a1, s2
  mv a2, t0
  li a3, 1
  call spr
  j .L4
.L3:
  ; foes2.e16.ts:250  if (kind === K_SERPENT) spr(x, y, (SERPENT_TILE + ((t >> 4) & 1) * 4) | foePal, S16)
  li t0, 10
  lw t1, 0(fp) ; kind
  bne t1, t0, .L5
  ; foes2.e16.ts:250  spr(x, y, (SERPENT_TILE + ((t >> 4) & 1) * 4) | foePal, S16)
  srli t0, s3, 4
  andi t0, t0, 1
  slli t0, t0, 2
  lw t1, 0x172c(zero)
  addi t0, t0, 526
  or t0, t0, t1
  mv a0, s1
  mv a1, s2
  mv a2, t0
  li a3, 1
  call spr
  j .L6
.L5:
  ; foes2.e16.ts:251  spr(x, y, (SERPENT_TILE + 8) | foePal, S16)
  lw t0, 0x172c(zero)
  li t1, 534
  or t1, t1, t0
  mv a0, s1
  mv a1, s2
  mv a2, t1
  li a3, 1
  call spr
.L6:
.L4:
.L2:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; foes2.e16.ts:255 serpentsClear() at -O1
serpentsClear:
  ; foes2.e16.ts:256  serpentHead[0] = 0
  sw zero, serpentHead(zero)
  ; foes2.e16.ts:257  serpentHead[1] = 0
  sw zero, serpentHead+2(zero)
.return:
  ret

  .align 2

  .bank 4
  .org 0xc000
; title.e16.ts:130 spritesIn() at -O1
spritesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; title.e16.ts:131  load(SHIP_BANK, SHIP_AT, SHIP_TILE * 32, SHIP_BYTES)
  li a0, 261
  li a1, 50306
  li a2, 0
  li a3, 640
  call load
  ; title.e16.ts:132  load(FLAME_BANK, FLAME_AT, FLAME_TILE * 32, FLAME_BYTES)
  li a0, 261
  li a1, 50946
  li a2, 640
  li a3, 384
  call load
  ; title.e16.ts:133  load(SHOT_BANK, SHOT_AT, SHOT_TILE * 32, SHOT_BYTES)
  li a0, 261
  li a1, 51330
  li a2, 1024
  li a3, 96
  call load
  ; title.e16.ts:134  load(LANCE_BANK, LANCE_AT, LANCE_TILE * 32, LANCE_BYTES)
  li a0, 261
  li a1, 51426
  li a2, 1120
  li a3, 512
  call load
  ; title.e16.ts:135  load(LANCE_ENDS_BANK, LANCE_ENDS_AT, LANCE_ENDS_TILE * 32, LANCE_ENDS_BYTES)
  li a0, 261
  li a1, 51938
  li a2, 1632
  li a3, 512
  call load
  ; title.e16.ts:136  load(MOTE_BANK, MOTE_AT, MOTE_TILE * 32, MOTE_BYTES)
  li a0, 261
  li a1, 52450
  li a2, 2144
  li a3, 512
  call load
  ; title.e16.ts:137  load(DART_BANK, DART_AT, DART_TILE * 32, DART_BYTES)
  li a0, 261
  li a1, 52962
  li a2, 2656
  li a3, 256
  call load
  ; title.e16.ts:138  load(PIKE_BANK, PIKE_AT, PIKE_TILE * 32, PIKE_BYTES)
  li a0, 261
  li a1, 53218
  li a2, 2912
  li a3, 256
  call load
  ; title.e16.ts:139  load(ROCK_BIG_BANK, ROCK_BIG_AT, ROCK_BIG_TILE * 32, ROCK_BIG_BYTES)
  li a0, 261
  li a1, 53474
  li a2, 3168
  li a3, 1024
  call load
  ; title.e16.ts:140  load(ROCK_SMALL_BANK, ROCK_SMALL_AT, ROCK_SMALL_TILE * 32, ROCK_SMALL_BYTES)
  li a0, 261
  li a1, 54498
  li a2, 4192
  li a3, 256
  call load
  ; title.e16.ts:141  load(HALBERD_BANK, HALBERD_AT, HALBERD_TILE * 32, HALBERD_BYTES)
  li a0, 261
  li a1, 54754
  li a2, 4448
  li a3, 1024
  call load
  ; title.e16.ts:142  load(WARDEN_BANK, WARDEN_AT, WARDEN_TILE * 32, WARDEN_BYTES)
  li a0, 261
  li a1, 55778
  li a2, 5472
  li a3, 1024
  call load
  ; title.e16.ts:143  load(BULLETS_BANK, BULLETS_AT, BULLETS_TILE * 32, BULLETS_BYTES)
  li a0, 261
  li a1, 56802
  li a2, 6496
  li a3, 352
  call load
  ; title.e16.ts:144  load(ORBS_BANK, ORBS_AT, ORBS_TILE * 32, ORBS_BYTES)
  li a0, 262
  li a1, 49152
  li a2, 6848
  li a3, 512
  call load
  ; title.e16.ts:145  load(BLAST_SMALL_BANK, BLAST_SMALL_AT, BLAST_SMALL_TILE * 32, BLAST_SMALL_BYTES)
  li a0, 262
  li a1, 49664
  li a2, 7360
  li a3, 768
  call load
  ; title.e16.ts:146  load(BLAST_BIG_BANK, BLAST_BIG_AT, BLAST_BIG_TILE * 32, BLAST_BIG_BYTES)
  li a0, 262
  li a1, 50432
  li a2, 8128
  li a3, 4096
  call load
  ; title.e16.ts:147  load(BITS_BANK, BITS_AT, BITS_TILE * 32, BITS_BYTES)
  li a0, 262
  li a1, 54528
  li a2, 12224
  li a3, 192
  call load
  ; title.e16.ts:148  load(STARS_BANK, STARS_AT, STARS_TILE * 32, STARS_BYTES)
  li a0, 262
  li a1, 54720
  li a2, 12416
  li a3, 192
  call load
  ; title.e16.ts:149  load(RING_BANK, RING_AT, RING_TILE * 32, RING_BYTES)
  li a0, 262
  li a1, 54912
  li a2, 12608
  li a3, 512
  call load
  ; title.e16.ts:150  load(FAR_STARS_BANK, FAR_STARS_AT, FAR_STARS_TILE * 32, FAR_STARS_BYTES)
  li a0, 262
  li a1, 55424
  li a2, 13120
  li a3, 96
  call load
  ; title.e16.ts:151  load(PICKUPS_BANK, PICKUPS_AT, PICKUPS_TILE * 32, PICKUPS_BYTES)
  li a0, 262
  li a1, 55520
  li a2, 13216
  li a3, 768
  call load
  ; title.e16.ts:152  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
  li a0, 263
  li a1, 49152
  li a2, 13984
  li a3, 2048
  call load
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; title.e16.ts:156 title() at -O1
;   t in s1
;   shown in s2
title:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; title.e16.ts:157  mapsClear()
  call mapsClear
  ; title.e16.ts:158  stageStart()
  call stageStart
  ; title.e16.ts:159  stageSpeed(4)
  li a0, 4
  call stageSpeed
  ; title.e16.ts:160  logoIn()
  call logoIn
  ; title.e16.ts:161  music(M_TITLE)
  li a0, 1
  call music
  ; title.e16.ts:162  levelShow()
  call levelShow
  ; title.e16.ts:163  say(10, 34, str('(C) ELECXZY PROJECT'), SL_TEXT)
  li a0, 10
  li a1, 34
  la a2, str_32
  li a3, 5
  call say
  ; title.e16.ts:164  let t: u16 = 0
  li s1, 0 ; t
  ; title.e16.ts:165  let shown: u16 = 0
  li s2, 0 ; shown
  ; title.e16.ts:166  for (;;) {
.L1:
  ; title.e16.ts:167  frameBegin()
  call frameBegin
  ; title.e16.ts:168  shakeStep()
  call shakeStep
  ; title.e16.ts:169  stageStep()
  call stageStep
  ; title.e16.ts:170  farStarsStep(1, frame)
  lw t0, 0x1908(zero)
  li a0, 1
  mv a1, t0
  call farStarsStep
  ; title.e16.ts:171  logoStep(t)
  mv a0, s1
  call logoStep
  ; title.e16.ts:172  if ((t & 32) === 0) say(14, 17, str('PRESS START'), SL_GOLD)
  andi t0, s1, 32
  bne t0, zero, .L5
  ; title.e16.ts:172  say(14, 17, str('PRESS START'), SL_GOLD)
  li a0, 14
  li a1, 17
  la a2, str_33
  li a3, 6
  call say
  j .L6
.L5:
  ; title.e16.ts:173  unsay(14, 17, 11)
  li a0, 14
  li a1, 17
  li a2, 11
  call unsay
.L6:
  ; title.e16.ts:176  if (t === shown) {
  bne s1, s2, .L7
  ; title.e16.ts:177  pageShow((div(t, PAGE) & 1) !== 0)
  li t0, 300
  divu t0, s1, t0
  andi t0, t0, 1
  sub t0, t0, zero
  snez a0, t0
  call pageShow
  ; title.e16.ts:178  shown = shown + PAGE
  addi s2, s2, 300
.L7:
  ; title.e16.ts:180  if (pressed(B_LEFT) && level > LV_EASY) levelPick(level - 1)
  li a0, 4
  call pressed
  beqz a0, .L8
  lw t0, 0x173e(zero)
  bgeu zero, t0, .L8
  ; title.e16.ts:180  levelPick(level - 1)
  lw t0, 0x173e(zero)
  addi a0, t0, -1
  call levelPick
.L8:
  ; title.e16.ts:181  if (pressed(B_RIGHT) && level < LV_HARD) levelPick(level + 1)
  li a0, 8
  call pressed
  beqz a0, .L9
  lw t0, 0x173e(zero)
  li t1, 2
  bgeu t0, t1, .L9
  ; title.e16.ts:181  levelPick(level + 1)
  lw t0, 0x173e(zero)
  addi a0, t0, 1
  call levelPick
.L9:
  ; title.e16.ts:182  if (t > 40 && pressed(B_START | B_A)) break
  li t0, 40
  bgeu t0, s1, .L10
  li a0, 1040
  call pressed
  beqz a0, .L10
  ; title.e16.ts:182  break
  j .L4
.L10:
  ; title.e16.ts:183  t++
  addi s1, s1, 1
  j .L1
.L4:
  ; title.e16.ts:185  levelKeep()
  la t0, levelKeep
  li t1, 258
  call far_call
  ; title.e16.ts:186  randSeed(frame ^ peek16(RT_FRAME))
  lw t0, 0x1908(zero)
  lw t1, 514(zero)
  xor a0, t0, t1
  call randSeed
  ; title.e16.ts:187  sfxSelect()
  call sfxSelect
  ; title.e16.ts:188  palettesIn()
  call palettesIn
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; title.e16.ts:195 pageShow(help) at -O1
;   help in s2
;   y in s1
pageShow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; help
  ; title.e16.ts:196  let y: u16 = 20
  li s1, 20 ; y
  ; title.e16.ts:197  while (y < 32) {
  j .L3
.L1:
  ; title.e16.ts:198  unsay(0, y, 40)
  li a0, 0
  mv a1, s1
  li a2, 40
  call unsay
  ; title.e16.ts:199  y++
  addi s1, s1, 1
.L3:
  li t0, 32
  bltu s1, t0, .L1
  ; title.e16.ts:201  if (help) helpShow()
  beqz s2, .L5
  ; title.e16.ts:201  helpShow()
  call helpShow
  j .L6
.L5:
  ; title.e16.ts:202  tableShow(22)
  li a0, 22
  la t0, tableShow
  li t1, 258
  call far_call
.L6:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; title.e16.ts:206 logoStep(t) at -O1
;   t in s1
logoStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; title.e16.ts:207  if (t < 48) {
  li t0, 48
  bgeu s1, t0, .L1
  ; title.e16.ts:208  poke16(BG1Y, (48 - t) * 2)
  li t0, 48
  sub t0, t0, s1
  slli t0, t0, 1
  li t1, 63526
  sw t0, 0(t1)
  ; title.e16.ts:209  palMix(SL_RED, 0x7fff, 16)
  li a0, 7
  li a1, 32767
  li a2, 16
  call palMix
  j .L2
.L1:
  ; title.e16.ts:210  if (t < 64) {
  li t0, 64
  bgeu s1, t0, .L3
  ; title.e16.ts:211  poke16(BG1Y, 0)
  li t0, 63526
  sw zero, 0(t0)
  ; title.e16.ts:212  palMix(SL_RED, 0x7fff, 64 - t)
  li t0, 64
  sub t0, t0, s1
  li a0, 7
  li a1, 32767
  mv a2, t0
  call palMix
  ; title.e16.ts:213  if (t === 48) {
  li t0, 48
  bne s1, t0, .L4
  ; title.e16.ts:214  shake(12)
  li a0, 12
  call shake
  ; title.e16.ts:215  wave(40, 6)
  li a0, 40
  li a1, 6
  call wave
.L4:
.L3:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; title.e16.ts:221 levelPick(l) at -O1
;   l in s1
levelPick:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; l
  ; title.e16.ts:222  levelSet(l)
  mv a0, s1
  call levelSet
  ; title.e16.ts:223  tableRead()
  la t0, tableRead
  li t1, 258
  call far_call
  ; title.e16.ts:224  levelShow()
  call levelShow
  ; title.e16.ts:225  pageShow(false)
  li a0, 0
  call pageShow
  ; title.e16.ts:226  sfxSelect()
  call sfxSelect
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; title.e16.ts:233 levelShow() at -O1
levelShow:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; title.e16.ts:234  unsay(0, 13, 40)
  li a0, 0
  li a1, 13
  li a2, 40
  call unsay
  ; title.e16.ts:235  unsay(0, 15, 40)
  li a0, 0
  li a1, 15
  li a2, 40
  call unsay
  ; title.e16.ts:236  levelWord(LV_EASY, 10, 4, str('EASY'))
  li a0, 0
  li a1, 10
  li a2, 4
  la a3, str_34
  call levelWord
  ; title.e16.ts:237  levelWord(1, 17, 6, str('NORMAL'))
  li a0, 1
  li a1, 17
  li a2, 6
  la a3, str_35
  call levelWord
  ; title.e16.ts:238  levelWord(LV_HARD, 26, 4, str('HARD'))
  li a0, 2
  li a1, 26
  li a2, 4
  la a3, str_36
  call levelWord
  ; title.e16.ts:239  if (level === LV_EASY) say(4, 15, str('MORE SHIPS AND BOMBS, LESS FIRE'), SL_TEXT)
  lw t0, 0x173e(zero)
  bne t0, zero, .L1
  ; title.e16.ts:239  say(4, 15, str('MORE SHIPS AND BOMBS, LESS FIRE'), SL_TEXT)
  li a0, 4
  li a1, 15
  la a2, str_37
  li a3, 5
  call say
  j .L2
.L1:
  ; title.e16.ts:240  if (level === LV_HARD) say(8, 15, str('FULL FIRE FROM THE START'), SL_TEXT)
  lw t0, 0x173e(zero)
  li t1, 2
  bne t0, t1, .L3
  ; title.e16.ts:240  say(8, 15, str('FULL FIRE FROM THE START'), SL_TEXT)
  li a0, 8
  li a1, 15
  la a2, str_38
  li a3, 5
  call say
  j .L4
.L3:
  ; title.e16.ts:241  say(7, 15, str('THE FIRE BUILDS AS YOU GO'), SL_TEXT)
  li a0, 7
  li a1, 15
  la a2, str_39
  li a3, 5
  call say
.L4:
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; title.e16.ts:245 levelWord(l, x, n, s) at -O1
;   l in s3
;   x in s1
;   n in s0
;   s in s2
levelWord:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; l
  mv s1, a1 ; x
  mv s0, a2 ; n
  mv s2, a3 ; s
  ; title.e16.ts:246  if (l !== level) {
  lw t0, 0x173e(zero)
  beq s3, t0, .L1
  ; title.e16.ts:247  say(x, 13, s, SL_TEXT)
  mv a0, s1
  li a1, 13
  mv a2, s2
  li a3, 5
  call say
  ; title.e16.ts:248  return
  j .return
.L1:
  ; title.e16.ts:250  say(x - 1, 13, str('>'), SL_GOLD)
  addi a0, s1, -1
  li a1, 13
  la a2, str_40
  li a3, 6
  call say
  ; title.e16.ts:251  say(x, 13, s, SL_GOLD)
  mv a0, s1
  li a1, 13
  mv a2, s2
  li a3, 6
  call say
  ; title.e16.ts:252  say(x + n, 13, str('<'), SL_GOLD)
  add a0, s1, s0
  li a1, 13
  la a2, str_41
  li a3, 6
  call say
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; title.e16.ts:256 helpShow() at -O1
helpShow:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; title.e16.ts:257  say(14, 20, str('HOW TO PLAY'), SL_TEXT)
  li a0, 14
  li a1, 20
  la a2, str_42
  li a3, 5
  call say
  ; title.e16.ts:258  say(6, 22, str('D-PAD'), SL_GOLD)
  li a0, 6
  li a1, 22
  la a2, str_43
  li a3, 6
  call say
  ; title.e16.ts:259  say(14, 22, str('MOVE'), SL_TEXT)
  li a0, 14
  li a1, 22
  la a2, str_44
  li a3, 5
  call say
  ; title.e16.ts:260  say(6, 24, str('A'), SL_GOLD)
  li a0, 6
  li a1, 24
  la a2, str_45
  li a3, 6
  call say
  ; title.e16.ts:261  say(14, 24, str('SHOT, HOLD FOR LANCE'), SL_TEXT)
  li a0, 14
  li a1, 24
  la a2, str_46
  li a3, 5
  call say
  ; title.e16.ts:262  say(6, 26, str('B'), SL_GOLD)
  li a0, 6
  li a1, 26
  la a2, str_47
  li a3, 6
  call say
  ; title.e16.ts:263  say(14, 26, str('BOMB'), SL_TEXT)
  li a0, 14
  li a1, 26
  la a2, str_48
  li a3, 5
  call say
  ; title.e16.ts:264  say(6, 28, str('X OR R'), SL_GOLD)
  li a0, 6
  li a1, 28
  la a2, str_49
  li a3, 6
  call say
  ; title.e16.ts:265  say(14, 28, str('OVERDRIVE WHEN READY'), SL_TEXT)
  li a0, 14
  li a1, 28
  la a2, str_50
  li a3, 5
  call say
  ; title.e16.ts:266  say(6, 30, str('START'), SL_GOLD)
  li a0, 6
  li a1, 30
  la a2, str_51
  li a3, 6
  call say
  ; title.e16.ts:267  say(14, 30, str('PAUSE'), SL_TEXT)
  li a0, 14
  li a1, 30
  la a2, str_52
  li a3, 5
  call say
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; round.e16.ts:61 game() at -O1
;   r in s1
;   cleared in s2
game:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; round.e16.ts:62  rankReset()
  call rankReset
  ; round.e16.ts:63  scoreNew()
  call scoreNew
  ; round.e16.ts:64  shipNew()
  call shipNew
  ; round.e16.ts:65  roundIs(1)
  li a0, 1
  call roundIs
  ; round.e16.ts:66  boost(0)
  li a0, 0
  call boost
  ; round.e16.ts:67  let r: u16 = 1
  li s1, 1 ; r
  ; round.e16.ts:68  for (;;) {
.L1:
  ; round.e16.ts:69  const cleared = stage(r)
  mv a0, s1
  call stage
  mv s2, a0 ; cleared
  ; round.e16.ts:70  if (!cleared) break
  bnez s2, .L5
  ; round.e16.ts:70  break
  j .L4
.L5:
  ; round.e16.ts:71  r = r + 1
  addi s1, s1, 1
  ; round.e16.ts:72  roundIs(r)
  mv a0, s1
  call roundIs
  ; round.e16.ts:73  boost(8)
  li a0, 8
  call boost
  j .L1
.L4:
  ; round.e16.ts:75  gameOver()
  la t0, gameOver
  li t1, 258
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; round.e16.ts:79 stage(round) at -O1
;   round in s1
stage:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; round
  ; round.e16.ts:80  stageBegin(round)
  mv a0, s1
  call stageBegin
  ; round.e16.ts:81  for (;;) {
.L1:
  ; round.e16.ts:82  frameBegin()
  call frameBegin
  ; round.e16.ts:83  if (pressed(B_START)) pause()
  li a0, 1024
  call pressed
  beqz a0, .L5
  ; round.e16.ts:83  pause()
  la t0, pause
  li t1, 258
  call far_call
.L5:
  ; round.e16.ts:84  stageEvents()
  call stageEvents
  ; round.e16.ts:85  play_()
  call play_
  ; round.e16.ts:86  if (shipState === SH_GONE) return false
  lw t0, 0x14d8(zero)
  li t1, 3
  bne t0, t1, .L6
  ; round.e16.ts:86  return false
  li a0, 0
  j .return
.L6:
  ; round.e16.ts:87  if (bossOutcome()) break
  call bossOutcome
  beqz a0, .L1
  ; round.e16.ts:87  break
  ; round.e16.ts:89  tally()
  la t0, tally
  li t1, 258
  call far_call
  ; round.e16.ts:90  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; round.e16.ts:94 stageBegin(round) at -O1
;   round in s1
stageBegin:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; round
  ; round.e16.ts:95  mapsClear()
  call mapsClear
  ; round.e16.ts:96  panelsIn()
  call panelsIn
  ; round.e16.ts:97  hudLabels()
  la t0, hudLabels
  li t1, 258
  call far_call
  ; round.e16.ts:98  stageStart()
  call stageStart
  ; round.e16.ts:99  scriptStart()
  call scriptStart
  ; round.e16.ts:100  foesClear()
  call foesClear
  ; round.e16.ts:101  bulletsClear()
  call bulletsClear
  ; round.e16.ts:102  shotsClear()
  call shotsClear
  ; round.e16.ts:103  itemsClear()
  call itemsClear
  ; round.e16.ts:104  missilesClear()
  la t0, missilesClear
  li t1, 259
  call far_call
  ; round.e16.ts:105  bossReset()
  la t0, bossReset
  li t1, 257
  call far_call
  ; round.e16.ts:106  bossOnWas = B_NONE
  sw zero, 0x1948(zero)
  ; round.e16.ts:107  banner = 150
  li t0, 150
  sw t0, 0x1942(zero)
  ; round.e16.ts:108  warning = 0
  sw zero, 0x1944(zero)
  ; round.e16.ts:109  clearT = 0
  sw zero, 0x1946(zero)
  ; round.e16.ts:110  music(M_STAGE)
  li a0, 2
  call music
  ; round.e16.ts:111  say(16, 15, round === 1 ? str('STAGE 1') : str('ROUND 2'), SL_GOLD)
  li t0, 16
  li t1, 15
  mv t2, s1
  li t3, 1
  bne t2, t3, .L1
  la t2, str_53
  j .L2
.L1:
  la t2, str_54
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 6
  call say
  ; round.e16.ts:112  say(15, 17, str('READY'), SL_TEXT)
  li a0, 15
  li a1, 17
  la a2, str_55
  li a3, 5
  call say
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; round.e16.ts:120 stageEvents() at -O1
;   cmd in s1
stageEvents:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; round.e16.ts:121  if (banner > 0) {
  lw t0, 0x1942(zero)
  bgeu zero, t0, .L1
  ; round.e16.ts:122  banner--
  lw t0, 0x1942(zero)
  addi t0, t0, -1
  sw t0, 0x1942(zero)
  ; round.e16.ts:123  if (banner === 0) fieldClear()
  bne t0, zero, .L2
  ; round.e16.ts:123  fieldClear()
  call fieldClear
.L2:
.L1:
  ; round.e16.ts:125  const cmd = scriptStep()
  call scriptStep
  mv s1, a0 ; cmd
  ; round.e16.ts:126  if (cmd === CMD_SPEED) stageSpeed(scriptArg)
  li t0, 20
  bne s1, t0, .L3
  ; round.e16.ts:126  stageSpeed(scriptArg)
  lw a0, 0x173c(zero)
  call stageSpeed
  j .L4
.L3:
  ; round.e16.ts:127  if (cmd === CMD_MIDBOSS) midboss()
  li t0, 21
  bne s1, t0, .L5
  ; round.e16.ts:127  midboss()
  call midboss
  j .L6
.L5:
  ; round.e16.ts:128  if (cmd === CMD_BOSS) warning = 300
  li t0, 22
  bne s1, t0, .L7
  ; round.e16.ts:128  warning = 300
  li t0, 300
  sw t0, 0x1944(zero)
.L7:
.L6:
.L4:
  ; round.e16.ts:129  if (warning === 0) return
  lw t0, 0x1944(zero)
  bne t0, zero, .L8
  ; round.e16.ts:129  return
  j .return
.L8:
  ; round.e16.ts:130  warningStep(warning)
  lw a0, 0x1944(zero)
  la t0, warningStep
  li t1, 258
  call far_call
  ; round.e16.ts:131  warning--
  lw t0, 0x1944(zero)
  addi t0, t0, -1
  sw t0, 0x1944(zero)
  ; round.e16.ts:132  if (warning === 0) boss()
  bne t0, zero, .L9
  ; round.e16.ts:132  boss()
  call boss
.L9:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; round.e16.ts:140 bossOutcome() at -O1
bossOutcome:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; round.e16.ts:141  if (bossOnWas !== B_NONE && (bossPhase === 10 || bossPhase === 11)) {
  lw t0, 0x1948(zero)
  beq t0, zero, .L1
  lw t0, 0x1756(zero)
  li t1, 10
  beq t0, t1, .L2
  lw t0, 0x1756(zero)
  li t1, 11
  bne t0, t1, .L1
.L2:
  ; round.e16.ts:142  if (bossPhase === 10) points(bossOnWas === B_BASTION ? 3000 : 10000)
  lw t0, 0x1756(zero)
  li t1, 10
  bne t0, t1, .L3
  ; round.e16.ts:142  points(bossOnWas === B_BASTION ? 3000 : 10000)
  lw t0, 0x1948(zero)
  li t1, 1
  bne t0, t1, .L4
  li t0, 3000
  j .L5
.L4:
  li t0, 10000
.L5:
  mv a0, t0
  call points
.L3:
  ; round.e16.ts:143  if (bossOnWas === B_BASTION) {
  lw t0, 0x1948(zero)
  li t1, 1
  bne t0, t1, .L6
  ; round.e16.ts:144  stageRelease()
  call stageRelease
  ; round.e16.ts:145  music(M_STAGE)
  li a0, 2
  call music
  j .L7
.L6:
  ; round.e16.ts:146  clearT = 1
  li t0, 1
  sw t0, 0x1946(zero)
.L7:
  ; round.e16.ts:147  bossOnWas = B_NONE
  sw zero, 0x1948(zero)
.L1:
  ; round.e16.ts:149  if (clearT === 0) return false
  lw t0, 0x1946(zero)
  bne t0, zero, .L8
  ; round.e16.ts:149  return false
  li a0, 0
  j .return
.L8:
  ; round.e16.ts:150  clearT++
  lw t0, 0x1946(zero)
  addi t0, t0, 1
  sw t0, 0x1946(zero)
  ; round.e16.ts:151  return clearT > 150
  li t1, 150
  sltu a0, t1, t0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; round.e16.ts:156 midboss() at -O1
midboss:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; round.e16.ts:157  stageHold(STAGE_H - 64 - 128 - 96 - 64)
  li a0, 256
  call stageHold
  ; round.e16.ts:158  bastionIn()
  call bastionIn
  ; round.e16.ts:159  bastionStart()
  la t0, bastionStart
  li t1, 257
  call far_call
  ; round.e16.ts:160  bossOnWas = B_BASTION
  li t0, 1
  sw t0, 0x1948(zero)
  ; round.e16.ts:161  music(M_BOSS)
  li a0, 3
  call music
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; round.e16.ts:164 boss() at -O1
boss:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; round.e16.ts:165  fieldClear()
  call fieldClear
  ; round.e16.ts:166  palettesIn()
  call palettesIn
  ; round.e16.ts:167  stageHold(0)
  li a0, 0
  call stageHold
  ; round.e16.ts:168  zenithIn()
  call zenithIn
  ; round.e16.ts:169  zenithStart()
  la t0, zenithStart
  li t1, 257
  call far_call
  ; round.e16.ts:170  bossOnWas = B_ZENITH
  li t0, 2
  sw t0, 0x1948(zero)
  ; round.e16.ts:171  music(M_BOSS)
  li a0, 3
  call music
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; round.e16.ts:175 bastionIn() at -O1
bastionIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; round.e16.ts:176  load(BASTION_BANK, BASTION_AT, BASTION_TILE * 32, BASTION_BYTES)
  li a0, 263
  li a1, 52896
  li a2, 26112
  li a3, 2560
  call load
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; round.e16.ts:179 zenithIn() at -O1
zenithIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; round.e16.ts:180  load(ZENITH_BANK, ZENITH_AT, ZENITH_TILE * 32, ZENITH_BYTES)
  li a0, 264
  li a1, 49152
  li a2, 26112
  li a3, 6656
  call load
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

str_32:
  .byte 40, 67, 41, 32, 69, 76, 69, 67, 88, 90, 89, 32, 80, 82, 79, 74, 69, 67, 84, 0
str_33:
  .byte 80, 82, 69, 83, 83, 32, 83, 84, 65, 82, 84, 0
str_34:
  .byte 69, 65, 83, 89, 0
str_35:
  .byte 78, 79, 82, 77, 65, 76, 0
str_36:
  .byte 72, 65, 82, 68, 0
str_37:
  .byte 77, 79, 82, 69, 32, 83, 72, 73, 80, 83, 32, 65, 78, 68, 32, 66, 79, 77, 66, 83, 44, 32, 76, 69, 83, 83, 32, 70, 73, 82, 69, 0
str_38:
  .byte 70, 85, 76, 76, 32, 70, 73, 82, 69, 32, 70, 82, 79, 77, 32, 84, 72, 69, 32, 83, 84, 65, 82, 84, 0
str_39:
  .byte 84, 72, 69, 32, 70, 73, 82, 69, 32, 66, 85, 73, 76, 68, 83, 32, 65, 83, 32, 89, 79, 85, 32, 71, 79, 0
str_40:
  .byte 62, 0
str_41:
  .byte 60, 0
str_42:
  .byte 72, 79, 87, 32, 84, 79, 32, 80, 76, 65, 89, 0
str_43:
  .byte 68, 45, 80, 65, 68, 0
str_44:
  .byte 77, 79, 86, 69, 0
str_45:
  .byte 65, 0
str_46:
  .byte 83, 72, 79, 84, 44, 32, 72, 79, 76, 68, 32, 70, 79, 82, 32, 76, 65, 78, 67, 69, 0
str_47:
  .byte 66, 0
str_48:
  .byte 66, 79, 77, 66, 0
str_49:
  .byte 88, 32, 79, 82, 32, 82, 0
str_50:
  .byte 79, 86, 69, 82, 68, 82, 73, 86, 69, 32, 87, 72, 69, 78, 32, 82, 69, 65, 68, 89, 0
str_51:
  .byte 83, 84, 65, 82, 84, 0
str_52:
  .byte 80, 65, 85, 83, 69, 0
str_53:
  .byte 83, 84, 65, 71, 69, 32, 49, 0
str_54:
  .byte 82, 79, 85, 78, 68, 32, 50, 0
str_55:
  .byte 82, 69, 65, 68, 89, 0
  .align 2
