; Made by e16c from lib/kit.e16.ts, lib/sound.e16.ts, field.e16.ts, fall.e16.ts, hud.e16.ts, audio.e16.ts, drill.e16.ts, scenes.e16.ts, best.e16.ts, player.e16.ts, fx.e16.ts, panel.e16.ts, assets.e16.ts: do not edit.

; sprN at 0x0880
; sprShown at 0x0882
; padIs at 0x0884
; padWas at 0x0886
; seed at 0x0aca
; muted at 0x0c8c
; opTook at 0x0c8e
; top at 0x10b0
; stamp at 0x10b2
; drawLeft at 0x10b4
; foundN at 0x12e6
; lbN at 0x1588
; gNext at 0x181a
; wobbleFrames at 0x187c
; fallSpeed at 0x187e
; target at 0x1880
; struck at 0x1882
; susHead at 0x1984
; susTail at 0x1986
; landN at 0x1a08
; chain at 0x1a0a
; vanishedBlocks at 0x1a0c
; vanishedChain at 0x1a0e
; vanishedAt at 0x1a10
; landings at 0x1a12
; loosened at 0x1a14
; pendN at 0x1c96
; goneN at 0x1cf8
; bandY at 0x1d02
; bandH at 0x1d04
; song at 0x1d06
; seen at 0x1d08
; frame at 0x1d0a
; camY at 0x1d0c
; view at 0x1d0e
; shakeT at 0x1d10
; scrollNext at 0x1d12
; lives at 0x1d14
; stratum at 0x1d16
; maxDepth at 0x1d18
; maxChain at 0x1d1a
; continues at 0x1d1c
; outcome at 0x1d1e
; alarmT at 0x1d20
; bannerT at 0x1d22
; jingleT at 0x1d24
; wasAlive at 0x1d26
; frameStart at 0x1d28
; walkX at 0x1d52
; walkFace at 0x1d54
; pCol at 0x1d98
; pRow at 0x1d9a
; pX at 0x1d9c
; pY at 0x1d9e
; pState at 0x1da0
; pT at 0x1da2
; pFace at 0x1da4
; pDir at 0x1da6
; pTo at 0x1da8
; pSpeed at 0x1daa
; pPush at 0x1dac
; pIdle at 0x1dae
; pSafe at 0x1db0
; air at 0x1db2
; airSub at 0x1db4
; airDrain at 0x1db6
; dugN at 0x1db8
; alloyBroken at 0x1dba
; capsuleN at 0x1dbc
; capsules at 0x1dbe
; fxNext at 0x1f80
; velX at 0x1f82
; velY at 0x1f84
; shownDepth at 0x1f86
; shownAir at 0x1f88
; shownLives at 0x1f8a
; shownChain at 0x1f8c
; shownCaps at 0x1f8e
; shownScore at 0x1f90
; shownBest at 0x1f92
; shownStratum at 0x1f94
; shownLow at 0x1f96
palCopy = 0x0280 ; 512 bytes
oam = 0x0480 ; 1024 bytes
sines = 0x0888 ; 512 bytes
atans = 0x0a88 ; 66 bytes
chBank = 0x0acc ; 32 bytes
chSong = 0x0aec ; 32 bytes
chAt = 0x0b0c ; 32 bytes
chLoop = 0x0b2c ; 32 bytes
chWait = 0x0b4c ; 32 bytes
chGate = 0x0b6c ; 32 bytes
chFreq = 0x0b8c ; 32 bytes
lastFreq = 0x0bac ; 32 bytes
chLen = 0x0bcc ; 32 bytes
chHeld = 0x0bec ; 32 bytes
chDrop = 0x0c0c ; 32 bytes
chVol = 0x0c2c ; 32 bytes
chInstVol = 0x0c4c ; 32 bytes
chOn = 0x0c6c ; 32 bytes
cells = 0x0c90 ; 512 bytes
marks = 0x0e90 ; 512 bytes
rowMarked = 0x1090 ; 32 bytes
found = 0x10b6 ; 560 bytes
lbCell = 0x12e8 ; 192 bytes
lbGroup = 0x13a8 ; 96 bytes
lbUnit = 0x1408 ; 96 bytes
lbTile = 0x1468 ; 192 bytes
lbVal = 0x1528 ; 96 bytes
lbAt = 0x158a ; 512 bytes
gSize = 0x178a ; 96 bytes
gSet = 0x17ea ; 48 bytes
uState = 0x181c ; 24 bytes
uTime = 0x1834 ; 24 bytes
uOff = 0x184c ; 24 bytes
uSize = 0x1864 ; 24 bytes
sus = 0x1884 ; 256 bytes
landQ = 0x1988 ; 128 bytes
pendCell = 0x1a16 ; 320 bytes
pendDue = 0x1b56 ; 320 bytes
goneCell = 0x1c98 ; 48 bytes
goneType = 0x1cc8 ; 48 bytes
score = 0x1cfa ; 4 bytes
best = 0x1cfe ; 4 bytes
heap = 0x1d2a ; 40 bytes
bestScore = 0x1d56 ; 20 bytes
bestDepth = 0x1d6a ; 10 bytes
bestName = 0x1d74 ; 30 bytes
letters = 0x1d92 ; 6 bytes
fxK = 0x1dc0 ; 64 bytes
fxX = 0x1e00 ; 64 bytes
fxY = 0x1e40 ; 64 bytes
fxVX = 0x1e80 ; 64 bytes
fxVY = 0x1ec0 ; 64 bytes
fxT = 0x1f00 ; 64 bytes
fxA = 0x1f40 ; 64 bytes

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
  ; seed = 7467
  li t0, 7467
  sw t0, 0x0aca(zero)
  ; muted = 0
  sw zero, 0x0c8c(zero)
  ; opTook = 0
  sw zero, 0x0c8e(zero)
  ; top = 0
  sw zero, 0x10b0(zero)
  ; stamp = 1
  li t0, 1
  sw t0, 0x10b2(zero)
  ; drawLeft = 0
  sw zero, 0x10b4(zero)
  ; foundN = 0
  sw zero, 0x12e6(zero)
  ; lbN = 0
  sw zero, 0x1588(zero)
  ; gNext = 0
  sw zero, 0x181a(zero)
  ; wobbleFrames = 64
  li t0, 64
  sw t0, 0x187c(zero)
  ; fallSpeed = 8
  li t0, 8
  sw t0, 0x187e(zero)
  ; target = 65535
  li t0, 65535
  sw t0, 0x1880(zero)
  ; struck = 0
  sw zero, 0x1882(zero)
  ; susHead = 0
  sw zero, 0x1984(zero)
  ; susTail = 0
  sw zero, 0x1986(zero)
  ; landN = 0
  sw zero, 0x1a08(zero)
  ; chain = 0
  sw zero, 0x1a0a(zero)
  ; vanishedBlocks = 0
  sw zero, 0x1a0c(zero)
  ; vanishedChain = 0
  sw zero, 0x1a0e(zero)
  ; vanishedAt = 0
  sw zero, 0x1a10(zero)
  ; landings = 0
  sw zero, 0x1a12(zero)
  ; loosened = 0
  sw zero, 0x1a14(zero)
  ; pendN = 0
  sw zero, 0x1c96(zero)
  ; goneN = 0
  sw zero, 0x1cf8(zero)
  ; bandY = 0
  sw zero, 0x1d02(zero)
  ; bandH = 0
  sw zero, 0x1d04(zero)
  ; song = 0
  sw zero, 0x1d06(zero)
  ; seen = 0
  sw zero, 0x1d08(zero)
  ; frame = 0
  sw zero, 0x1d0a(zero)
  ; camY = 0
  sw zero, 0x1d0c(zero)
  ; view = 0
  sw zero, 0x1d0e(zero)
  ; shakeT = 0
  sw zero, 0x1d10(zero)
  ; scrollNext = 0
  sw zero, 0x1d12(zero)
  ; lives = 3
  li t0, 3
  sw t0, 0x1d14(zero)
  ; stratum = 0
  sw zero, 0x1d16(zero)
  ; maxDepth = 0
  sw zero, 0x1d18(zero)
  ; maxChain = 0
  sw zero, 0x1d1a(zero)
  ; continues = 0
  sw zero, 0x1d1c(zero)
  ; outcome = 0
  sw zero, 0x1d1e(zero)
  ; alarmT = 0
  sw zero, 0x1d20(zero)
  ; bannerT = 0
  sw zero, 0x1d22(zero)
  ; jingleT = 0
  sw zero, 0x1d24(zero)
  ; wasAlive = 1
  li t0, 1
  sw t0, 0x1d26(zero)
  ; frameStart = 0
  sw zero, 0x1d28(zero)
  ; walkX = 40
  li t0, 40
  sw t0, 0x1d52(zero)
  ; walkFace = 0
  sw zero, 0x1d54(zero)
  ; pCol = 4
  li t0, 4
  sw t0, 0x1d98(zero)
  ; pRow = 5
  li t0, 5
  sw t0, 0x1d9a(zero)
  ; pX = 64
  li t0, 64
  sw t0, 0x1d9c(zero)
  ; pY = 80
  li t0, 80
  sw t0, 0x1d9e(zero)
  ; pState = 0
  sw zero, 0x1da0(zero)
  ; pT = 0
  sw zero, 0x1da2(zero)
  ; pFace = 0
  sw zero, 0x1da4(zero)
  ; pDir = 0
  sw zero, 0x1da6(zero)
  ; pTo = 0
  sw zero, 0x1da8(zero)
  ; pSpeed = 0
  sw zero, 0x1daa(zero)
  ; pPush = 0
  sw zero, 0x1dac(zero)
  ; pIdle = 0
  sw zero, 0x1dae(zero)
  ; pSafe = 0
  sw zero, 0x1db0(zero)
  ; air = 100
  li t0, 100
  sw t0, 0x1db2(zero)
  ; airSub = 0
  sw zero, 0x1db4(zero)
  ; airDrain = 60
  li t0, 60
  sw t0, 0x1db6(zero)
  ; dugN = 0
  sw zero, 0x1db8(zero)
  ; alloyBroken = 0
  sw zero, 0x1dba(zero)
  ; capsuleN = 0
  sw zero, 0x1dbc(zero)
  ; capsules = 0
  sw zero, 0x1dbe(zero)
  ; fxNext = 0
  sw zero, 0x1f80(zero)
  ; velX = 0
  sw zero, 0x1f82(zero)
  ; velY = 0
  sw zero, 0x1f84(zero)
  ; shownDepth = 65535
  li t0, 65535
  sw t0, 0x1f86(zero)
  ; shownAir = 65535
  li t0, 65535
  sw t0, 0x1f88(zero)
  ; shownLives = 65535
  li t0, 65535
  sw t0, 0x1f8a(zero)
  ; shownChain = 65535
  li t0, 65535
  sw t0, 0x1f8c(zero)
  ; shownCaps = 65535
  li t0, 65535
  sw t0, 0x1f8e(zero)
  ; shownScore = 65535
  li t0, 65535
  sw t0, 0x1f90(zero)
  ; shownBest = 65535
  li t0, 65535
  sw t0, 0x1f92(zero)
  ; shownStratum = 65535
  li t0, 65535
  sw t0, 0x1f94(zero)
  ; shownLow = 65535
  li t0, 65535
  sw t0, 0x1f96(zero)
  ; palCopy: 512 bytes of 0
  li t0, 0x0280
  li t1, 512
  mset t0, zero, t1
  ; oam: 1024 bytes of 0
  li t0, 0x0480
  li t1, 1024
  mset t0, zero, t1
  ; sines: 512 bytes of 0
  li t0, 0x0888
  li t1, 512
  mset t0, zero, t1
  ; atans: 66 bytes of 0
  li t0, 0x0a88
  li t1, 66
  mset t0, zero, t1
  ; chBank: 32 bytes of 0
  li t0, 0x0acc
  li t1, 32
  mset t0, zero, t1
  ; chSong: 32 bytes of 0
  li t0, 0x0aec
  li t1, 32
  mset t0, zero, t1
  ; chAt: 32 bytes of 0
  li t0, 0x0b0c
  li t1, 32
  mset t0, zero, t1
  ; chLoop: 32 bytes of 0
  li t0, 0x0b2c
  li t1, 32
  mset t0, zero, t1
  ; chWait: 32 bytes of 0
  li t0, 0x0b4c
  li t1, 32
  mset t0, zero, t1
  ; chGate: 32 bytes of 0
  li t0, 0x0b6c
  li t1, 32
  mset t0, zero, t1
  ; chFreq: 32 bytes of 0
  li t0, 0x0b8c
  li t1, 32
  mset t0, zero, t1
  ; lastFreq: 32 bytes of 0
  li t0, 0x0bac
  li t1, 32
  mset t0, zero, t1
  ; chLen: 32 bytes of 0
  li t0, 0x0bcc
  li t1, 32
  mset t0, zero, t1
  ; chHeld: 32 bytes of 0
  li t0, 0x0bec
  li t1, 32
  mset t0, zero, t1
  ; chDrop: 32 bytes of 0
  li t0, 0x0c0c
  li t1, 32
  mset t0, zero, t1
  ; chVol: 32 bytes of 0
  li t0, 0x0c2c
  li t1, 32
  mset t0, zero, t1
  ; chInstVol: 32 bytes of 0
  li t0, 0x0c4c
  li t1, 32
  mset t0, zero, t1
  ; chOn: 32 bytes of 0
  li t0, 0x0c6c
  li t1, 32
  mset t0, zero, t1
  ; cells: 512 bytes of 0
  li t0, 0x0c90
  li t1, 512
  mset t0, zero, t1
  ; marks: 512 bytes of 0
  li t0, 0x0e90
  li t1, 512
  mset t0, zero, t1
  ; rowMarked: 32 bytes of 0
  li t0, 0x1090
  li t1, 32
  mset t0, zero, t1
  ; found: 560 bytes of 0
  li t0, 0x10b6
  li t1, 560
  mset t0, zero, t1
  ; lbCell: 192 bytes of 0
  li t0, 0x12e8
  li t1, 192
  mset t0, zero, t1
  ; lbGroup: 96 bytes of 0
  li t0, 0x13a8
  li t1, 96
  mset t0, zero, t1
  ; lbUnit: 96 bytes of 0
  li t0, 0x1408
  li t1, 96
  mset t0, zero, t1
  ; lbTile: 192 bytes of 0
  li t0, 0x1468
  li t1, 192
  mset t0, zero, t1
  ; lbVal: 96 bytes of 0
  li t0, 0x1528
  li t1, 96
  mset t0, zero, t1
  ; lbAt: 512 bytes of 0
  li t0, 0x158a
  li t1, 512
  mset t0, zero, t1
  ; gSize: 96 bytes of 0
  li t0, 0x178a
  li t1, 96
  mset t0, zero, t1
  ; gSet: 48 bytes of 0
  li t0, 0x17ea
  li t1, 48
  mset t0, zero, t1
  ; uState: 24 bytes of 0
  li t0, 0x181c
  li t1, 24
  mset t0, zero, t1
  ; uTime: 24 bytes of 0
  li t0, 0x1834
  li t1, 24
  mset t0, zero, t1
  ; uOff: 24 bytes of 0
  li t0, 0x184c
  li t1, 24
  mset t0, zero, t1
  ; uSize: 24 bytes of 0
  li t0, 0x1864
  li t1, 24
  mset t0, zero, t1
  ; sus: 256 bytes of 0
  li t0, 0x1884
  li t1, 256
  mset t0, zero, t1
  ; landQ: 128 bytes of 0
  li t0, 0x1988
  li t1, 128
  mset t0, zero, t1
  ; pendCell: 320 bytes of 0
  li t0, 0x1a16
  li t1, 320
  mset t0, zero, t1
  ; pendDue: 320 bytes of 0
  li t0, 0x1b56
  li t1, 320
  mset t0, zero, t1
  ; goneCell: 48 bytes of 0
  li t0, 0x1c98
  li t1, 48
  mset t0, zero, t1
  ; goneType: 48 bytes of 0
  li t0, 0x1cc8
  li t1, 48
  mset t0, zero, t1
  ; score: 4 bytes of 0
  li t0, 0x1cfa
  li t1, 4
  mset t0, zero, t1
  ; best: 4 bytes of 0
  li t0, 0x1cfe
  li t1, 4
  mset t0, zero, t1
  ; heap: 40 bytes of 0
  li t0, 0x1d2a
  li t1, 40
  mset t0, zero, t1
  ; bestScore: 20 bytes of 0
  li t0, 0x1d56
  li t1, 20
  mset t0, zero, t1
  ; bestDepth: 10 bytes of 0
  li t0, 0x1d6a
  li t1, 10
  mset t0, zero, t1
  ; bestName: 30 bytes of 0
  li t0, 0x1d74
  li t1, 30
  mset t0, zero, t1
  ; letters: 6 bytes of 0
  li t0, 0x1d92
  li t1, 6
  mset t0, zero, t1
  ; fxK: 64 bytes of 0
  li t0, 0x1dc0
  li t1, 64
  mset t0, zero, t1
  ; fxX: 64 bytes of 0
  li t0, 0x1e00
  li t1, 64
  mset t0, zero, t1
  ; fxY: 64 bytes of 0
  li t0, 0x1e40
  li t1, 64
  mset t0, zero, t1
  ; fxVX: 64 bytes of 0
  li t0, 0x1e80
  li t1, 64
  mset t0, zero, t1
  ; fxVY: 64 bytes of 0
  li t0, 0x1ec0
  li t1, 64
  mset t0, zero, t1
  ; fxT: 64 bytes of 0
  li t0, 0x1f00
  li t1, 64
  mset t0, zero, t1
  ; fxA: 64 bytes of 0
  li t0, 0x1f40
  li t1, 64
  mset t0, zero, t1
  ret

; lib/kit.e16.ts:82 bank(b) at -O1
;   b in a0
;   old in a1
bank:
  ; lib/kit.e16.ts:83  const old = peek16(IO_BANK)
  li t0, 65284
  lw a1, 0(t0)
  ; lib/kit.e16.ts:84  poke16(IO_BANK, b)
  li t0, 65284
  sw a0, 0(t0)
  ; lib/kit.e16.ts:85  return old
  mv a0, a1
.return:
  ret

; lib/kit.e16.ts:89 vpoke(at, v) at -O1
;   at in a0
;   v in a1
vpoke:
  ; lib/kit.e16.ts:90  poke16(VPAGE, at >> 12)
  srli t0, a0, 12
  li t1, 63490
  sw t0, 0(t1)
  ; lib/kit.e16.ts:91  poke16(VWIN + (at & 0xfff), v)
  andi t0, a0, 4095
  sw a1, -8192(t0)
.return:
  ret

; lib/kit.e16.ts:95 vfill(at, v, n) at -O1
;   at in a0
;   v in a1
;   n in a2
;   p in s1
;   k in a3
vfill:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/kit.e16.ts:96  while (n > 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:97  poke16(VPAGE, at >> 12)
  srli t0, a0, 12
  li t1, 63490
  sw t0, 0(t1)
  ; lib/kit.e16.ts:98  let p = VWIN + (at & 0xfff)
  andi t0, a0, 4095
  addi s1, t0, -8192
  ; lib/kit.e16.ts:99  let k = div(0x1000 - (at & 0xfff), 2)
  andi t0, a0, 4095
  li t1, 4096
  sub t1, t1, t0
  srli a3, t1, 1
  ; lib/kit.e16.ts:100  if (k > n) k = n
  bgeu a2, a3, .L5
  ; lib/kit.e16.ts:100  k = n
  mv a3, a2 ; k
.L5:
  ; lib/kit.e16.ts:101  n = wrap16(n - k)
  sub a2, a2, a3
  ; lib/kit.e16.ts:102  at = wrap16(at + k * 2)
  slli t0, a3, 1
  add a0, a0, t0
  ; lib/kit.e16.ts:103  while (k > 0) {
  j .L8
.L6:
  ; lib/kit.e16.ts:104  poke16(p, v)
  sw a1, 0(s1)
  ; lib/kit.e16.ts:105  p = wrap16(p + 2)
  addi s1, s1, 2
  ; lib/kit.e16.ts:106  k--
  addi a3, a3, -1
.L8:
  bltu zero, a3, .L6
.L3:
  bltu zero, a2, .L1
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/kit.e16.ts:112 dma(src, dst, len) at -O1
;   src in a0
;   dst in a1
;   len in a2
dma:
  ; lib/kit.e16.ts:113  poke16(DMASRC, src)
  li t0, 63536
  sw a0, 0(t0)
  ; lib/kit.e16.ts:114  poke16(DMADST, dst)
  li t0, 63538
  sw a1, 0(t0)
  ; lib/kit.e16.ts:115  poke16(DMALEN, len)
  li t0, 63540
  sw a2, 0(t0)
  ; lib/kit.e16.ts:116  poke16(DMACTRL, 1)
  li t0, 1
  li t1, 63542
  sw t0, 0(t1)
.return:
  ret

; lib/kit.e16.ts:123 load(b, src, dst, len) at -O1
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
  ; lib/kit.e16.ts:124  const old = bank(b)
  mv a0, s3
  call bank
  sw a0, 4(fp) ; old
  ; lib/kit.e16.ts:125  while (len > 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:126  let n = wrap16(0xe000 - src)
  lw t0, 0(fp) ; src
  li t1, 57344
  sub s2, t1, t0
  ; lib/kit.e16.ts:127  if (n > len) n = len
  bgeu s1, s2, .L5
  ; lib/kit.e16.ts:127  n = len
  mv s2, s1 ; n
.L5:
  ; lib/kit.e16.ts:128  dma(src, dst, n)
  lw a0, 0(fp)
  lw a1, 2(fp)
  mv a2, s2
  call dma
  ; lib/kit.e16.ts:129  len = wrap16(len - n)
  sub s1, s1, s2
  ; lib/kit.e16.ts:130  dst = wrap16(dst + n)
  lw t0, 2(fp) ; dst
  add t0, t0, s2
  sw t0, 2(fp) ; dst
  ; lib/kit.e16.ts:131  b++
  addi s3, s3, 1
  ; lib/kit.e16.ts:132  poke16(IO_BANK, b)
  li t0, 65284
  sw s3, 0(t0)
  ; lib/kit.e16.ts:133  src = WINDOW
  li t0, 49152
  sw t0, 0(fp) ; src
.L3:
  bltu zero, s1, .L1
  ; lib/kit.e16.ts:135  poke16(IO_BANK, old)
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

; lib/kit.e16.ts:139 palette(row, slot) at -O1
;   row in s1
;   slot in s2
palette:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; row
  mv s2, a1 ; slot
  ; lib/kit.e16.ts:140  load(PALETTES_BANK, PALETTES_AT + row * 32, PALS + slot * 32, 32)
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

; lib/kit.e16.ts:144 colour(slot, k, rgb) at -O1
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
  ; lib/kit.e16.ts:145  vpoke(PALS + slot * 32 + k * 2, rgb)
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

; lib/kit.e16.ts:152 palKeep(row, slot) at -O1
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
  ; lib/kit.e16.ts:153  const old = bank(PALETTES_BANK)
  li a0, 259
  call bank
  mv s0, a0 ; old
  ; lib/kit.e16.ts:154  let k: u16 = 0
  li s1, 0 ; k
  ; lib/kit.e16.ts:155  while (k < 16) {
  j .L3
.L1:
  ; lib/kit.e16.ts:156  palCopy[slot * 16 + k] = peek16(PALETTES_AT + row * 32 + k * 2)
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
  ; lib/kit.e16.ts:157  k++
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
  ; lib/kit.e16.ts:159  poke16(IO_BANK, old)
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

; lib/kit.e16.ts:163 palMix(slot, rgb, t) at -O1
;   slot in s2
;   rgb in s3
;   t in 0(fp)
;   k in s1
;   c in 2(fp)
palMix:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; slot
  mv s3, a1 ; rgb
  sw a2, 0(fp) ; t
  ; lib/kit.e16.ts:164  let k: u16 = 1
  li s1, 1 ; k
  ; lib/kit.e16.ts:165  poke16(VPAGE, (PALS + slot * 32) >> 12)
  slli t0, s2, 5
  li t1, 50176
  add t1, t1, t0
  srli t1, t1, 12
  li t0, 63490
  sw t1, 0(t0)
  ; lib/kit.e16.ts:166  while (k < 16) {
  j .L3
.L1:
  ; lib/kit.e16.ts:167  const c = palCopy[slot * 16 + k]
  slli t0, s2, 4
  add t0, t0, s1
  slli t0, t0, 1
  lw t0, palCopy(t0)
  sw t0, 2(fp) ; c
  ; lib/kit.e16.ts:168  poke16(VWIN + ((PALS + slot * 32 + k * 2) & 0xfff), mix(c, rgb, t))
  slli t0, s2, 5
  li t1, 50176
  add t1, t1, t0
  slli t0, s1, 1
  add t1, t1, t0
  andi t1, t1, 4095
  addi t1, t1, -8192
  addi sp, sp, -2
  sw t1, 0(sp)
  lw a0, 2(fp)
  mv a1, s3
  lw a2, 0(fp)
  call mix
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; lib/kit.e16.ts:169  k++
  addi s1, s1, 1
.L3:
  li t0, 16
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

; lib/kit.e16.ts:174 mix(a, b, t) at -O1
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
  ; lib/kit.e16.ts:175  const r = mixPart(a & 31, b & 31, t)
  andi t0, s1, 31
  andi t1, s2, 31
  mv a0, t0
  mv a1, t1
  mv a2, s3
  call mixPart
  sw a0, 0(fp) ; r
  ; lib/kit.e16.ts:176  const g = mixPart((a >> 5) & 31, (b >> 5) & 31, t)
  srli t0, s1, 5
  andi t0, t0, 31
  srli t1, s2, 5
  andi t1, t1, 31
  mv a0, t0
  mv a1, t1
  mv a2, s3
  call mixPart
  sw a0, 2(fp) ; g
  ; lib/kit.e16.ts:177  const bl = mixPart((a >> 10) & 31, (b >> 10) & 31, t)
  srli t0, s1, 10
  andi t0, t0, 31
  srli t1, s2, 10
  andi t1, t1, 31
  mv a0, t0
  mv a1, t1
  mv a2, s3
  call mixPart
  sw a0, 4(fp) ; bl
  ; lib/kit.e16.ts:178  return r | (g << 5) | (bl << 10)
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

; lib/kit.e16.ts:181 mixPart(a, b, t) at -O1
;   a in a0
;   b in a1
;   t in a2
mixPart:
  ; lib/kit.e16.ts:182  return (a * (16 - t) + b * t) >> 4
  li t0, 16
  sub t0, t0, a2
  mul t0, a0, t0
  mul t1, a1, a2
  add t0, t0, t1
  srli a0, t0, 4
.return:
  ret

; lib/kit.e16.ts:188 cellAt(layer, x, y) at -O1
;   layer in a0
;   x in a1
;   y in a2
cellAt:
  ; lib/kit.e16.ts:189  return (layer === 0 ? MAP0 : MAP1) + ((y & 63) << 7) + ((x & 63) << 1)
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

; lib/kit.e16.ts:196 mapRow(b, src, layer, y) at -O1
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
  ; lib/kit.e16.ts:197  const old = bank(b)
  mv a0, s1
  call bank
  sw a0, 2(fp) ; old
  ; lib/kit.e16.ts:198  dma(src, cellAt(layer, 0, y), 128)
  mv a0, s3
  li a1, 0
  lw a2, 0(fp)
  call cellAt
  mv a1, a0
  mv a0, s2
  li a2, 128
  call dma
  ; lib/kit.e16.ts:199  poke16(IO_BANK, old)
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

; lib/kit.e16.ts:203 text(at, s, font) at -O1
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
  ; lib/kit.e16.ts:204  let c = peek(s)
  lbu s3, 0(s1)
  ; lib/kit.e16.ts:205  while (c !== 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:206  vpoke(at, font + c - 32)
  add t0, s0, s3
  mv a0, s2
  addi a1, t0, -32
  call vpoke
  ; lib/kit.e16.ts:207  at = wrap16(at + 2)
  addi s2, s2, 2
  ; lib/kit.e16.ts:208  s++
  addi s1, s1, 1
  ; lib/kit.e16.ts:209  c = peek(s)
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

; lib/kit.e16.ts:214 number(at, n, digits, zero) at -O1
;   at in s1
;   n in s3
;   digits in s2
;   zero in s0
number:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; at
  mv s3, a1 ; n
  mv s2, a2 ; digits
  mv s0, a3 ; zero
  ; lib/kit.e16.ts:215  at = wrap16(at + digits * 2)
  slli t0, s2, 1
  add s1, s1, t0
  ; lib/kit.e16.ts:216  while (digits > 0) {
  j .L3
.L1:
  ; lib/kit.e16.ts:217  at = wrap16(at - 2)
  addi s1, s1, -2
  ; lib/kit.e16.ts:218  vpoke(at, zero + (n % 10))
  li t0, 10
  remu t0, s3, t0
  add t0, s0, t0
  mv a0, s1
  mv a1, t0
  call vpoke
  ; lib/kit.e16.ts:219  n = div(n, 10)
  li t0, 10
  divu s3, s3, t0
  ; lib/kit.e16.ts:220  digits--
  addi s2, s2, -1
.L3:
  bltu zero, s2, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; lib/kit.e16.ts:232 sprBegin() at -O1
sprBegin:
  ; lib/kit.e16.ts:233  sprN = 0
  sw zero, 0x0880(zero)
.return:
  ret

; lib/kit.e16.ts:237 spr(x, y, tile, size) at -O1
;   x in a0
;   y in a1
;   tile in a2
;   size in a3
;   k in s1
spr:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/kit.e16.ts:238  if (sprN >= 128) return
  lw t0, 0x0880(zero)
  li t1, 128
  bltu t0, t1, .L1
  ; lib/kit.e16.ts:238  return
  j .return
.L1:
  ; lib/kit.e16.ts:239  const k = sprN << 2
  lw t0, 0x0880(zero)
  slli s1, t0, 2
  ; lib/kit.e16.ts:240  oam[k] = u16(x)
  slli t0, s1, 1
  sw a0, oam(t0)
  ; lib/kit.e16.ts:241  oam[k + 1] = u16(y)
  addi t0, s1, 1
  slli t0, t0, 1
  sw a1, oam(t0)
  ; lib/kit.e16.ts:242  oam[k + 2] = tile
  addi t0, s1, 2
  slli t0, t0, 1
  sw a2, oam(t0)
  ; lib/kit.e16.ts:243  oam[k + 3] = size
  addi t0, s1, 3
  slli t0, t0, 1
  sw a3, oam(t0)
  ; lib/kit.e16.ts:244  sprN++
  lw t0, 0x0880(zero)
  addi t0, t0, 1
  sw t0, 0x0880(zero)
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/kit.e16.ts:248 sprCount() at -O1
sprCount:
  ; lib/kit.e16.ts:249  return sprN
  lw a0, 0x0880(zero)
.return:
  ret

; lib/kit.e16.ts:253 sprShow() at -O1
;   k in s1
sprShow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; lib/kit.e16.ts:254  let k = sprN
  lw s1, 0x0880(zero)
  ; lib/kit.e16.ts:255  while (k < sprShown) {
  j .L3
.L1:
  ; lib/kit.e16.ts:256  oam[(k << 2) + 3] = S_NONE
  slli t0, s1, 2
  addi t0, t0, 3
  slli t0, t0, 1
  li t1, 3
  sw t1, oam(t0)
  ; lib/kit.e16.ts:257  k++
  addi s1, s1, 1
.L3:
  lw t0, 0x0882(zero)
  bltu s1, t0, .L1
  ; lib/kit.e16.ts:259  sprShown = sprN
  lw t0, 0x0880(zero)
  sw t0, 0x0882(zero)
  ; lib/kit.e16.ts:260  dma(addr(oam), OAM, 1024)
  la a0, oam
  li a1, 49152
  li a2, 1024
  call dma
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; lib/kit.e16.ts:269 padRead() at -O1
padRead:
  ; lib/kit.e16.ts:270  padWas = padIs
  lw t0, 0x0884(zero)
  sw t0, 0x0886(zero)
  ; lib/kit.e16.ts:271  padIs = peek16(PAD)
  li t0, 63504
  lw t0, 0(t0)
  sw t0, 0x0884(zero)
.return:
  ret

; lib/kit.e16.ts:275 held(mask) at -O1
;   mask in a0
held:
  ; lib/kit.e16.ts:276  return (padIs & mask) === mask
  lw t0, 0x0884(zero)
  and t0, t0, a0
  sub t0, t0, a0
  seqz a0, t0
.return:
  ret

; lib/kit.e16.ts:280 pressed(mask) at -O1
;   mask in a0
pressed:
  ; lib/kit.e16.ts:281  return (padIs & ~padWas & mask) !== 0
  lw t0, 0x0884(zero)
  lw t1, 0x0886(zero)
  not t1, t1
  and t0, t0, t1
  and t0, t0, a0
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; lib/kit.e16.ts:285 padNow() at -O1
padNow:
  ; lib/kit.e16.ts:286  return padIs
  lw a0, 0x0884(zero)
.return:
  ret

; lib/kit.e16.ts:298 kitInit() at -O1
;   old in s2
;   k in s1
kitInit:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; lib/kit.e16.ts:299  const old = bank(KIT_TABLES_BANK)
  li a0, 259
  call bank
  mv s2, a0 ; old
  ; lib/kit.e16.ts:300  let k: u16 = 0
  li s1, 0 ; k
  ; lib/kit.e16.ts:301  while (k < 256) {
  j .L3
.L1:
  ; lib/kit.e16.ts:302  sines[k] = peek16(KIT_SIN_AT + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  li t2, 49152
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, sines(t0)
  ; lib/kit.e16.ts:303  k++
  addi s1, s1, 1
.L3:
  li t0, 256
  bltu s1, t0, .L1
  ; lib/kit.e16.ts:305  k = 0
  li s1, 0 ; k
  ; lib/kit.e16.ts:306  while (k < 33) {
  j .L7
.L5:
  ; lib/kit.e16.ts:307  atans[k] = peek16(KIT_ATAN_AT + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  li t2, 49664
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, atans(t0)
  ; lib/kit.e16.ts:308  k++
  addi s1, s1, 1
.L7:
  li t0, 33
  bltu s1, t0, .L5
  ; lib/kit.e16.ts:310  poke16(IO_BANK, old)
  li t0, 65284
  sw s2, 0(t0)
  ; lib/kit.e16.ts:312  padIs = peek16(PAD)
  li t0, 63504
  lw t0, 0(t0)
  sw t0, 0x0884(zero)
  ; lib/kit.e16.ts:313  padWas = padIs
  sw t0, 0x0886(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; lib/kit.e16.ts:317 sin(a) at -O1
;   a in a0
sin:
  ; lib/kit.e16.ts:318  return i16(sines[a & 255])
  andi t0, a0, 255
  slli t0, t0, 1
  lw a0, sines(t0)
.return:
  ret

; lib/kit.e16.ts:322 cos(a) at -O1
;   a in a0
cos:
  ; lib/kit.e16.ts:323  return i16(sines[(a + 64) & 255])
  addi t0, a0, 64
  andi t0, t0, 255
  slli t0, t0, 1
  lw a0, sines(t0)
.return:
  ret

; lib/kit.e16.ts:327 aim(dx, dy) at -O1
;   dx in a0
;   dy in a1
;   ax in a3
;   ay in s1
;   a in a2
aim:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/kit.e16.ts:328  const ax = dx < 0 ? u16(-dx) : u16(dx)
  bge a0, zero, .L1
  neg t0, a0
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a3, t0 ; ax
  ; lib/kit.e16.ts:329  const ay = dy < 0 ? u16(-dy) : u16(dy)
  bge a1, zero, .L3
  neg t0, a1
  j .L4
.L3:
  mv t0, a1
.L4:
  mv s1, t0 ; ay
  ; lib/kit.e16.ts:330  if (ax === 0 && ay === 0) return 64
  bne a3, zero, .L5
  bne s1, zero, .L5
  ; lib/kit.e16.ts:330  return 64
  li a0, 64
  j .return
.L5:
  ; lib/kit.e16.ts:332  let a: u16 = 0
  li a2, 0 ; a
  ; lib/kit.e16.ts:333  if (ax >= ay) a = atans[div(ay * 32 + (ax >> 1), ax)]
  bltu a3, s1, .L6
  ; lib/kit.e16.ts:333  a = atans[div(ay * 32 + (ax >> 1), ax)]
  slli t0, s1, 5
  srli t1, a3, 1
  add t0, t0, t1
  divu t0, t0, a3
  slli t0, t0, 1
  lw a2, atans(t0)
  j .L7
.L6:
  ; lib/kit.e16.ts:334  a = 64 - atans[div(ax * 32 + (ay >> 1), ay)]
  slli t0, a3, 5
  srli t1, s1, 1
  add t0, t0, t1
  divu t0, t0, s1
  slli t0, t0, 1
  lw t0, atans(t0)
  li t1, 64
  sub a2, t1, t0
.L7:
  ; lib/kit.e16.ts:335  if (dx < 0) a = 128 - a
  bge a0, zero, .L8
  ; lib/kit.e16.ts:335  a = 128 - a
  li t0, 128
  sub a2, t0, a2
.L8:
  ; lib/kit.e16.ts:336  if (dy < 0) a = wrap16(256 - a)
  bge a1, zero, .L9
  ; lib/kit.e16.ts:336  a = wrap16(256 - a)
  li t0, 256
  sub a2, t0, a2
.L9:
  ; lib/kit.e16.ts:337  return a & 255
  andi a0, a2, 255
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/kit.e16.ts:341 rand() at -O1
;   x in a0
rand:
  ; lib/kit.e16.ts:342  let x = seed
  lw a0, 0x0aca(zero)
  ; lib/kit.e16.ts:343  x = wrap16(x ^ (x << 7))
  slli t0, a0, 7
  xor a0, a0, t0
  ; lib/kit.e16.ts:344  x = x ^ (x >> 9)
  srli t0, a0, 9
  xor a0, a0, t0
  ; lib/kit.e16.ts:345  x = wrap16(x ^ (x << 8))
  slli t0, a0, 8
  xor a0, a0, t0
  ; lib/kit.e16.ts:346  seed = x
  sw a0, 0x0aca(zero)
  ; lib/kit.e16.ts:347  return x
.return:
  ret

; lib/kit.e16.ts:351 randBelow(n) at -O1
;   n in s1
randBelow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; lib/kit.e16.ts:352  return ((rand() >> 8) * n) >> 8
  call rand
  srli t0, a0, 8
  mul t0, t0, s1
  srli a0, t0, 8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; lib/kit.e16.ts:356 randSeed(s) at -O1
;   s in a0
randSeed:
  ; lib/kit.e16.ts:357  seed = s === 0 ? 0x1d2b : s
  bne a0, zero, .L1
  li t0, 7467
  j .L2
.L1:
  mv t0, a0
.L2:
  sw t0, 0x0aca(zero)
.return:
  ret

; lib/kit.e16.ts:363 scoreAdd(at, n) at -O1
;   at in a0
;   n in a1
;   lo in a2
;   hi in a3
scoreAdd:
  ; lib/kit.e16.ts:364  let lo = peek16(at) + n
  lw t0, 0(a0)
  add a2, t0, a1
  ; lib/kit.e16.ts:365  let hi = peek16(at + 2)
  lw a3, 2(a0)
  ; lib/kit.e16.ts:366  while (lo >= 10000) {
  j .L3
.L1:
  ; lib/kit.e16.ts:367  lo = lo - 10000
  li t0, 10000
  sub a2, a2, t0
  ; lib/kit.e16.ts:368  hi++
  addi a3, a3, 1
.L3:
  li t0, 10000
  bgeu a2, t0, .L1
  ; lib/kit.e16.ts:370  if (hi > 9999) {
  li t0, 9999
  bgeu t0, a3, .L5
  ; lib/kit.e16.ts:371  hi = 9999
  li a3, 9999 ; hi
  ; lib/kit.e16.ts:372  lo = 9999
  li a2, 9999 ; lo
.L5:
  ; lib/kit.e16.ts:374  poke16(at, lo)
  sw a2, 0(a0)
  ; lib/kit.e16.ts:375  poke16(at + 2, hi)
  sw a3, 2(a0)
.return:
  ret

; lib/kit.e16.ts:379 scoreMore(a, b) at -O1
;   a in a0
;   b in a1
;   ah in a2
;   bh in a3
scoreMore:
  ; lib/kit.e16.ts:380  const ah = peek16(a + 2)
  lw a2, 2(a0)
  ; lib/kit.e16.ts:381  const bh = peek16(b + 2)
  lw a3, 2(a1)
  ; lib/kit.e16.ts:382  return ah > bh || (ah === bh && peek16(a) > peek16(b))
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

; lib/kit.e16.ts:386 scoreShow(cell, at, zero) at -O1
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
  ; lib/kit.e16.ts:387  number(cell, peek16(at + 2), 4, zero)
  lw t0, 2(s2)
  mv a0, s1
  mv a1, t0
  li a2, 4
  mv a3, s3
  call number
  ; lib/kit.e16.ts:388  number(wrap16(cell + 8), peek16(at), 4, zero)
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

; lib/kit.e16.ts:394 saveRead(off) at -O1
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
  ; lib/kit.e16.ts:395  const old = bank(SAVE_BANK)
  li a0, 128
  call bank
  mv s2, a0 ; old
  ; lib/kit.e16.ts:396  const v = peek16(WINDOW + off)
  li t0, 49152
  add t0, t0, s1
  lw s3, 0(t0)
  ; lib/kit.e16.ts:397  poke16(IO_BANK, old)
  li t0, 65284
  sw s2, 0(t0)
  ; lib/kit.e16.ts:398  return v
  mv a0, s3
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; lib/kit.e16.ts:401 saveWrite(off, v) at -O1
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
  ; lib/kit.e16.ts:402  const old = bank(SAVE_BANK)
  li a0, 128
  call bank
  mv s3, a0 ; old
  ; lib/kit.e16.ts:403  poke16(WINDOW + off, v)
  li t0, 49152
  add t0, t0, s1
  sw s2, 0(t0)
  ; lib/kit.e16.ts:404  poke16(IO_BANK, old)
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
  sw a0, 0x0c8c(zero)
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
  sw zero, 0x0c8e(zero)
  ; lib/sound.e16.ts:162  while (!opTook) at = oneOp(c, at)
  j .L3
.L1:
  ; lib/sound.e16.ts:162  at = oneOp(c, at)
  mv a0, s1
  mv a1, s2
  call oneOp
  mv s2, a0 ; at
.L3:
  lw t0, 0x0c8e(zero)
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
  sw t0, 0x0c8e(zero)
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
  sw t0, 0x0c8e(zero)
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
  sw t0, 0x0c8e(zero)
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
  sw t0, 0x0c8e(zero)
  ; lib/sound.e16.ts:185  return wrap16(at + 2)
  addi a0, s1, 2
  j .return
.L6:
  ; lib/sound.e16.ts:187  chWait[c] = peek(at + 1)
  slli t0, s2, 1
  lbu t1, 1(s1)
  sw t1, chWait(t0)
  ; lib/sound.e16.ts:188  chGate[c] = peek(at + 2) === 0 ? 0 : chWait[c] + 1
  slli t0, s2, 1
  lbu t1, 2(s1)
  addi t0, t0, chGate
  li t2, 0
  bne t1, t2, .L12
  li t1, 0
  j .L13
.L12:
  slli t1, s2, 1
  lw t1, chWait(t1)
  addi t1, t1, 1
.L13:
  sw t1, 0(t0)
  ; lib/sound.e16.ts:189  opTook = true
  li t0, 1
  sw t0, 0x0c8e(zero)
  ; lib/sound.e16.ts:190  return wrap16(at + 3)
  addi a0, s1, 3
  j .return
.L7:
  ; lib/sound.e16.ts:192  setInstrument(c, peek(at + 1))
  lbu t0, 1(s1)
  mv a0, s2
  mv a1, t0
  call setInstrument
  ; lib/sound.e16.ts:193  return wrap16(at + 2)
  addi a0, s1, 2
  j .return
.L8:
  ; lib/sound.e16.ts:195  chVol[c] = peek(at + 1)
  slli t0, s2, 1
  lbu t1, 1(s1)
  sw t1, chVol(t0)
  ; lib/sound.e16.ts:196  return wrap16(at + 2)
  addi a0, s1, 2
  j .return
.L9:
  ; lib/sound.e16.ts:198  poke16(CHSEL, c)
  li t0, 63552
  sw s2, 0(t0)
  ; lib/sound.e16.ts:199  poke16(PAN, peek(at + 1))
  lbu t0, 1(s1)
  li t1, 63560
  sw t0, 0(t1)
  ; lib/sound.e16.ts:200  return wrap16(at + 2)
  addi a0, s1, 2
  j .return
.L10:
  ; lib/sound.e16.ts:202  if (chLoop[c] !== 0xffff) return wrap16(chSong[c] + chLoop[c])
  slli t0, s2, 1
  lw t0, chLoop(t0)
  li t1, 65535
  beq t0, t1, .L14
  ; lib/sound.e16.ts:202  return wrap16(chSong[c] + chLoop[c])
  slli t0, s2, 1
  lw t0, chSong(t0)
  slli t1, s2, 1
  lw t1, chLoop(t1)
  add a0, t0, t1
  j .return
.L14:
  ; lib/sound.e16.ts:203  return endChannel(c, at)
  mv a0, s2
  mv a1, s1
  call endChannel
  j .return
.L11:
  ; lib/sound.e16.ts:206  return endChannel(c, at)
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

; lib/sound.e16.ts:210 endChannel(c, at) at -O1
;   c in a0
;   at in a1
endChannel:
  ; lib/sound.e16.ts:211  poke16(CHSEL, c)
  li t0, 63552
  sw a0, 0(t0)
  ; lib/sound.e16.ts:212  poke16(KEY, 0)
  li t0, 63566
  sw zero, 0(t0)
  ; lib/sound.e16.ts:213  chOn[c] = 0
  slli t0, a0, 1
  sw zero, chOn(t0)
  ; lib/sound.e16.ts:214  opTook = true
  li t0, 1
  sw t0, 0x0c8e(zero)
  ; lib/sound.e16.ts:215  return at
  mv a0, a1
.return:
  ret

; lib/sound.e16.ts:219 startNote(c, freq, frames, held) at -O1
;   c in a0
;   freq in a1
;   frames in a2
;   held in a3
;   quiet in s1
startNote:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; lib/sound.e16.ts:220  chLen[c] = frames
  slli t0, a0, 1
  sw a2, chLen(t0)
  ; lib/sound.e16.ts:221  chHeld[c] = held
  slli t0, a0, 1
  sw a3, chHeld(t0)
  ; lib/sound.e16.ts:222  lastFreq[c] = freq
  slli t0, a0, 1
  sw a1, lastFreq(t0)
  ; lib/sound.e16.ts:223  chWait[c] = frames
  slli t0, a0, 1
  sw a2, chWait(t0)
  ; lib/sound.e16.ts:224  chGate[c] = held
  slli t0, a0, 1
  sw a3, chGate(t0)
  ; lib/sound.e16.ts:225  chFreq[c] = freq
  slli t0, a0, 1
  sw a1, chFreq(t0)
  ; lib/sound.e16.ts:226  poke16(CHSEL, c)
  li t0, 63552
  sw a0, 0(t0)
  ; lib/sound.e16.ts:227  poke16(FREQ, freq)
  li t0, 63556
  sw a1, 0(t0)
  ; lib/sound.e16.ts:228  const quiet = c < 12 && (muted & (1 << c)) !== 0
  sltiu t0, a0, 12
  mv t1, t0
  beqz t1, .L1
  lw t0, 0x0c8c(zero)
  li t1, 1
  sll t1, t1, a0
  and t0, t0, t1
  sub t0, t0, zero
  snez t0, t0
.L1:
  mv s1, t0 ; quiet
  ; lib/sound.e16.ts:229  poke16(VOL, quiet ? 0 : (chVol[c] * chInstVol[c] + 14) >> 4)
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
  addi t1, t1, 14
  srli t1, t1, 4
.L3:
  sw t1, 0(t0)
  ; lib/sound.e16.ts:230  poke16(KEY, 1)
  li t0, 1
  li t1, 63566
  sw t0, 0(t1)
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; lib/sound.e16.ts:234 setInstrument(c, k) at -O1
;   c in a0
;   k in a1
;   song in a3
;   at in a2
setInstrument:
  ; lib/sound.e16.ts:235  const song = chSong[c]
  slli t0, a0, 1
  lw a3, chSong(t0)
  ; lib/sound.e16.ts:236  const at = song + 2 + peek(song) * 6 + k * 8
  lbu t0, 0(a3)
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  addi t1, a3, 2
  add t1, t1, t0
  slli t0, a1, 3
  add a2, t1, t0
  ; lib/sound.e16.ts:237  poke16(CHSEL, c)
  li t0, 63552
  sw a0, 0(t0)
  ; lib/sound.e16.ts:238  poke16(WAVE, peek(at))
  lbu t0, 0(a2)
  li t1, 63554
  sw t0, 0(t1)
  ; lib/sound.e16.ts:239  chInstVol[c] = peek(at + 1)
  slli t0, a0, 1
  lbu t1, 1(a2)
  sw t1, chInstVol(t0)
  ; lib/sound.e16.ts:240  poke16(ENV, peek16(at + 2))
  lw t0, 2(a2)
  li t1, 63562
  sw t0, 0(t1)
  ; lib/sound.e16.ts:241  poke16(MOD, peek16(at + 4))
  lw t0, 4(a2)
  li t1, 63564
  sw t0, 0(t1)
  ; lib/sound.e16.ts:242  poke16(PAN, peek(at + 6))
  lbu t0, 6(a2)
  li t1, 63560
  sw t0, 0(t1)
  ; lib/sound.e16.ts:243  chDrop[c] = peek(at + 7)
  slli t0, a0, 1
  lbu t1, 7(a2)
  sw t1, chDrop(t0)
.return:
  ret

; field.e16.ts:57 alloyChance(s) at -O1
;   s in a0
alloyChance:
  ; field.e16.ts:58  return s === 0 ? 3 : s === 1 ? 5 : s === 2 ? 7 : s === 3 ? 9 : 11
  bne a0, zero, .L1
  li t0, 3
  j .L2
.L1:
  li t0, 1
  bne a0, t0, .L3
  li t0, 5
  j .L4
.L3:
  li t0, 2
  bne a0, t0, .L5
  li t0, 7
  j .L6
.L5:
  li t0, 3
  bne a0, t0, .L7
  li t0, 9
  j .L8
.L7:
  li t0, 11
.L8:
.L6:
.L4:
.L2:
  mv a0, t0
.return:
  ret

; field.e16.ts:62 stratumOf(r) at -O1
;   r in a0
;   d in a1
stratumOf:
  ; field.e16.ts:63  if (r < GROUND) return 0
  li t0, 6
  bgeu a0, t0, .L1
  ; field.e16.ts:63  return 0
  li a0, 0
  ret
.L1:
  ; field.e16.ts:64  const d = r - GROUND
  addi a1, a0, -6
  ; field.e16.ts:65  return d >= 400 ? 4 : d >= 300 ? 3 : d >= 200 ? 2 : d >= 100 ? 1 : 0
  li t0, 400
  bltu a1, t0, .L2
  li t0, 4
  j .L3
.L2:
  li t0, 300
  bltu a1, t0, .L4
  li t0, 3
  j .L5
.L4:
  li t0, 200
  bltu a1, t0, .L6
  li t0, 2
  j .L7
.L6:
  li t0, 100
  bltu a1, t0, .L8
  li t0, 1
  j .L9
.L8:
  li t0, 0
.L9:
.L7:
.L5:
.L3:
  mv a0, t0
.return:
  ret

; field.e16.ts:68 cellOf(col, r) at -O1
;   col in a0
;   r in a1
cellOf:
  ; field.e16.ts:69  return ((r & 31) << 4) + col
  andi t0, a1, 31
  slli t0, t0, 4
  add a0, t0, a0
.return:
  ret

; field.e16.ts:73 rowOf(ring) at -O1
;   ring in a0
rowOf:
  ; field.e16.ts:74  return top + (wrap16(ring - top) & 31)
  lw t0, 0x10b0(zero)
  lw t1, 0x10b0(zero)
  sub t1, a0, t1
  andi t1, t1, 31
  add a0, t0, t1
.return:
  ret

; field.e16.ts:78 fieldNew() at -O1
;   k in s1
;   r in s2
fieldNew:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; field.e16.ts:79  let k: u16 = 0
  li s1, 0 ; k
  ; field.e16.ts:80  while (k < 512) {
  j .L3
.L1:
  ; field.e16.ts:81  cells[k] = T_WALL
  li t0, 15
  sb t0, cells(s1)
  ; field.e16.ts:82  marks[k] = 0
  sb zero, marks(s1)
  ; field.e16.ts:83  k++
  addi s1, s1, 1
.L3:
  li t0, 512
  bltu s1, t0, .L1
  ; field.e16.ts:85  stamp = 1
  li t0, 1
  sw t0, 0x10b2(zero)
  ; field.e16.ts:86  top = 0
  sw zero, 0x10b0(zero)
  ; field.e16.ts:87  earthFor(0)
  li a0, 0
  call earthFor
  ; field.e16.ts:88  let r: u16 = 0
  li s2, 0 ; r
  ; field.e16.ts:89  while (r < 31) {
  j .L7
.L5:
  ; field.e16.ts:90  rowMake(r)
  mv a0, s2
  call rowMake
  ; field.e16.ts:91  r++
  addi s2, s2, 1
.L7:
  li t0, 31
  bltu s2, t0, .L5
  ; field.e16.ts:94  vfill(0x8000, (TANK_TILE + 1) | (SL_PANEL << 10), 4096)
  li a0, 32768
  li a1, 7293
  li a2, 4096
  call vfill
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; field.e16.ts:98 fieldAdvance() at -O1
;   base in s2
;   c in s1
fieldAdvance:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; field.e16.ts:99  const base = (top & 31) << 4
  lw t0, 0x10b0(zero)
  andi t0, t0, 31
  slli s2, t0, 4
  ; field.e16.ts:100  let c: u16 = 0
  li s1, 0 ; c
  ; field.e16.ts:101  while (c < COLS) {
  j .L3
.L1:
  ; field.e16.ts:102  cells[base + c] = T_WALL
  add t0, s2, s1
  li t1, 15
  sb t1, cells(t0)
  ; field.e16.ts:103  c++
  addi s1, s1, 1
.L3:
  li t0, 9
  bltu s1, t0, .L1
  ; field.e16.ts:105  top++
  lw t0, 0x10b0(zero)
  addi t0, t0, 1
  sw t0, 0x10b0(zero)
  ; field.e16.ts:106  rowMake(top + 30)
  addi a0, t0, 30
  call rowMake
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; field.e16.ts:110 rowMake(r) at -O1
;   r in s1
;   base in s3
;   above in 2(fp)
;   c in s2
;   v in 0(fp)
rowMake:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; r
  ; field.e16.ts:111  const base = (r & 31) << 4
  andi t0, s1, 31
  slli s3, t0, 4
  ; field.e16.ts:112  const above = ((r - 1) & 31) << 4
  addi t0, s1, -1
  andi t0, t0, 31
  slli t0, t0, 4
  sw t0, 2(fp) ; above
  ; field.e16.ts:113  if (r === GROUND || (r > GROUND && r < CORE_ROW && (r - GROUND) % 100 === 0)) earthFor(r)
  li t0, 6
  beq s1, t0, .L2
  li t0, 6
  bgeu t0, s1, .L1
  li t0, 506
  bgeu s1, t0, .L1
  li t0, 100
  addi t1, s1, -6
  remu t1, t1, t0
  bne t1, zero, .L1
.L2:
  ; field.e16.ts:113  earthFor(r)
  mv a0, s1
  call earthFor
.L1:
  ; field.e16.ts:114  let c: u16 = 0
  li s2, 0 ; c
  ; field.e16.ts:115  while (c < COLS) {
  j .L5
.L3:
  ; field.e16.ts:116  let v: u16 = T_EMPTY
  sw zero, 0(fp) ; v
  ; field.e16.ts:117  if (r >= CORE_ROW) v = T_CORE
  li t0, 506
  bltu s1, t0, .L7
  ; field.e16.ts:117  v = T_CORE
  li t0, 7
  sw t0, 0(fp) ; v
  j .L8
.L7:
  ; field.e16.ts:118  if (r >= GROUND) v = blockFor(c, r, base, above)
  li t0, 6
  bltu s1, t0, .L9
  ; field.e16.ts:118  v = blockFor(c, r, base, above)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  lw a3, 2(fp)
  call blockFor
  sw a0, 0(fp) ; v
.L9:
.L8:
  ; field.e16.ts:119  cells[base + c] = v
  add t0, s3, s2
  lw t1, 0(fp) ; v
  sb t1, cells(t0)
  ; field.e16.ts:120  markAround(base + c)
  add a0, s3, s2
  call markAround
  ; field.e16.ts:121  c++
  addi s2, s2, 1
.L5:
  li t0, 9
  bltu s2, t0, .L3
  ; field.e16.ts:124  if (r >= GROUND + 4 && r < CORE_ROW && (r - GROUND) % 10 === 7) {
  li t0, 10
  bltu s1, t0, .L10
  li t0, 506
  bgeu s1, t0, .L10
  li t0, 10
  addi t1, s1, -6
  remu t1, t1, t0
  li t0, 7
  bne t1, t0, .L10
  ; field.e16.ts:125  cells[base + randBelow(COLS)] = T_AIR
  li a0, 9
  call randBelow
  add t0, s3, a0
  li t1, 6
  sb t1, cells(t0)
.L10:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; field.e16.ts:130 blockFor(c, r, base, above) at -O1
;   c in s1
;   r in 0(fp)
;   base in 4(fp)
;   above in 6(fp)
;   p in 2(fp)
;   left in s2
;   up in s3
blockFor:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s1, a0 ; c
  sw a1, 0(fp) ; r
  sw a2, 4(fp) ; base
  sw a3, 6(fp) ; above
  ; field.e16.ts:131  if (randBelow(100) < alloyChance(stratumOf(r))) return T_ALLOY
  li a0, 100
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  lw a0, 0(fp)
  call stratumOf
  call alloyChance
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L1
  ; field.e16.ts:131  return T_ALLOY
  li a0, 5
  j .return
.L1:
  ; field.e16.ts:132  const p = randBelow(100)
  li a0, 100
  call randBelow
  sw a0, 2(fp) ; p
  ; field.e16.ts:133  const left = c > 0 ? cells[base + c - 1] & 15 : 0
  bgeu zero, s1, .L2
  lw t0, 4(fp) ; base
  add t0, t0, s1
  lbu t0, cells-1(t0)
  andi t0, t0, 15
  j .L3
.L2:
  li t0, 0
.L3:
  mv s2, t0 ; left
  ; field.e16.ts:134  if (p < 20 && left >= T_RED && left <= T_BLUE) return left
  li t0, 20
  lw t1, 2(fp) ; p
  bgeu t1, t0, .L4
  li t0, 1
  bltu s2, t0, .L4
  li t0, 4
  bltu t0, s2, .L4
  ; field.e16.ts:134  return left
  mv a0, s2
  j .return
.L4:
  ; field.e16.ts:135  const up = r > GROUND ? cells[above + c] & 15 : 0
  li t0, 6
  lw t1, 0(fp) ; r
  bgeu t0, t1, .L5
  lw t0, 6(fp) ; above
  add t0, t0, s1
  lbu t0, cells(t0)
  andi t0, t0, 15
  j .L6
.L5:
  li t0, 0
.L6:
  mv s3, t0 ; up
  ; field.e16.ts:136  if (p < 34 && up >= T_RED && up <= T_BLUE) return up
  li t0, 34
  lw t1, 2(fp) ; p
  bgeu t1, t0, .L7
  li t0, 1
  bltu s3, t0, .L7
  li t0, 4
  bltu t0, s3, .L7
  ; field.e16.ts:136  return up
  mv a0, s3
  j .return
.L7:
  ; field.e16.ts:137  return T_RED + (rand() & 3)
  call rand
  andi t0, a0, 3
  addi a0, t0, 1
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; field.e16.ts:141 earthFor(r) at -O1
;   r in s3
;   s in s1
;   slot in s2
earthFor:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; r
  ; field.e16.ts:142  const s = stratumOf(r)
  mv a0, s3
  call stratumOf
  mv s1, a0 ; s
  ; field.e16.ts:143  const slot = (s & 1) === 0 ? SL_EARTH_A : SL_EARTH_B
  andi t0, s1, 1
  bne t0, zero, .L1
  li t0, 0
  j .L2
.L1:
  li t0, 5
.L2:
  mv s2, t0 ; slot
  ; field.e16.ts:144  palette(PAL_EARTH1 + s, slot)
  addi a0, s1, 0
  mv a1, s2
  call palette
  ; field.e16.ts:145  palKeep(PAL_EARTH1 + s, slot)
  addi a0, s1, 0
  mv a1, s2
  call palKeep
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; field.e16.ts:151 stampNext() at -O1
;   k in a0
stampNext:
  ; field.e16.ts:152  stamp++
  lw t0, 0x10b2(zero)
  addi t0, t0, 1
  sw t0, 0x10b2(zero)
  ; field.e16.ts:153  if (stamp < 128) return
  li t1, 128
  bgeu t0, t1, .L1
  ; field.e16.ts:153  return
  ret
.L1:
  ; field.e16.ts:154  let k: u16 = 0
  li a0, 0 ; k
  ; field.e16.ts:155  while (k < 512) {
  j .L4
.L2:
  ; field.e16.ts:156  marks[k] = marks[k] & 0x80
  lbu t0, marks(a0)
  andi t0, t0, 128
  sb t0, marks(a0)
  ; field.e16.ts:157  k++
  addi a0, a0, 1
.L4:
  li t0, 512
  bltu a0, t0, .L2
  ; field.e16.ts:159  stamp = 1
  li t0, 1
  sw t0, 0x10b2(zero)
.return:
  ret

; field.e16.ts:162 stamped(i) at -O1
;   i in a0
stamped:
  ; field.e16.ts:163  return (marks[i] & 127) === stamp
  lbu t0, marks(a0)
  andi t0, t0, 127
  lw t1, 0x10b2(zero)
  sub t0, t0, t1
  seqz a0, t0
.return:
  ret

; field.e16.ts:166 stampIt(i) at -O1
;   i in a0
stampIt:
  ; field.e16.ts:167  marks[i] = (marks[i] & 0x80) | stamp
  lbu t0, marks(a0)
  andi t0, t0, 128
  lw t1, 0x10b2(zero)
  or t0, t0, t1
  sb t0, marks(a0)
.return:
  ret

; field.e16.ts:173 markAround(i) at -O1
;   i in a0
;   r in a1
markAround:
  ; field.e16.ts:174  marks[(i - 17) & 511] = marks[(i - 17) & 511] | 0x80
  addi t0, a0, -17
  andi t0, t0, 511
  addi t1, a0, -17
  andi t1, t1, 511
  lbu t1, marks(t1)
  ori t1, t1, 128
  sb t1, marks(t0)
  ; field.e16.ts:175  marks[(i - 16) & 511] = marks[(i - 16) & 511] | 0x80
  addi t0, a0, -16
  andi t0, t0, 511
  addi t1, a0, -16
  andi t1, t1, 511
  lbu t1, marks(t1)
  ori t1, t1, 128
  sb t1, marks(t0)
  ; field.e16.ts:176  marks[(i - 15) & 511] = marks[(i - 15) & 511] | 0x80
  addi t0, a0, -15
  andi t0, t0, 511
  addi t1, a0, -15
  andi t1, t1, 511
  lbu t1, marks(t1)
  ori t1, t1, 128
  sb t1, marks(t0)
  ; field.e16.ts:177  marks[(i - 1) & 511] = marks[(i - 1) & 511] | 0x80
  addi t0, a0, -1
  andi t0, t0, 511
  addi t1, a0, -1
  andi t1, t1, 511
  lbu t1, marks(t1)
  ori t1, t1, 128
  sb t1, marks(t0)
  ; field.e16.ts:178  marks[i] = marks[i] | 0x80
  lbu t0, marks(a0)
  ori t0, t0, 128
  sb t0, marks(a0)
  ; field.e16.ts:179  marks[(i + 1) & 511] = marks[(i + 1) & 511] | 0x80
  addi t0, a0, 1
  andi t0, t0, 511
  addi t1, a0, 1
  andi t1, t1, 511
  lbu t1, marks(t1)
  ori t1, t1, 128
  sb t1, marks(t0)
  ; field.e16.ts:180  marks[(i + 15) & 511] = marks[(i + 15) & 511] | 0x80
  addi t0, a0, 15
  andi t0, t0, 511
  addi t1, a0, 15
  andi t1, t1, 511
  lbu t1, marks(t1)
  ori t1, t1, 128
  sb t1, marks(t0)
  ; field.e16.ts:181  marks[(i + 16) & 511] = marks[(i + 16) & 511] | 0x80
  addi t0, a0, 16
  andi t0, t0, 511
  addi t1, a0, 16
  andi t1, t1, 511
  lbu t1, marks(t1)
  ori t1, t1, 128
  sb t1, marks(t0)
  ; field.e16.ts:182  marks[(i + 17) & 511] = marks[(i + 17) & 511] | 0x80
  addi t0, a0, 17
  andi t0, t0, 511
  addi t1, a0, 17
  andi t1, t1, 511
  lbu t1, marks(t1)
  ori t1, t1, 128
  sb t1, marks(t0)
  ; field.e16.ts:183  const r = i >> 4
  srli a1, a0, 4
  ; field.e16.ts:184  rowMarked[(r - 1) & 31] = 1
  addi t0, a1, -1
  andi t0, t0, 31
  li t1, 1
  sb t1, rowMarked(t0)
  ; field.e16.ts:185  rowMarked[r] = 1
  li t0, 1
  sb t0, rowMarked(a1)
  ; field.e16.ts:186  rowMarked[(r + 1) & 31] = 1
  addi t0, a1, 1
  andi t0, t0, 31
  li t1, 1
  sb t1, rowMarked(t0)
.return:
  ret

; field.e16.ts:196 fieldDraw(from, rows, most) at -O1
;   from in s3
;   rows in 0(fp)
;   most in 2(fp)
;   r in s1
;   row in s2
fieldDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; from
  sw a1, 0(fp) ; rows
  sw a2, 2(fp) ; most
  ; field.e16.ts:197  drawLeft = most
  lw t0, 2(fp) ; most
  sw t0, 0x10b4(zero)
  ; field.e16.ts:198  let r: u16 = 0
  li s1, 0 ; r
  ; field.e16.ts:199  while (r < rows) {
  j .L3
.L1:
  ; field.e16.ts:200  const row = from + r
  add s2, s3, s1
  ; field.e16.ts:201  if (wrap16(row - top) < 31 && rowMarked[row & 31] !== 0 && rowDraw(row)) {
  lw t0, 0x10b0(zero)
  sub t0, s2, t0
  li t1, 31
  bgeu t0, t1, .L5
  andi t0, s2, 31
  lbu t0, rowMarked(t0)
  beq t0, zero, .L5
  mv a0, s2
  call rowDraw
  beqz a0, .L5
  ; field.e16.ts:202  rowMarked[row & 31] = 0
  andi t0, s2, 31
  sb zero, rowMarked(t0)
.L5:
  ; field.e16.ts:204  r++
  addi s1, s1, 1
.L3:
  lw t0, 0(fp) ; rows
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

; field.e16.ts:209 rowDraw(row) at -O1
;   row in s3
;   base in s2
;   all in s0
;   c in s1
rowDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s3, a0 ; row
  ; field.e16.ts:210  const base = (row & 31) << 4
  andi t0, s3, 31
  slli s2, t0, 4
  ; field.e16.ts:211  let all = true
  li s0, 1 ; all
  ; field.e16.ts:212  let c: u16 = 0
  li s1, 0 ; c
  ; field.e16.ts:213  while (c < COLS) {
  j .L3
.L1:
  ; field.e16.ts:214  if ((marks[base + c] & 0x80) !== 0) {
  add t0, s2, s1
  lbu t0, marks(t0)
  andi t0, t0, 128
  beq t0, zero, .L5
  ; field.e16.ts:215  if (drawLeft > 0) {
  lw t0, 0x10b4(zero)
  bgeu zero, t0, .L6
  ; field.e16.ts:216  marks[base + c] = marks[base + c] & 127
  add t0, s2, s1
  add t1, s2, s1
  lbu t1, marks(t1)
  andi t1, t1, 127
  sb t1, marks(t0)
  ; field.e16.ts:217  cellDraw(base + c, row)
  add a0, s2, s1
  mv a1, s3
  call cellDraw
  ; field.e16.ts:218  drawLeft--
  lw t0, 0x10b4(zero)
  addi t0, t0, -1
  sw t0, 0x10b4(zero)
  j .L7
.L6:
  ; field.e16.ts:219  all = false
  li s0, 0 ; all
.L7:
.L5:
  ; field.e16.ts:221  c++
  addi s1, s1, 1
.L3:
  li t0, 9
  bltu s1, t0, .L1
  ; field.e16.ts:223  return all
  mv a0, s0
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; field.e16.ts:227 cellDraw(i, row) at -O1
;   i in s3
;   row in 6(fp)
;   at in 4(fp)
;   p in s1
;   v in 0(fp)
;   t in 2(fp)
;   tile in s2
cellDraw:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s3, a0 ; i
  sw a1, 6(fp) ; row
  ; field.e16.ts:228  const at = 0x8000 + ((i & 0x1f0) << 4) + 22 + ((i & 15) << 2)
  andi t0, s3, 496
  slli t0, t0, 4
  li t1, 32768
  add t1, t1, t0
  andi t0, s3, 15
  slli t0, t0, 2
  addi t1, t1, 22
  add t1, t1, t0
  sw t1, 4(fp) ; at
  ; field.e16.ts:229  poke16(VPAGE, at >> 12)
  lw t0, 4(fp) ; at
  srli t0, t0, 12
  li t1, 63490
  sw t0, 0(t1)
  ; field.e16.ts:230  const p = VWIN + (at & 0xfff)
  lw t0, 4(fp) ; at
  andi t0, t0, 4095
  addi s1, t0, -8192
  ; field.e16.ts:231  const v = cells[i]
  lbu t0, cells(s3)
  sw t0, 0(fp) ; v
  ; field.e16.ts:232  const t = v & 15
  lw t0, 0(fp) ; v
  andi t0, t0, 15
  sw t0, 2(fp) ; t
  ; field.e16.ts:233  if (t === T_EMPTY || (v & F_LOOSE) !== 0) {
  lw t0, 2(fp) ; t
  beq t0, zero, .L2
  lw t0, 0(fp) ; v
  andi t0, t0, 128
  beq t0, zero, .L1
.L2:
  ; field.e16.ts:234  groundDraw(p, i, row)
  mv a0, s1
  mv a1, s3
  lw a2, 6(fp)
  call groundDraw
  ; field.e16.ts:235  return
  j .return
.L1:
  ; field.e16.ts:237  if (t <= T_BLUE) {
  li t0, 4
  lw t1, 2(fp) ; t
  bltu t0, t1, .L3
  ; field.e16.ts:238  blockDraw(p, i, v)
  mv a0, s1
  mv a1, s3
  lw a2, 0(fp)
  call blockDraw
  ; field.e16.ts:239  return
  j .return
.L3:
  ; field.e16.ts:241  let tile: u16 = CORE_TILE | (SL_FLASH << 10)
  li s2, 6453 ; tile
  ; field.e16.ts:242  if (t === T_ALLOY) tile = (ALLOY_TILE + ((v >> 4) & 3) * 4) | (SL_PANEL << 10)
  li t0, 5
  lw t1, 2(fp) ; t
  bne t1, t0, .L4
  ; field.e16.ts:242  tile = (ALLOY_TILE + ((v >> 4) & 3) * 4) | (SL_PANEL << 10)
  lw t0, 0(fp) ; v
  srli t0, t0, 4
  andi t0, t0, 3
  slli t0, t0, 2
  addi t0, t0, 281
  ori s2, t0, 7168
  j .L5
.L4:
  ; field.e16.ts:243  if (t === T_AIR) tile = CAPSULE_TILE | (SL_PANEL << 10)
  li t0, 6
  lw t1, 2(fp) ; t
  bne t1, t0, .L6
  ; field.e16.ts:243  tile = CAPSULE_TILE | (SL_PANEL << 10)
  li s2, 7469 ; tile
.L6:
.L5:
  ; field.e16.ts:244  poke16(p, tile)
  sw s2, 0(s1)
  ; field.e16.ts:245  poke16(p + 2, tile + 1)
  addi t0, s2, 1
  sw t0, 2(s1)
  ; field.e16.ts:246  poke16(p + 128, tile + 2)
  addi t0, s2, 2
  sw t0, 128(s1)
  ; field.e16.ts:247  poke16(p + 130, tile + 3)
  addi t0, s2, 3
  sw t0, 130(s1)
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; field.e16.ts:251 groundDraw(p, i, row) at -O1
;   p in s1
;   i in s3
;   row in 0(fp)
;   a in 2(fp)
;   l in 4(fp)
;   slot in 6(fp)
;   base in s2
groundDraw:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s1, a0 ; p
  mv s3, a1 ; i
  sw a2, 0(fp) ; row
  ; field.e16.ts:252  const a: u16 = solid(cells[(i - 16) & 511]) ? 1 : 0
  addi t0, s3, -16
  andi t0, t0, 511
  lbu a0, cells(t0)
  call solid
  beqz a0, .L1
  li t0, 1
  j .L2
.L1:
  li t0, 0
.L2:
  sw t0, 2(fp) ; a
  ; field.e16.ts:253  const l: u16 = solid(cells[(i - 1) & 511]) ? 1 : 0
  addi t0, s3, -1
  andi t0, t0, 511
  lbu a0, cells(t0)
  call solid
  beqz a0, .L3
  li t0, 1
  j .L4
.L3:
  li t0, 0
.L4:
  sw t0, 4(fp) ; l
  ; field.e16.ts:254  const slot = (stratumOf(row) & 1) === 0 ? SL_EARTH_A : SL_EARTH_B
  lw a0, 0(fp)
  call stratumOf
  andi t0, a0, 1
  bne t0, zero, .L5
  li t0, 0
  j .L6
.L5:
  li t0, 5
.L6:
  sw t0, 6(fp) ; slot
  ; field.e16.ts:255  const base = (GROUND_TILE + (((row + (i & 15) * 3) >> 1) & 1) * 9) | (slot << 10)
  andi t0, s3, 15
  slli t1, t0, 1
  add t0, t1, t0
  lw t1, 0(fp) ; row
  add t1, t1, t0
  srli t1, t1, 1
  andi t1, t1, 1
  slli t0, t1, 3
  add t1, t0, t1
  lw t0, 6(fp) ; slot
  slli t0, t0, 10
  addi t1, t1, 179
  or s2, t1, t0
  ; field.e16.ts:256  poke16(p, base + a * 2 + l)
  lw t0, 2(fp) ; a
  slli t0, t0, 1
  add t0, s2, t0
  lw t1, 4(fp) ; l
  add t0, t0, t1
  sw t0, 0(s1)
  ; field.e16.ts:257  poke16(p + 2, base + 4 + a)
  lw t0, 2(fp) ; a
  addi t1, s2, 4
  add t1, t1, t0
  sw t1, 2(s1)
  ; field.e16.ts:258  poke16(p + 128, base + 6 + l)
  lw t0, 4(fp) ; l
  addi t1, s2, 6
  add t1, t1, t0
  sw t1, 128(s1)
  ; field.e16.ts:259  poke16(p + 130, base + 8)
  addi t0, s2, 8
  sw t0, 130(s1)
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; field.e16.ts:263 solid(v) at -O1
;   v in a0
solid:
  ; field.e16.ts:264  return (v & 15) !== 0 && (v & F_LOOSE) === 0
  andi t0, a0, 15
  sub t0, t0, zero
  snez t0, t0
  mv t1, t0
  beqz t1, .L1
  andi t0, a0, 128
  sub t0, t0, zero
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; field.e16.ts:271 blockDraw(p, i, v) at -O1
;   p in s3
;   i in s1
;   v in 2(fp)
;   key in s2
;   n in 4(fp)
;   s in 6(fp)
;   w in 8(fp)
;   e in 10(fp)
;   slot in 12(fp)
;   base in 0(fp)
blockDraw:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s3, 16(sp)
  sw s1, 18(sp)
  sw s2, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  mv s3, a0 ; p
  mv s1, a1 ; i
  sw a2, 2(fp) ; v
  ; field.e16.ts:272  const key = v & 0xcf
  lw t0, 2(fp) ; v
  andi s2, t0, 207
  ; field.e16.ts:273  const n = like(i - 16, key)
  addi a0, s1, -16
  mv a1, s2
  call like
  sw a0, 4(fp) ; n
  ; field.e16.ts:274  const s = like(i + 16, key)
  addi a0, s1, 16
  mv a1, s2
  call like
  sw a0, 6(fp) ; s
  ; field.e16.ts:275  const w = like(i - 1, key)
  addi a0, s1, -1
  mv a1, s2
  call like
  sw a0, 8(fp) ; w
  ; field.e16.ts:276  const e = like(i + 1, key)
  addi a0, s1, 1
  mv a1, s2
  call like
  sw a0, 10(fp) ; e
  ; field.e16.ts:277  const slot = (v & F_PEND) !== 0 ? SL_FLASH : v & 15
  lw t0, 2(fp) ; v
  andi t0, t0, 64
  beq t0, zero, .L1
  li t0, 6
  j .L2
.L1:
  lw t0, 2(fp) ; v
  andi t0, t0, 15
.L2:
  sw t0, 12(fp) ; slot
  ; field.e16.ts:278  const base = QUARTERS_TILE | (slot << 10)
  lw t0, 12(fp) ; slot
  slli t0, t0, 10
  li t1, 159
  or t1, t1, t0
  sw t1, 0(fp) ; base
  ; field.e16.ts:279  poke16(p, base + quarter(n, w, like(i - 17, key)))
  addi a0, s1, -17
  mv a1, s2
  call like
  lw a1, 8(fp)
  mv a2, a0
  lw a0, 4(fp)
  call quarter
  lw t0, 0(fp) ; base
  add t0, t0, a0
  sw t0, 0(s3)
  ; field.e16.ts:280  poke16(p + 2, base + 5 + quarter(n, e, like(i - 15, key)))
  lw t0, 0(fp) ; base
  addi t0, t0, 5
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s1, -15
  mv a1, s2
  call like
  lw a1, 10(fp)
  mv a2, a0
  lw a0, 4(fp)
  call quarter
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 2(s3)
  ; field.e16.ts:281  poke16(p + 128, base + 10 + quarter(s, w, like(i + 15, key)))
  lw t0, 0(fp) ; base
  addi t0, t0, 10
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s1, 15
  mv a1, s2
  call like
  lw a1, 8(fp)
  mv a2, a0
  lw a0, 6(fp)
  call quarter
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 128(s3)
  ; field.e16.ts:282  poke16(p + 130, base + 15 + quarter(s, e, like(i + 17, key)))
  lw t0, 0(fp) ; base
  addi t0, t0, 15
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s1, 17
  mv a1, s2
  call like
  lw a1, 10(fp)
  mv a2, a0
  lw a0, 6(fp)
  call quarter
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 130(s3)
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s3, 16(sp)
  lw s1, 18(sp)
  lw s2, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; field.e16.ts:285 like(i, key) at -O1
;   i in a0
;   key in a1
like:
  ; field.e16.ts:286  return (cells[i & 511] & 0xcf) === key ? 1 : 0
  andi t0, a0, 511
  lbu t0, cells(t0)
  andi t0, t0, 207
  bne t0, a1, .L1
  li t0, 1
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  ret

; field.e16.ts:290 quarter(v, h, d) at -O1
;   v in a0
;   h in a1
;   d in a2
quarter:
  ; field.e16.ts:291  if (v !== 0) {
  beq a0, zero, .L1
  ; field.e16.ts:292  if (h !== 0) return d !== 0 ? 4 : 3
  beq a1, zero, .L2
  ; field.e16.ts:292  return d !== 0 ? 4 : 3
  beq a2, zero, .L3
  li t0, 4
  j .L4
.L3:
  li t0, 3
.L4:
  mv a0, t0
  ret
.L2:
  ; field.e16.ts:293  return 1
  li a0, 1
  ret
.L1:
  ; field.e16.ts:295  return h !== 0 ? 2 : 0
  beq a1, zero, .L5
  li t0, 2
  j .L6
.L5:
  li t0, 0
.L6:
  mv a0, t0
.return:
  ret

; field.e16.ts:299 markAll() at -O1
;   k in a0
markAll:
  ; field.e16.ts:300  let k: u16 = 0
  li a0, 0 ; k
  ; field.e16.ts:301  while (k < 512) {
  j .L3
.L1:
  ; field.e16.ts:302  marks[k] = marks[k] | 0x80
  lbu t0, marks(a0)
  ori t0, t0, 128
  sb t0, marks(a0)
  ; field.e16.ts:303  k++
  addi a0, a0, 1
.L3:
  li t0, 512
  bltu a0, t0, .L1
  ; field.e16.ts:305  k = 0
  li a0, 0 ; k
  ; field.e16.ts:306  while (k < 32) {
  j .L7
.L5:
  ; field.e16.ts:307  rowMarked[k] = 1
  li t0, 1
  sb t0, rowMarked(a0)
  ; field.e16.ts:308  k++
  addi a0, a0, 1
.L7:
  li t0, 32
  bltu a0, t0, .L5
.return:
  ret

; field.e16.ts:313 inField(i) at -O1
;   i in a0
inField:
  ; field.e16.ts:314  return (i & 15) < COLS && (wrap16((i >> 4) - (top & 31)) & 31) !== 31
  andi t0, a0, 15
  sltiu t0, t0, 9
  mv t1, t0
  beqz t1, .L1
  srli t0, a0, 4
  lw t1, 0x10b0(zero)
  andi t1, t1, 31
  sub t0, t0, t1
  andi t0, t0, 31
  li t1, 31
  sub t0, t0, t1
  snez t0, t0
.L1:
  mv a0, t0
.return:
  ret

; field.e16.ts:318 rowIn(r) at -O1
;   r in a0
rowIn:
  ; field.e16.ts:319  return wrap16(r - top)
  lw t0, 0x10b0(zero)
  sub a0, a0, t0
.return:
  ret

; fall.e16.ts:48 groupOf(start) at -O1
;   start in s0
;   key in s1
;   k in s2
;   i in s3
groupOf:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s0, a0 ; start
  ; fall.e16.ts:49  stampNext()
  call stampNext
  ; fall.e16.ts:50  found[0] = start
  sw s0, found(zero)
  ; fall.e16.ts:51  stampIt(start)
  mv a0, s0
  call stampIt
  ; fall.e16.ts:52  foundN = 1
  li t0, 1
  sw t0, 0x12e6(zero)
  ; fall.e16.ts:53  const key = cells[start]
  lbu s1, cells(s0)
  ; fall.e16.ts:54  if ((key & 15) > T_BLUE) return 1
  andi t0, s1, 15
  li t1, 4
  bgeu t1, t0, .L1
  ; fall.e16.ts:54  return 1
  li a0, 1
  j .return
.L1:
  ; fall.e16.ts:55  let k: u16 = 0
  li s2, 0 ; k
  ; fall.e16.ts:56  while (k < foundN) {
  j .L4
.L2:
  ; fall.e16.ts:57  const i = found[k]
  slli t0, s2, 1
  lw s3, found(t0)
  ; fall.e16.ts:58  k++
  addi s2, s2, 1
  ; fall.e16.ts:59  reach((i - 16) & 511, key)
  addi t0, s3, -16
  andi a0, t0, 511
  mv a1, s1
  call reach
  ; fall.e16.ts:60  reach((i + 16) & 511, key)
  addi t0, s3, 16
  andi a0, t0, 511
  mv a1, s1
  call reach
  ; fall.e16.ts:61  reach((i - 1) & 511, key)
  addi t0, s3, -1
  andi a0, t0, 511
  mv a1, s1
  call reach
  ; fall.e16.ts:62  reach((i + 1) & 511, key)
  addi t0, s3, 1
  andi a0, t0, 511
  mv a1, s1
  call reach
.L4:
  lw t0, 0x12e6(zero)
  bltu s2, t0, .L2
  ; fall.e16.ts:64  return foundN
  lw a0, 0x12e6(zero)
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; fall.e16.ts:67 reach(i, key) at -O1
;   i in s1
;   key in s2
reach:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; key
  ; fall.e16.ts:68  if (cells[i] !== key || stamped(i) || foundN >= 280) return
  lbu t0, cells(s1)
  bne t0, s2, .L2
  mv a0, s1
  call stamped
  bnez a0, .L2
  lw t0, 0x12e6(zero)
  li t1, 280
  bltu t0, t1, .L1
.L2:
  ; fall.e16.ts:68  return
  j .return
.L1:
  ; fall.e16.ts:69  stampIt(i)
  mv a0, s1
  call stampIt
  ; fall.e16.ts:70  found[foundN] = i
  lw t0, 0x12e6(zero)
  slli t0, t0, 1
  sw s1, found(t0)
  ; fall.e16.ts:71  foundN++
  lw t0, 0x12e6(zero)
  addi t0, t0, 1
  sw t0, 0x12e6(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; fall.e16.ts:96 groupNew() at -O1
;   n in a0
;   g in a1
groupNew:
  ; fall.e16.ts:97  let n: u16 = 0
  li a0, 0 ; n
  ; fall.e16.ts:98  while (n < G_N) {
  j .L3
.L1:
  ; fall.e16.ts:99  const g = gNext
  lw a1, 0x181a(zero)
  ; fall.e16.ts:100  gNext = gNext + 1 === G_N ? 0 : gNext + 1
  lw t0, 0x181a(zero)
  li t1, 48
  addi t0, t0, 1
  bne t0, t1, .L5
  li t0, 0
  j .L6
.L5:
  lw t0, 0x181a(zero)
  addi t0, t0, 1
.L6:
  sw t0, 0x181a(zero)
  ; fall.e16.ts:101  if (gSize[g] === 0) return g
  slli t0, a1, 1
  lw t0, gSize(t0)
  bne t0, zero, .L7
  ; fall.e16.ts:101  return g
  mv a0, a1
  ret
.L7:
  ; fall.e16.ts:102  n++
  addi a0, a0, 1
.L3:
  li t0, 48
  bltu a0, t0, .L1
  ; fall.e16.ts:104  return 0xff
  li a0, 255
.return:
  ret

; fall.e16.ts:121 fallPace(wobble, speed) at -O1
;   wobble in a0
;   speed in a1
fallPace:
  ; fall.e16.ts:122  wobbleFrames = wobble
  sw a0, 0x187c(zero)
  ; fall.e16.ts:123  fallSpeed = speed
  sw a1, 0x187e(zero)
.return:
  ret

; fall.e16.ts:131 targetIs(cell) at -O1
;   cell in a0
targetIs:
  ; fall.e16.ts:132  target = cell
  sw a0, 0x1880(zero)
.return:
  ret

; fall.e16.ts:135 struckClear() at -O1
struckClear:
  ; fall.e16.ts:136  struck = 0
  sw zero, 0x1882(zero)
.return:
  ret

; fall.e16.ts:140 fallQuiet() at -O1
fallQuiet:
  ; fall.e16.ts:141  return lbN === 0 && pendN === 0 && landN === 0 && susHead === susTail
  lw t0, 0x1588(zero)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L3
  lw t0, 0x1c96(zero)
  sub t0, t0, zero
  seqz t0, t0
.L3:
  mv t1, t0
  beqz t1, .L2
  lw t0, 0x1a08(zero)
  sub t0, t0, zero
  seqz t0, t0
.L2:
  mv t1, t0
  beqz t1, .L1
  lw t0, 0x1984(zero)
  lw t1, 0x1986(zero)
  sub t0, t0, t1
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; fall.e16.ts:144 fallClear() at -O1
;   k in a0
fallClear:
  ; fall.e16.ts:145  let k: u16 = 0
  li a0, 0 ; k
  ; fall.e16.ts:146  while (k < 512) {
  j .L3
.L1:
  ; fall.e16.ts:147  lbAt[k] = 0
  sb zero, lbAt(a0)
  ; fall.e16.ts:148  k++
  addi a0, a0, 1
.L3:
  li t0, 512
  bltu a0, t0, .L1
  ; fall.e16.ts:150  k = 0
  li a0, 0 ; k
  ; fall.e16.ts:151  while (k < U_N) {
  j .L7
.L5:
  ; fall.e16.ts:152  uState[k] = U_FREE
  slli t0, a0, 1
  sw zero, uState(t0)
  ; fall.e16.ts:153  uSize[k] = 0
  slli t0, a0, 1
  sw zero, uSize(t0)
  ; fall.e16.ts:154  k++
  addi a0, a0, 1
.L7:
  li t0, 12
  bltu a0, t0, .L5
  ; fall.e16.ts:156  k = 0
  li a0, 0 ; k
  ; fall.e16.ts:157  while (k < G_N) {
  j .L11
.L9:
  ; fall.e16.ts:158  gSize[k] = 0
  slli t0, a0, 1
  sw zero, gSize(t0)
  ; fall.e16.ts:159  k++
  addi a0, a0, 1
.L11:
  li t0, 48
  bltu a0, t0, .L9
  ; fall.e16.ts:161  lbN = 0
  sw zero, 0x1588(zero)
  ; fall.e16.ts:162  pendN = 0
  sw zero, 0x1c96(zero)
  ; fall.e16.ts:163  susHead = 0
  sw zero, 0x1984(zero)
  ; fall.e16.ts:164  susTail = 0
  sw zero, 0x1986(zero)
  ; fall.e16.ts:165  landN = 0
  sw zero, 0x1a08(zero)
  ; fall.e16.ts:166  chain = 0
  sw zero, 0x1a0a(zero)
  ; fall.e16.ts:167  struck = 0
  sw zero, 0x1882(zero)
.return:
  ret

; fall.e16.ts:170 unitNew() at -O1
;   u in a0
unitNew:
  ; fall.e16.ts:171  let u: u16 = 0
  li a0, 0 ; u
  ; fall.e16.ts:172  while (u < U_N) {
  j .L3
.L1:
  ; fall.e16.ts:173  if (uState[u] === U_FREE) {
  slli t0, a0, 1
  lw t0, uState(t0)
  bne t0, zero, .L5
  ; fall.e16.ts:174  uState[u] = U_WOBBLE
  slli t0, a0, 1
  li t1, 1
  sw t1, uState(t0)
  ; fall.e16.ts:175  uTime[u] = wobbleFrames
  slli t0, a0, 1
  lw t1, 0x187c(zero)
  sw t1, uTime(t0)
  ; fall.e16.ts:176  uOff[u] = 0
  slli t0, a0, 1
  sw zero, uOff(t0)
  ; fall.e16.ts:177  uSize[u] = 0
  slli t0, a0, 1
  sw zero, uSize(t0)
  ; fall.e16.ts:178  return u
  ret
.L5:
  ; fall.e16.ts:180  u++
  addi a0, a0, 1
.L3:
  li t0, 12
  bltu a0, t0, .L1
  ; fall.e16.ts:182  return 0xff
  li a0, 255
.return:
  ret

; fall.e16.ts:191 suspect(i) at -O1
;   i in a0
;   next in a1
suspect:
  ; fall.e16.ts:192  const next = (susTail + 1) & 127
  lw t0, 0x1986(zero)
  addi t0, t0, 1
  andi a1, t0, 127
  ; fall.e16.ts:193  if (next === susHead) return
  lw t0, 0x1984(zero)
  bne a1, t0, .L1
  ; fall.e16.ts:193  return
  ret
.L1:
  ; fall.e16.ts:194  sus[susTail] = i
  lw t0, 0x1986(zero)
  slli t0, t0, 1
  sw a0, sus(t0)
  ; fall.e16.ts:195  susTail = next
  sw a1, 0x1986(zero)
.return:
  ret

; fall.e16.ts:199 suspectsStep(budget) at -O1
;   budget in s3
;   spent in s1
;   i in s0
;   cost in s2
suspectsStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; budget
  ; fall.e16.ts:200  let spent: u16 = 0
  li s1, 0 ; spent
  ; fall.e16.ts:201  while (susHead !== susTail && spent < budget) {
  j .L3
.L1:
  ; fall.e16.ts:202  const i = sus[susHead]
  lw t0, 0x1984(zero)
  slli t0, t0, 1
  lw s0, sus(t0)
  ; fall.e16.ts:203  susHead = (susHead + 1) & 127
  lw t0, 0x1984(zero)
  addi t0, t0, 1
  andi t0, t0, 127
  sw t0, 0x1984(zero)
  ; fall.e16.ts:204  const cost = footing(i)
  mv a0, s0
  call footing
  mv s2, a0 ; cost
  ; fall.e16.ts:206  if (cost === FULL) return
  li t0, 65535
  bne s2, t0, .L5
  ; fall.e16.ts:206  return
  j .return
.L5:
  ; fall.e16.ts:207  spent = spent + cost
  add s1, s1, s2
.L3:
  lw t0, 0x1984(zero)
  lw t1, 0x1986(zero)
  beq t0, t1, .L6
  bltu s1, s3, .L1
.L6:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; fall.e16.ts:221 underneath(n) at -O1
;   n in 4(fp)
;   join in s3
;   k in s1
;   ceiling in 6(fp)
;   below in s2
;   bv in 0(fp)
;   u in 2(fp)
underneath:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 4(fp) ; n
  ; fall.e16.ts:222  let join: u16 = 0xff
  li s3, 255 ; join
  ; fall.e16.ts:223  let k: u16 = 0
  li s1, 0 ; k
  ; fall.e16.ts:224  const ceiling = top & 31
  lw t0, 0x10b0(zero)
  andi t0, t0, 31
  sw t0, 6(fp) ; ceiling
  ; fall.e16.ts:225  while (k < n) {
  j .L3
.L1:
  ; fall.e16.ts:227  if (found[k] >> 4 === ceiling) return HELD
  slli t0, s1, 1
  lw t0, found(t0)
  srli t0, t0, 4
  lw t1, 6(fp) ; ceiling
  bne t0, t1, .L5
  ; fall.e16.ts:227  return HELD
  li a0, 254
  j .return
.L5:
  ; fall.e16.ts:228  const below = (found[k] + 16) & 511
  slli t0, s1, 1
  lw t0, found(t0)
  addi t0, t0, 16
  andi s2, t0, 511
  ; fall.e16.ts:229  const bv = cells[below]
  lbu t0, cells(s2)
  sw t0, 0(fp) ; bv
  ; fall.e16.ts:230  if ((bv & 15) !== 0 && !stamped(below)) {
  lw t0, 0(fp) ; bv
  andi t0, t0, 15
  beq t0, zero, .L6
  mv a0, s2
  call stamped
  bnez a0, .L6
  ; fall.e16.ts:231  if ((bv & F_LOOSE) === 0) return HELD
  lw t0, 0(fp) ; bv
  andi t0, t0, 128
  bne t0, zero, .L7
  ; fall.e16.ts:231  return HELD
  li a0, 254
  j .return
.L7:
  ; fall.e16.ts:232  const u = lbUnit[lbAt[below] - 1]
  lbu t0, lbAt(s2)
  lbu t0, lbUnit-1(t0)
  sw t0, 2(fp) ; u
  ; fall.e16.ts:233  if (uState[u] === U_WOBBLE) join = u
  lw t0, 2(fp) ; u
  slli t0, t0, 1
  lw t0, uState(t0)
  li t1, 1
  bne t0, t1, .L8
  ; fall.e16.ts:233  join = u
  lw s3, 2(fp) ; u
.L8:
.L6:
  ; fall.e16.ts:235  k++
  addi s1, s1, 1
.L3:
  lw t0, 4(fp) ; n
  bltu s1, t0, .L1
  ; fall.e16.ts:237  return join
  mv a0, s3
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; fall.e16.ts:241 footing(i) at -O1
;   i in s2
;   v in 0(fp)
;   t in 2(fp)
;   n in s1
;   join in s3
;   g in 4(fp)
;   u in 6(fp)
footing:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s2, a0 ; i
  ; fall.e16.ts:242  const v = cells[i]
  lbu t0, cells(s2)
  sw t0, 0(fp) ; v
  ; fall.e16.ts:243  const t = v & 15
  lw t0, 0(fp) ; v
  andi t0, t0, 15
  sw t0, 2(fp) ; t
  ; fall.e16.ts:244  if (t === T_EMPTY || t >= T_CORE || (v & (F_LOOSE | F_PEND)) !== 0) return 2
  lw t0, 2(fp) ; t
  beq t0, zero, .L2
  li t0, 7
  lw t1, 2(fp) ; t
  bgeu t1, t0, .L2
  lw t0, 0(fp) ; v
  andi t0, t0, 192
  beq t0, zero, .L1
.L2:
  ; fall.e16.ts:244  return 2
  li a0, 2
  j .return
.L1:
  ; fall.e16.ts:245  const n = groupOf(i)
  mv a0, s2
  call groupOf
  mv s1, a0 ; n
  ; fall.e16.ts:246  const join = underneath(n)
  mv a0, s1
  call underneath
  mv s3, a0 ; join
  ; fall.e16.ts:247  if (join === HELD) return n + 4
  li t0, 254
  bne s3, t0, .L3
  ; fall.e16.ts:247  return n + 4
  addi a0, s1, 4
  j .return
.L3:
  ; fall.e16.ts:248  if (lbN + n > LB_N) {
  lw t0, 0x1588(zero)
  add t0, t0, s1
  li t1, 96
  bgeu t1, t0, .L4
  ; fall.e16.ts:250  suspect(i)
  mv a0, s2
  call suspect
  ; fall.e16.ts:251  return FULL
  li a0, 65535
  j .return
.L4:
  ; fall.e16.ts:253  const g = groupNew()
  call groupNew
  sw a0, 4(fp) ; g
  ; fall.e16.ts:254  const u = g === 0xff ? 0xff : join !== 0xff ? join : unitNew()
  li t0, 255
  lw t1, 4(fp) ; g
  bne t1, t0, .L5
  li t0, 255
  j .L6
.L5:
  li t0, 255
  beq s3, t0, .L7
  mv t0, s3
  j .L8
.L7:
  call unitNew
  mv t0, a0
.L8:
.L6:
  sw t0, 6(fp) ; u
  ; fall.e16.ts:255  if (u === 0xff) {
  li t0, 255
  lw t1, 6(fp) ; u
  bne t1, t0, .L9
  ; fall.e16.ts:256  suspect(i)
  mv a0, s2
  call suspect
  ; fall.e16.ts:257  return FULL
  li a0, 65535
  j .return
.L9:
  ; fall.e16.ts:259  if (join === 0xff) loosened++
  li t0, 255
  bne s3, t0, .L10
  ; fall.e16.ts:259  loosened++
  lw t0, 0x1a14(zero)
  addi t0, t0, 1
  sw t0, 0x1a14(zero)
.L10:
  ; fall.e16.ts:260  loosen(n, u, g)
  mv a0, s1
  lw a1, 6(fp)
  lw a2, 4(fp)
  call loosen
  ; fall.e16.ts:262  return n * 4 + 16
  slli t0, s1, 2
  addi a0, t0, 16
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s2, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; fall.e16.ts:266 loosen(n, u, g) at -O1
;   n in s3
;   u in 0(fp)
;   g in 2(fp)
;   first in 4(fp)
;   k in s1
;   c/above in s2
loosen:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s3, a0 ; n
  sw a1, 0(fp) ; u
  sw a2, 2(fp) ; g
  ; fall.e16.ts:267  const first = lbN
  lw t0, 0x1588(zero)
  sw t0, 4(fp) ; first
  ; fall.e16.ts:268  let k: u16 = 0
  li s1, 0 ; k
  ; fall.e16.ts:269  while (k < n) {
  j .L3
.L1:
  ; fall.e16.ts:270  const c = found[k]
  slli t0, s1, 1
  lw s2, found(t0)
  ; fall.e16.ts:271  cells[c] = cells[c] | F_LOOSE
  lbu t0, cells(s2)
  ori t0, t0, 128
  sb t0, cells(s2)
  ; fall.e16.ts:272  lbCell[lbN] = c
  lw t0, 0x1588(zero)
  slli t0, t0, 1
  sw s2, lbCell(t0)
  ; fall.e16.ts:273  lbGroup[lbN] = g
  lw t0, 0x1588(zero)
  lw t1, 2(fp) ; g
  sb t1, lbGroup(t0)
  ; fall.e16.ts:274  lbUnit[lbN] = u
  lw t0, 0x1588(zero)
  lw t1, 0(fp) ; u
  sb t1, lbUnit(t0)
  ; fall.e16.ts:275  lbN++
  lw t0, 0x1588(zero)
  addi t0, t0, 1
  sw t0, 0x1588(zero)
  ; fall.e16.ts:276  lbAt[c] = lbN
  lw t0, 0x1588(zero)
  sb t0, lbAt(s2)
  ; fall.e16.ts:277  markAround(c)
  mv a0, s2
  call markAround
  ; fall.e16.ts:278  k++
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
  ; fall.e16.ts:282  k = first
  lw s1, 4(fp) ; first
  ; fall.e16.ts:283  while (k < lbN) {
  j .L7
.L5:
  ; fall.e16.ts:284  lbTile[k] = looseTile(lbCell[k], g)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, lbCell(t1)
  addi t0, t0, lbTile
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  lw a1, 2(fp)
  call looseTile
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; fall.e16.ts:285  k++
  addi s1, s1, 1
.L7:
  lw t0, 0x1588(zero)
  bltu s1, t0, .L5
  ; fall.e16.ts:287  gSize[g] = n
  lw t0, 2(fp) ; g
  slli t0, t0, 1
  sw s3, gSize(t0)
  ; fall.e16.ts:288  uSize[u] = uSize[u] + n
  lw t0, 0(fp) ; u
  slli t0, t0, 1
  lw t1, 0(fp) ; u
  slli t1, t1, 1
  lw t1, uSize(t1)
  add t1, t1, s3
  sw t1, uSize(t0)
  ; fall.e16.ts:289  k = 0
  li s1, 0 ; k
  ; fall.e16.ts:290  while (k < n) {
  j .L11
.L9:
  ; fall.e16.ts:291  const above = (found[k] - 16) & 511
  slli t0, s1, 1
  lw t0, found(t0)
  addi t0, t0, -16
  andi s2, t0, 511
  ; fall.e16.ts:292  if (!stamped(above)) suspect(above)
  mv a0, s2
  call stamped
  bnez a0, .L13
  ; fall.e16.ts:292  suspect(above)
  mv a0, s2
  call suspect
.L13:
  ; fall.e16.ts:293  k++
  addi s1, s1, 1
.L11:
  bltu s1, s3, .L9
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; fall.e16.ts:298 looseTile(c, g) at -O1
;   c in s2
;   g in s3
;   v in 2(fp)
;   t in 0(fp)
;   m in s1
looseTile:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; c
  mv s3, a1 ; g
  ; fall.e16.ts:299  const v = cells[c]
  lbu t0, cells(s2)
  sw t0, 2(fp) ; v
  ; fall.e16.ts:300  const t = v & 15
  lw t0, 2(fp) ; v
  andi t0, t0, 15
  sw t0, 0(fp) ; t
  ; fall.e16.ts:301  if (t === T_ALLOY) return (ALLOY_TILE + ((v >> 4) & 3) * 4) | (5 << 10)
  li t0, 5
  lw t1, 0(fp) ; t
  bne t1, t0, .L1
  ; fall.e16.ts:301  return (ALLOY_TILE + ((v >> 4) & 3) * 4) | (5 << 10)
  lw t0, 2(fp) ; v
  srli t0, t0, 4
  andi t0, t0, 3
  slli t0, t0, 2
  addi t0, t0, 281
  ori a0, t0, 5120
  j .return
.L1:
  ; fall.e16.ts:302  if (t === T_AIR) return CAPSULE_TILE | (5 << 10)
  li t0, 6
  lw t1, 0(fp) ; t
  bne t1, t0, .L2
  ; fall.e16.ts:302  return CAPSULE_TILE | (5 << 10)
  li a0, 5421
  j .return
.L2:
  ; fall.e16.ts:303  let m: u16 = 0
  li s1, 0 ; m
  ; fall.e16.ts:304  if (kin((c - 16) & 511, g)) m = m | 1
  addi t0, s2, -16
  andi a0, t0, 511
  mv a1, s3
  call kin
  beqz a0, .L3
  ; fall.e16.ts:304  m = m | 1
  ori s1, s1, 1
.L3:
  ; fall.e16.ts:305  if (kin((c + 1) & 511, g)) m = m | 2
  addi t0, s2, 1
  andi a0, t0, 511
  mv a1, s3
  call kin
  beqz a0, .L4
  ; fall.e16.ts:305  m = m | 2
  ori s1, s1, 2
.L4:
  ; fall.e16.ts:306  if (kin((c + 16) & 511, g)) m = m | 4
  addi t0, s2, 16
  andi a0, t0, 511
  mv a1, s3
  call kin
  beqz a0, .L5
  ; fall.e16.ts:306  m = m | 4
  ori s1, s1, 4
.L5:
  ; fall.e16.ts:307  if (kin((c - 1) & 511, g)) m = m | 8
  addi t0, s2, -1
  andi a0, t0, 511
  mv a1, s3
  call kin
  beqz a0, .L6
  ; fall.e16.ts:307  m = m | 8
  ori s1, s1, 8
.L6:
  ; fall.e16.ts:308  return (LOOSE_TILE + m * 4) | (t << 10)
  slli t0, s1, 2
  lw t1, 0(fp) ; t
  slli t1, t1, 10
  addi t0, t0, 197
  or a0, t0, t1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fall.e16.ts:311 kin(c, g) at -O1
;   c in a0
;   g in a1
;   j in a2
kin:
  ; fall.e16.ts:312  const j = lbAt[c]
  lbu a2, lbAt(a0)
  ; fall.e16.ts:313  return j !== 0 && lbGroup[j - 1] === g
  sub t0, a2, zero
  snez t0, t0
  mv t1, t0
  beqz t1, .L1
  lbu t0, lbGroup-1(a2)
  sub t0, t0, a1
  seqz t0, t0
.L1:
  mv a0, t0
.return:
  ret

; fall.e16.ts:319 unitsStep() at -O1
;   u in s1
;   s in s2
unitsStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; fall.e16.ts:320  let u: u16 = 0
  li s1, 0 ; u
  ; fall.e16.ts:321  while (u < U_N) {
  j .L3
.L1:
  ; fall.e16.ts:322  const s = uState[u]
  slli t0, s1, 1
  lw s2, uState(t0)
  ; fall.e16.ts:323  if (s === U_WOBBLE) wobbleStep(u)
  li t0, 1
  bne s2, t0, .L5
  ; fall.e16.ts:323  wobbleStep(u)
  mv a0, s1
  call wobbleStep
  j .L6
.L5:
  ; fall.e16.ts:324  if (s === U_FALL) fallStep(u)
  li t0, 2
  bne s2, t0, .L7
  ; fall.e16.ts:324  fallStep(u)
  mv a0, s1
  call fallStep
.L7:
.L6:
  ; fall.e16.ts:325  u++
  addi s1, s1, 1
.L3:
  li t0, 12
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; fall.e16.ts:329 wobbleStep(u) at -O1
;   u in s1
wobbleStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; u
  ; fall.e16.ts:330  if (uTime[u] > 0) {
  slli t0, s1, 1
  lw t0, uTime(t0)
  bgeu zero, t0, .L1
  ; fall.e16.ts:331  uTime[u] = uTime[u] - 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, uTime(t1)
  addi t1, t1, -1
  sw t1, uTime(t0)
  ; fall.e16.ts:332  return
  j .return
.L1:
  ; fall.e16.ts:334  settle(u)
  mv a0, s1
  call settle
  ; fall.e16.ts:335  if (uState[u] !== U_FREE) {
  slli t0, s1, 1
  lw t0, uState(t0)
  beq t0, zero, .L2
  ; fall.e16.ts:336  uState[u] = U_FALL
  slli t0, s1, 1
  li t1, 2
  sw t1, uState(t0)
  ; fall.e16.ts:337  uOff[u] = 0
  slli t0, s1, 1
  sw zero, uOff(t0)
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; fall.e16.ts:341 fallStep(u) at -O1
;   u in s1
;   off in s2
;   v in s3
fallStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; u
  ; fall.e16.ts:342  let off = uOff[u] + fallSpeed
  slli t0, s1, 1
  lw t0, uOff(t0)
  lw t1, 0x187e(zero)
  add s2, t0, t1
  ; fall.e16.ts:344  if (off >= 32 && target !== 0xffff) strikeCheck(u)
  li t0, 32
  bltu s2, t0, .L1
  lw t0, 0x1880(zero)
  li t1, 65535
  beq t0, t1, .L1
  ; fall.e16.ts:344  strikeCheck(u)
  mv a0, s1
  call strikeCheck
.L1:
  ; fall.e16.ts:345  if (off < 64) {
  li t0, 64
  bgeu s2, t0, .L2
  ; fall.e16.ts:346  uOff[u] = off
  slli t0, s1, 1
  sw s2, uOff(t0)
  ; fall.e16.ts:347  return
  j .return
.L2:
  ; fall.e16.ts:351  const v = blocker(u)
  mv a0, s1
  call blocker
  mv s3, a0 ; v
  ; fall.e16.ts:352  if (v !== 0xff) {
  li t0, 255
  beq s3, t0, .L3
  ; fall.e16.ts:355  if (uState[v] === U_FALL) merge(u, v)
  slli t0, s3, 1
  lw t0, uState(t0)
  li t1, 2
  bne t0, t1, .L4
  ; fall.e16.ts:355  merge(u, v)
  mv a0, s1
  mv a1, s3
  call merge
  j .L5
.L4:
  ; fall.e16.ts:356  uOff[u] = 64
  slli t0, s1, 1
  li t1, 64
  sw t1, uOff(t0)
.L5:
  ; fall.e16.ts:357  return
  j .return
.L3:
  ; fall.e16.ts:359  down(u)
  mv a0, s1
  call down
  ; fall.e16.ts:360  off = off - 64
  addi s2, s2, -64
  ; fall.e16.ts:361  uOff[u] = off
  slli t0, s1, 1
  sw s2, uOff(t0)
  ; fall.e16.ts:362  settle(u)
  mv a0, s1
  call settle
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; fall.e16.ts:366 strikeCheck(u) at -O1
;   u in s2
;   k in s1
;   c in s3
strikeCheck:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; u
  ; fall.e16.ts:367  let k: u16 = 0
  li s1, 0 ; k
  ; fall.e16.ts:368  while (k < lbN) {
  j .L3
.L1:
  ; fall.e16.ts:369  if (lbUnit[k] === u && ((lbCell[k] + 16) & 511) === target) {
  lbu t0, lbUnit(s1)
  bne t0, s2, .L5
  slli t0, s1, 1
  lw t0, lbCell(t0)
  addi t0, t0, 16
  andi t0, t0, 511
  lw t1, 0x1880(zero)
  bne t0, t1, .L5
  ; fall.e16.ts:370  if ((cells[lbCell[k]] & 15) === T_AIR) {
  slli t0, s1, 1
  lw t0, lbCell(t0)
  lbu t0, cells(t0)
  andi t0, t0, 15
  li t1, 6
  bne t0, t1, .L6
  ; fall.e16.ts:371  struck = 2
  li t0, 2
  sw t0, 0x1882(zero)
  ; fall.e16.ts:372  const c = lbCell[k]
  slli t0, s1, 1
  lw s3, lbCell(t0)
  ; fall.e16.ts:373  dropBlock(k)
  mv a0, s1
  call dropBlock
  ; fall.e16.ts:374  cells[c] = T_EMPTY
  sb zero, cells(s3)
  ; fall.e16.ts:375  markAround(c)
  mv a0, s3
  call markAround
  ; fall.e16.ts:376  return
  j .return
.L6:
  ; fall.e16.ts:379  struck = 1
  li t0, 1
  sw t0, 0x1882(zero)
  ; fall.e16.ts:380  uOff[u] = 50
  slli t0, s2, 1
  li t1, 50
  sw t1, uOff(t0)
  ; fall.e16.ts:381  return
  j .return
.L5:
  ; fall.e16.ts:383  k++
  addi s1, s1, 1
.L3:
  lw t0, 0x1588(zero)
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; fall.e16.ts:388 blocker(u) at -O1
;   u in a0
;   k in a1
;   below in a2
;   v in a3
blocker:
  ; fall.e16.ts:389  let k: u16 = 0
  li a1, 0 ; k
  ; fall.e16.ts:390  while (k < lbN) {
  j .L3
.L1:
  ; fall.e16.ts:391  if (lbUnit[k] === u) {
  lbu t0, lbUnit(a1)
  bne t0, a0, .L5
  ; fall.e16.ts:392  const below = (lbCell[k] + 16) & 511
  slli t0, a1, 1
  lw t0, lbCell(t0)
  addi t0, t0, 16
  andi a2, t0, 511
  ; fall.e16.ts:393  if ((cells[below] & F_LOOSE) !== 0) {
  lbu t0, cells(a2)
  andi t0, t0, 128
  beq t0, zero, .L6
  ; fall.e16.ts:394  const v = lbUnit[lbAt[below] - 1]
  lbu t0, lbAt(a2)
  lbu a3, lbUnit-1(t0)
  ; fall.e16.ts:395  if (v !== u) return v
  beq a3, a0, .L7
  ; fall.e16.ts:395  return v
  mv a0, a3
  ret
.L7:
.L6:
.L5:
  ; fall.e16.ts:398  k++
  addi a1, a1, 1
.L3:
  lw t0, 0x1588(zero)
  bltu a1, t0, .L1
  ; fall.e16.ts:400  return 0xff
  li a0, 255
.return:
  ret

; fall.e16.ts:404 merge(u, v) at -O1
;   u in a0
;   v in a1
;   k in a2
merge:
  ; fall.e16.ts:405  let k: u16 = 0
  li a2, 0 ; k
  ; fall.e16.ts:406  while (k < lbN) {
  j .L3
.L1:
  ; fall.e16.ts:407  if (lbUnit[k] === u) lbUnit[k] = v
  lbu t0, lbUnit(a2)
  bne t0, a0, .L5
  ; fall.e16.ts:407  lbUnit[k] = v
  sb a1, lbUnit(a2)
.L5:
  ; fall.e16.ts:408  k++
  addi a2, a2, 1
.L3:
  lw t0, 0x1588(zero)
  bltu a2, t0, .L1
  ; fall.e16.ts:410  uSize[v] = uSize[v] + uSize[u]
  slli t0, a1, 1
  slli t1, a1, 1
  lw t1, uSize(t1)
  slli t2, a0, 1
  lw t2, uSize(t2)
  add t1, t1, t2
  sw t1, uSize(t0)
  ; fall.e16.ts:411  uSize[u] = 0
  slli t0, a0, 1
  sw zero, uSize(t0)
  ; fall.e16.ts:412  uState[u] = U_FREE
  slli t0, a0, 1
  sw zero, uState(t0)
.return:
  ret

; fall.e16.ts:416 down(u) at -O1
;   u in a0
;   k in a1
;   c in a2
down:
  ; fall.e16.ts:417  let k: u16 = 0
  li a1, 0 ; k
  ; fall.e16.ts:418  while (k < lbN) {
  j .L3
.L1:
  ; fall.e16.ts:419  if (lbUnit[k] === u) {
  lbu t0, lbUnit(a1)
  bne t0, a0, .L5
  ; fall.e16.ts:422  const c = lbCell[k]
  slli t0, a1, 1
  lw a2, lbCell(t0)
  ; fall.e16.ts:423  lbVal[k] = cells[c]
  lbu t0, cells(a2)
  sb t0, lbVal(a1)
  ; fall.e16.ts:424  cells[c] = T_EMPTY
  sb zero, cells(a2)
  ; fall.e16.ts:425  lbAt[c] = 0
  sb zero, lbAt(a2)
.L5:
  ; fall.e16.ts:427  k++
  addi a1, a1, 1
.L3:
  lw t0, 0x1588(zero)
  bltu a1, t0, .L1
  ; fall.e16.ts:429  k = 0
  li a1, 0 ; k
  ; fall.e16.ts:430  while (k < lbN) {
  j .L8
.L6:
  ; fall.e16.ts:431  if (lbUnit[k] === u) {
  lbu t0, lbUnit(a1)
  bne t0, a0, .L10
  ; fall.e16.ts:432  const c = (lbCell[k] + 16) & 511
  slli t0, a1, 1
  lw t0, lbCell(t0)
  addi t0, t0, 16
  andi a2, t0, 511
  ; fall.e16.ts:433  cells[c] = lbVal[k]
  lbu t0, lbVal(a1)
  sb t0, cells(a2)
  ; fall.e16.ts:434  lbCell[k] = c
  slli t0, a1, 1
  sw a2, lbCell(t0)
  ; fall.e16.ts:435  lbAt[c] = k + 1
  addi t0, a1, 1
  sb t0, lbAt(a2)
.L10:
  ; fall.e16.ts:437  k++
  addi a1, a1, 1
.L8:
  lw t0, 0x1588(zero)
  bltu a1, t0, .L6
.return:
  ret

; fall.e16.ts:446 settle(u) at -O1
;   u in s2
;   k in s1
;   up in 0(fp)
;   c in s3
;   landed.c in 2(fp)
settle:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; u
  ; fall.e16.ts:448  if (!touches(u)) return
  mv a0, s2
  call touches
  bnez a0, .L1
  ; fall.e16.ts:448  return
  j .return
.L1:
  ; fall.e16.ts:449  let k: u16 = 0
  li s1, 0 ; k
  ; fall.e16.ts:450  while (k < lbN) {
  j .L4
.L2:
  ; fall.e16.ts:451  if (lbUnit[k] === u) gSet[lbGroup[k]] = 0
  lbu t0, lbUnit(s1)
  bne t0, s2, .L6
  ; fall.e16.ts:451  gSet[lbGroup[k]] = 0
  lbu t0, lbGroup(s1)
  sb zero, gSet(t0)
.L6:
  ; fall.e16.ts:452  k++
  addi s1, s1, 1
.L4:
  lw t0, 0x1588(zero)
  bltu s1, t0, .L2
  ; fall.e16.ts:456  let up = true
  li t0, 1
  sw t0, 0(fp) ; up
  ; fall.e16.ts:457  while (settlePass(u, up)) up = !up
  j .L9
.L7:
  ; fall.e16.ts:457  up = !up
  lw t0, 0(fp) ; up
  seqz t0, t0
  sw t0, 0(fp) ; up
.L9:
  mv a0, s2
  lw a1, 0(fp)
  call settlePass
  bnez a0, .L7
  ; fall.e16.ts:459  k = lbN
  lw s1, 0x1588(zero)
  ; fall.e16.ts:460  while (k > 0) {
  j .L13
.L11:
  ; fall.e16.ts:461  k--
  addi s1, s1, -1
  ; fall.e16.ts:462  if (lbUnit[k] === u && gSet[lbGroup[k]] !== 0) {
  lbu t0, lbUnit(s1)
  bne t0, s2, .L15
  lbu t0, lbGroup(s1)
  lbu t0, gSet(t0)
  beq t0, zero, .L15
  ; fall.e16.ts:463  const c = lbCell[k]
  slli t0, s1, 1
  lw s3, lbCell(t0)
  ; fall.e16.ts:464  cells[c] = cells[c] & ~F_LOOSE
  lbu t0, cells(s3)
  andi t0, t0, -129
  sb t0, cells(s3)
  ; fall.e16.ts:465  markAround(c)
  mv a0, s3
  call markAround
  ; fall.e16.ts:466  landed(c)
  sw s3, 2(fp) ; landed.c
  ; fall.e16.ts:550  if (landN < 64) {
  lw t0, 0x1a08(zero)
  li t1, 64
  bgeu t0, t1, .I1_end
  ; fall.e16.ts:551  landQ[landN] = c
  lw t0, 0x1a08(zero)
  slli t0, t0, 1
  lw t1, 2(fp) ; landed.c
  sw t1, landQ(t0)
  ; fall.e16.ts:552  landN++
  lw t0, 0x1a08(zero)
  addi t0, t0, 1
  sw t0, 0x1a08(zero)
.I1_end:
  ; fall.e16.ts:467  dropBlock(k)
  mv a0, s1
  call dropBlock
.L15:
.L13:
  bltu zero, s1, .L11
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fall.e16.ts:473 settlePass(u, up) at -O1
;   u in s3
;   up in 2(fp)
;   more in 0(fp)
;   k in s1
;   j in s2
settlePass:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; u
  sw a1, 2(fp) ; up
  ; fall.e16.ts:474  let more = false
  sw zero, 0(fp) ; more
  ; fall.e16.ts:475  let k: u16 = 0
  li s1, 0 ; k
  ; fall.e16.ts:476  while (k < lbN) {
  j .L3
.L1:
  ; fall.e16.ts:477  const j = up ? k : lbN - 1 - k
  lw t0, 2(fp) ; up
  beqz t0, .L5
  mv t0, s1
  j .L6
.L5:
  lw t0, 0x1588(zero)
  addi t0, t0, -1
  sub t0, t0, s1
.L6:
  mv s2, t0 ; j
  ; fall.e16.ts:478  if (lbUnit[j] === u && gSet[lbGroup[j]] === 0 && rests(j, u)) {
  lbu t0, lbUnit(s2)
  bne t0, s3, .L7
  lbu t0, lbGroup(s2)
  lbu t0, gSet(t0)
  bne t0, zero, .L7
  mv a0, s2
  mv a1, s3
  call rests
  beqz a0, .L7
  ; fall.e16.ts:479  gSet[lbGroup[j]] = 1
  lbu t0, lbGroup(s2)
  li t1, 1
  sb t1, gSet(t0)
  ; fall.e16.ts:480  more = true
  li t0, 1
  sw t0, 0(fp) ; more
.L7:
  ; fall.e16.ts:482  k++
  addi s1, s1, 1
.L3:
  lw t0, 0x1588(zero)
  bltu s1, t0, .L1
  ; fall.e16.ts:484  return more
  lw a0, 0(fp)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fall.e16.ts:488 touches(u) at -O1
;   u in a0
;   k in a1
;   bv in a2
touches:
  ; fall.e16.ts:489  let k: u16 = 0
  li a1, 0 ; k
  ; fall.e16.ts:490  while (k < lbN) {
  j .L3
.L1:
  ; fall.e16.ts:491  if (lbUnit[k] === u) {
  lbu t0, lbUnit(a1)
  bne t0, a0, .L5
  ; fall.e16.ts:492  const bv = cells[(lbCell[k] + 16) & 511]
  slli t0, a1, 1
  lw t0, lbCell(t0)
  addi t0, t0, 16
  andi t0, t0, 511
  lbu a2, cells(t0)
  ; fall.e16.ts:493  if ((bv & 15) !== 0 && (bv & F_LOOSE) === 0) return true
  andi t0, a2, 15
  beq t0, zero, .L6
  andi t0, a2, 128
  bne t0, zero, .L6
  ; fall.e16.ts:493  return true
  li a0, 1
  ret
.L6:
.L5:
  ; fall.e16.ts:495  k++
  addi a1, a1, 1
.L3:
  lw t0, 0x1588(zero)
  bltu a1, t0, .L1
  ; fall.e16.ts:497  return false
  li a0, 0
.return:
  ret

; fall.e16.ts:500 rests(k, u) at -O1
;   k in a0
;   u in a1
;   below in a2
;   bv in a3
;   j in s1
rests:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; fall.e16.ts:501  const below = (lbCell[k] + 16) & 511
  slli t0, a0, 1
  lw t0, lbCell(t0)
  addi t0, t0, 16
  andi a2, t0, 511
  ; fall.e16.ts:502  const bv = cells[below]
  lbu a3, cells(a2)
  ; fall.e16.ts:503  if ((bv & 15) === 0) return false
  andi t0, a3, 15
  bne t0, zero, .L1
  ; fall.e16.ts:503  return false
  li a0, 0
  j .return
.L1:
  ; fall.e16.ts:504  if ((bv & F_LOOSE) === 0) return true
  andi t0, a3, 128
  bne t0, zero, .L2
  ; fall.e16.ts:504  return true
  li a0, 1
  j .return
.L2:
  ; fall.e16.ts:505  const j = lbAt[below] - 1
  lbu t0, lbAt(a2)
  addi s1, t0, -1
  ; fall.e16.ts:506  return lbUnit[j] === u && gSet[lbGroup[j]] !== 0
  lbu t0, lbUnit(s1)
  sub t0, t0, a1
  seqz t0, t0
  mv t1, t0
  beqz t1, .L3
  lbu t0, lbGroup(s1)
  lbu t0, gSet(t0)
  sub t0, t0, zero
  snez t0, t0
.L3:
  mv a0, t0
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; fall.e16.ts:510 dropBlock(k) at -O1
;   k in a0
;   u in a1
dropBlock:
  ; fall.e16.ts:511  const u = lbUnit[k]
  lbu a1, lbUnit(a0)
  ; fall.e16.ts:512  gSize[lbGroup[k]] = gSize[lbGroup[k]] - 1
  lbu t0, lbGroup(a0)
  slli t0, t0, 1
  lbu t1, lbGroup(a0)
  slli t1, t1, 1
  lw t1, gSize(t1)
  addi t1, t1, -1
  sw t1, gSize(t0)
  ; fall.e16.ts:513  lbAt[lbCell[k]] = 0
  slli t0, a0, 1
  lw t0, lbCell(t0)
  sb zero, lbAt(t0)
  ; fall.e16.ts:514  lbN--
  lw t0, 0x1588(zero)
  addi t0, t0, -1
  sw t0, 0x1588(zero)
  ; fall.e16.ts:515  if (k !== lbN) {
  lw t0, 0x1588(zero)
  beq a0, t0, .L1
  ; fall.e16.ts:516  lbCell[k] = lbCell[lbN]
  slli t0, a0, 1
  lw t1, 0x1588(zero)
  slli t1, t1, 1
  lw t1, lbCell(t1)
  sw t1, lbCell(t0)
  ; fall.e16.ts:517  lbGroup[k] = lbGroup[lbN]
  lw t0, 0x1588(zero)
  lbu t0, lbGroup(t0)
  sb t0, lbGroup(a0)
  ; fall.e16.ts:518  lbUnit[k] = lbUnit[lbN]
  lw t0, 0x1588(zero)
  lbu t0, lbUnit(t0)
  sb t0, lbUnit(a0)
  ; fall.e16.ts:519  lbTile[k] = lbTile[lbN]
  slli t0, a0, 1
  lw t1, 0x1588(zero)
  slli t1, t1, 1
  lw t1, lbTile(t1)
  sw t1, lbTile(t0)
  ; fall.e16.ts:520  lbVal[k] = lbVal[lbN]
  lw t0, 0x1588(zero)
  lbu t0, lbVal(t0)
  sb t0, lbVal(a0)
  ; fall.e16.ts:521  lbAt[lbCell[k]] = k + 1
  slli t0, a0, 1
  lw t0, lbCell(t0)
  addi t1, a0, 1
  sb t1, lbAt(t0)
.L1:
  ; fall.e16.ts:523  uSize[u] = uSize[u] - 1
  slli t0, a1, 1
  slli t1, a1, 1
  lw t1, uSize(t1)
  addi t1, t1, -1
  sw t1, uSize(t0)
  ; fall.e16.ts:524  if (uSize[u] === 0) uState[u] = U_FREE
  slli t0, a1, 1
  lw t0, uSize(t0)
  bne t0, zero, .L2
  ; fall.e16.ts:524  uState[u] = U_FREE
  slli t0, a1, 1
  sw zero, uState(t0)
.L2:
.return:
  ret

; fall.e16.ts:528 cellClear(c) at -O1
;   c in s1
cellClear:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; fall.e16.ts:529  if (lbAt[c] !== 0) dropBlock(lbAt[c] - 1)
  lbu t0, lbAt(s1)
  beq t0, zero, .L1
  ; fall.e16.ts:529  dropBlock(lbAt[c] - 1)
  lbu t0, lbAt(s1)
  addi a0, t0, -1
  call dropBlock
.L1:
  ; fall.e16.ts:530  cells[c] = T_EMPTY
  sb zero, cells(s1)
  ; fall.e16.ts:531  markAround(c)
  mv a0, s1
  call markAround
  ; fall.e16.ts:532  suspect((c - 16) & 511)
  addi t0, s1, -16
  andi a0, t0, 511
  call suspect
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; fall.e16.ts:536 fallForget(ring) at -O1
;   ring in s2
;   k in s1
fallForget:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; ring
  ; fall.e16.ts:537  let k = lbN
  lw s1, 0x1588(zero)
  ; fall.e16.ts:538  while (k > 0) {
  j .L3
.L1:
  ; fall.e16.ts:539  k--
  addi s1, s1, -1
  ; fall.e16.ts:540  if (lbCell[k] >> 4 === ring) dropBlock(k)
  slli t0, s1, 1
  lw t0, lbCell(t0)
  srli t0, t0, 4
  bne t0, s2, .L5
  ; fall.e16.ts:540  dropBlock(k)
  mv a0, s1
  call dropBlock
.L5:
.L3:
  bltu zero, s1, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; fall.e16.ts:566 chainNew() at -O1
chainNew:
  ; fall.e16.ts:567  chain = 0
  sw zero, 0x1a0a(zero)
.return:
  ret

; fall.e16.ts:570 newsClear() at -O1
newsClear:
  ; fall.e16.ts:571  loosened = 0
  sw zero, 0x1a14(zero)
  ; fall.e16.ts:572  vanishedBlocks = 0
  sw zero, 0x1a0c(zero)
  ; fall.e16.ts:573  vanishedChain = 0
  sw zero, 0x1a0e(zero)
  ; fall.e16.ts:574  landings = 0
  sw zero, 0x1a12(zero)
.return:
  ret

; fall.e16.ts:582 chainsStep(now, budget) at -O1
;   now in 4(fp)
;   budget in 6(fp)
;   spent in s2
;   k in s1
;   c in 0(fp)
;   t in 2(fp)
;   n in s3
chainsStep:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 4(fp) ; now
  sw a1, 6(fp) ; budget
  ; fall.e16.ts:583  landings = landN
  lw t0, 0x1a08(zero)
  sw t0, 0x1a12(zero)
  ; fall.e16.ts:584  let spent: u16 = 0
  li s2, 0 ; spent
  ; fall.e16.ts:585  let k: u16 = 0
  li s1, 0 ; k
  ; fall.e16.ts:586  while (k < landN && spent < budget) {
  j .L3
.L1:
  ; fall.e16.ts:587  const c = landQ[k]
  slli t0, s1, 1
  lw t0, landQ(t0)
  sw t0, 0(fp) ; c
  ; fall.e16.ts:588  k++
  addi s1, s1, 1
  ; fall.e16.ts:589  const t = cells[c]
  lw t0, 0(fp) ; c
  lbu t0, cells(t0)
  sw t0, 2(fp) ; t
  ; fall.e16.ts:590  spent = spent + 2
  addi s2, s2, 2
  ; fall.e16.ts:591  if (t < 1 || t > T_BLUE) continue
  li t0, 1
  lw t1, 2(fp) ; t
  bltu t1, t0, .L2
  li t0, 4
  lw t1, 2(fp) ; t
  bgeu t0, t1, .L5
  ; fall.e16.ts:591  continue
  j .L2
.L5:
  ; fall.e16.ts:592  const n = groupOf(c)
  lw a0, 0(fp)
  call groupOf
  mv s3, a0 ; n
  ; fall.e16.ts:593  spent = spent + n
  add s2, s2, s3
  ; fall.e16.ts:594  if (n < 4) continue
  li t0, 4
  bgeu s3, t0, .L7
  ; fall.e16.ts:594  continue
  j .L2
.L7:
  ; fall.e16.ts:595  chain++
  lw t0, 0x1a0a(zero)
  addi t0, t0, 1
  sw t0, 0x1a0a(zero)
  ; fall.e16.ts:596  vanishedBlocks = vanishedBlocks + n
  lw t0, 0x1a0c(zero)
  add t0, t0, s3
  sw t0, 0x1a0c(zero)
  ; fall.e16.ts:597  vanishedChain = chain
  lw t0, 0x1a0a(zero)
  sw t0, 0x1a0e(zero)
  ; fall.e16.ts:598  vanishedAt = c
  lw t0, 0(fp) ; c
  sw t0, 0x1a10(zero)
  ; fall.e16.ts:599  vanish(n, now + 24, 0)
  lw t0, 4(fp) ; now
  mv a0, s3
  addi a1, t0, 24
  li a2, 0
  call vanish
  ; fall.e16.ts:600  spent = spent + n * 2
  slli t0, s3, 1
  add s2, s2, t0
.L2:
.L3:
  lw t0, 0x1a08(zero)
  bgeu s1, t0, .L8
  lw t0, 6(fp) ; budget
  bltu s2, t0, .L1
.L8:
  ; fall.e16.ts:602  if (k > 0 && k < landN) memcpy(addr(landQ), addr(landQ) + k * 2, (landN - k) * 2)
  bgeu zero, s1, .L9
  lw t0, 0x1a08(zero)
  bgeu s1, t0, .L9
  ; fall.e16.ts:602  memcpy(addr(landQ), addr(landQ) + k * 2, (landN - k) * 2)
  slli t0, s1, 1
  lw t1, 0x1a08(zero)
  sub t1, t1, s1
  slli t1, t1, 1
  la a0, landQ
  addi a1, t0, landQ
  mv a2, t1
  mcpy a0, a1, a2
.L9:
  ; fall.e16.ts:603  landN = landN - k
  lw t0, 0x1a08(zero)
  sub t0, t0, s1
  sw t0, 0x1a08(zero)
  ; fall.e16.ts:604  if (fallQuiet()) chain = 0
  call fallQuiet
  beqz a0, .L10
  ; fall.e16.ts:604  chain = 0
  sw zero, 0x1a0a(zero)
.L10:
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s2, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; fall.e16.ts:611 vanish(n, due, step) at -O1
;   n in s3
;   due in 0(fp)
;   step in 2(fp)
;   k in s1
;   c in s2
vanish:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; n
  sw a1, 0(fp) ; due
  sw a2, 2(fp) ; step
  ; fall.e16.ts:612  let k: u16 = 0
  li s1, 0 ; k
  ; fall.e16.ts:613  while (k < n) {
  j .L3
.L1:
  ; fall.e16.ts:614  const c = found[k]
  slli t0, s1, 1
  lw s2, found(t0)
  ; fall.e16.ts:615  cells[c] = cells[c] | F_PEND
  lbu t0, cells(s2)
  ori t0, t0, 64
  sb t0, cells(s2)
  ; fall.e16.ts:616  markAround(c)
  mv a0, s2
  call markAround
  ; fall.e16.ts:617  pend(c, wrap16(due + ((k * step) >> 2)))
  lw t0, 2(fp) ; step
  mul t0, s1, t0
  srli t0, t0, 2
  lw t1, 0(fp) ; due
  add t1, t1, t0
  mv a0, s2
  mv a1, t1
  call pend
  ; fall.e16.ts:618  k++
  addi s1, s1, 1
.L3:
  bltu s1, s3, .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fall.e16.ts:627 pend(c, due) at -O1
;   c in s1
;   due in s2
pend:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; c
  mv s2, a1 ; due
  ; fall.e16.ts:628  if (pendN >= PEND_N) {
  lw t0, 0x1c96(zero)
  li t1, 160
  bltu t0, t1, .L1
  ; fall.e16.ts:629  gone(c)
  mv a0, s1
  call gone
  ; fall.e16.ts:630  return
  j .return
.L1:
  ; fall.e16.ts:632  pendCell[pendN] = c
  lw t0, 0x1c96(zero)
  slli t0, t0, 1
  sw s1, pendCell(t0)
  ; fall.e16.ts:633  pendDue[pendN] = due
  lw t0, 0x1c96(zero)
  slli t0, t0, 1
  sw s2, pendDue(t0)
  ; fall.e16.ts:634  pendN++
  lw t0, 0x1c96(zero)
  addi t0, t0, 1
  sw t0, 0x1c96(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; fall.e16.ts:643 pendStep(now, most) at -O1
;   now in s3
;   most in s2
;   k in s1
pendStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; now
  mv s2, a1 ; most
  ; fall.e16.ts:644  goneN = 0
  sw zero, 0x1cf8(zero)
  ; fall.e16.ts:645  let k: u16 = 0
  li s1, 0 ; k
  ; fall.e16.ts:646  while (k < pendN) {
  j .L3
.L1:
  ; fall.e16.ts:647  if (i16(wrap16(now - pendDue[k])) >= 0 && most > 0) {
  slli t0, s1, 1
  lw t0, pendDue(t0)
  sub t0, s3, t0
  blt t0, zero, .L5
  bgeu zero, s2, .L5
  ; fall.e16.ts:648  gone(pendCell[k])
  slli t0, s1, 1
  lw a0, pendCell(t0)
  call gone
  ; fall.e16.ts:649  most--
  addi s2, s2, -1
  ; fall.e16.ts:650  pendN--
  lw t0, 0x1c96(zero)
  addi t0, t0, -1
  sw t0, 0x1c96(zero)
  ; fall.e16.ts:651  pendCell[k] = pendCell[pendN]
  slli t0, s1, 1
  lw t1, 0x1c96(zero)
  slli t1, t1, 1
  lw t1, pendCell(t1)
  sw t1, pendCell(t0)
  ; fall.e16.ts:652  pendDue[k] = pendDue[pendN]
  slli t0, s1, 1
  lw t1, 0x1c96(zero)
  slli t1, t1, 1
  lw t1, pendDue(t1)
  sw t1, pendDue(t0)
  j .L6
.L5:
  ; fall.e16.ts:653  k++
  addi s1, s1, 1
.L6:
.L3:
  lw t0, 0x1c96(zero)
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; fall.e16.ts:658 gone(c) at -O1
;   c in s1
;   v in s2
gone:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; c
  ; fall.e16.ts:659  const v = cells[c]
  lbu s2, cells(s1)
  ; fall.e16.ts:660  if ((v & F_PEND) === 0) return
  andi t0, s2, 64
  bne t0, zero, .L1
  ; fall.e16.ts:660  return
  j .return
.L1:
  ; fall.e16.ts:661  if (goneN < 24) {
  lw t0, 0x1cf8(zero)
  li t1, 24
  bgeu t0, t1, .L2
  ; fall.e16.ts:662  goneCell[goneN] = c
  lw t0, 0x1cf8(zero)
  slli t0, t0, 1
  sw s1, goneCell(t0)
  ; fall.e16.ts:663  goneType[goneN] = v & 15
  lw t0, 0x1cf8(zero)
  slli t0, t0, 1
  andi t1, s2, 15
  sw t1, goneType(t0)
  ; fall.e16.ts:664  goneN++
  lw t0, 0x1cf8(zero)
  addi t0, t0, 1
  sw t0, 0x1cf8(zero)
.L2:
  ; fall.e16.ts:666  cells[c] = T_EMPTY
  sb zero, cells(s1)
  ; fall.e16.ts:667  markAround(c)
  mv a0, s1
  call markAround
  ; fall.e16.ts:668  suspect((c - 16) & 511)
  addi t0, s1, -16
  andi a0, t0, 511
  call suspect
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; fall.e16.ts:672 pending(c) at -O1
;   c in a0
pending:
  ; fall.e16.ts:673  return (cells[c] & F_PEND) !== 0
  lbu t0, cells(a0)
  andi t0, t0, 64
  sub t0, t0, zero
  snez a0, t0
.return:
  ret

; fall.e16.ts:677 pendForget(ring) at -O1
;   ring in a0
;   k in a1
pendForget:
  ; fall.e16.ts:678  let k: u16 = 0
  li a1, 0 ; k
  ; fall.e16.ts:679  while (k < pendN) {
  j .L3
.L1:
  ; fall.e16.ts:680  if (pendCell[k] >> 4 === ring) {
  slli t0, a1, 1
  lw t0, pendCell(t0)
  srli t0, t0, 4
  bne t0, a0, .L5
  ; fall.e16.ts:681  pendN--
  lw t0, 0x1c96(zero)
  addi t0, t0, -1
  sw t0, 0x1c96(zero)
  ; fall.e16.ts:682  pendCell[k] = pendCell[pendN]
  slli t0, a1, 1
  lw t1, 0x1c96(zero)
  slli t1, t1, 1
  lw t1, pendCell(t1)
  sw t1, pendCell(t0)
  ; fall.e16.ts:683  pendDue[k] = pendDue[pendN]
  slli t0, a1, 1
  lw t1, 0x1c96(zero)
  slli t1, t1, 1
  lw t1, pendDue(t1)
  sw t1, pendDue(t0)
  j .L6
.L5:
  ; fall.e16.ts:684  k++
  addi a1, a1, 1
.L6:
.L3:
  lw t0, 0x1c96(zero)
  bltu a1, t0, .L1
.return:
  ret

; hud.e16.ts:20 say(x, y, s, sl) at -O1
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
  ; hud.e16.ts:21  text(cellAt(1, x, y), s, FONT_TILE | (sl << 10) | 0x8000)
  li a0, 1
  mv a1, s1
  mv a2, s2
  call cellAt
  slli t0, s0, 10
  or t0, zero, t0
  li t1, 32768
  or t0, t0, t1
  mv a1, s3
  mv a2, t0
  call text
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; hud.e16.ts:25 unsay(x, y, n) at -O1
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
  ; hud.e16.ts:26  vfill(cellAt(1, x, y), PANELS_TILE, n)
  li a0, 1
  mv a1, s1
  mv a2, s2
  call cellAt
  li a1, 443
  mv a2, s3
  call vfill
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; hud.e16.ts:30 wellClear() at -O1
;   y in s1
wellClear:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; hud.e16.ts:31  bandH = 0
  sw zero, 0x1d04(zero)
  ; hud.e16.ts:32  let y: u16 = 0
  li s1, 0 ; y
  ; hud.e16.ts:33  while (y < 36) {
  j .L3
.L1:
  ; hud.e16.ts:34  unsay(11, y, 18)
  li a0, 11
  mv a1, s1
  li a2, 18
  call unsay
  ; hud.e16.ts:35  y++
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; hud.e16.ts:40 glyph(c, sl) at -O1
;   c in a0
;   sl in a1
glyph:
  ; hud.e16.ts:41  return (FONT_TILE + c - 32) | (sl << 10) | 0x8000
  slli t0, a1, 10
  addi t1, a0, -32
  or t1, t1, t0
  li t0, 32768
  or a0, t1, t0
.return:
  ret

; hud.e16.ts:45 figure(cell, n, digits, sl) at -O1
;   cell in 2(fp)
;   n in 4(fp)
;   digits in 0(fp)
;   sl in 6(fp)
;   at in s3
;   v in s1
;   k in s2
;   c in 8(fp)
figure:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s3, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 2(fp) ; cell
  sw a1, 4(fp) ; n
  sw a2, 0(fp) ; digits
  sw a3, 6(fp) ; sl
  ; hud.e16.ts:46  let at = cell + (digits - 1) * 2
  lw t0, 0(fp) ; digits
  addi t0, t0, -1
  slli t0, t0, 1
  lw t1, 2(fp) ; cell
  add s3, t1, t0
  ; hud.e16.ts:47  let v = n
  lw s1, 4(fp) ; n
  ; hud.e16.ts:48  let k: u16 = 0
  li s2, 0 ; k
  ; hud.e16.ts:49  while (k < digits) {
  j .L3
.L1:
  ; hud.e16.ts:50  const c: u16 = k > 0 && v === 0 ? 32 : 48 + (v % 10)
  bgeu zero, s2, .L5
  bne s1, zero, .L5
  li t0, 32
  j .L6
.L5:
  li t0, 10
  remu t0, s1, t0
  addi t0, t0, 48
.L6:
  sw t0, 8(fp) ; c
  ; hud.e16.ts:51  vpoke(at, glyph(c, sl))
  lw a0, 8(fp)
  lw a1, 6(fp)
  call glyph
  mv a1, a0
  mv a0, s3
  call vpoke
  ; hud.e16.ts:52  v = div(v, 10)
  li t0, 10
  divu s1, s1, t0
  ; hud.e16.ts:53  at = at - 2
  addi s3, s3, -2
  ; hud.e16.ts:54  k++
  addi s2, s2, 1
.L3:
  lw t0, 0(fp) ; digits
  bltu s2, t0, .L1
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s3, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; hud.e16.ts:64 band(y, rows) at -O1
;   y in a0
;   rows in a1
band:
  ; hud.e16.ts:65  bandY = y
  sw a0, 0x1d02(zero)
  ; hud.e16.ts:66  bandH = rows
  sw a1, 0x1d04(zero)
.return:
  ret

; hud.e16.ts:70 bandDraw() at -O1
;   r in s1
;   part in s3
;   k in s2
bandDraw:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  ; hud.e16.ts:71  let r: u16 = 0
  li s1, 0 ; r
  ; hud.e16.ts:72  while (r < bandH) {
  j .L3
.L1:
  ; hud.e16.ts:73  const part: u16 = r === 0 ? 0 : r === bandH - 1 ? 2 : 1
  bne s1, zero, .L5
  li t0, 0
  j .L6
.L5:
  lw t0, 0x1d04(zero)
  addi t0, t0, -1
  bne s1, t0, .L7
  li t0, 2
  j .L8
.L7:
  li t0, 1
.L8:
.L6:
  mv s3, t0 ; part
  ; hud.e16.ts:74  let k: u16 = 0
  li s2, 0 ; k
  ; hud.e16.ts:75  while (k < 9) {
  j .L11
.L9:
  ; hud.e16.ts:76  spr(i16(88 + k * 16), i16(bandY + r * 16), (BAND_TILE + part * 4) | (5 << 10), S16)
  slli t0, s2, 4
  lw t1, 0x1d02(zero)
  slli t2, s1, 4
  add t1, t1, t2
  slli t2, s3, 2
  addi t2, t2, 147
  ori t2, t2, 5120
  addi a0, t0, 88
  mv a1, t1
  mv a2, t2
  li a3, 1
  call spr
  ; hud.e16.ts:77  k++
  addi s2, s2, 1
.L11:
  li t0, 9
  bltu s2, t0, .L9
  ; hud.e16.ts:79  r++
  addi s1, s1, 1
.L3:
  lw t0, 0x1d04(zero)
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; audio.e16.ts:64 music(m) at -O1
;   m in s1
music:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; m
  ; audio.e16.ts:65  song = m
  sw s1, 0x1d06(zero)
  ; audio.e16.ts:66  if (m === M_TITLE) play(SONG_TITLE_BANK, SONG_TITLE_AT, true)
  li t0, 1
  bne s1, t0, .L1
  ; audio.e16.ts:66  play(SONG_TITLE_BANK, SONG_TITLE_AT, true)
  li a0, 265
  li a1, 51980
  li a2, 1
  call play
  j .L2
.L1:
  ; audio.e16.ts:67  if (m === M_MAIN) play(SONG_MAIN_BANK, SONG_MAIN_AT, true)
  li t0, 2
  bne s1, t0, .L3
  ; audio.e16.ts:67  play(SONG_MAIN_BANK, SONG_MAIN_AT, true)
  li a0, 264
  li a1, 49920
  li a2, 1
  call play
  j .L4
.L3:
  ; audio.e16.ts:68  if (m === M_DEEP) play(SONG_DEEP_BANK, SONG_DEEP_AT, true)
  li t0, 3
  bne s1, t0, .L5
  ; audio.e16.ts:68  play(SONG_DEEP_BANK, SONG_DEEP_AT, true)
  li a0, 265
  li a1, 49152
  li a2, 1
  call play
  j .L6
.L5:
  ; audio.e16.ts:69  if (m === M_LOWAIR) play(SONG_LOWAIR_BANK, SONG_LOWAIR_AT, true)
  li t0, 4
  bne s1, t0, .L7
  ; audio.e16.ts:69  play(SONG_LOWAIR_BANK, SONG_LOWAIR_AT, true)
  li a0, 264
  li a1, 53498
  li a2, 1
  call play
  j .L8
.L7:
  ; audio.e16.ts:70  if (m === M_STRATUM) play(SONG_STRATUM_BANK, SONG_STRATUM_AT, true)
  li t0, 5
  bne s1, t0, .L9
  ; audio.e16.ts:70  play(SONG_STRATUM_BANK, SONG_STRATUM_AT, true)
  li a0, 265
  li a1, 52804
  li a2, 1
  call play
  j .L10
.L9:
  ; audio.e16.ts:71  if (m === M_OVER) play(SONG_OVER_BANK, SONG_OVER_AT, true)
  li t0, 6
  bne s1, t0, .L11
  ; audio.e16.ts:71  play(SONG_OVER_BANK, SONG_OVER_AT, true)
  li a0, 265
  li a1, 53720
  li a2, 1
  call play
  j .L12
.L11:
  ; audio.e16.ts:72  if (m === M_RESULT) play(SONG_RESULT_BANK, SONG_RESULT_AT, true)
  li t0, 7
  bne s1, t0, .L13
  ; audio.e16.ts:72  play(SONG_RESULT_BANK, SONG_RESULT_AT, true)
  li a0, 265
  li a1, 53810
  li a2, 1
  call play
  j .L14
.L13:
  ; audio.e16.ts:73  if (m === M_GOAL) play(SONG_GOAL_BANK, SONG_GOAL_AT, true)
  li t0, 8
  bne s1, t0, .L15
  ; audio.e16.ts:73  play(SONG_GOAL_BANK, SONG_GOAL_AT, true)
  li a0, 265
  li a1, 52996
  li a2, 1
  call play
  j .L16
.L15:
  ; audio.e16.ts:74  musicStop()
  call musicStop
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

; audio.e16.ts:77 sfxDig() at -O1
sfxDig:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:78  play(SONG_X_DIG_BANK, SONG_X_DIG_AT, false)
  li a0, 265
  li a1, 54052
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:81 sfxClank() at -O1
sfxClank:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:82  play(SONG_X_CLANK_BANK, SONG_X_CLANK_AT, false)
  li a0, 265
  li a1, 54108
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:85 sfxClink() at -O1
sfxClink:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:86  play(SONG_X_CLINK_BANK, SONG_X_CLINK_AT, false)
  li a0, 265
  li a1, 54158
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:89 sfxSwing() at -O1
sfxSwing:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:90  play(SONG_X_SWING_BANK, SONG_X_SWING_AT, false)
  li a0, 265
  li a1, 54186
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:93 sfxLand() at -O1
sfxLand:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:94  play(SONG_X_LAND_BANK, SONG_X_LAND_AT, false)
  li a0, 265
  li a1, 54210
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:97 sfxPop() at -O1
sfxPop:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:98  play(SONG_X_POP_BANK, SONG_X_POP_AT, false)
  li a0, 265
  li a1, 54236
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:102 sfxChain(n) at -O1
;   n in s1
sfxChain:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; audio.e16.ts:103  if (n >= 3) play(SONG_X_CHAIN2_BANK, SONG_X_CHAIN2_AT, false)
  li t0, 3
  bltu s1, t0, .L1
  ; audio.e16.ts:103  play(SONG_X_CHAIN2_BANK, SONG_X_CHAIN2_AT, false)
  li a0, 265
  li a1, 54310
  li a2, 0
  call play
  j .L2
.L1:
  ; audio.e16.ts:104  play(SONG_X_CHAIN_BANK, SONG_X_CHAIN_AT, false)
  li a0, 265
  li a1, 54266
  li a2, 0
  call play
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; audio.e16.ts:107 sfxCapsule() at -O1
sfxCapsule:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:108  play(SONG_X_CAPSULE_BANK, SONG_X_CAPSULE_AT, false)
  li a0, 265
  li a1, 54402
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:111 sfxCrush() at -O1
sfxCrush:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:112  play(SONG_X_CRUSH_BANK, SONG_X_CRUSH_AT, false)
  li a0, 265
  li a1, 54504
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:115 sfxGasp() at -O1
sfxGasp:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:116  play(SONG_X_GASP_BANK, SONG_X_GASP_AT, false)
  li a0, 265
  li a1, 54550
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:119 sfxAlarm() at -O1
sfxAlarm:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:120  play(SONG_X_ALARM_BANK, SONG_X_ALARM_AT, false)
  li a0, 265
  li a1, 54574
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:123 sfxRumble() at -O1
sfxRumble:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:124  play(SONG_X_RUMBLE_BANK, SONG_X_RUMBLE_AT, false)
  li a0, 265
  li a1, 54446
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:127 sfxSelect() at -O1
sfxSelect:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:128  play(SONG_X_SELECT_BANK, SONG_X_SELECT_AT, false)
  li a0, 265
  li a1, 54472
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:241 main() at -O1
main:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:242  kitInit()
  call kitInit
  ; drill.e16.ts:243  soundInit()
  call soundInit
  ; drill.e16.ts:244  screenOn()
  call screenOn
  ; drill.e16.ts:245  palettesIn()
  call palettesIn
  ; drill.e16.ts:246  tilesIn()
  call tilesIn
  ; drill.e16.ts:247  tableLoad()
  la t0, tableLoad
  li t1, 257
  call far_call
  ; drill.e16.ts:248  for (;;) {
.L1:
  ; drill.e16.ts:249  title()
  la t0, title
  li t1, 257
  call far_call
  ; drill.e16.ts:250  game()
  call game
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:255 screenOn() at -O1
screenOn:
  ; drill.e16.ts:256  poke16(VCTRL, 3)
  li t0, 3
  li t1, 63488
  sw t0, 0(t1)
  ; drill.e16.ts:257  poke16(LAYERS, 7)
  li t0, 7
  li t1, 63528
  sw t0, 0(t1)
  ; drill.e16.ts:258  poke16(BG0X, 0)
  li t0, 63520
  sw zero, 0(t0)
  ; drill.e16.ts:259  poke16(BG0Y, 0)
  li t0, 63522
  sw zero, 0(t0)
  ; drill.e16.ts:260  poke16(BG1X, 0)
  li t0, 63524
  sw zero, 0(t0)
  ; drill.e16.ts:261  poke16(BG1Y, 0)
  li t0, 63526
  sw zero, 0(t0)
.return:
  ret

; drill.e16.ts:265 palettesIn() at -O1
palettesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:266  slot(PAL_RED, 1)
  li a0, 5
  li a1, 1
  call slot
  ; drill.e16.ts:267  slot(PAL_YELLOW, 2)
  li a0, 6
  li a1, 2
  call slot
  ; drill.e16.ts:268  slot(PAL_GREEN, 3)
  li a0, 7
  li a1, 3
  call slot
  ; drill.e16.ts:269  slot(PAL_BLUE, 4)
  li a0, 8
  li a1, 4
  call slot
  ; drill.e16.ts:270  slot(PAL_FLASH, SL_FLASH)
  li a0, 9
  li a1, 6
  call slot
  ; drill.e16.ts:271  slot(PAL_PANEL, SL_PANEL)
  li a0, 10
  li a1, 7
  call slot
  ; drill.e16.ts:272  slot(PAL_DRILLER, 8)
  li a0, 11
  li a1, 8
  call slot
  ; drill.e16.ts:273  slot(PAL_RED, 9)
  li a0, 5
  li a1, 9
  call slot
  ; drill.e16.ts:274  slot(PAL_YELLOW, 10)
  li a0, 6
  li a1, 10
  call slot
  ; drill.e16.ts:275  slot(PAL_GREEN, 11)
  li a0, 7
  li a1, 11
  call slot
  ; drill.e16.ts:276  slot(PAL_BLUE, 12)
  li a0, 8
  li a1, 12
  call slot
  ; drill.e16.ts:277  slot(PAL_PANEL, 13)
  li a0, 10
  li a1, 13
  call slot
  ; drill.e16.ts:278  slot(PAL_FX, 14)
  li a0, 12
  li a1, 14
  call slot
  ; drill.e16.ts:279  slot(PAL_FLASH, 15)
  li a0, 9
  li a1, 15
  call slot
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:282 slot(row, s) at -O1
;   row in s1
;   s in s2
slot:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; row
  mv s2, a1 ; s
  ; drill.e16.ts:283  palette(row, s)
  mv a0, s1
  mv a1, s2
  call palette
  ; drill.e16.ts:284  palKeep(row, s)
  mv a0, s1
  mv a1, s2
  call palKeep
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; drill.e16.ts:288 tilesIn() at -O1
tilesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:289  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
  li a0, 259
  li a1, 50178
  li a2, 0
  li a3, 2048
  call load
  ; drill.e16.ts:290  load(DIGITS_BANK, DIGITS_AT, DIGITS_TILE * 32, DIGITS_BYTES)
  li a0, 259
  li a1, 52226
  li a2, 2048
  li a3, 1920
  call load
  ; drill.e16.ts:291  load(TANK_BANK, TANK_AT, TANK_TILE * 32, TANK_BYTES)
  li a0, 259
  li a1, 54146
  li a2, 3968
  li a3, 576
  call load
  ; drill.e16.ts:292  load(ICONS_BANK, ICONS_AT, ICONS_TILE * 32, ICONS_BYTES)
  li a0, 259
  li a1, 54722
  li a2, 4544
  li a3, 160
  call load
  ; drill.e16.ts:293  load(BAND_BANK, BAND_AT, BAND_TILE * 32, BAND_BYTES)
  li a0, 259
  li a1, 54882
  li a2, 4704
  li a3, 384
  call load
  ; drill.e16.ts:294  load(QUARTERS_BANK, QUARTERS_AT, QUARTERS_TILE * 32, QUARTERS_BYTES)
  li a0, 259
  li a1, 55266
  li a2, 5088
  li a3, 640
  call load
  ; drill.e16.ts:295  load(GROUND_BANK, GROUND_AT, GROUND_TILE * 32, GROUND_BYTES)
  li a0, 259
  li a1, 55906
  li a2, 5728
  li a3, 576
  call load
  ; drill.e16.ts:296  load(LOOSE_BANK, LOOSE_AT, LOOSE_TILE * 32, LOOSE_BYTES)
  li a0, 260
  li a1, 49152
  li a2, 6304
  li a3, 2048
  call load
  ; drill.e16.ts:297  load(POP_BANK, POP_AT, POP_TILE * 32, POP_BYTES)
  li a0, 260
  li a1, 51200
  li a2, 8352
  li a3, 640
  call load
  ; drill.e16.ts:298  load(ALLOY_BANK, ALLOY_AT, ALLOY_TILE * 32, ALLOY_BYTES)
  li a0, 260
  li a1, 51840
  li a2, 8992
  li a3, 640
  call load
  ; drill.e16.ts:299  load(CAPSULE_BANK, CAPSULE_AT, CAPSULE_TILE * 32, CAPSULE_BYTES)
  li a0, 260
  li a1, 52480
  li a2, 9632
  li a3, 256
  call load
  ; drill.e16.ts:300  load(CORE_BANK, CORE_AT, CORE_TILE * 32, CORE_BYTES)
  li a0, 260
  li a1, 52736
  li a2, 9888
  li a3, 128
  call load
  ; drill.e16.ts:301  load(DRILLER_BANK, DRILLER_AT, DRILLER_TILE * 32, DRILLER_BYTES)
  li a0, 260
  li a1, 52864
  li a2, 10016
  li a3, 3072
  call load
  ; drill.e16.ts:302  load(BIT_BANK, BIT_AT, BIT_TILE * 32, BIT_BYTES)
  li a0, 260
  li a1, 55936
  li a2, 13088
  li a3, 768
  call load
  ; drill.e16.ts:303  load(FX_BANK, FX_AT, FX_TILE * 32, FX_BYTES)
  li a0, 260
  li a1, 56704
  li a2, 13856
  li a3, 320
  call load
  ; drill.e16.ts:304  load(PANELS_TILES_BANK, PANELS_TILES_AT, PANELS_TILE * 32, PANELS_TILES_BYTES)
  li a0, 261
  li a1, 49152
  li a2, 14176
  li a3, 8448
  call load
  ; drill.e16.ts:305  load(LOGO_TILES_BANK, LOGO_TILES_AT, LOGO_TILE * 32, LOGO_TILES_BYTES)
  li a0, 263
  li a1, 53760
  li a2, 22624
  li a3, 3424
  call load
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:309 panelsIn() at -O1
;   y in s1
panelsIn:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; drill.e16.ts:310  let y: u16 = 0
  li s1, 0 ; y
  ; drill.e16.ts:311  while (y < PANELS_H) {
  j .L3
.L1:
  ; drill.e16.ts:312  mapRow(PANELS_MAP_BANK, 0xc000 + y * 128, 1, y)
  slli t0, s1, 7
  li t1, 49152
  add t1, t1, t0
  li a0, 263
  mv a1, t1
  li a2, 1
  mv a3, s1
  call mapRow
  ; drill.e16.ts:313  y++
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; drill.e16.ts:321 logoIn(x, y) at -O1
;   x in s3
;   y in 0(fp)
;   old in 2(fp)
;   r in s1
;   c in s2
logoIn:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; x
  sw a1, 0(fp) ; y
  ; drill.e16.ts:322  palette(PAL_LOGO, 5)
  li a0, 13
  li a1, 5
  call palette
  ; drill.e16.ts:323  palKeep(PAL_LOGO, 5)
  li a0, 13
  li a1, 5
  call palKeep
  ; drill.e16.ts:324  const old = bank(LOGO_MAP_BANK)
  li a0, 264
  call bank
  sw a0, 2(fp) ; old
  ; drill.e16.ts:325  let r: u16 = 0
  li s1, 0 ; r
  ; drill.e16.ts:326  while (r < LOGO_H) {
  j .L3
.L1:
  ; drill.e16.ts:327  let c: u16 = 0
  li s2, 0 ; c
  ; drill.e16.ts:328  while (c < LOGO_W) {
  j .L7
.L5:
  ; drill.e16.ts:329  vpoke(cellAt(1, x + c, y + r), peek16(0xc000 + r * 128 + c * 2) | 0x8000)
  add t0, s3, s2
  lw t1, 0(fp) ; y
  add t1, t1, s1
  li a0, 1
  mv a1, t0
  mv a2, t1
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
  ; drill.e16.ts:330  c++
  addi s2, s2, 1
.L7:
  li t0, 31
  bltu s2, t0, .L5
  ; drill.e16.ts:332  r++
  addi s1, s1, 1
.L3:
  li t0, 6
  bltu s1, t0, .L1
  ; drill.e16.ts:334  poke16(IO_BANK, old)
  lw t0, 2(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; drill.e16.ts:338 frameBegin() at -O1
frameBegin:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:339  seen = frame_wait(seen)
  lw a0, 0x1d08(zero)
  call frame_wait
  sw a0, 0x1d08(zero)
  ; drill.e16.ts:340  frameStart = csrr(0xc00)
  csrr t0, 3072
  sw t0, 0x1d28(zero)
  ; drill.e16.ts:341  sprShow()
  call sprShow
  ; drill.e16.ts:342  poke16(BG0Y, scrollNext & 511)
  lw t0, 0x1d12(zero)
  andi t0, t0, 511
  li t1, 63522
  sw t0, 0(t1)
  ; drill.e16.ts:343  pulse()
  call pulse
  ; drill.e16.ts:344  padRead()
  call padRead
  ; drill.e16.ts:345  soundTick()
  call soundTick
  ; drill.e16.ts:346  sprBegin()
  ; lib/kit.e16.ts:233  sprN = 0
  sw zero, 0x0880(zero)
  ; drill.e16.ts:347  frame++
  lw t0, 0x1d0a(zero)
  addi t0, t0, 1
  sw t0, 0x1d0a(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:354 spent() at -O1
spent:
  ; drill.e16.ts:355  return wrap16(csrr(0xc00) - frameStart)
  csrr t0, 3072
  lw t1, 0x1d28(zero)
  sub a0, t0, t1
.return:
  ret

; drill.e16.ts:359 seenIs(v) at -O1
;   v in a0
seenIs:
  ; drill.e16.ts:360  seen = v
  sw a0, 0x1d08(zero)
.return:
  ret

; drill.e16.ts:364 scrollIs(y) at -O1
;   y in a0
scrollIs:
  ; drill.e16.ts:365  scrollNext = y
  sw a0, 0x1d12(zero)
.return:
  ret

; drill.e16.ts:372 pulse() at -O1
;   p in s2
;   t in s0
;   k in s1
;   turn in s3
pulse:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  ; drill.e16.ts:374  if ((frame & 1) !== 0) return
  lw t0, 0x1d0a(zero)
  andi t0, t0, 1
  beq t0, zero, .L1
  ; drill.e16.ts:374  return
  j .return
.L1:
  ; drill.e16.ts:375  const p = frame & 15
  lw t0, 0x1d0a(zero)
  andi s2, t0, 15
  ; drill.e16.ts:376  const t: u16 = p < 8 ? p + 4 : 20 - p
  li t0, 8
  bgeu s2, t0, .L2
  addi t0, s2, 4
  j .L3
.L2:
  li t0, 20
  sub t0, t0, s2
.L3:
  mv s0, t0 ; t
  ; drill.e16.ts:377  let k: u16 = 2
  li s1, 2 ; k
  ; drill.e16.ts:378  while (k < 8) {
  j .L6
.L4:
  ; drill.e16.ts:379  colour(SL_FLASH, k, mix(palCopy[SL_FLASH * 16 + k], 0x3b9f, t))
  addi t0, s1, 96
  slli t0, t0, 1
  lw a0, palCopy(t0)
  li a1, 15263
  mv a2, s0
  call mix
  mv a1, s1
  mv a2, a0
  li a0, 6
  call colour
  ; drill.e16.ts:380  k++
  addi s1, s1, 1
.L6:
  li t0, 8
  bltu s1, t0, .L4
  ; drill.e16.ts:382  if ((frame & 7) !== 0) return
  lw t0, 0x1d0a(zero)
  andi t0, t0, 7
  beq t0, zero, .L8
  ; drill.e16.ts:382  return
  j .return
.L8:
  ; drill.e16.ts:383  const turn = (frame >> 3) % 3
  lw t0, 0x1d0a(zero)
  srli t0, t0, 3
  li t1, 3
  remu s3, t0, t1
  ; drill.e16.ts:384  colour(SL_FLASH, 9, palCopy[SL_FLASH * 16 + 9 + turn])
  addi t0, s3, 105
  slli t0, t0, 1
  lw t0, palCopy(t0)
  li a0, 6
  li a1, 9
  mv a2, t0
  call colour
  ; drill.e16.ts:385  colour(SL_FLASH, 10, palCopy[SL_FLASH * 16 + 9 + ((turn + 1) % 3)])
  li t0, 3
  addi t1, s3, 1
  remu t1, t1, t0
  addi t1, t1, 105
  slli t1, t1, 1
  lw t1, palCopy(t1)
  li a0, 6
  li a1, 10
  mv a2, t1
  call colour
  ; drill.e16.ts:386  colour(SL_FLASH, 11, palCopy[SL_FLASH * 16 + 9 + ((turn + 2) % 3)])
  li t0, 3
  addi t1, s3, 2
  remu t1, t1, t0
  addi t1, t1, 105
  slli t1, t1, 1
  lw t1, palCopy(t1)
  li a0, 6
  li a1, 11
  mv a2, t1
  call colour
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; drill.e16.ts:392 points(n) at -O1
;   n in s3
;   left in s1
;   k in s2
points:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; n
  ; drill.e16.ts:393  let left = n
  mv s1, s3 ; left
  ; drill.e16.ts:394  while (left > 0) {
  j .L3
.L1:
  ; drill.e16.ts:395  const k = left > 9000 ? 9000 : left
  li t0, 9000
  bgeu t0, s1, .L5
  li t0, 9000
  j .L6
.L5:
  mv t0, s1
.L6:
  mv s2, t0 ; k
  ; drill.e16.ts:396  scoreAdd(addr(score), k)
  la a0, score
  mv a1, s2
  call scoreAdd
  ; drill.e16.ts:397  left = left - k
  sub s1, s1, s2
.L3:
  bltu zero, s1, .L1
  ; drill.e16.ts:399  if (scoreMore(addr(score), addr(best))) {
  la a0, score
  la a1, best
  call scoreMore
  beqz a0, .L7
  ; drill.e16.ts:400  best[0] = score[0]
  lw t0, score(zero)
  sw t0, best(zero)
  ; drill.e16.ts:401  best[1] = score[1]
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

; drill.e16.ts:406 pace(s) at -O1
;   s in s1
pace:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; s
  ; drill.e16.ts:407  airPace(60 - s * 6)
  slli t1, s1, 2
  slli t0, s1, 1
  add t0, t0, t1
  li t1, 60
  sub a0, t1, t0
  la t0, airPace
  li t1, 258
  call far_call
  ; drill.e16.ts:408  fallPace(64 - s * 7, 8 + s)
  slli t1, s1, 3
  sub t0, t1, s1
  li t1, 64
  sub a0, t1, t0
  addi a1, s1, 8
  call fallPace
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; drill.e16.ts:411 gameNew() at -O1
gameNew:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:412  frame = 0
  sw zero, 0x1d0a(zero)
  ; drill.e16.ts:413  fieldNew()
  call fieldNew
  ; drill.e16.ts:414  fallClear()
  call fallClear
  ; drill.e16.ts:415  fxClear()
  la t0, fxClear
  li t1, 258
  call far_call
  ; drill.e16.ts:416  playerNew()
  la t0, playerNew
  li t1, 258
  call far_call
  ; drill.e16.ts:417  camY = 0
  sw zero, 0x1d0c(zero)
  ; drill.e16.ts:418  view = 0
  sw zero, 0x1d0e(zero)
  ; drill.e16.ts:419  scrollNext = 0
  sw zero, 0x1d12(zero)
  ; drill.e16.ts:420  lives = 3
  li t0, 3
  sw t0, 0x1d14(zero)
  ; drill.e16.ts:421  stratum = 0
  sw zero, 0x1d16(zero)
  ; drill.e16.ts:422  maxDepth = 0
  sw zero, 0x1d18(zero)
  ; drill.e16.ts:423  maxChain = 0
  sw zero, 0x1d1a(zero)
  ; drill.e16.ts:424  continues = 0
  sw zero, 0x1d1c(zero)
  ; drill.e16.ts:425  outcome = 0
  sw zero, 0x1d1e(zero)
  ; drill.e16.ts:426  alarmT = 0
  sw zero, 0x1d20(zero)
  ; drill.e16.ts:427  bannerT = 90
  li t0, 90
  sw t0, 0x1d22(zero)
  ; drill.e16.ts:428  jingleT = 0
  sw zero, 0x1d24(zero)
  ; drill.e16.ts:429  wasAlive = true
  li t0, 1
  sw t0, 0x1d26(zero)
  ; drill.e16.ts:430  score[0] = 0
  sw zero, score(zero)
  ; drill.e16.ts:431  score[1] = 0
  sw zero, score+2(zero)
  ; drill.e16.ts:432  pace(0)
  li a0, 0
  call pace
  ; drill.e16.ts:433  panelsIn()
  call panelsIn
  ; drill.e16.ts:434  hudLabels()
  la t0, hudLabels
  li t1, 258
  call far_call
  ; drill.e16.ts:435  stratumShow(0)
  li a0, 0
  la t0, stratumShow
  li t1, 258
  call far_call
  ; drill.e16.ts:436  markAll()
  call markAll
  ; drill.e16.ts:437  fieldDraw(0, 31, 300)
  li a0, 0
  li a1, 31
  li a2, 300
  call fieldDraw
  ; drill.e16.ts:438  music(M_MAIN)
  li a0, 2
  call music
  ; drill.e16.ts:439  band(100, 1)
  li a0, 100
  li a1, 1
  call band
  ; drill.e16.ts:440  say(17, 13, str('READY'), W_GOLD)
  li a0, 17
  li a1, 13
  la a2, str_0
  li a3, 6
  call say
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:444 game() at -O1
game:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:445  gameNew()
  call gameNew
  ; drill.e16.ts:446  for (;;) {
.L1:
  ; drill.e16.ts:447  frameBegin()
  call frameBegin
  ; drill.e16.ts:448  if (pressed(B_START)) pause()
  li a0, 1024
  call pressed
  beqz a0, .L5
  ; drill.e16.ts:448  pause()
  la t0, pause
  li t1, 257
  call far_call
.L5:
  ; drill.e16.ts:449  playFrame()
  call playFrame
  ; drill.e16.ts:450  if (outcome !== 0) break
  lw t0, 0x1d1e(zero)
  beq t0, zero, .L1
  ; drill.e16.ts:450  break
  ; drill.e16.ts:452  if (outcome === O_GOAL) goal()
  lw t0, 0x1d1e(zero)
  li t1, 2
  bne t0, t1, .L7
  ; drill.e16.ts:452  goal()
  la t0, goal
  li t1, 257
  call far_call
.L7:
  ; drill.e16.ts:453  results()
  la t0, results
  li t1, 257
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:457 playFrame() at -O1
;   dying in s1
playFrame:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; drill.e16.ts:458  const dying = !alive()
  la t0, alive
  li t1, 258
  call far_call
  seqz s1, a0
  ; drill.e16.ts:459  playerStep(frame, dying)
  lw a0, 0x1d0a(zero)
  mv a1, s1
  la t0, playerStep
  li t1, 258
  call far_call
  ; drill.e16.ts:460  if (!dying) fieldStep()
  bnez s1, .L1
  ; drill.e16.ts:460  fieldStep()
  call fieldStep
  j .L2
.L1:
  ; drill.e16.ts:461  if (deathDone()) afterDeath()
  la t0, deathDone
  li t1, 258
  call far_call
  beqz a0, .L3
  ; drill.e16.ts:461  afterDeath()
  call afterDeath
.L3:
.L2:
  ; drill.e16.ts:462  if (wasAlive && !alive()) {
  lw t0, 0x1d26(zero)
  beqz t0, .L4
  la t0, alive
  li t1, 258
  call far_call
  bnez a0, .L4
  ; drill.e16.ts:463  shakeT = 12
  li t0, 12
  sw t0, 0x1d10(zero)
  ; drill.e16.ts:464  if (pState === P_GASP) sfxGasp()
  lw t0, 0x1da0(zero)
  li t1, 7
  bne t0, t1, .L5
  ; drill.e16.ts:464  sfxGasp()
  call sfxGasp
.L5:
.L4:
  ; drill.e16.ts:466  wasAlive = alive()
  la t0, alive
  li t1, 258
  call far_call
  sw a0, 0x1d26(zero)
  ; drill.e16.ts:467  cameraStep()
  call cameraStep
  ; drill.e16.ts:468  ringStep()
  call ringStep
  ; drill.e16.ts:469  drawStep()
  call drawStep
  ; drill.e16.ts:470  events()
  call events
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; drill.e16.ts:474 fieldStep() at -O1
fieldStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:475  newsClear()
  call newsClear
  ; drill.e16.ts:476  pendStep(frame, 24)
  lw a0, 0x1d0a(zero)
  li a1, 24
  call pendStep
  ; drill.e16.ts:477  pops()
  call pops
  ; drill.e16.ts:478  suspectsStep(spent() < 20000 ? 100 : 24)
  call spent
  li t0, 20000
  bgeu a0, t0, .L1
  li t0, 100
  j .L2
.L1:
  li t0, 24
.L2:
  mv a0, t0
  call suspectsStep
  ; drill.e16.ts:479  unitsStep()
  call unitsStep
  ; drill.e16.ts:480  chainsStep(frame, spent() < 24000 ? 60 : 12)
  lw t0, 0x1d0a(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  call spent
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
  li t2, 24000
  bgeu t1, t2, .L3
  li t1, 60
  j .L4
.L3:
  li t1, 12
.L4:
  mv a0, t0
  mv a1, t1
  call chainsStep
  ; drill.e16.ts:481  if (struck === 1 && pSafe === 0) {
  lw t0, 0x1882(zero)
  li t1, 1
  bne t0, t1, .L5
  lw t0, 0x1db0(zero)
  bne t0, zero, .L5
  ; drill.e16.ts:482  crushed()
  la t0, crushed
  li t1, 258
  call far_call
  ; drill.e16.ts:483  sfxCrush()
  call sfxCrush
  j .L6
.L5:
  ; drill.e16.ts:484  if (struck === 2) {
  lw t0, 0x1882(zero)
  li t1, 2
  bne t0, t1, .L7
  ; drill.e16.ts:485  caughtFalling()
  la t0, caughtFalling
  li t1, 258
  call far_call
  ; drill.e16.ts:486  sfxCapsule()
  call sfxCapsule
  ; drill.e16.ts:487  bubbles(i16(FIELD_X + pX) + 8, i16(pY))
  lw t0, 0x1d9c(zero)
  lw t1, 0x1d9e(zero)
  addi a0, t0, 96
  mv a1, t1
  la t0, bubbles
  li t1, 258
  call far_call
.L7:
.L6:
  ; drill.e16.ts:489  struckClear()
  ; fall.e16.ts:136  struck = 0
  sw zero, 0x1882(zero)
  ; drill.e16.ts:490  scoreFrame()
  call scoreFrame
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:494 pops() at -O1
;   k in s1
;   c in s2
;   y in s0
;   t in s3
pops:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  ; drill.e16.ts:495  let k: u16 = 0
  li s1, 0 ; k
  ; drill.e16.ts:496  while (k < goneN) {
  j .L3
.L1:
  ; drill.e16.ts:497  const c = goneCell[k]
  slli t0, s1, 1
  lw s2, goneCell(t0)
  ; drill.e16.ts:498  const y = rowOf(c >> 4) * 16
  srli a0, s2, 4
  call rowOf
  slli s0, a0, 4
  ; drill.e16.ts:499  const t = goneType[k]
  slli t0, s1, 1
  lw s3, goneType(t0)
  ; drill.e16.ts:500  pop(i16(FIELD_X + (c & 15) * 16), i16(y), t, (k & 1) + (t <= T_BLUE ? 0 : 1))
  andi t0, s2, 15
  slli t0, t0, 4
  andi t1, s1, 1
  addi t0, t0, 88
  mv t2, s3
  mv t3, t1
  mv t1, s0
  mv a1, s3
  li a2, 4
  bltu a2, a1, .L5
  li a1, 0
  j .L6
.L5:
  li a1, 1
.L6:
  add t3, t3, a1
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  la t0, pop
  li t1, 258
  call far_call
  ; drill.e16.ts:501  k++
  addi s1, s1, 1
.L3:
  lw t0, 0x1cf8(zero)
  bltu s1, t0, .L1
  ; drill.e16.ts:503  if (goneN > 0 && (frame & 3) === 0) sfxPop()
  lw t0, 0x1cf8(zero)
  bgeu zero, t0, .L7
  lw t0, 0x1d0a(zero)
  andi t0, t0, 3
  bne t0, zero, .L7
  ; drill.e16.ts:503  sfxPop()
  call sfxPop
.L7:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; drill.e16.ts:507 scoreFrame() at -O1
;   worth in s1
;   c in s2
;   x in s3
;   y in s0
scoreFrame:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; drill.e16.ts:508  if (dugN > 0) points(dugN * 10)
  lw t0, 0x1db8(zero)
  bgeu zero, t0, .L1
  ; drill.e16.ts:508  points(dugN * 10)
  lw t0, 0x1db8(zero)
  slli t1, t0, 3
  slli t0, t0, 1
  add a0, t0, t1
  call points
.L1:
  ; drill.e16.ts:509  if (vanishedBlocks > 0) {
  lw t0, 0x1a0c(zero)
  bgeu zero, t0, .L2
  ; drill.e16.ts:510  const worth = vanishedBlocks * 20 * vanishedChain
  lw t0, 0x1a0c(zero)
  slli t1, t0, 4
  slli t0, t0, 2
  add t0, t0, t1
  lw t1, 0x1a0e(zero)
  mul s1, t0, t1
  ; drill.e16.ts:511  points(worth)
  mv a0, s1
  call points
  ; drill.e16.ts:512  if (vanishedChain > maxChain) maxChain = vanishedChain
  lw t0, 0x1a0e(zero)
  lw t1, 0x1d1a(zero)
  bgeu t1, t0, .L3
  ; drill.e16.ts:512  maxChain = vanishedChain
  lw t0, 0x1a0e(zero)
  sw t0, 0x1d1a(zero)
.L3:
  ; drill.e16.ts:513  const c = vanishedAt
  lw s2, 0x1a10(zero)
  ; drill.e16.ts:514  const x = i16(FIELD_X + (c & 15) * 16) + 8
  andi t0, s2, 15
  slli t0, t0, 4
  addi s3, t0, 96
  ; drill.e16.ts:515  const y = i16(rowOf(c >> 4) * 16) - 10
  srli a0, s2, 4
  call rowOf
  slli t0, a0, 4
  addi s0, t0, -10
  ; drill.e16.ts:516  if (vanishedChain >= 2) chainShow(x, y, vanishedChain)
  lw t0, 0x1a0e(zero)
  li t1, 2
  bltu t0, t1, .L4
  ; drill.e16.ts:516  chainShow(x, y, vanishedChain)
  lw t0, 0x1a0e(zero)
  mv a0, s3
  mv a1, s0
  mv a2, t0
  la t0, chainShow
  li t1, 258
  call far_call
  j .L5
.L4:
  ; drill.e16.ts:517  plusShow(x, y, worth)
  mv a0, s3
  mv a1, s0
  mv a2, s1
  la t0, plusShow
  li t1, 258
  call far_call
.L5:
  ; drill.e16.ts:518  sfxChain(vanishedChain)
  lw a0, 0x1a0e(zero)
  call sfxChain
.L2:
  ; drill.e16.ts:520  if (capsuleN > 0) {
  lw t0, 0x1dbc(zero)
  bgeu zero, t0, .L6
  ; drill.e16.ts:521  points(capsuleN * 100)
  lw t0, 0x1dbc(zero)
  li t1, 100
  mul a0, t0, t1
  call points
  ; drill.e16.ts:522  sfxCapsule()
  call sfxCapsule
  ; drill.e16.ts:523  bubbles(i16(FIELD_X + pX) + 8, i16(pY))
  lw t0, 0x1d9c(zero)
  lw t1, 0x1d9e(zero)
  addi a0, t0, 96
  mv a1, t1
  la t0, bubbles
  li t1, 258
  call far_call
.L6:
  ; drill.e16.ts:525  if (alloyBroken !== 0) {
  lw t0, 0x1dba(zero)
  beq t0, zero, .L7
  ; drill.e16.ts:526  points(50)
  li a0, 50
  call points
  ; drill.e16.ts:527  shakeT = 6
  li t0, 6
  sw t0, 0x1d10(zero)
.L7:
  ; drill.e16.ts:529  if (loosened > 0) sfxRumble()
  lw t0, 0x1a14(zero)
  bgeu zero, t0, .L8
  ; drill.e16.ts:529  sfxRumble()
  call sfxRumble
.L8:
  ; drill.e16.ts:530  if (pRow > 5 && pRow - 5 > maxDepth) {
  lw t0, 0x1d9a(zero)
  li t1, 5
  bgeu t1, t0, .L9
  lw t0, 0x1d9a(zero)
  lw t1, 0x1d18(zero)
  addi t0, t0, -5
  bgeu t1, t0, .L9
  ; drill.e16.ts:531  points((pRow - 5 - maxDepth) * 10)
  lw t0, 0x1d9a(zero)
  lw t1, 0x1d18(zero)
  addi t0, t0, -5
  sub t0, t0, t1
  slli t1, t0, 3
  slli t0, t0, 1
  add a0, t0, t1
  call points
  ; drill.e16.ts:532  maxDepth = pRow - 5
  lw t0, 0x1d9a(zero)
  addi t0, t0, -5
  sw t0, 0x1d18(zero)
.L9:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; drill.e16.ts:537 afterDeath() at -O1
afterDeath:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:538  if (lives > 0) lives--
  lw t0, 0x1d14(zero)
  bgeu zero, t0, .L1
  ; drill.e16.ts:538  lives--
  lw t0, 0x1d14(zero)
  addi t0, t0, -1
  sw t0, 0x1d14(zero)
.L1:
  ; drill.e16.ts:539  if (lives > 0) {
  lw t0, 0x1d14(zero)
  bgeu zero, t0, .L2
  ; drill.e16.ts:540  comeBack()
  la t0, comeBack
  li t1, 258
  call far_call
  ; drill.e16.ts:541  return
  j .return
.L2:
  ; drill.e16.ts:543  if (continueAsk()) {
  la t0, continueAsk
  li t1, 257
  call far_call
  beqz a0, .L3
  ; drill.e16.ts:544  lives = 3
  li t0, 3
  sw t0, 0x1d14(zero)
  ; drill.e16.ts:545  continues++
  lw t0, 0x1d1c(zero)
  addi t0, t0, 1
  sw t0, 0x1d1c(zero)
  ; drill.e16.ts:546  comeBack()
  la t0, comeBack
  li t1, 258
  call far_call
  ; drill.e16.ts:547  return
  j .return
.L3:
  ; drill.e16.ts:549  outcome = O_OVER
  li t0, 1
  sw t0, 0x1d1e(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:553 cameraStep() at -O1
;   want in a0
;   shake in a1
cameraStep:
  ; drill.e16.ts:554  let want: u16 = pY > 96 ? pY - 96 : 0
  lw t0, 0x1d9e(zero)
  li t1, 96
  bgeu t1, t0, .L1
  lw t0, 0x1d9e(zero)
  addi t0, t0, -96
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0 ; want
  ; drill.e16.ts:555  if (want < top * 16) want = top * 16
  lw t0, 0x10b0(zero)
  slli t0, t0, 4
  bgeu a0, t0, .L3
  ; drill.e16.ts:555  want = top * 16
  lw t0, 0x10b0(zero)
  slli a0, t0, 4
.L3:
  ; drill.e16.ts:556  const most = (CORE_ROW + 3) * 16 - 288
  ; drill.e16.ts:557  if (want > most) want = most
  li t0, 7856
  bgeu t0, a0, .L4
  ; drill.e16.ts:557  want = most
  li a0, 7856 ; want
.L4:
  ; drill.e16.ts:558  if (want > camY) camY = camY + ((want - camY + 7) >> 3)
  lw t0, 0x1d0c(zero)
  bgeu t0, a0, .L5
  ; drill.e16.ts:558  camY = camY + ((want - camY + 7) >> 3)
  lw t0, 0x1d0c(zero)
  lw t1, 0x1d0c(zero)
  sub t1, a0, t1
  addi t1, t1, 7
  srli t1, t1, 3
  add t0, t0, t1
  sw t0, 0x1d0c(zero)
  j .L6
.L5:
  ; drill.e16.ts:559  if (want < camY) camY = camY - ((camY - want + 7) >> 3)
  lw t0, 0x1d0c(zero)
  bgeu a0, t0, .L7
  ; drill.e16.ts:559  camY = camY - ((camY - want + 7) >> 3)
  lw t0, 0x1d0c(zero)
  lw t1, 0x1d0c(zero)
  sub t1, t1, a0
  addi t1, t1, 7
  srli t1, t1, 3
  sub t0, t0, t1
  sw t0, 0x1d0c(zero)
.L7:
.L6:
  ; drill.e16.ts:560  let shake: u16 = 0
  li a1, 0 ; shake
  ; drill.e16.ts:561  if (shakeT > 0) {
  lw t0, 0x1d10(zero)
  bgeu zero, t0, .L8
  ; drill.e16.ts:562  shakeT--
  lw t0, 0x1d10(zero)
  addi t0, t0, -1
  sw t0, 0x1d10(zero)
  ; drill.e16.ts:563  shake = (shakeT & 2) !== 0 ? 2 : 0
  andi t0, t0, 2
  beq t0, zero, .L9
  li t0, 2
  j .L10
.L9:
  li t0, 0
.L10:
  mv a1, t0 ; shake
.L8:
  ; drill.e16.ts:565  view = camY + shake
  lw t0, 0x1d0c(zero)
  add t0, t0, a1
  sw t0, 0x1d0e(zero)
  ; drill.e16.ts:566  scrollNext = view
  sw t0, 0x1d12(zero)
.return:
  ret

; drill.e16.ts:570 ringStep() at -O1
;   ring in s1
ringStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; drill.e16.ts:571  if (camY >> 4 <= top + 6) return
  lw t0, 0x1d0c(zero)
  srli t0, t0, 4
  lw t1, 0x10b0(zero)
  addi t1, t1, 6
  bltu t1, t0, .L1
  ; drill.e16.ts:571  return
  j .return
.L1:
  ; drill.e16.ts:572  const ring = top & 31
  lw t0, 0x10b0(zero)
  andi s1, t0, 31
  ; drill.e16.ts:573  fallForget(ring)
  mv a0, s1
  call fallForget
  ; drill.e16.ts:574  pendForget(ring)
  mv a0, s1
  call pendForget
  ; drill.e16.ts:575  fieldAdvance()
  call fieldAdvance
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; drill.e16.ts:579 drawStep() at -O1
;   busy in s1
drawStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; drill.e16.ts:581  const busy = spent()
  call spent
  mv s1, a0 ; busy
  ; drill.e16.ts:582  fieldDraw(camY >> 4, 19, busy < 16000 ? 24 : busy < 26000 ? 10 : 3)
  lw t0, 0x1d0c(zero)
  srli t0, t0, 4
  li t1, 19
  mv t2, s1
  li t3, 16000
  bgeu t2, t3, .L1
  li t2, 24
  j .L2
.L1:
  mv t2, s1
  li t3, 26000
  bgeu t2, t3, .L3
  li t2, 10
  j .L4
.L3:
  li t2, 3
.L4:
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call fieldDraw
  ; drill.e16.ts:584  bandDraw()
  call bandDraw
  ; drill.e16.ts:585  fxStep(view)
  lw a0, 0x1d0e(zero)
  la t0, fxStep
  li t1, 258
  call far_call
  ; drill.e16.ts:586  looseDraw()
  call looseDraw
  ; drill.e16.ts:587  playerDraw(view, frame)
  lw t0, 0x1d0e(zero)
  lw t1, 0x1d0a(zero)
  mv a0, t0
  mv a1, t1
  la t0, playerDraw
  li t1, 258
  call far_call
  ; drill.e16.ts:588  hudStep(maxDepth, air, lives, frame)
  lw t0, 0x1d18(zero)
  lw t1, 0x1db2(zero)
  lw t2, 0x1d14(zero)
  lw t3, 0x1d0a(zero)
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  la t0, hudStep
  li t1, 258
  call far_call
  ; drill.e16.ts:589  hudCounts(maxChain, capsules)
  lw t0, 0x1d1a(zero)
  lw t1, 0x1dbe(zero)
  mv a0, t0
  mv a1, t1
  la t0, hudCounts
  li t1, 258
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; drill.e16.ts:593 looseDraw() at -O1
;   k in s1
;   c in 2(fp)
;   u in s3
;   st in 4(fp)
;   y in s2
;   x in 0(fp)
;   fast in 6(fp)
looseDraw:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  ; drill.e16.ts:594  let k: u16 = 0
  li s1, 0 ; k
  ; drill.e16.ts:595  while (k < lbN) {
  j .L3
.L1:
  ; drill.e16.ts:596  const c = lbCell[k]
  slli t0, s1, 1
  lw t0, lbCell(t0)
  sw t0, 2(fp) ; c
  ; drill.e16.ts:597  const u = lbUnit[k]
  lbu s3, lbUnit(s1)
  ; drill.e16.ts:598  const st = uState[u]
  slli t0, s3, 1
  lw t0, uState(t0)
  sw t0, 4(fp) ; st
  ; drill.e16.ts:599  let y = i16(wrap16(rowOf(c >> 4) * 16 - view))
  lw t0, 2(fp) ; c
  srli a0, t0, 4
  call rowOf
  slli t0, a0, 4
  lw t1, 0x1d0e(zero)
  sub s2, t0, t1
  ; drill.e16.ts:600  if (st === U_FALL) y = y + i16(uOff[u] >> 2)
  li t0, 2
  lw t1, 4(fp) ; st
  bne t1, t0, .L5
  ; drill.e16.ts:600  y = y + i16(uOff[u] >> 2)
  slli t0, s3, 1
  lw t0, uOff(t0)
  srli t0, t0, 2
  add s2, s2, t0
.L5:
  ; drill.e16.ts:601  let x = i16(FIELD_X + (c & 15) * 16)
  lw t0, 2(fp) ; c
  andi t0, t0, 15
  slli t0, t0, 4
  addi t0, t0, 88
  sw t0, 0(fp) ; x
  ; drill.e16.ts:602  if (st === U_WOBBLE) {
  li t0, 1
  lw t1, 4(fp) ; st
  bne t1, t0, .L6
  ; drill.e16.ts:603  const fast = uTime[u] < 24 ? 1 : 2
  slli t0, s3, 1
  lw t0, uTime(t0)
  li t1, 24
  bgeu t0, t1, .L7
  li t0, 1
  j .L8
.L7:
  li t0, 2
.L8:
  sw t0, 6(fp) ; fast
  ; drill.e16.ts:604  x = x + ((frame >> fast) & 1 ? 1 : -1)
  lw t0, 0x1d0a(zero)
  lw t1, 6(fp) ; fast
  srl t0, t0, t1
  andi t1, t0, 1
  lw t0, 0(fp)
  beqz t1, .L9
  li t1, 1
  j .L10
.L9:
  li t1, 65535
.L10:
  add t0, t0, t1
  sw t0, 0(fp) ; x
.L6:
  ; drill.e16.ts:606  if (y > -16 && y < 288) spr(x, y, lbTile[k], S16)
  li t0, 65520
  bge t0, s2, .L11
  li t0, 288
  bge s2, t0, .L11
  ; drill.e16.ts:606  spr(x, y, lbTile[k], S16)
  slli t0, s1, 1
  lw t0, lbTile(t0)
  lw a0, 0(fp)
  mv a1, s2
  mv a2, t0
  li a3, 1
  call spr
.L11:
  ; drill.e16.ts:607  k++
  addi s1, s1, 1
.L3:
  lw t0, 0x1588(zero)
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; drill.e16.ts:612 events() at -O1
events:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:613  if (bannerT > 0) {
  lw t0, 0x1d22(zero)
  bgeu zero, t0, .L1
  ; drill.e16.ts:614  bannerT--
  lw t0, 0x1d22(zero)
  addi t0, t0, -1
  sw t0, 0x1d22(zero)
  ; drill.e16.ts:615  if (bannerT === 0) wellClear()
  bne t0, zero, .L2
  ; drill.e16.ts:615  wellClear()
  call wellClear
.L2:
.L1:
  ; drill.e16.ts:617  if (stratum < 4 && maxDepth >= (stratum + 1) * 100) {
  lw t0, 0x1d16(zero)
  li t1, 4
  bgeu t0, t1, .L3
  lw t0, 0x1d18(zero)
  lw t1, 0x1d16(zero)
  li t2, 100
  addi t1, t1, 1
  mul t1, t1, t2
  bltu t0, t1, .L3
  ; drill.e16.ts:618  stratum++
  lw t0, 0x1d16(zero)
  addi t0, t0, 1
  sw t0, 0x1d16(zero)
  ; drill.e16.ts:619  pace(stratum)
  mv a0, t0
  call pace
  ; drill.e16.ts:620  stratumShow(stratum)
  lw a0, 0x1d16(zero)
  la t0, stratumShow
  li t1, 258
  call far_call
  ; drill.e16.ts:621  points(stratum * 1000)
  lw t0, 0x1d16(zero)
  li t1, 1000
  mul a0, t0, t1
  call points
  ; drill.e16.ts:622  airAdd(20)
  li a0, 20
  la t0, airAdd
  li t1, 258
  call far_call
  ; drill.e16.ts:623  stratumBanner(stratum)
  lw a0, 0x1d16(zero)
  la t0, stratumBanner
  li t1, 257
  call far_call
  ; drill.e16.ts:624  bannerT = 150
  li t0, 150
  sw t0, 0x1d22(zero)
  ; drill.e16.ts:625  jingleT = 110
  li t0, 110
  sw t0, 0x1d24(zero)
  ; drill.e16.ts:626  music(M_STRATUM)
  li a0, 5
  call music
.L3:
  ; drill.e16.ts:628  if (jingleT > 0) {
  lw t0, 0x1d24(zero)
  bgeu zero, t0, .L4
  ; drill.e16.ts:629  jingleT--
  lw t0, 0x1d24(zero)
  addi t0, t0, -1
  sw t0, 0x1d24(zero)
  ; drill.e16.ts:630  if (jingleT === 0) music(baseSong())
  bne t0, zero, .L5
  ; drill.e16.ts:630  music(baseSong())
  call baseSong
  call music
.L5:
.L4:
  ; drill.e16.ts:632  if (maxDepth >= 500 && (pState === P_STAND || pState === P_LAND)) {
  lw t0, 0x1d18(zero)
  li t1, 500
  bltu t0, t1, .L6
  lw t0, 0x1da0(zero)
  beq t0, zero, .L7
  lw t0, 0x1da0(zero)
  li t1, 5
  bne t0, t1, .L6
.L7:
  ; drill.e16.ts:633  outcome = O_GOAL
  li t0, 2
  sw t0, 0x1d1e(zero)
  ; drill.e16.ts:634  return
  j .return
.L6:
  ; drill.e16.ts:636  airMood()
  call airMood
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:639 baseSong() at -O1
baseSong:
  ; drill.e16.ts:640  return stratum >= 3 ? M_DEEP : M_MAIN
  lw t0, 0x1d16(zero)
  li t1, 3
  bltu t0, t1, .L1
  li t0, 3
  j .L2
.L1:
  li t0, 2
.L2:
  mv a0, t0
.return:
  ret

; drill.e16.ts:644 airMood() at -O1
airMood:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; drill.e16.ts:645  if (jingleT > 0 || !alive()) return
  lw t0, 0x1d24(zero)
  bltu zero, t0, .L2
  la t0, alive
  li t1, 258
  call far_call
  bnez a0, .L1
.L2:
  ; drill.e16.ts:645  return
  j .return
.L1:
  ; drill.e16.ts:646  if (air <= 25) {
  lw t0, 0x1db2(zero)
  li t1, 25
  bltu t1, t0, .L3
  ; drill.e16.ts:647  if (song !== M_LOWAIR) music(M_LOWAIR)
  lw t0, 0x1d06(zero)
  li t1, 4
  beq t0, t1, .L4
  ; drill.e16.ts:647  music(M_LOWAIR)
  li a0, 4
  call music
.L4:
  ; drill.e16.ts:648  alarmT++
  lw t0, 0x1d20(zero)
  addi t0, t0, 1
  sw t0, 0x1d20(zero)
  ; drill.e16.ts:649  if (alarmT >= 45) {
  li t1, 45
  bltu t0, t1, .L6
  ; drill.e16.ts:650  alarmT = 0
  sw zero, 0x1d20(zero)
  ; drill.e16.ts:651  sfxAlarm()
  call sfxAlarm
  j .L6
.L3:
  ; drill.e16.ts:654  alarmT = 40
  li t0, 40
  sw t0, 0x1d20(zero)
  ; drill.e16.ts:655  if (song === M_LOWAIR) music(baseSong())
  lw t0, 0x1d06(zero)
  li t1, 4
  bne t0, t1, .L7
  ; drill.e16.ts:655  music(baseSong())
  call baseSong
  call music
.L7:
.L6:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; drill.e16.ts:660 idle(n) at -O1
;   n in s1
idle:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; drill.e16.ts:661  while (n > 0) {
  j .L3
.L1:
  ; drill.e16.ts:662  frameBegin()
  call frameBegin
  ; drill.e16.ts:663  fieldDraw(camY >> 4, 19, 40)
  lw t0, 0x1d0c(zero)
  srli a0, t0, 4
  li a1, 19
  li a2, 40
  call fieldDraw
  ; drill.e16.ts:664  bandDraw()
  call bandDraw
  ; drill.e16.ts:665  fxStep(view)
  lw a0, 0x1d0e(zero)
  la t0, fxStep
  li t1, 258
  call far_call
  ; drill.e16.ts:666  looseDraw()
  call looseDraw
  ; drill.e16.ts:667  playerDraw(view, frame)
  lw t0, 0x1d0e(zero)
  lw t1, 0x1d0a(zero)
  mv a0, t0
  mv a1, t1
  la t0, playerDraw
  li t1, 258
  call far_call
  ; drill.e16.ts:668  n--
  addi s1, s1, -1
.L3:
  bltu zero, s1, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

str_0:
  .byte 82, 69, 65, 68, 89, 0
  .align 2
e16c_fixed_end:

  .bank 1
  .org 0xc000
; scenes.e16.ts:56 title() at -O1
;   t in s1
title:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; scenes.e16.ts:57  music(M_TITLE)
  li a0, 1
  call music
  ; scenes.e16.ts:58  fieldNew()
  call fieldNew
  ; scenes.e16.ts:59  vfill(cellAt(1, 0, 0), PANELS_TILE, 4096)
  li a0, 40960
  li a1, 443
  li a2, 4096
  call vfill
  ; scenes.e16.ts:60  groundFill()
  call groundFill
  ; scenes.e16.ts:61  heapDraw()
  call heapDraw
  ; scenes.e16.ts:62  logoIn(4, 3)
  li a0, 4
  li a1, 3
  call logoIn
  ; scenes.e16.ts:63  scrollIs(0)
  li a0, 0
  call scrollIs
  ; scenes.e16.ts:64  tableShow(15)
  li a0, 15
  call tableShow
  ; scenes.e16.ts:65  say(10, 28, str('(C) ELECXZY PROJECT'), W_WHITE)
  li a0, 10
  li a1, 28
  la a2, str_1
  li a3, 7
  call say
  ; scenes.e16.ts:66  let t: u16 = 0
  li s1, 0 ; t
  ; scenes.e16.ts:67  walkX = 40
  li t0, 40
  sw t0, 0x1d52(zero)
  ; scenes.e16.ts:68  walkFace = 0
  sw zero, 0x1d54(zero)
  ; scenes.e16.ts:69  for (;;) {
.L1:
  ; scenes.e16.ts:70  frameBegin()
  call frameBegin
  ; scenes.e16.ts:71  logoDrop(t)
  mv a0, s1
  call logoDrop
  ; scenes.e16.ts:72  if ((t & 32) === 0) say(14, 10, str('PRESS START'), W_GOLD)
  andi t0, s1, 32
  bne t0, zero, .L5
  ; scenes.e16.ts:72  say(14, 10, str('PRESS START'), W_GOLD)
  li a0, 14
  li a1, 10
  la a2, str_2
  li a3, 6
  call say
  j .L6
.L5:
  ; scenes.e16.ts:73  unsay(14, 10, 11)
  li a0, 14
  li a1, 10
  li a2, 11
  call unsay
.L6:
  ; scenes.e16.ts:74  walker(t)
  mv a0, s1
  call walker
  ; scenes.e16.ts:75  if (t > 40 && pressed(B_START | B_A)) break
  li t0, 40
  bgeu t0, s1, .L7
  li a0, 1040
  call pressed
  beqz a0, .L7
  ; scenes.e16.ts:75  break
  j .L4
.L7:
  ; scenes.e16.ts:76  t++
  addi s1, s1, 1
  j .L1
.L4:
  ; scenes.e16.ts:78  randSeed(frame ^ peek16(0x0202))
  lw t0, 0x1d0a(zero)
  lw t1, 514(zero)
  xor a0, t0, t1
  call randSeed
  ; scenes.e16.ts:79  sfxSelect()
  call sfxSelect
  ; scenes.e16.ts:80  poke16(BG1Y, 0)
  li t0, 63526
  sw zero, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes.e16.ts:84 groundFill() at -O1
;   y in s1
;   x in s2
groundFill:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; scenes.e16.ts:85  let y: u16 = 0
  li s1, 0 ; y
  ; scenes.e16.ts:86  while (y < 36) {
  j .L3
.L1:
  ; scenes.e16.ts:87  let x: u16 = 0
  li s2, 0 ; x
  ; scenes.e16.ts:88  while (x < 40) {
  j .L7
.L5:
  ; scenes.e16.ts:89  vpoke(cellAt(0, x, y), GROUND_TILE + 8 + (((x >> 1) + (y >> 1)) & 1) * 9)
  li a0, 0
  mv a1, s2
  mv a2, s1
  call cellAt
  srli t0, s2, 1
  srli t1, s1, 1
  add t0, t0, t1
  andi t0, t0, 1
  slli t1, t0, 3
  add t0, t1, t0
  addi a1, t0, 187
  call vpoke
  ; scenes.e16.ts:90  x++
  addi s2, s2, 1
.L7:
  li t0, 40
  bltu s2, t0, .L5
  ; scenes.e16.ts:92  y++
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:100 walker(t) at -O1
;   t in s1
;   phase in s3
;   f in s2
walker:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; t
  ; scenes.e16.ts:101  const phase = t % 240
  li t0, 240
  remu s3, s1, t0
  ; scenes.e16.ts:102  let f: u16 = 0
  li s2, 0 ; f
  ; scenes.e16.ts:103  if (phase < 160) {
  li t0, 160
  bgeu s3, t0, .L1
  ; scenes.e16.ts:104  if ((t & 1) === 0) walkX = walkFace === 0 ? walkX + 1 : walkX - 1
  andi t0, s1, 1
  bne t0, zero, .L2
  ; scenes.e16.ts:104  walkX = walkFace === 0 ? walkX + 1 : walkX - 1
  lw t0, 0x1d54(zero)
  bne t0, zero, .L3
  lw t0, 0x1d52(zero)
  addi t0, t0, 1
  j .L4
.L3:
  lw t0, 0x1d52(zero)
  addi t0, t0, -1
.L4:
  sw t0, 0x1d52(zero)
.L2:
  ; scenes.e16.ts:105  if (walkX > 280) walkFace = 1
  lw t0, 0x1d52(zero)
  li t1, 280
  bgeu t1, t0, .L5
  ; scenes.e16.ts:105  walkFace = 1
  li t0, 1
  sw t0, 0x1d54(zero)
.L5:
  ; scenes.e16.ts:106  if (walkX < 24) walkFace = 0
  lw t0, 0x1d52(zero)
  li t1, 24
  bgeu t0, t1, .L6
  ; scenes.e16.ts:106  walkFace = 0
  sw zero, 0x1d54(zero)
.L6:
  ; scenes.e16.ts:107  f = 2 + ((t >> 2) & 3)
  srli t0, s1, 2
  andi t0, t0, 3
  addi s2, t0, 2
  j .L7
.L1:
  ; scenes.e16.ts:108  if (phase < 200) f = 8 + ((t >> 1) & 1)
  li t0, 200
  bgeu s3, t0, .L8
  ; scenes.e16.ts:108  f = 8 + ((t >> 1) & 1)
  srli t0, s1, 1
  andi t0, t0, 1
  addi s2, t0, 8
  j .L9
.L8:
  ; scenes.e16.ts:109  if (phase < 230) f = 21 + ((t >> 4) & 1)
  li t0, 230
  bgeu s3, t0, .L10
  ; scenes.e16.ts:109  f = 21 + ((t >> 4) & 1)
  srli t0, s1, 4
  andi t0, t0, 1
  addi s2, t0, 21
.L10:
.L9:
.L7:
  ; scenes.e16.ts:110  spr(i16(walkX), 240, (DRILLER_TILE + f * 4) | (walkFace !== 0 ? FLIP_H : 0), S16)
  lw t0, 0x1d52(zero)
  slli t1, s2, 2
  lw t3, 0x1d54(zero)
  addi t2, t1, 313
  li t1, 240
  li a1, 0
  beq t3, a1, .L11
  li t3, 8192
  j .L12
.L11:
  li t3, 0
.L12:
  or t2, t2, t3
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call spr
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; scenes.e16.ts:114 logoDrop(t) at -O1
;   t in a0
logoDrop:
  ; scenes.e16.ts:115  if (t < 30) poke16(BG1Y, (30 - t) * 3)
  li t0, 30
  bgeu a0, t0, .L1
  ; scenes.e16.ts:115  poke16(BG1Y, (30 - t) * 3)
  li t0, 30
  sub t0, t0, a0
  slli t1, t0, 1
  add t0, t1, t0
  li t1, 63526
  sw t0, 0(t1)
  j .L2
.L1:
  ; scenes.e16.ts:116  if (t < 36) poke16(BG1Y, 512 - (t - 30))
  li t0, 36
  bgeu a0, t0, .L3
  ; scenes.e16.ts:116  poke16(BG1Y, 512 - (t - 30))
  addi t0, a0, -30
  li t1, 512
  sub t1, t1, t0
  li t0, 63526
  sw t1, 0(t0)
  j .L4
.L3:
  ; scenes.e16.ts:117  if (t < 42) poke16(BG1Y, 512 - (42 - t))
  li t0, 42
  bgeu a0, t0, .L5
  ; scenes.e16.ts:117  poke16(BG1Y, 512 - (42 - t))
  li t0, 42
  sub t0, t0, a0
  li t1, 512
  sub t1, t1, t0
  li t0, 63526
  sw t1, 0(t0)
  j .L6
.L5:
  ; scenes.e16.ts:118  if (t === 42) poke16(BG1Y, 0)
  li t0, 42
  bne a0, t0, .L7
  ; scenes.e16.ts:118  poke16(BG1Y, 0)
  li t0, 63526
  sw zero, 0(t0)
.L7:
.L6:
.L4:
.L2:
.return:
  ret

; scenes.e16.ts:122 heapDraw() at -O1
;   k in s1
heapDraw:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; scenes.e16.ts:123  let k: u16 = 0
  li s1, 0 ; k
  ; scenes.e16.ts:124  while (k < 40) {
  j .L3
.L1:
  ; scenes.e16.ts:125  heap[k] = 1 + (rand() & 3)
  call rand
  andi t0, a0, 3
  addi t0, t0, 1
  sb t0, heap(s1)
  ; scenes.e16.ts:126  if (k >= 20 && (rand() & 3) !== 0) heap[k] = heap[k - 20]
  li t0, 20
  bltu s1, t0, .L5
  call rand
  andi t0, a0, 3
  beq t0, zero, .L5
  ; scenes.e16.ts:126  heap[k] = heap[k - 20]
  lbu t0, heap-20(s1)
  sb t0, heap(s1)
  j .L6
.L5:
  ; scenes.e16.ts:127  if (k > 0 && (rand() & 1) !== 0 && k !== 20) heap[k] = heap[k - 1]
  bgeu zero, s1, .L7
  call rand
  andi t0, a0, 1
  beq t0, zero, .L7
  li t0, 20
  beq s1, t0, .L7
  ; scenes.e16.ts:127  heap[k] = heap[k - 1]
  lbu t0, heap-1(s1)
  sb t0, heap(s1)
.L7:
.L6:
  ; scenes.e16.ts:128  k++
  addi s1, s1, 1
.L3:
  li t0, 40
  bltu s1, t0, .L1
  ; scenes.e16.ts:130  k = 0
  li s1, 0 ; k
  ; scenes.e16.ts:131  while (k < 40) {
  j .L10
.L8:
  ; scenes.e16.ts:132  heapCell(k % 20, div(k, 20))
  li t0, 20
  remu t0, s1, t0
  li t1, 20
  divu t1, s1, t1
  mv a0, t0
  mv a1, t1
  call heapCell
  ; scenes.e16.ts:133  k++
  addi s1, s1, 1
.L10:
  li t0, 40
  bltu s1, t0, .L8
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes.e16.ts:137 heapAt(x, y, c) at -O1
;   x in a0
;   y in a1
;   c in a2
heapAt:
  ; scenes.e16.ts:138  if (x >= 20 || y >= 2) return 0
  li t0, 20
  bgeu a0, t0, .L2
  li t0, 2
  bltu a1, t0, .L1
.L2:
  ; scenes.e16.ts:138  return 0
  li a0, 0
  ret
.L1:
  ; scenes.e16.ts:139  return heap[y * 20 + x] === c ? 1 : 0
  slli t1, a1, 4
  slli t0, a1, 2
  add t0, t0, t1
  add t0, t0, a0
  lbu t0, heap(t0)
  bne t0, a2, .L3
  li t0, 1
  j .L4
.L3:
  li t0, 0
.L4:
  mv a0, t0
.return:
  ret

; scenes.e16.ts:142 heapCell(x, y) at -O1
;   x in s2
;   y in s3
;   c in s1
;   up in 4(fp)
;   left in 6(fp)
;   n in 8(fp)
;   s in 10(fp)
;   w in 12(fp)
;   e in 14(fp)
;   base in 0(fp)
;   at in 2(fp)
heapCell:
  addi sp, sp, -26
  sw ra, 16(sp)
  sw s2, 18(sp)
  sw s3, 20(sp)
  sw s1, 22(sp)
  sw s0, 24(sp)
  mv fp, sp
  mv s2, a0 ; x
  mv s3, a1 ; y
  ; scenes.e16.ts:143  const c = heap[y * 20 + x]
  slli t1, s3, 4
  slli t0, s3, 2
  add t0, t0, t1
  add t0, t0, s2
  lbu s1, heap(t0)
  ; scenes.e16.ts:144  const up = wrap16(y - 1)
  addi t0, s3, -1
  sw t0, 4(fp) ; up
  ; scenes.e16.ts:145  const left = wrap16(x - 1)
  addi t0, s2, -1
  sw t0, 6(fp) ; left
  ; scenes.e16.ts:146  const n = heapAt(x, up, c)
  mv a0, s2
  lw a1, 4(fp)
  mv a2, s1
  call heapAt
  sw a0, 8(fp) ; n
  ; scenes.e16.ts:147  const s = heapAt(x, y + 1, c)
  mv a0, s2
  addi a1, s3, 1
  mv a2, s1
  call heapAt
  sw a0, 10(fp) ; s
  ; scenes.e16.ts:148  const w = heapAt(left, y, c)
  lw a0, 6(fp)
  mv a1, s3
  mv a2, s1
  call heapAt
  sw a0, 12(fp) ; w
  ; scenes.e16.ts:149  const e = heapAt(x + 1, y, c)
  addi a0, s2, 1
  mv a1, s3
  mv a2, s1
  call heapAt
  sw a0, 14(fp) ; e
  ; scenes.e16.ts:150  const base = QUARTERS_TILE | (c << 10)
  slli t0, s1, 10
  li t1, 159
  or t1, t1, t0
  sw t1, 0(fp) ; base
  ; scenes.e16.ts:151  const at = cellAt(0, x * 2, 32 + y * 2)
  slli t0, s2, 1
  slli t1, s3, 1
  li a0, 0
  mv a1, t0
  addi a2, t1, 32
  call cellAt
  sw a0, 2(fp) ; at
  ; scenes.e16.ts:152  vpoke(at, base + quarterOf(n, w, heapAt(left, up, c)))
  lw a0, 6(fp)
  lw a1, 4(fp)
  mv a2, s1
  call heapAt
  lw a1, 12(fp)
  mv a2, a0
  lw a0, 8(fp)
  call quarterOf
  lw t0, 0(fp) ; base
  add t0, t0, a0
  lw a0, 2(fp)
  mv a1, t0
  call vpoke
  ; scenes.e16.ts:153  vpoke(at + 2, base + 5 + quarterOf(n, e, heapAt(x + 1, up, c)))
  lw t0, 2(fp) ; at
  lw t1, 0(fp) ; base
  addi t0, t0, 2
  addi sp, sp, -2
  sw t0, 0(sp)
  addi t1, t1, 5
  addi sp, sp, -2
  sw t1, 0(sp)
  addi a0, s2, 1
  lw a1, 4(fp)
  mv a2, s1
  call heapAt
  lw a1, 14(fp)
  mv a2, a0
  lw a0, 8(fp)
  call quarterOf
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  mv a1, t0
  call vpoke
  ; scenes.e16.ts:154  vpoke(at + 128, base + 10 + quarterOf(s, w, heapAt(left, y + 1, c)))
  lw t0, 2(fp) ; at
  lw t1, 0(fp) ; base
  addi t0, t0, 128
  addi sp, sp, -2
  sw t0, 0(sp)
  addi t1, t1, 10
  addi sp, sp, -2
  sw t1, 0(sp)
  lw a0, 6(fp)
  addi a1, s3, 1
  mv a2, s1
  call heapAt
  lw a1, 12(fp)
  mv a2, a0
  lw a0, 10(fp)
  call quarterOf
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  mv a1, t0
  call vpoke
  ; scenes.e16.ts:155  vpoke(at + 130, base + 15 + quarterOf(s, e, heapAt(x + 1, y + 1, c)))
  lw t0, 2(fp) ; at
  lw t1, 0(fp) ; base
  addi t0, t0, 130
  addi sp, sp, -2
  sw t0, 0(sp)
  addi t1, t1, 15
  addi sp, sp, -2
  sw t1, 0(sp)
  addi a0, s2, 1
  addi a1, s3, 1
  mv a2, s1
  call heapAt
  lw a1, 14(fp)
  mv a2, a0
  lw a0, 10(fp)
  call quarterOf
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  mv a1, t0
  call vpoke
.return:
  mv sp, fp
  lw ra, 16(sp)
  lw s2, 18(sp)
  lw s3, 20(sp)
  lw s1, 22(sp)
  lw s0, 24(sp)
  addi sp, sp, 26
  ret

; scenes.e16.ts:158 quarterOf(v, h, d) at -O1
;   v in a0
;   h in a1
;   d in a2
quarterOf:
  ; scenes.e16.ts:159  if (v !== 0) {
  beq a0, zero, .L1
  ; scenes.e16.ts:160  if (h !== 0) return d !== 0 ? 4 : 3
  beq a1, zero, .L2
  ; scenes.e16.ts:160  return d !== 0 ? 4 : 3
  beq a2, zero, .L3
  li t0, 4
  j .L4
.L3:
  li t0, 3
.L4:
  mv a0, t0
  ret
.L2:
  ; scenes.e16.ts:161  return 1
  li a0, 1
  ret
.L1:
  ; scenes.e16.ts:163  return h !== 0 ? 2 : 0
  beq a1, zero, .L5
  li t0, 2
  j .L6
.L5:
  li t0, 0
.L6:
  mv a0, t0
.return:
  ret

; scenes.e16.ts:169 pause() at -O1
pause:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes.e16.ts:170  band(108, 1)
  li a0, 108
  li a1, 1
  call band
  ; scenes.e16.ts:171  say(17, 14, str('PAUSE'), W_GOLD)
  li a0, 17
  li a1, 14
  la a2, str_3
  li a3, 6
  call say
  ; scenes.e16.ts:172  soundMaster(4)
  li a0, 4
  call soundMaster
  ; scenes.e16.ts:174  idle(2)
  li a0, 2
  call idle
  ; scenes.e16.ts:175  for (;;) {
.L1:
  ; scenes.e16.ts:176  seenIs(frame_wait(seen))
  lw a0, 0x1d08(zero)
  call frame_wait
  call seenIs
  ; scenes.e16.ts:177  padRead()
  call padRead
  ; scenes.e16.ts:178  if (pressed(B_START)) break
  li a0, 1024
  call pressed
  beqz a0, .L1
  ; scenes.e16.ts:178  break
  ; scenes.e16.ts:180  soundMaster(15)
  li a0, 15
  call soundMaster
  ; scenes.e16.ts:181  unsay(17, 14, 5)
  li a0, 17
  li a1, 14
  li a2, 5
  call unsay
  ; scenes.e16.ts:182  band(0, 0)
  li a0, 0
  li a1, 0
  call band
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes.e16.ts:186 stratumBanner(s) at -O1
;   s in s1
;   name in s2
stratumBanner:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; s
  ; scenes.e16.ts:187  wellClear()
  call wellClear
  ; scenes.e16.ts:188  band(146, 5)
  li a0, 146
  li a1, 5
  call band
  ; scenes.e16.ts:189  say(14, 19, str('= = = = = ='), W_GOLD)
  li a0, 14
  li a1, 19
  la a2, str_4
  li a3, 6
  call say
  ; scenes.e16.ts:190  say(14, 20, str('STRATUM'), W_WHITE)
  li a0, 14
  li a1, 20
  la a2, str_5
  li a3, 7
  call say
  ; scenes.e16.ts:191  vpoke(cellAt(1, 22, 20), glyph(49 + s, W_GOLD))
  addi a0, s1, 49
  li a1, 6
  call glyph
  mv a1, a0
  li a0, 43564
  call vpoke
  ; scenes.e16.ts:192  let name = str('CLAY')
  la s2, str_6
  ; scenes.e16.ts:193  if (s === 2) name = str('SLATE')
  li t0, 2
  bne s1, t0, .L1
  ; scenes.e16.ts:193  name = str('SLATE')
  la s2, str_7
  j .L2
.L1:
  ; scenes.e16.ts:194  if (s === 3) name = str('MAGMA')
  li t0, 3
  bne s1, t0, .L3
  ; scenes.e16.ts:194  name = str('MAGMA')
  la s2, str_8
  j .L4
.L3:
  ; scenes.e16.ts:195  if (s === 4) name = str('GEODE')
  li t0, 4
  bne s1, t0, .L5
  ; scenes.e16.ts:195  name = str('GEODE')
  la s2, str_9
.L5:
.L4:
.L2:
  ; scenes.e16.ts:196  say(17, 22, name, W_GOLD)
  li a0, 17
  li a1, 22
  mv a2, s2
  li a3, 6
  call say
  ; scenes.e16.ts:197  say(14, 24, str('= = = = = ='), W_GOLD)
  li a0, 14
  li a1, 24
  la a2, str_4
  li a3, 6
  call say
  ; scenes.e16.ts:198  say(13, 26, str('BONUS'), W_WHITE)
  li a0, 13
  li a1, 26
  la a2, str_10
  li a3, 7
  call say
  ; scenes.e16.ts:199  figure(cellAt(1, 19, 26), s * 1000, 5, W_GOLD)
  li t0, 1000
  mul t0, s1, t0
  li a0, 44326
  mv a1, t0
  li a2, 5
  li a3, 6
  call figure
  ; scenes.e16.ts:200  say(13, 27, str('AIR +20'), W_GREEN)
  li a0, 13
  li a1, 27
  la a2, str_11
  li a3, 3
  call say
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:204 continueAsk() at -O1
;   n in s1
;   t in s2
continueAsk:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; scenes.e16.ts:205  music(M_OVER)
  li a0, 6
  call music
  ; scenes.e16.ts:206  wellClear()
  call wellClear
  ; scenes.e16.ts:207  band(90, 4)
  li a0, 90
  li a1, 4
  call band
  ; scenes.e16.ts:208  say(15, 12, str('GAME OVER'), W_RED)
  li a0, 15
  li a1, 12
  la a2, str_12
  li a3, 1
  call say
  ; scenes.e16.ts:209  idle(120)
  li a0, 120
  call idle
  ; scenes.e16.ts:210  say(14, 15, str('CONTINUE?'), W_WHITE)
  li a0, 14
  li a1, 15
  la a2, str_13
  li a3, 7
  call say
  ; scenes.e16.ts:211  say(12, 18, str('PRESS START'), W_GOLD)
  li a0, 12
  li a1, 18
  la a2, str_2
  li a3, 6
  call say
  ; scenes.e16.ts:212  let n: u16 = 10
  li s1, 10 ; n
  ; scenes.e16.ts:213  while (n > 0) {
  j .L3
.L1:
  ; scenes.e16.ts:214  n--
  addi s1, s1, -1
  ; scenes.e16.ts:215  vpoke(cellAt(1, 24, 15), glyph(48 + n, W_GOLD))
  addi a0, s1, 48
  li a1, 6
  call glyph
  mv a1, a0
  li a0, 42928
  call vpoke
  ; scenes.e16.ts:216  let t: u16 = 0
  li s2, 0 ; t
  ; scenes.e16.ts:217  while (t < 60) {
  j .L7
.L5:
  ; scenes.e16.ts:218  idle(1)
  li a0, 1
  call idle
  ; scenes.e16.ts:219  if (pressed(B_START)) {
  li a0, 1024
  call pressed
  beqz a0, .L9
  ; scenes.e16.ts:220  wellClear()
  call wellClear
  ; scenes.e16.ts:221  sfxSelect()
  call sfxSelect
  ; scenes.e16.ts:222  music(stratum >= 3 ? M_DEEP : M_MAIN)
  lw t0, 0x1d16(zero)
  li t1, 3
  bltu t0, t1, .L10
  li t0, 3
  j .L11
.L10:
  li t0, 2
.L11:
  mv a0, t0
  call music
  ; scenes.e16.ts:223  return true
  li a0, 1
  j .return
.L9:
  ; scenes.e16.ts:225  t++
  addi s2, s2, 1
.L7:
  li t0, 60
  bltu s2, t0, .L5
.L3:
  bltu zero, s1, .L1
  ; scenes.e16.ts:228  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:232 goal() at -O1
goal:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes.e16.ts:233  cheer()
  la t0, cheer
  li t1, 258
  call far_call
  ; scenes.e16.ts:234  music(M_GOAL)
  li a0, 8
  call music
  ; scenes.e16.ts:235  wellClear()
  call wellClear
  ; scenes.e16.ts:236  stratumShow(5)
  li a0, 5
  la t0, stratumShow
  li t1, 258
  call far_call
  ; scenes.e16.ts:237  band(138, 6)
  li a0, 138
  li a1, 6
  call band
  ; scenes.e16.ts:238  say(13, 18, str('CORE REACHED!'), W_GOLD)
  li a0, 13
  li a1, 18
  la a2, str_14
  li a3, 6
  call say
  ; scenes.e16.ts:239  idle(90)
  li a0, 90
  call idle
  ; scenes.e16.ts:240  say(12, 21, str('AIR'), W_WHITE)
  li a0, 12
  li a1, 21
  la a2, str_15
  li a3, 7
  call say
  ; scenes.e16.ts:241  figure(cellAt(1, 23, 21), air * 100, 5, W_GOLD)
  lw t0, 0x1db2(zero)
  li t1, 100
  mul t0, t0, t1
  li a0, 43694
  mv a1, t0
  li a2, 5
  li a3, 6
  call figure
  ; scenes.e16.ts:242  idle(30)
  li a0, 30
  call idle
  ; scenes.e16.ts:243  say(12, 23, str('DRILLERS'), W_WHITE)
  li a0, 12
  li a1, 23
  la a2, str_16
  li a3, 7
  call say
  ; scenes.e16.ts:244  figure(cellAt(1, 23, 23), lives * 5000, 5, W_GOLD)
  lw t0, 0x1d14(zero)
  li t1, 5000
  mul t0, t0, t1
  li a0, 43950
  mv a1, t0
  li a2, 5
  li a3, 6
  call figure
  ; scenes.e16.ts:245  idle(30)
  li a0, 30
  call idle
  ; scenes.e16.ts:246  points(air * 100 + 10000)
  lw t0, 0x1db2(zero)
  li t1, 100
  mul t0, t0, t1
  li t1, 10000
  add a0, t0, t1
  call points
  ; scenes.e16.ts:247  points(lives * 5000)
  lw t0, 0x1d14(zero)
  li t1, 5000
  mul a0, t0, t1
  call points
  ; scenes.e16.ts:248  say(12, 25, str('CLEAR'), W_WHITE)
  li a0, 12
  li a1, 25
  la a2, str_17
  li a3, 7
  call say
  ; scenes.e16.ts:249  figure(cellAt(1, 23, 25), 10000, 5, W_GOLD)
  li a0, 44206
  li a1, 10000
  li a2, 5
  li a3, 6
  call figure
  ; scenes.e16.ts:250  idle(240)
  li a0, 240
  call idle
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes.e16.ts:254 results() at -O1
;   place in s2
;   t in s1
results:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; scenes.e16.ts:255  music(M_RESULT)
  li a0, 7
  call music
  ; scenes.e16.ts:256  wellClear()
  call wellClear
  ; scenes.e16.ts:257  band(42, 9)
  li a0, 42
  li a1, 9
  call band
  ; scenes.e16.ts:258  say(16, 6, str('RESULT'), W_GOLD)
  li a0, 16
  li a1, 6
  la a2, str_18
  li a3, 6
  call say
  ; scenes.e16.ts:259  say(12, 9, str('DEPTH'), W_WHITE)
  li a0, 12
  li a1, 9
  la a2, str_19
  li a3, 7
  call say
  ; scenes.e16.ts:260  figure(cellAt(1, 24, 9), maxDepth, 3, W_GOLD)
  lw t0, 0x1d18(zero)
  li a0, 42160
  mv a1, t0
  li a2, 3
  li a3, 6
  call figure
  ; scenes.e16.ts:261  vpoke(cellAt(1, 27, 9), glyph(77, W_GOLD))
  li a0, 42166
  li a1, 38957
  call vpoke
  ; scenes.e16.ts:262  idle(20)
  li a0, 20
  call idle
  ; scenes.e16.ts:263  say(12, 11, str('SCORE'), W_WHITE)
  li a0, 12
  li a1, 11
  la a2, str_20
  li a3, 7
  call say
  ; scenes.e16.ts:264  scoreAt(cellAt(1, 20, 11))
  li a0, 42408
  call scoreAt
  ; scenes.e16.ts:265  idle(20)
  li a0, 20
  call idle
  ; scenes.e16.ts:266  say(12, 13, str('CHAIN'), W_WHITE)
  li a0, 12
  li a1, 13
  la a2, str_21
  li a3, 7
  call say
  ; scenes.e16.ts:267  figure(cellAt(1, 24, 13), maxChain, 4, W_GOLD)
  lw t0, 0x1d1a(zero)
  li a0, 42672
  mv a1, t0
  li a2, 4
  li a3, 6
  call figure
  ; scenes.e16.ts:268  idle(20)
  li a0, 20
  call idle
  ; scenes.e16.ts:269  say(12, 15, str('CAPSULES'), W_WHITE)
  li a0, 12
  li a1, 15
  la a2, str_22
  li a3, 7
  call say
  ; scenes.e16.ts:270  figure(cellAt(1, 24, 15), capsules, 4, W_GOLD)
  lw t0, 0x1dbe(zero)
  li a0, 42928
  mv a1, t0
  li a2, 4
  li a3, 6
  call figure
  ; scenes.e16.ts:271  if (continues > 0) {
  lw t0, 0x1d1c(zero)
  bgeu zero, t0, .L1
  ; scenes.e16.ts:272  say(12, 17, str('CONTINUES'), W_WHITE)
  li a0, 12
  li a1, 17
  la a2, str_23
  li a3, 7
  call say
  ; scenes.e16.ts:273  figure(cellAt(1, 26, 17), continues, 2, W_RED)
  lw t0, 0x1d1c(zero)
  li a0, 43188
  mv a1, t0
  li a2, 2
  li a3, 1
  call figure
.L1:
  ; scenes.e16.ts:275  idle(90)
  li a0, 90
  call idle
  ; scenes.e16.ts:276  const place = tablePlace()
  call tablePlace
  mv s2, a0 ; place
  ; scenes.e16.ts:277  if (place < 5) nameEntry(place)
  li t0, 5
  bgeu s2, t0, .L2
  ; scenes.e16.ts:277  nameEntry(place)
  mv a0, s2
  call nameEntry
  j .L3
.L2:
  ; scenes.e16.ts:279  say(13, 21, str('PRESS START'), W_GOLD)
  li a0, 13
  li a1, 21
  la a2, str_2
  li a3, 6
  call say
  ; scenes.e16.ts:280  let t: u16 = 0
  li s1, 0 ; t
  ; scenes.e16.ts:281  while (t < 600) {
  j .L6
.L4:
  ; scenes.e16.ts:282  idle(1)
  li a0, 1
  call idle
  ; scenes.e16.ts:283  if (pressed(B_START | B_A)) break
  li a0, 1040
  call pressed
  beqz a0, .L8
  ; scenes.e16.ts:283  break
  j .L7
.L8:
  ; scenes.e16.ts:284  t++
  addi s1, s1, 1
.L6:
  li t0, 600
  bltu s1, t0, .L4
.L7:
.L3:
  ; scenes.e16.ts:287  wellClear()
  call wellClear
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:291 scoreAt(at) at -O1
;   at in s3
;   v in s2
;   k in s1
scoreAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; at
  ; scenes.e16.ts:292  let v = score[0]
  lw s2, score(zero)
  ; scenes.e16.ts:293  let k: u16 = 0
  li s1, 0 ; k
  ; scenes.e16.ts:294  while (k < 4) {
  j .L3
.L1:
  ; scenes.e16.ts:295  vpoke(at + 14 - k * 2, glyph(48 + (v % 10), W_GOLD))
  slli t0, s1, 1
  addi t1, s3, 14
  sub t1, t1, t0
  li t0, 10
  remu t0, s2, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  addi a0, t0, 48
  li a1, 6
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; scenes.e16.ts:296  v = div(v, 10)
  li t0, 10
  divu s2, s2, t0
  ; scenes.e16.ts:297  k++
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
  ; scenes.e16.ts:299  v = score[1]
  lw s2, score+2(zero)
  ; scenes.e16.ts:300  k = 0
  li s1, 0 ; k
  ; scenes.e16.ts:301  while (k < 4) {
  j .L7
.L5:
  ; scenes.e16.ts:302  vpoke(at + 6 - k * 2, glyph(48 + (v % 10), W_GOLD))
  slli t0, s1, 1
  addi t1, s3, 6
  sub t1, t1, t0
  li t0, 10
  remu t0, s2, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  addi a0, t0, 48
  li a1, 6
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; scenes.e16.ts:303  v = div(v, 10)
  li t0, 10
  divu s2, s2, t0
  ; scenes.e16.ts:304  k++
  addi s1, s1, 1
.L7:
  li t0, 4
  bltu s1, t0, .L5
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; best.e16.ts:28 tableLoad() at -O1
;   k in s1
;   at in s2
;   ab in s3
tableLoad:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; best.e16.ts:29  if (saveRead(0) !== MAGIC) tableFresh()
  li a0, 0
  call saveRead
  li t0, 17477
  beq a0, t0, .L1
  ; best.e16.ts:29  tableFresh()
  call tableFresh
.L1:
  ; best.e16.ts:30  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:31  while (k < 5) {
  j .L4
.L2:
  ; best.e16.ts:32  const at = 2 + k * ENTRY
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  addi s2, t0, 2
  ; best.e16.ts:33  bestScore[k * 2] = saveRead(at)
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
  ; best.e16.ts:34  bestScore[k * 2 + 1] = saveRead(at + 2)
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
  ; best.e16.ts:35  bestDepth[k] = saveRead(at + 4)
  slli t0, s1, 1
  addi t0, t0, bestDepth
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s2, 4
  call saveRead
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; best.e16.ts:36  const ab = saveRead(at + 6)
  addi a0, s2, 6
  call saveRead
  mv s3, a0 ; ab
  ; best.e16.ts:37  bestName[k * 3] = ab & 255
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  andi t1, s3, 255
  sw t1, bestName(t0)
  ; best.e16.ts:38  bestName[k * 3 + 1] = ab >> 8
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 1
  slli t0, t0, 1
  srli t1, s3, 8
  sw t1, bestName(t0)
  ; best.e16.ts:39  bestName[k * 3 + 2] = saveRead(at + 8) & 255
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 2
  slli t0, t0, 1
  addi t0, t0, bestName
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s2, 8
  call saveRead
  andi t0, a0, 255
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; best.e16.ts:40  k++
  addi s1, s1, 1
.L4:
  li t0, 5
  bltu s1, t0, .L2
  ; best.e16.ts:42  best[0] = bestScore[0]
  lw t0, bestScore(zero)
  sw t0, best(zero)
  ; best.e16.ts:43  best[1] = bestScore[1]
  lw t0, bestScore+2(zero)
  sw t0, best+2(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; best.e16.ts:47 tableFresh() at -O1
;   k in s1
;   at in s2
tableFresh:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; best.e16.ts:48  saveWrite(0, MAGIC)
  li a0, 0
  li a1, 17477
  call saveWrite
  ; best.e16.ts:49  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:50  while (k < 5) {
  j .L3
.L1:
  ; best.e16.ts:51  const at = 2 + k * ENTRY
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  addi s2, t0, 2
  ; best.e16.ts:52  saveWrite(at, (5 - k) * 1000)
  li t0, 5
  sub t0, t0, s1
  li t1, 1000
  mul t0, t0, t1
  mv a0, s2
  mv a1, t0
  call saveWrite
  ; best.e16.ts:53  saveWrite(at + 2, 0)
  addi a0, s2, 2
  li a1, 0
  call saveWrite
  ; best.e16.ts:54  saveWrite(at + 4, (5 - k) * 20)
  li t0, 5
  sub t0, t0, s1
  slli t1, t0, 4
  slli t0, t0, 2
  add t0, t0, t1
  addi a0, s2, 4
  mv a1, t0
  call saveWrite
  ; best.e16.ts:55  saveWrite(at + 6, 0x4952)
  addi a0, s2, 6
  li a1, 18770
  call saveWrite
  ; best.e16.ts:56  saveWrite(at + 8, 0x56)
  addi a0, s2, 8
  li a1, 86
  call saveWrite
  ; best.e16.ts:57  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; best.e16.ts:62 tablePlace() at -O1
;   k in s1
tablePlace:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; best.e16.ts:63  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:64  while (k < 5) {
  j .L3
.L1:
  ; best.e16.ts:65  if (scoreMore(addr(score), addr(bestScore) + k * 4)) return k
  slli t0, s1, 2
  la a0, score
  addi a1, t0, bestScore
  call scoreMore
  beqz a0, .L5
  ; best.e16.ts:65  return k
  mv a0, s1
  j .return
.L5:
  ; best.e16.ts:66  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
  ; best.e16.ts:68  return 5
  li a0, 5
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; best.e16.ts:72 tableEnter(place, a, b, c) at -O1
;   place in s2
;   a in 0(fp)
;   b in 2(fp)
;   c in 4(fp)
;   k in s1
;   at in s3
tableEnter:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; place
  sw a1, 0(fp) ; a
  sw a2, 2(fp) ; b
  sw a3, 4(fp) ; c
  ; best.e16.ts:73  let k: u16 = 4
  li s1, 4 ; k
  ; best.e16.ts:74  while (k > place) {
  j .L3
.L1:
  ; best.e16.ts:75  bestScore[k * 2] = bestScore[k * 2 - 2]
  slli t0, s1, 1
  slli t0, t0, 1
  slli t1, s1, 1
  addi t1, t1, -2
  slli t1, t1, 1
  lw t1, bestScore(t1)
  sw t1, bestScore(t0)
  ; best.e16.ts:76  bestScore[k * 2 + 1] = bestScore[k * 2 - 1]
  slli t0, s1, 1
  addi t0, t0, 1
  slli t0, t0, 1
  slli t1, s1, 1
  addi t1, t1, -1
  slli t1, t1, 1
  lw t1, bestScore(t1)
  sw t1, bestScore(t0)
  ; best.e16.ts:77  bestDepth[k] = bestDepth[k - 1]
  slli t0, s1, 1
  addi t1, s1, -1
  slli t1, t1, 1
  lw t1, bestDepth(t1)
  sw t1, bestDepth(t0)
  ; best.e16.ts:78  bestName[k * 3] = bestName[k * 3 - 3]
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  slli t2, s1, 1
  add t1, t2, s1
  addi t1, t1, -3
  slli t1, t1, 1
  lw t1, bestName(t1)
  sw t1, bestName(t0)
  ; best.e16.ts:79  bestName[k * 3 + 1] = bestName[k * 3 - 2]
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
  ; best.e16.ts:80  bestName[k * 3 + 2] = bestName[k * 3 - 1]
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
  ; best.e16.ts:81  k--
  addi s1, s1, -1
.L3:
  bltu s2, s1, .L1
  ; best.e16.ts:83  bestScore[place * 2] = score[0]
  slli t0, s2, 1
  slli t0, t0, 1
  lw t1, score(zero)
  sw t1, bestScore(t0)
  ; best.e16.ts:84  bestScore[place * 2 + 1] = score[1]
  slli t0, s2, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, score+2(zero)
  sw t1, bestScore(t0)
  ; best.e16.ts:85  bestDepth[place] = maxDepth
  slli t0, s2, 1
  lw t1, 0x1d18(zero)
  sw t1, bestDepth(t0)
  ; best.e16.ts:86  bestName[place * 3] = a
  slli t1, s2, 1
  add t0, t1, s2
  slli t0, t0, 1
  lw t1, 0(fp) ; a
  sw t1, bestName(t0)
  ; best.e16.ts:87  bestName[place * 3 + 1] = b
  slli t1, s2, 1
  add t0, t1, s2
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, 2(fp) ; b
  sw t1, bestName(t0)
  ; best.e16.ts:88  bestName[place * 3 + 2] = c
  slli t1, s2, 1
  add t0, t1, s2
  addi t0, t0, 2
  slli t0, t0, 1
  lw t1, 4(fp) ; c
  sw t1, bestName(t0)
  ; best.e16.ts:89  k = 0
  li s1, 0 ; k
  ; best.e16.ts:90  while (k < 5) {
  j .L7
.L5:
  ; best.e16.ts:91  const at = 2 + k * ENTRY
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  addi s3, t0, 2
  ; best.e16.ts:92  saveWrite(at, bestScore[k * 2])
  slli t0, s1, 1
  slli t0, t0, 1
  lw t0, bestScore(t0)
  mv a0, s3
  mv a1, t0
  call saveWrite
  ; best.e16.ts:93  saveWrite(at + 2, bestScore[k * 2 + 1])
  slli t0, s1, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, bestScore(t0)
  addi a0, s3, 2
  mv a1, t0
  call saveWrite
  ; best.e16.ts:94  saveWrite(at + 4, bestDepth[k])
  slli t0, s1, 1
  lw t0, bestDepth(t0)
  addi a0, s3, 4
  mv a1, t0
  call saveWrite
  ; best.e16.ts:95  saveWrite(at + 6, bestName[k * 3] | (bestName[k * 3 + 1] << 8))
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
  addi a0, s3, 6
  mv a1, t0
  call saveWrite
  ; best.e16.ts:96  saveWrite(at + 8, bestName[k * 3 + 2])
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 2
  slli t0, t0, 1
  lw t0, bestName(t0)
  addi a0, s3, 8
  mv a1, t0
  call saveWrite
  ; best.e16.ts:97  k++
  addi s1, s1, 1
.L7:
  li t0, 5
  bltu s1, t0, .L5
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; best.e16.ts:102 tableShow(y) at -O1
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
  ; best.e16.ts:103  say(13, y - 2, str('BEST DRILLERS'), W_GOLD)
  li a0, 13
  addi a1, s0, -2
  la a2, str_24
  li a3, 6
  call say
  ; best.e16.ts:104  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:105  while (k < 5) {
  j .L3
.L1:
  ; best.e16.ts:106  const row = y + k * 2
  slli t0, s1, 1
  add s2, s0, t0
  ; best.e16.ts:107  const s = k === 0 ? W_GOLD : W_WHITE
  bne s1, zero, .L5
  li t0, 6
  j .L6
.L5:
  li t0, 7
.L6:
  mv s3, t0 ; s
  ; best.e16.ts:108  vpoke(cellAt(1, 7, row), glyph(49 + k, s))
  li a0, 1
  li a1, 7
  mv a2, s2
  call cellAt
  addi sp, sp, -2
  sw a0, 0(sp)
  addi a0, s1, 49
  mv a1, s3
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; best.e16.ts:109  vpoke(cellAt(1, 10, row), glyph(bestName[k * 3], s))
  li a0, 1
  li a1, 10
  mv a2, s2
  call cellAt
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  lw t0, bestName(t0)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  mv a1, s3
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; best.e16.ts:110  vpoke(cellAt(1, 11, row), glyph(bestName[k * 3 + 1], s))
  li a0, 1
  li a1, 11
  mv a2, s2
  call cellAt
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, bestName(t0)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  mv a1, s3
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; best.e16.ts:111  vpoke(cellAt(1, 12, row), glyph(bestName[k * 3 + 2], s))
  li a0, 1
  li a1, 12
  mv a2, s2
  call cellAt
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 2
  slli t0, t0, 1
  lw t0, bestName(t0)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  mv a1, s3
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; best.e16.ts:112  scoreDigits(cellAt(1, 15, row), k, s)
  li a0, 1
  li a1, 15
  mv a2, s2
  call cellAt
  mv a1, s1
  mv a2, s3
  call scoreDigits
  ; best.e16.ts:113  figure(cellAt(1, 25, row), bestDepth[k], 3, s)
  li a0, 1
  li a1, 25
  mv a2, s2
  call cellAt
  slli t0, s1, 1
  lw a1, bestDepth(t0)
  li a2, 3
  mv a3, s3
  call figure
  ; best.e16.ts:114  vpoke(cellAt(1, 28, row), glyph(77, s))
  li a0, 1
  li a1, 28
  mv a2, s2
  call cellAt
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 77
  mv a1, s3
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; best.e16.ts:115  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; best.e16.ts:120 scoreDigits(at, k, s) at -O1
;   at in 0(fp)
;   k in 2(fp)
;   s in 4(fp)
;   hi in s2
;   lo in s3
;   d in s1
scoreDigits:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 0(fp) ; at
  sw a1, 2(fp) ; k
  sw a2, 4(fp) ; s
  ; best.e16.ts:121  let hi = bestScore[k * 2 + 1]
  lw t0, 2(fp) ; k
  slli t0, t0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw s2, bestScore(t0)
  ; best.e16.ts:122  let lo = bestScore[k * 2]
  lw t0, 2(fp) ; k
  slli t0, t0, 1
  slli t0, t0, 1
  lw s3, bestScore(t0)
  ; best.e16.ts:123  let d: u16 = 0
  li s1, 0 ; d
  ; best.e16.ts:124  while (d < 4) {
  j .L3
.L1:
  ; best.e16.ts:125  vpoke(at + 14 - d * 2, glyph(48 + (lo % 10), s))
  lw t0, 0(fp) ; at
  slli t1, s1, 1
  addi t0, t0, 14
  sub t0, t0, t1
  li t1, 10
  remu t1, s3, t1
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, t1, 48
  lw a1, 4(fp)
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; best.e16.ts:126  vpoke(at + 6 - d * 2, glyph(48 + (hi % 10), s))
  lw t0, 0(fp) ; at
  slli t1, s1, 1
  addi t0, t0, 6
  sub t0, t0, t1
  li t1, 10
  remu t1, s2, t1
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, t1, 48
  lw a1, 4(fp)
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; best.e16.ts:127  lo = div(lo, 10)
  li t0, 10
  divu s3, s3, t0
  ; best.e16.ts:128  hi = div(hi, 10)
  li t0, 10
  divu s2, s2, t0
  ; best.e16.ts:129  d++
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; best.e16.ts:137 letterStep(k, t) at -O1
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
  ; best.e16.ts:138  let c = letters[k]
  slli t0, s3, 1
  lw s1, letters(t0)
  ; best.e16.ts:139  if (pressed(B_UP)) c = c === 90 ? 65 : c + 1
  li a0, 1
  call pressed
  beqz a0, .L1
  ; best.e16.ts:139  c = c === 90 ? 65 : c + 1
  li t0, 90
  bne s1, t0, .L2
  li t0, 65
  j .L3
.L2:
  addi t0, s1, 1
.L3:
  mv s1, t0 ; c
.L1:
  ; best.e16.ts:140  if (pressed(B_DOWN)) c = c === 65 ? 90 : c - 1
  li a0, 2
  call pressed
  beqz a0, .L4
  ; best.e16.ts:140  c = c === 65 ? 90 : c - 1
  li t0, 65
  bne s1, t0, .L5
  li t0, 90
  j .L6
.L5:
  addi t0, s1, -1
.L6:
  mv s1, t0 ; c
.L4:
  ; best.e16.ts:141  letters[k] = c
  slli t0, s3, 1
  sw s1, letters(t0)
  ; best.e16.ts:142  let j: u16 = 0
  li s2, 0 ; j
  ; best.e16.ts:143  while (j < 3) {
  j .L9
.L7:
  ; best.e16.ts:144  const blink = j === k && (t & 16) !== 0
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
  ; best.e16.ts:145  vpoke(cellAt(1, 18 + j, 14), glyph(letters[j], blink ? W_WHITE : W_GOLD))
  li a0, 1
  addi a1, s2, 18
  li a2, 14
  call cellAt
  slli t0, s2, 1
  lw t1, letters(t0)
  mv t0, a0
  lw t2, 2(fp)
  beqz t2, .L12
  li t2, 7
  j .L13
.L12:
  li t2, 6
.L13:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  mv a1, t2
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
  ; best.e16.ts:146  j++
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

; best.e16.ts:151 nameEntry(place) at -O1
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
  ; best.e16.ts:152  wellClear()
  call wellClear
  ; best.e16.ts:153  band(58, 6)
  li a0, 58
  li a1, 6
  call band
  ; best.e16.ts:154  say(14, 9, str('NEW RECORD'), W_GOLD)
  li a0, 14
  li a1, 9
  la a2, str_25
  li a3, 6
  call say
  ; best.e16.ts:155  say(13, 11, str('ENTER A NAME'), W_WHITE)
  li a0, 13
  li a1, 11
  la a2, str_26
  li a3, 7
  call say
  ; best.e16.ts:156  letters[0] = 65
  li t0, 65
  sw t0, letters(zero)
  ; best.e16.ts:157  letters[1] = 65
  li t0, 65
  sw t0, letters+2(zero)
  ; best.e16.ts:158  letters[2] = 65
  li t0, 65
  sw t0, letters+4(zero)
  ; best.e16.ts:159  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:160  let t: u16 = 0
  li s2, 0 ; t
  ; best.e16.ts:161  while (k < 3 && t < 1800) {
  j .L3
.L1:
  ; best.e16.ts:162  idle(1)
  li a0, 1
  call idle
  ; best.e16.ts:163  t++
  addi s2, s2, 1
  ; best.e16.ts:164  letterStep(k, t)
  mv a0, s1
  mv a1, s2
  call letterStep
  ; best.e16.ts:165  if (pressed(B_A)) {
  li a0, 16
  call pressed
  beqz a0, .L5
  ; best.e16.ts:166  sfxSelect()
  call sfxSelect
  ; best.e16.ts:167  k++
  addi s1, s1, 1
.L5:
.L3:
  li t0, 3
  bgeu s1, t0, .L6
  li t0, 1800
  bltu s2, t0, .L1
.L6:
  ; best.e16.ts:170  tableEnter(place, letters[0], letters[1], letters[2])
  lw t0, letters(zero)
  lw t1, letters+2(zero)
  lw t2, letters+4(zero)
  mv a0, s3
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call tableEnter
  ; best.e16.ts:171  idle(60)
  li a0, 60
  call idle
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

str_1:
  .byte 40, 67, 41, 32, 69, 76, 69, 67, 88, 90, 89, 32, 80, 82, 79, 74, 69, 67, 84, 0
str_2:
  .byte 80, 82, 69, 83, 83, 32, 83, 84, 65, 82, 84, 0
str_3:
  .byte 80, 65, 85, 83, 69, 0
str_4:
  .byte 61, 32, 61, 32, 61, 32, 61, 32, 61, 32, 61, 0
str_5:
  .byte 83, 84, 82, 65, 84, 85, 77, 0
str_6:
  .byte 67, 76, 65, 89, 0
str_7:
  .byte 83, 76, 65, 84, 69, 0
str_8:
  .byte 77, 65, 71, 77, 65, 0
str_9:
  .byte 71, 69, 79, 68, 69, 0
str_10:
  .byte 66, 79, 78, 85, 83, 0
str_11:
  .byte 65, 73, 82, 32, 43, 50, 48, 0
str_12:
  .byte 71, 65, 77, 69, 32, 79, 86, 69, 82, 0
str_13:
  .byte 67, 79, 78, 84, 73, 78, 85, 69, 63, 0
str_14:
  .byte 67, 79, 82, 69, 32, 82, 69, 65, 67, 72, 69, 68, 33, 0
str_15:
  .byte 65, 73, 82, 0
str_16:
  .byte 68, 82, 73, 76, 76, 69, 82, 83, 0
str_17:
  .byte 67, 76, 69, 65, 82, 0
str_18:
  .byte 82, 69, 83, 85, 76, 84, 0
str_19:
  .byte 68, 69, 80, 84, 72, 0
str_20:
  .byte 83, 67, 79, 82, 69, 0
str_21:
  .byte 67, 72, 65, 73, 78, 0
str_22:
  .byte 67, 65, 80, 83, 85, 76, 69, 83, 0
str_23:
  .byte 67, 79, 78, 84, 73, 78, 85, 69, 83, 0
str_24:
  .byte 66, 69, 83, 84, 32, 68, 82, 73, 76, 76, 69, 82, 83, 0
str_25:
  .byte 78, 69, 87, 32, 82, 69, 67, 79, 82, 68, 0
str_26:
  .byte 69, 78, 84, 69, 82, 32, 65, 32, 78, 65, 77, 69, 0
  .align 2

  .bank 2
  .org 0xc000
; player.e16.ts:77 playerNew() at -O1
playerNew:
  ; player.e16.ts:78  pCol = 4
  li t0, 4
  sw t0, 0x1d98(zero)
  ; player.e16.ts:79  pRow = 5
  li t0, 5
  sw t0, 0x1d9a(zero)
  ; player.e16.ts:80  pX = 64
  li t0, 64
  sw t0, 0x1d9c(zero)
  ; player.e16.ts:81  pY = 80
  li t0, 80
  sw t0, 0x1d9e(zero)
  ; player.e16.ts:82  pState = P_STAND
  sw zero, 0x1da0(zero)
  ; player.e16.ts:83  pT = 0
  sw zero, 0x1da2(zero)
  ; player.e16.ts:84  pFace = 0
  sw zero, 0x1da4(zero)
  ; player.e16.ts:85  air = 100
  li t0, 100
  sw t0, 0x1db2(zero)
  ; player.e16.ts:86  airSub = 0
  sw zero, 0x1db4(zero)
  ; player.e16.ts:87  pSafe = 0
  sw zero, 0x1db0(zero)
  ; player.e16.ts:88  capsules = 0
  sw zero, 0x1dbe(zero)
.return:
  ret

; player.e16.ts:91 airPace(drain) at -O1
;   drain in a0
airPace:
  ; player.e16.ts:92  airDrain = drain
  sw a0, 0x1db6(zero)
.return:
  ret

; player.e16.ts:95 airAdd(n) at -O1
;   n in a0
airAdd:
  ; player.e16.ts:96  air = air + n > 100 ? 100 : air + n
  lw t0, 0x1db2(zero)
  add t0, t0, a0
  li t1, 100
  bgeu t1, t0, .L1
  li t0, 100
  j .L2
.L1:
  lw t0, 0x1db2(zero)
  add t0, t0, a0
.L2:
  sw t0, 0x1db2(zero)
.return:
  ret

; player.e16.ts:100 airLose(n) at -O1
;   n in a0
airLose:
  ; player.e16.ts:101  air = air > n ? air - n : 0
  lw t0, 0x1db2(zero)
  bgeu a0, t0, .L1
  lw t0, 0x1db2(zero)
  sub t0, t0, a0
  j .L2
.L1:
  li t0, 0
.L2:
  sw t0, 0x1db2(zero)
.return:
  ret

; player.e16.ts:104 alive() at -O1
alive:
  ; player.e16.ts:105  return pState < P_CRUSH
  lw t0, 0x1da0(zero)
  sltiu a0, t0, 6
.return:
  ret

; player.e16.ts:109 aim_() at -O1
;   col in s2
;   row in s1
aim_:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; player.e16.ts:110  if (pSafe > 0 || !alive()) {
  lw t0, 0x1db0(zero)
  bltu zero, t0, .L2
  call alive
  bnez a0, .L1
.L2:
  ; player.e16.ts:111  targetIs(0xffff)
  li a0, 65535
  call targetIs
  ; player.e16.ts:112  return
  j .return
.L1:
  ; player.e16.ts:114  let col = pCol
  lw s2, 0x1d98(zero)
  ; player.e16.ts:115  let row = pRow
  lw s1, 0x1d9a(zero)
  ; player.e16.ts:117  if (pState === P_WALK && pT >= 4) col = pTo
  lw t0, 0x1da0(zero)
  li t1, 1
  bne t0, t1, .L3
  lw t0, 0x1da2(zero)
  li t1, 4
  bltu t0, t1, .L3
  ; player.e16.ts:117  col = pTo
  lw s2, 0x1da8(zero)
.L3:
  ; player.e16.ts:118  if (pState === P_CLIMB && pT >= 8) row = pRow - 1
  lw t0, 0x1da0(zero)
  li t1, 2
  bne t0, t1, .L4
  lw t0, 0x1da2(zero)
  li t1, 8
  bltu t0, t1, .L4
  ; player.e16.ts:118  row = pRow - 1
  lw t0, 0x1d9a(zero)
  addi s1, t0, -1
.L4:
  ; player.e16.ts:119  if (pState === P_FALL && (pY & 15) >= 8) row = pRow + 1
  lw t0, 0x1da0(zero)
  li t1, 3
  bne t0, t1, .L5
  lw t0, 0x1d9e(zero)
  andi t0, t0, 15
  li t1, 8
  bltu t0, t1, .L5
  ; player.e16.ts:119  row = pRow + 1
  lw t0, 0x1d9a(zero)
  addi s1, t0, 1
.L5:
  ; player.e16.ts:120  targetIs(cellOf(col, row))
  mv a0, s2
  mv a1, s1
  call cellOf
  call targetIs
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; player.e16.ts:124 playerStep(now, frozen) at -O1
;   now in s2
;   frozen in s3
;   s in s1
playerStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; now
  mv s3, a1 ; frozen
  ; player.e16.ts:125  dugN = 0
  sw zero, 0x1db8(zero)
  ; player.e16.ts:126  alloyBroken = 0
  sw zero, 0x1dba(zero)
  ; player.e16.ts:127  capsuleN = 0
  sw zero, 0x1dbc(zero)
  ; player.e16.ts:128  if (pSafe > 0) pSafe--
  lw t0, 0x1db0(zero)
  bgeu zero, t0, .L1
  ; player.e16.ts:128  pSafe--
  lw t0, 0x1db0(zero)
  addi t0, t0, -1
  sw t0, 0x1db0(zero)
.L1:
  ; player.e16.ts:129  if (frozen) {
  beqz s3, .L2
  ; player.e16.ts:130  pT++
  lw t0, 0x1da2(zero)
  addi t0, t0, 1
  sw t0, 0x1da2(zero)
  ; player.e16.ts:131  return
  j .return
.L2:
  ; player.e16.ts:133  const s = pState
  lw s1, 0x1da0(zero)
  ; player.e16.ts:134  if (s === P_STAND) stand()
  bne s1, zero, .L3
  ; player.e16.ts:134  stand()
  call stand
  j .L4
.L3:
  ; player.e16.ts:135  if (s === P_WALK) walk()
  li t0, 1
  bne s1, t0, .L5
  ; player.e16.ts:135  walk()
  call walk
  j .L6
.L5:
  ; player.e16.ts:136  if (s === P_CLIMB) climb()
  li t0, 2
  bne s1, t0, .L7
  ; player.e16.ts:136  climb()
  call climb
  j .L8
.L7:
  ; player.e16.ts:137  if (s === P_FALL) fall()
  li t0, 3
  bne s1, t0, .L9
  ; player.e16.ts:137  fall()
  call fall
  j .L10
.L9:
  ; player.e16.ts:138  if (s === P_DIG) dig(now)
  li t0, 4
  bne s1, t0, .L11
  ; player.e16.ts:138  dig(now)
  mv a0, s2
  call dig
  j .L12
.L11:
  ; player.e16.ts:139  if (s === P_LAND) {
  li t0, 5
  bne s1, t0, .L13
  ; player.e16.ts:140  pT++
  lw t0, 0x1da2(zero)
  addi t0, t0, 1
  sw t0, 0x1da2(zero)
  ; player.e16.ts:141  if (pT >= 6) pState = P_STAND
  li t1, 6
  bltu t0, t1, .L15
  ; player.e16.ts:141  pState = P_STAND
  sw zero, 0x1da0(zero)
  j .L15
.L13:
  ; player.e16.ts:142  pT++
  lw t0, 0x1da2(zero)
  addi t0, t0, 1
  sw t0, 0x1da2(zero)
.L15:
.L12:
.L10:
.L8:
.L6:
.L4:
  ; player.e16.ts:143  if (alive() && s !== P_CHEER) breathe()
  call alive
  beqz a0, .L16
  li t0, 8
  beq s1, t0, .L16
  ; player.e16.ts:143  breathe()
  call breathe
.L16:
  ; player.e16.ts:144  aim_()
  call aim_
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; player.e16.ts:147 breathe() at -O1
breathe:
  ; player.e16.ts:148  airSub++
  lw t0, 0x1db4(zero)
  addi t0, t0, 1
  sw t0, 0x1db4(zero)
  ; player.e16.ts:149  if (airSub < airDrain) return
  lw t1, 0x1db6(zero)
  bgeu t0, t1, .L1
  ; player.e16.ts:149  return
  ret
.L1:
  ; player.e16.ts:150  airSub = 0
  sw zero, 0x1db4(zero)
  ; player.e16.ts:151  if (air > 0) air--
  lw t0, 0x1db2(zero)
  bgeu zero, t0, .L2
  ; player.e16.ts:151  air--
  lw t0, 0x1db2(zero)
  addi t0, t0, -1
  sw t0, 0x1db2(zero)
.L2:
  ; player.e16.ts:152  if (air === 0) {
  lw t0, 0x1db2(zero)
  bne t0, zero, .L3
  ; player.e16.ts:153  pState = P_GASP
  li t0, 7
  sw t0, 0x1da0(zero)
  ; player.e16.ts:154  pT = 0
  sw zero, 0x1da2(zero)
.L3:
.return:
  ret

; player.e16.ts:159 at(col, row) at -O1
;   col in s1
;   row in s2
at:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; col
  mv s2, a1 ; row
  ; player.e16.ts:160  if (col >= COLS) return T_WALL
  li t0, 9
  bltu s1, t0, .L1
  ; player.e16.ts:160  return T_WALL
  li a0, 15
  j .return
.L1:
  ; player.e16.ts:161  return cells[cellOf(col, row)]
  mv a0, s1
  mv a1, s2
  call cellOf
  lbu a0, cells(a0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; player.e16.ts:164 stand() at -O1
;   left in s1
stand:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; player.e16.ts:165  pT++
  lw t0, 0x1da2(zero)
  addi t0, t0, 1
  sw t0, 0x1da2(zero)
  ; player.e16.ts:166  pIdle++
  lw t0, 0x1dae(zero)
  addi t0, t0, 1
  sw t0, 0x1dae(zero)
  ; player.e16.ts:167  if (!standsOn()) {
  call standsOn
  bnez a0, .L1
  ; player.e16.ts:168  startFall()
  ; player.e16.ts:230  pState = P_FALL
  li t0, 3
  sw t0, 0x1da0(zero)
  ; player.e16.ts:231  pT = 0
  sw zero, 0x1da2(zero)
  ; player.e16.ts:232  pSpeed = 1
  li t0, 1
  sw t0, 0x1daa(zero)
  ; player.e16.ts:169  return
  j .return
.L1:
  ; player.e16.ts:171  if (digWanted()) return
  call digWanted
  beqz a0, .L2
  ; player.e16.ts:171  return
  j .return
.L2:
  ; player.e16.ts:172  const left = held(B_LEFT)
  li a0, 4
  call held
  mv s1, a0 ; left
  ; player.e16.ts:173  if (!left && !held(B_RIGHT)) {
  bnez s1, .L3
  li a0, 8
  call held
  bnez a0, .L3
  ; player.e16.ts:174  pPush = 0
  sw zero, 0x1dac(zero)
  ; player.e16.ts:175  return
  j .return
.L3:
  ; player.e16.ts:177  pIdle = 0
  sw zero, 0x1dae(zero)
  ; player.e16.ts:178  pFace = left ? 1 : 0
  beqz s1, .L4
  li t0, 1
  j .L5
.L4:
  li t0, 0
.L5:
  sw t0, 0x1da4(zero)
  ; player.e16.ts:179  if (left && pCol === 0) return
  beqz s1, .L6
  lw t0, 0x1d98(zero)
  bne t0, zero, .L6
  ; player.e16.ts:179  return
  j .return
.L6:
  ; player.e16.ts:180  step(left ? pCol - 1 : pCol + 1)
  beqz s1, .L7
  lw t0, 0x1d98(zero)
  addi t0, t0, -1
  j .L8
.L7:
  lw t0, 0x1d98(zero)
  addi t0, t0, 1
.L8:
  mv a0, t0
  call step
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; player.e16.ts:184 digWanted() at -O1
digWanted:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; player.e16.ts:185  if (pressed(B_A) || (held(B_A) && pT > 10)) {
  li a0, 16
  call pressed
  bnez a0, .L2
  li a0, 16
  call held
  beqz a0, .L1
  lw t0, 0x1da2(zero)
  li t1, 10
  bgeu t1, t0, .L1
.L2:
  ; player.e16.ts:186  startDig(held(B_DOWN) ? 2 : held(B_UP) ? 3 : pFace)
  li a0, 2
  call held
  beqz a0, .L3
  li t0, 2
  j .L4
.L3:
  li a0, 1
  call held
  beqz a0, .L5
  li t0, 3
  j .L6
.L5:
  lw t0, 0x1da4(zero)
.L6:
.L4:
  mv a0, t0
  call startDig
  ; player.e16.ts:187  return true
  li a0, 1
  j .return
.L1:
  ; player.e16.ts:189  if (pressed(B_B) || (held(B_B) && pT > 10)) {
  li a0, 32
  call pressed
  bnez a0, .L8
  li a0, 32
  call held
  beqz a0, .L7
  lw t0, 0x1da2(zero)
  li t1, 10
  bgeu t1, t0, .L7
.L8:
  ; player.e16.ts:190  startDig(2)
  li a0, 2
  call startDig
  ; player.e16.ts:191  return true
  li a0, 1
  j .return
.L7:
  ; player.e16.ts:193  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; player.e16.ts:197 step(to) at -O1
;   to in s1
;   v in s2
;   up in s3
step:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; to
  ; player.e16.ts:198  const v = at(to, pRow)
  lw t0, 0x1d9a(zero)
  mv a0, s1
  mv a1, t0
  call at
  mv s2, a0 ; v
  ; player.e16.ts:199  if ((v & 15) === T_AIR && (v & (F_LOOSE | F_PEND)) === 0) collect(cellOf(to, pRow))
  andi t0, s2, 15
  li t1, 6
  bne t0, t1, .L1
  andi t0, s2, 192
  bne t0, zero, .L1
  ; player.e16.ts:199  collect(cellOf(to, pRow))
  lw t0, 0x1d9a(zero)
  mv a0, s1
  mv a1, t0
  call cellOf
  call collect
.L1:
  ; player.e16.ts:200  if ((at(to, pRow) & 15) === T_EMPTY) {
  lw t0, 0x1d9a(zero)
  mv a0, s1
  mv a1, t0
  call at
  andi t0, a0, 15
  bne t0, zero, .L2
  ; player.e16.ts:201  pTo = to
  sw s1, 0x1da8(zero)
  ; player.e16.ts:202  pState = P_WALK
  li t0, 1
  sw t0, 0x1da0(zero)
  ; player.e16.ts:203  pT = 0
  sw zero, 0x1da2(zero)
  ; player.e16.ts:204  pPush = 0
  sw zero, 0x1dac(zero)
  ; player.e16.ts:205  return
  j .return
.L2:
  ; player.e16.ts:208  pPush++
  lw t0, 0x1dac(zero)
  addi t0, t0, 1
  sw t0, 0x1dac(zero)
  ; player.e16.ts:209  const up = wrap16(pRow - 1)
  lw t0, 0x1d9a(zero)
  addi s3, t0, -1
  ; player.e16.ts:210  if (pPush >= 8 && (at(to, up) & 15) === T_EMPTY && (at(pCol, up) & 15) === T_EMPTY) {
  lw t0, 0x1dac(zero)
  li t1, 8
  bltu t0, t1, .L3
  mv a0, s1
  mv a1, s3
  call at
  andi t0, a0, 15
  bne t0, zero, .L3
  lw a0, 0x1d98(zero)
  mv a1, s3
  call at
  andi t0, a0, 15
  bne t0, zero, .L3
  ; player.e16.ts:211  pTo = to
  sw s1, 0x1da8(zero)
  ; player.e16.ts:212  pState = P_CLIMB
  li t0, 2
  sw t0, 0x1da0(zero)
  ; player.e16.ts:213  pT = 0
  sw zero, 0x1da2(zero)
  ; player.e16.ts:214  pPush = 0
  sw zero, 0x1dac(zero)
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; player.e16.ts:219 standsOn() at -O1
;   below in s2
;   v in s1
standsOn:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; player.e16.ts:220  const below = cellOf(pCol, pRow + 1)
  lw t0, 0x1d98(zero)
  lw t1, 0x1d9a(zero)
  mv a0, t0
  addi a1, t1, 1
  call cellOf
  mv s2, a0 ; below
  ; player.e16.ts:221  const v = cells[below]
  lbu s1, cells(s2)
  ; player.e16.ts:222  if ((v & 15) === T_AIR && (v & (F_LOOSE | F_PEND)) === 0) {
  andi t0, s1, 15
  li t1, 6
  bne t0, t1, .L1
  andi t0, s1, 192
  bne t0, zero, .L1
  ; player.e16.ts:223  collect(below)
  mv a0, s2
  call collect
  ; player.e16.ts:224  return false
  li a0, 0
  j .return
.L1:
  ; player.e16.ts:226  return (v & 15) !== T_EMPTY
  andi t0, s1, 15
  sub t0, t0, zero
  snez a0, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; player.e16.ts:235 walk() at -O1
walk:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; player.e16.ts:236  pT++
  lw t0, 0x1da2(zero)
  addi t0, t0, 1
  sw t0, 0x1da2(zero)
  ; player.e16.ts:237  if (pTo > pCol) pX = pX + 2
  lw t0, 0x1da8(zero)
  lw t1, 0x1d98(zero)
  bgeu t1, t0, .L1
  ; player.e16.ts:237  pX = pX + 2
  lw t0, 0x1d9c(zero)
  addi t0, t0, 2
  sw t0, 0x1d9c(zero)
  j .L2
.L1:
  ; player.e16.ts:238  pX = pX - 2
  lw t0, 0x1d9c(zero)
  addi t0, t0, -2
  sw t0, 0x1d9c(zero)
.L2:
  ; player.e16.ts:239  if (pT < 8) return
  lw t0, 0x1da2(zero)
  li t1, 8
  bgeu t0, t1, .L3
  ; player.e16.ts:239  return
  j .return
.L3:
  ; player.e16.ts:240  pCol = pTo
  lw t0, 0x1da8(zero)
  sw t0, 0x1d98(zero)
  ; player.e16.ts:241  pX = pCol * 16
  slli t0, t0, 4
  sw t0, 0x1d9c(zero)
  ; player.e16.ts:242  pState = P_STAND
  sw zero, 0x1da0(zero)
  ; player.e16.ts:243  pT = 11
  li t0, 11
  sw t0, 0x1da2(zero)
  ; player.e16.ts:244  if ((pIdle & 1) === 0) dust(i16(FIELD_X + pX) + (pFace === 0 ? -2 : 18), i16(pY) + 14, 0)
  lw t0, 0x1dae(zero)
  andi t0, t0, 1
  bne t0, zero, .L4
  ; player.e16.ts:244  dust(i16(FIELD_X + pX) + (pFace === 0 ? -2 : 18), i16(pY) + 14, 0)
  lw t0, 0x1d9c(zero)
  lw t1, 0x1da4(zero)
  addi t0, t0, 88
  li t2, 0
  bne t1, t2, .L5
  li t1, 65534
  j .L6
.L5:
  li t1, 18
.L6:
  add t0, t0, t1
  lw t1, 0x1d9e(zero)
  mv a0, t0
  addi a1, t1, 14
  li a2, 0
  call dust
.L4:
  ; player.e16.ts:245  pIdle++
  lw t0, 0x1dae(zero)
  addi t0, t0, 1
  sw t0, 0x1dae(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; player.e16.ts:248 climb() at -O1
climb:
  ; player.e16.ts:249  pT++
  lw t0, 0x1da2(zero)
  addi t0, t0, 1
  sw t0, 0x1da2(zero)
  ; player.e16.ts:250  if (pT <= 8) pY = pY - 2
  li t1, 8
  bltu t1, t0, .L1
  ; player.e16.ts:250  pY = pY - 2
  lw t0, 0x1d9e(zero)
  addi t0, t0, -2
  sw t0, 0x1d9e(zero)
  j .L2
.L1:
  ; player.e16.ts:251  if (pTo > pCol) pX = pX + 2
  lw t0, 0x1da8(zero)
  lw t1, 0x1d98(zero)
  bgeu t1, t0, .L3
  ; player.e16.ts:251  pX = pX + 2
  lw t0, 0x1d9c(zero)
  addi t0, t0, 2
  sw t0, 0x1d9c(zero)
  j .L4
.L3:
  ; player.e16.ts:252  pX = pX - 2
  lw t0, 0x1d9c(zero)
  addi t0, t0, -2
  sw t0, 0x1d9c(zero)
.L4:
.L2:
  ; player.e16.ts:253  if (pT < 16) return
  lw t0, 0x1da2(zero)
  li t1, 16
  bgeu t0, t1, .L5
  ; player.e16.ts:253  return
  ret
.L5:
  ; player.e16.ts:254  pCol = pTo
  lw t0, 0x1da8(zero)
  sw t0, 0x1d98(zero)
  ; player.e16.ts:255  pRow = pRow - 1
  lw t0, 0x1d9a(zero)
  addi t0, t0, -1
  sw t0, 0x1d9a(zero)
  ; player.e16.ts:256  pX = pCol * 16
  lw t0, 0x1d98(zero)
  slli t0, t0, 4
  sw t0, 0x1d9c(zero)
  ; player.e16.ts:257  pY = pRow * 16
  lw t0, 0x1d9a(zero)
  slli t0, t0, 4
  sw t0, 0x1d9e(zero)
  ; player.e16.ts:258  pState = P_STAND
  sw zero, 0x1da0(zero)
  ; player.e16.ts:259  pT = 11
  li t0, 11
  sw t0, 0x1da2(zero)
.return:
  ret

; player.e16.ts:262 fall() at -O1
;   next in s1
;   step in s2
fall:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; player.e16.ts:263  pT++
  lw t0, 0x1da2(zero)
  addi t0, t0, 1
  sw t0, 0x1da2(zero)
  ; player.e16.ts:264  if ((pT & 3) === 0 && pSpeed < 4) pSpeed++
  andi t0, t0, 3
  bne t0, zero, .L1
  lw t0, 0x1daa(zero)
  li t1, 4
  bgeu t0, t1, .L1
  ; player.e16.ts:264  pSpeed++
  lw t0, 0x1daa(zero)
  addi t0, t0, 1
  sw t0, 0x1daa(zero)
.L1:
  ; player.e16.ts:265  const next = (pRow + 1) * 16
  lw t0, 0x1d9a(zero)
  addi t0, t0, 1
  slli s1, t0, 4
  ; player.e16.ts:266  const step = next - pY < pSpeed ? next - pY : pSpeed
  lw t0, 0x1d9e(zero)
  sub t0, s1, t0
  lw t1, 0x1daa(zero)
  bgeu t0, t1, .L2
  lw t0, 0x1d9e(zero)
  sub t0, s1, t0
  j .L3
.L2:
  lw t0, 0x1daa(zero)
.L3:
  mv s2, t0 ; step
  ; player.e16.ts:267  pY = pY + step
  lw t0, 0x1d9e(zero)
  add t0, t0, s2
  sw t0, 0x1d9e(zero)
  ; player.e16.ts:268  if (pY < next) return
  bgeu t0, s1, .L4
  ; player.e16.ts:268  return
  j .return
.L4:
  ; player.e16.ts:269  pRow++
  lw t0, 0x1d9a(zero)
  addi t0, t0, 1
  sw t0, 0x1d9a(zero)
  ; player.e16.ts:270  if (standsOn()) {
  call standsOn
  beqz a0, .L5
  ; player.e16.ts:271  pY = pRow * 16
  lw t0, 0x1d9a(zero)
  slli t0, t0, 4
  sw t0, 0x1d9e(zero)
  ; player.e16.ts:272  pState = P_LAND
  li t0, 5
  sw t0, 0x1da0(zero)
  ; player.e16.ts:273  pT = 0
  sw zero, 0x1da2(zero)
  ; player.e16.ts:274  sfxLand()
  call sfxLand
  ; player.e16.ts:275  dust(i16(FIELD_X + pX) + 2, i16(pY) + 14, 0)
  lw t0, 0x1d9c(zero)
  lw t1, 0x1d9e(zero)
  addi a0, t0, 90
  addi a1, t1, 14
  li a2, 0
  call dust
  ; player.e16.ts:276  dust(i16(FIELD_X + pX) + 14, i16(pY) + 14, 0)
  lw t0, 0x1d9c(zero)
  lw t1, 0x1d9e(zero)
  addi a0, t0, 102
  addi a1, t1, 14
  li a2, 0
  call dust
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; player.e16.ts:282 startDig(dir) at -O1
;   dir in a0
startDig:
  ; player.e16.ts:283  pDir = dir
  sw a0, 0x1da6(zero)
  ; player.e16.ts:284  if (dir < 2) pFace = dir
  li t0, 2
  bgeu a0, t0, .L1
  ; player.e16.ts:284  pFace = dir
  sw a0, 0x1da4(zero)
.L1:
  ; player.e16.ts:285  pState = P_DIG
  li t0, 4
  sw t0, 0x1da0(zero)
  ; player.e16.ts:286  pT = 0
  sw zero, 0x1da2(zero)
  ; player.e16.ts:287  pIdle = 0
  sw zero, 0x1dae(zero)
.return:
  ret

; player.e16.ts:291 aimed() at -O1
;   col in s1
;   row in s2
aimed:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; player.e16.ts:292  const col = pDir === 0 ? pCol + 1 : pDir === 1 ? pCol - 1 : pCol
  lw t0, 0x1da6(zero)
  bne t0, zero, .L1
  lw t0, 0x1d98(zero)
  addi t0, t0, 1
  j .L2
.L1:
  lw t0, 0x1da6(zero)
  li t1, 1
  bne t0, t1, .L3
  lw t0, 0x1d98(zero)
  addi t0, t0, -1
  j .L4
.L3:
  lw t0, 0x1d98(zero)
.L4:
.L2:
  mv s1, t0 ; col
  ; player.e16.ts:293  const row = pDir === 2 ? pRow + 1 : pDir === 3 ? pRow - 1 : pRow
  lw t0, 0x1da6(zero)
  li t1, 2
  bne t0, t1, .L5
  lw t0, 0x1d9a(zero)
  addi t0, t0, 1
  j .L6
.L5:
  lw t0, 0x1da6(zero)
  li t1, 3
  bne t0, t1, .L7
  lw t0, 0x1d9a(zero)
  addi t0, t0, -1
  j .L8
.L7:
  lw t0, 0x1d9a(zero)
.L8:
.L6:
  mv s2, t0 ; row
  ; player.e16.ts:294  if (col >= COLS) return 0xffff
  li t0, 9
  bltu s1, t0, .L9
  ; player.e16.ts:294  return 0xffff
  li a0, 65535
  j .return
.L9:
  ; player.e16.ts:295  return cellOf(col, row)
  mv a0, s1
  mv a1, s2
  call cellOf
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; player.e16.ts:298 dig(now) at -O1
;   now in s1
dig:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; now
  ; player.e16.ts:299  pT++
  lw t0, 0x1da2(zero)
  addi t0, t0, 1
  sw t0, 0x1da2(zero)
  ; player.e16.ts:300  if (pT === 3) bite(now)
  li t1, 3
  bne t0, t1, .L1
  ; player.e16.ts:300  bite(now)
  mv a0, s1
  call bite
.L1:
  ; player.e16.ts:301  if (pT >= 10) {
  lw t0, 0x1da2(zero)
  li t1, 10
  bltu t0, t1, .L2
  ; player.e16.ts:302  pState = P_STAND
  sw zero, 0x1da0(zero)
  ; player.e16.ts:303  pT = 0
  sw zero, 0x1da2(zero)
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; player.e16.ts:308 bite(now) at -O1
;   now in 2(fp)
;   c in s1
;   v in 4(fp)
;   t in s2
;   x in s3
;   y in 0(fp)
;   n in 6(fp)
bite:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 2(fp) ; now
  ; player.e16.ts:309  const c = aimed()
  call aimed
  mv s1, a0 ; c
  ; player.e16.ts:310  const v = c === 0xffff ? T_EMPTY : cells[c]
  li t0, 65535
  bne s1, t0, .L1
  li t0, 0
  j .L2
.L1:
  lbu t0, cells(s1)
.L2:
  sw t0, 4(fp) ; v
  ; player.e16.ts:311  const t = v & 15
  lw t0, 4(fp) ; v
  andi s2, t0, 15
  ; player.e16.ts:312  const x = i16(FIELD_X + pX + (pDir === 0 ? 16 : pDir === 1 ? 0 : 8))
  lw t0, 0x1d9c(zero)
  lw t1, 0x1da6(zero)
  addi t0, t0, 88
  li t2, 0
  bne t1, t2, .L3
  li t1, 16
  j .L4
.L3:
  lw t1, 0x1da6(zero)
  li t2, 1
  bne t1, t2, .L5
  li t1, 0
  j .L6
.L5:
  li t1, 8
.L6:
.L4:
  add s3, t0, t1
  ; player.e16.ts:313  const y = i16(pY + (pDir === 2 ? 16 : pDir === 3 ? 0 : 8))
  lw t0, 0x1d9e(zero)
  lw t1, 0x1da6(zero)
  li t2, 2
  bne t1, t2, .L7
  li t1, 16
  j .L8
.L7:
  lw t1, 0x1da6(zero)
  li t2, 3
  bne t1, t2, .L9
  li t1, 0
  j .L10
.L9:
  li t1, 8
.L10:
.L8:
  add t0, t0, t1
  sw t0, 0(fp) ; y
  ; player.e16.ts:314  if (t === T_EMPTY) sfxSwing()
  bne s2, zero, .L11
  ; player.e16.ts:314  sfxSwing()
  call sfxSwing
  j .L12
.L11:
  ; player.e16.ts:315  if ((v & (F_LOOSE | F_PEND)) !== 0 || t === T_CORE || t === T_WALL) {
  lw t0, 4(fp) ; v
  andi t0, t0, 192
  bne t0, zero, .L14
  li t0, 7
  beq s2, t0, .L14
  li t0, 15
  bne s2, t0, .L13
.L14:
  ; player.e16.ts:316  sfxClink()
  call sfxClink
  ; player.e16.ts:317  sparks(x, y, 2)
  mv a0, s3
  lw a1, 0(fp)
  li a2, 2
  call sparks
  j .L15
.L13:
  ; player.e16.ts:318  if (t === T_AIR) collect(c)
  li t0, 6
  bne s2, t0, .L16
  ; player.e16.ts:318  collect(c)
  mv a0, s1
  call collect
  j .L17
.L16:
  ; player.e16.ts:319  if (t === T_ALLOY) alloyHit(c, now, x, y)
  li t0, 5
  bne s2, t0, .L18
  ; player.e16.ts:319  alloyHit(c, now, x, y)
  mv a0, s1
  lw a1, 2(fp)
  mv a2, s3
  lw a3, 0(fp)
  call alloyHit
  j .L19
.L18:
  ; player.e16.ts:321  chainNew()
  call chainNew
  ; player.e16.ts:322  const n = groupOf(c)
  mv a0, s1
  call groupOf
  sw a0, 6(fp) ; n
  ; player.e16.ts:323  vanish(n, now + 1, 1)
  lw t0, 2(fp) ; now
  lw a0, 6(fp)
  addi a1, t0, 1
  li a2, 1
  call vanish
  ; player.e16.ts:324  dugN = n
  lw t0, 6(fp) ; n
  sw t0, 0x1db8(zero)
  ; player.e16.ts:325  sfxDig()
  call sfxDig
  ; player.e16.ts:326  dust(x, y, 1)
  mv a0, s3
  lw a1, 0(fp)
  li a2, 1
  call dust
.L19:
.L17:
.L15:
.L12:
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; player.e16.ts:331 alloyHit(c, now, x, y) at -O1
;   c in s1
;   now in 0(fp)
;   x in 2(fp)
;   y in 4(fp)
;   v in s2
;   hits in s3
alloyHit:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; c
  sw a1, 0(fp) ; now
  sw a2, 2(fp) ; x
  sw a3, 4(fp) ; y
  ; player.e16.ts:332  const v = cells[c]
  lbu s2, cells(s1)
  ; player.e16.ts:333  const hits = ((v >> 4) & 3) + 1
  srli t0, s2, 4
  andi t0, t0, 3
  addi s3, t0, 1
  ; player.e16.ts:334  sparks(x, y, 4)
  lw a0, 2(fp)
  lw a1, 4(fp)
  li a2, 4
  call sparks
  ; player.e16.ts:335  sfxClank()
  call sfxClank
  ; player.e16.ts:336  if (hits >= ALLOY_HITS) {
  li t0, 4
  bltu s3, t0, .L1
  ; player.e16.ts:337  groupOf(c)
  mv a0, s1
  call groupOf
  ; player.e16.ts:338  vanish(1, now, 0)
  li a0, 1
  lw a1, 0(fp)
  li a2, 0
  call vanish
  ; player.e16.ts:339  alloyBroken = 1
  li t0, 1
  sw t0, 0x1dba(zero)
  ; player.e16.ts:340  airLose(20)
  li a0, 20
  call airLose
  ; player.e16.ts:341  return
  j .return
.L1:
  ; player.e16.ts:343  cells[c] = (v & 0xcf) | (hits << 4)
  andi t0, s2, 207
  slli t1, s3, 4
  or t0, t0, t1
  sb t0, cells(s1)
  ; player.e16.ts:344  markAround(c)
  mv a0, s1
  call markAround
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; player.e16.ts:348 collect(c) at -O1
;   c in s1
collect:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; c
  ; player.e16.ts:349  cellClear(c)
  mv a0, s1
  call cellClear
  ; player.e16.ts:350  capsuleN++
  lw t0, 0x1dbc(zero)
  addi t0, t0, 1
  sw t0, 0x1dbc(zero)
  ; player.e16.ts:351  capsules++
  lw t0, 0x1dbe(zero)
  addi t0, t0, 1
  sw t0, 0x1dbe(zero)
  ; player.e16.ts:352  airAdd(20)
  li a0, 20
  call airAdd
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; player.e16.ts:356 caughtFalling() at -O1
caughtFalling:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; player.e16.ts:357  capsuleN++
  lw t0, 0x1dbc(zero)
  addi t0, t0, 1
  sw t0, 0x1dbc(zero)
  ; player.e16.ts:358  capsules++
  lw t0, 0x1dbe(zero)
  addi t0, t0, 1
  sw t0, 0x1dbe(zero)
  ; player.e16.ts:359  airAdd(20)
  li a0, 20
  call airAdd
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; player.e16.ts:364 crushed() at -O1
crushed:
  ; player.e16.ts:365  pState = P_CRUSH
  li t0, 6
  sw t0, 0x1da0(zero)
  ; player.e16.ts:366  pT = 0
  sw zero, 0x1da2(zero)
.return:
  ret

; player.e16.ts:370 deathDone() at -O1
deathDone:
  ; player.e16.ts:371  return (pState === P_CRUSH && pT >= 100) || (pState === P_GASP && pT >= 130)
  lw t0, 0x1da0(zero)
  li t1, 6
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  beqz t1, .L2
  lw t0, 0x1da2(zero)
  li t1, 100
  sltu t0, t0, t1
  xori t0, t0, 1
.L2:
  mv t1, t0
  bnez t1, .L1
  lw t0, 0x1da0(zero)
  li t1, 7
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  beqz t1, .L3
  lw t0, 0x1da2(zero)
  li t1, 130
  sltu t0, t0, t1
  xori t0, t0, 1
.L3:
.L1:
  mv a0, t0
.return:
  ret

; player.e16.ts:375 comeBack() at -O1
;   k in s1
;   c in s3
;   t in s2
comeBack:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  ; player.e16.ts:376  let k: u16 = 0
  li s1, 0 ; k
  ; player.e16.ts:377  while (k < 3) {
  j .L3
.L1:
  ; player.e16.ts:378  const c = cellOf(pCol, pRow - k)
  lw t0, 0x1d98(zero)
  lw t1, 0x1d9a(zero)
  sub t1, t1, s1
  mv a0, t0
  mv a1, t1
  call cellOf
  mv s3, a0 ; c
  ; player.e16.ts:379  const t = cells[c] & 15
  lbu t0, cells(s3)
  andi s2, t0, 15
  ; player.e16.ts:380  if (t !== T_CORE && t !== T_WALL && t !== T_EMPTY) cellClear(c)
  li t0, 7
  beq s2, t0, .L5
  li t0, 15
  beq s2, t0, .L5
  beq s2, zero, .L5
  ; player.e16.ts:380  cellClear(c)
  mv a0, s3
  call cellClear
.L5:
  ; player.e16.ts:381  k++
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
  ; player.e16.ts:383  pY = pRow * 16
  lw t0, 0x1d9a(zero)
  slli t0, t0, 4
  sw t0, 0x1d9e(zero)
  ; player.e16.ts:384  pX = pCol * 16
  lw t0, 0x1d98(zero)
  slli t0, t0, 4
  sw t0, 0x1d9c(zero)
  ; player.e16.ts:385  pState = P_STAND
  sw zero, 0x1da0(zero)
  ; player.e16.ts:386  pT = 0
  sw zero, 0x1da2(zero)
  ; player.e16.ts:387  air = 100
  li t0, 100
  sw t0, 0x1db2(zero)
  ; player.e16.ts:388  airSub = 0
  sw zero, 0x1db4(zero)
  ; player.e16.ts:389  pSafe = 150
  li t0, 150
  sw t0, 0x1db0(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; player.e16.ts:392 cheer() at -O1
cheer:
  ; player.e16.ts:393  pState = P_CHEER
  li t0, 8
  sw t0, 0x1da0(zero)
  ; player.e16.ts:394  pT = 0
  sw zero, 0x1da2(zero)
.return:
  ret

; player.e16.ts:400 playerDraw(camY, frame) at -O1
;   camY in 2(fp)
;   frame in s1
;   x in s2
;   y in s3
;   flip in 0(fp)
;   f in 4(fp)
playerDraw:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 2(fp) ; camY
  mv s1, a1 ; frame
  ; player.e16.ts:401  if (pSafe > 0 && (frame & 4) !== 0) return
  lw t0, 0x1db0(zero)
  bgeu zero, t0, .L1
  andi t0, s1, 4
  beq t0, zero, .L1
  ; player.e16.ts:401  return
  j .return
.L1:
  ; player.e16.ts:402  const x = i16(FIELD_X + pX)
  lw t0, 0x1d9c(zero)
  addi s2, t0, 88
  ; player.e16.ts:403  const y = i16(pY - camY)
  lw t0, 0x1d9e(zero)
  lw t1, 2(fp) ; camY
  sub s3, t0, t1
  ; player.e16.ts:404  const flip = pFace === 1 ? FLIP_H : 0
  lw t0, 0x1da4(zero)
  li t1, 1
  bne t0, t1, .L2
  li t0, 8192
  j .L3
.L2:
  li t0, 0
.L3:
  sw t0, 0(fp) ; flip
  ; player.e16.ts:405  const f = frameNow(frame)
  mv a0, s1
  call frameNow
  sw a0, 4(fp) ; f
  ; player.e16.ts:406  if (pState === P_DIG && pT >= 2 && pT < 9) bitDraw(x, y, flip)
  lw t0, 0x1da0(zero)
  li t1, 4
  bne t0, t1, .L4
  lw t0, 0x1da2(zero)
  li t1, 2
  bltu t0, t1, .L4
  lw t0, 0x1da2(zero)
  li t1, 9
  bgeu t0, t1, .L4
  ; player.e16.ts:406  bitDraw(x, y, flip)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  call bitDraw
.L4:
  ; player.e16.ts:407  spr(x, y, (DRILLER_TILE + f * 4) | flip, S16)
  lw t0, 4(fp) ; f
  slli t0, t0, 2
  lw t1, 0(fp) ; flip
  addi t0, t0, 313
  or t0, t0, t1
  mv a0, s2
  mv a1, s3
  mv a2, t0
  li a3, 1
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

; player.e16.ts:410 bitDraw(x, y, flip) at -O1
;   x in s1
;   y in s2
;   flip in s0
;   spin in s3
bitDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s0, a2 ; flip
  ; player.e16.ts:411  const spin = (pT >> 1) & 1
  lw t0, 0x1da2(zero)
  srli t0, t0, 1
  andi s3, t0, 1
  ; player.e16.ts:412  const pal = 6 << 10
  ; player.e16.ts:413  if (pDir < 2) spr(x + (pDir === 0 ? 13 : -13), y, (BIT_TILE + spin * 4) | pal | flip, S16)
  lw t0, 0x1da6(zero)
  li t1, 2
  bgeu t0, t1, .L1
  ; player.e16.ts:413  spr(x + (pDir === 0 ? 13 : -13), y, (BIT_TILE + spin * 4) | pal | flip, S16)
  lw t1, 0x1da6(zero)
  mv t0, s1
  li t2, 0
  bne t1, t2, .L2
  li t1, 13
  j .L3
.L2:
  li t1, 65523
.L3:
  add t0, t0, t1
  slli t1, s3, 2
  addi t1, t1, 409
  ori t1, t1, 6144
  or t1, t1, s0
  mv a0, t0
  mv a1, s2
  mv a2, t1
  li a3, 1
  call spr
  j .L4
.L1:
  ; player.e16.ts:414  if (pDir === 2) spr(x, y + 13, (BIT_TILE + 8 + spin * 4) | pal, S16)
  lw t0, 0x1da6(zero)
  li t1, 2
  bne t0, t1, .L5
  ; player.e16.ts:414  spr(x, y + 13, (BIT_TILE + 8 + spin * 4) | pal, S16)
  slli t0, s3, 2
  addi t0, t0, 417
  ori t0, t0, 6144
  mv a0, s1
  addi a1, s2, 13
  mv a2, t0
  li a3, 1
  call spr
  j .L6
.L5:
  ; player.e16.ts:415  spr(x, y - 13, (BIT_TILE + 16 + spin * 4) | pal, S16)
  slli t0, s3, 2
  addi t0, t0, 425
  ori t0, t0, 6144
  mv a0, s1
  addi a1, s2, -13
  mv a2, t0
  li a3, 1
  call spr
.L6:
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; player.e16.ts:419 frameNow(frame) at -O1
;   frame in s2
;   s in s1
frameNow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; frame
  ; player.e16.ts:420  const s = pState
  lw s1, 0x1da0(zero)
  ; player.e16.ts:421  if (s === P_WALK) return 2 + ((pT >> 1) & 3)
  li t0, 1
  bne s1, t0, .L1
  ; player.e16.ts:421  return 2 + ((pT >> 1) & 3)
  lw t0, 0x1da2(zero)
  srli t0, t0, 1
  andi t0, t0, 3
  addi a0, t0, 2
  j .return
.L1:
  ; player.e16.ts:422  if (s === P_FALL) return 12
  li t0, 3
  bne s1, t0, .L2
  ; player.e16.ts:422  return 12
  li a0, 12
  j .return
.L2:
  ; player.e16.ts:423  if (s === P_CLIMB) return 14 + ((pT >> 2) & 1)
  li t0, 2
  bne s1, t0, .L3
  ; player.e16.ts:423  return 14 + ((pT >> 2) & 1)
  lw t0, 0x1da2(zero)
  srli t0, t0, 2
  andi t0, t0, 1
  addi a0, t0, 14
  j .return
.L3:
  ; player.e16.ts:424  if (s === P_DIG) return digFrame()
  li t0, 4
  bne s1, t0, .L4
  ; player.e16.ts:424  return digFrame()
  call digFrame
  j .return
.L4:
  ; player.e16.ts:425  if (s === P_LAND) return 13
  li t0, 5
  bne s1, t0, .L5
  ; player.e16.ts:425  return 13
  li a0, 13
  j .return
.L5:
  ; player.e16.ts:426  if (s === P_CRUSH) return 16 + ((pT >> 3) & 1)
  li t0, 6
  bne s1, t0, .L6
  ; player.e16.ts:426  return 16 + ((pT >> 3) & 1)
  lw t0, 0x1da2(zero)
  srli t0, t0, 3
  andi t0, t0, 1
  addi a0, t0, 16
  j .return
.L6:
  ; player.e16.ts:427  if (s === P_GASP) return pT > 90 ? 20 : 18 + ((pT >> 3) & 1)
  li t0, 7
  bne s1, t0, .L7
  ; player.e16.ts:427  return pT > 90 ? 20 : 18 + ((pT >> 3) & 1)
  lw t0, 0x1da2(zero)
  li t1, 90
  bgeu t1, t0, .L8
  li t0, 20
  j .L9
.L8:
  lw t0, 0x1da2(zero)
  srli t0, t0, 3
  andi t0, t0, 1
  addi t0, t0, 18
.L9:
  mv a0, t0
  j .return
.L7:
  ; player.e16.ts:428  if (s === P_CHEER) return 21 + ((pT >> 4) & 1)
  li t0, 8
  bne s1, t0, .L10
  ; player.e16.ts:428  return 21 + ((pT >> 4) & 1)
  lw t0, 0x1da2(zero)
  srli t0, t0, 4
  andi t0, t0, 1
  addi a0, t0, 21
  j .return
.L10:
  ; player.e16.ts:430  return (frame & 127) < 6 ? 1 : 0
  andi t0, s2, 127
  li t1, 6
  bgeu t0, t1, .L11
  li t0, 1
  j .L12
.L11:
  li t0, 0
.L12:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; player.e16.ts:434 digFrame() at -O1
;   shake in a0
digFrame:
  ; player.e16.ts:435  const shake = (pT >> 1) & 1
  lw t0, 0x1da2(zero)
  srli t0, t0, 1
  andi a0, t0, 1
  ; player.e16.ts:436  if (pDir < 2) return 6 + shake
  lw t0, 0x1da6(zero)
  li t1, 2
  bgeu t0, t1, .L1
  ; player.e16.ts:436  return 6 + shake
  addi a0, a0, 6
  ret
.L1:
  ; player.e16.ts:437  return pDir === 2 ? 8 + shake : 10 + shake
  lw t0, 0x1da6(zero)
  li t1, 2
  bne t0, t1, .L2
  addi t0, a0, 8
  j .L3
.L2:
  addi t0, a0, 10
.L3:
  mv a0, t0
.return:
  ret

; fx.e16.ts:31 fxVel(vx, vy) at -O1
;   vx in a0
;   vy in a1
fxVel:
  ; fx.e16.ts:32  velX = vx
  sw a0, 0x1f82(zero)
  ; fx.e16.ts:33  velY = vy
  sw a1, 0x1f84(zero)
.return:
  ret

; fx.e16.ts:37 fxAdd(k, x, y, a) at -O1
;   k in a0
;   x in a1
;   y in a2
;   a in a3
;   vx in s2
;   vy in s3
;   s in s1
fxAdd:
  addi sp, sp, -6
  sw s2, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  ; fx.e16.ts:38  const vx = velX
  lw s2, 0x1f82(zero)
  ; fx.e16.ts:39  const vy = velY
  lw s3, 0x1f84(zero)
  ; fx.e16.ts:40  velX = 0
  sw zero, 0x1f82(zero)
  ; fx.e16.ts:41  velY = 0
  sw zero, 0x1f84(zero)
  ; fx.e16.ts:42  const s = fxNext
  lw s1, 0x1f80(zero)
  ; fx.e16.ts:43  fxNext = (fxNext + 1) & 31
  lw t0, 0x1f80(zero)
  addi t0, t0, 1
  andi t0, t0, 31
  sw t0, 0x1f80(zero)
  ; fx.e16.ts:44  fxK[s] = k
  slli t0, s1, 1
  sw a0, fxK(t0)
  ; fx.e16.ts:45  fxX[s] = u16(x) << 4
  slli t0, s1, 1
  slli t1, a1, 4
  sw t1, fxX(t0)
  ; fx.e16.ts:47  fxY[s] = wrap16(u16(y) << 4)
  slli t0, s1, 1
  slli t1, a2, 4
  sw t1, fxY(t0)
  ; fx.e16.ts:48  fxVX[s] = u16(vx)
  slli t0, s1, 1
  sw s2, fxVX(t0)
  ; fx.e16.ts:49  fxVY[s] = u16(vy)
  slli t0, s1, 1
  sw s3, fxVY(t0)
  ; fx.e16.ts:50  fxT[s] = 0
  slli t0, s1, 1
  sw zero, fxT(t0)
  ; fx.e16.ts:51  fxA[s] = a
  slli t0, s1, 1
  sw a3, fxA(t0)
.return:
  lw s2, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; fx.e16.ts:55 pop(x, y, colour, stars) at -O1
;   x in s2
;   y in s3
;   colour in 0(fp)
;   stars in 2(fp)
;   n in s1
pop:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; x
  mv s3, a1 ; y
  sw a2, 0(fp) ; colour
  sw a3, 2(fp) ; stars
  ; fx.e16.ts:56  fxVel(0, 0)
  li a0, 0
  li a1, 0
  call fxVel
  ; fx.e16.ts:57  fxAdd(K_POP, x, y, colour)
  li a0, 1
  mv a1, s2
  mv a2, s3
  lw a3, 0(fp)
  call fxAdd
  ; fx.e16.ts:58  let n = stars
  lw s1, 2(fp) ; stars
  ; fx.e16.ts:59  while (n > 0) {
  j .L3
.L1:
  ; fx.e16.ts:60  fxVel(i16(randBelow(48)) - 24, -i16(randBelow(24)) - 20)
  li a0, 48
  call randBelow
  addi a0, a0, -24
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 24
  call randBelow
  neg t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  addi a1, t0, -20
  call fxVel
  ; fx.e16.ts:61  fxAdd(K_STAR, x + 4, y + 4, 0)
  li a0, 4
  addi a1, s2, 4
  addi a2, s3, 4
  li a3, 0
  call fxAdd
  ; fx.e16.ts:62  n--
  addi s1, s1, -1
.L3:
  bltu zero, s1, .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fx.e16.ts:67 dust(x, y, more) at -O1
;   x in s2
;   y in s3
;   more in s0
;   n in s1
dust:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; x
  mv s3, a1 ; y
  mv s0, a2 ; more
  ; fx.e16.ts:68  let n: u16 = more !== 0 ? 4 : 1
  beq s0, zero, .L1
  li t0, 4
  j .L2
.L1:
  li t0, 1
.L2:
  mv s1, t0 ; n
  ; fx.e16.ts:69  while (n > 0) {
  j .L5
.L3:
  ; fx.e16.ts:70  fxVel(i16(randBelow(32)) - 16, -i16(randBelow(12)) - 4)
  li a0, 32
  call randBelow
  addi a0, a0, -16
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 12
  call randBelow
  neg t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  addi a1, t0, -4
  call fxVel
  ; fx.e16.ts:71  fxAdd(K_DUST, x - 4, y - 4, 0)
  li a0, 2
  addi a1, s2, -4
  addi a2, s3, -4
  li a3, 0
  call fxAdd
  ; fx.e16.ts:72  n--
  addi s1, s1, -1
.L5:
  bltu zero, s1, .L3
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; fx.e16.ts:76 sparks(x, y, n) at -O1
;   x in s2
;   y in s3
;   n in s1
sparks:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; x
  mv s3, a1 ; y
  mv s1, a2 ; n
  ; fx.e16.ts:77  while (n > 0) {
  j .L3
.L1:
  ; fx.e16.ts:78  fxVel(i16(randBelow(64)) - 32, -i16(randBelow(40)) - 8)
  li a0, 64
  call randBelow
  addi a0, a0, -32
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 40
  call randBelow
  neg t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  addi a1, t0, -8
  call fxVel
  ; fx.e16.ts:79  fxAdd(K_SPARK, x - 4, y - 4, 0)
  li a0, 3
  addi a1, s2, -4
  addi a2, s3, -4
  li a3, 0
  call fxAdd
  ; fx.e16.ts:80  n--
  addi s1, s1, -1
.L3:
  bltu zero, s1, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:84 bubbles(x, y) at -O1
;   x in s2
;   y in s3
;   n in s1
bubbles:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; x
  mv s3, a1 ; y
  ; fx.e16.ts:85  let n: u16 = 4
  li s1, 4 ; n
  ; fx.e16.ts:86  while (n > 0) {
  j .L3
.L1:
  ; fx.e16.ts:87  fxVel(i16(randBelow(16)) - 8, -i16(randBelow(12)) - 10)
  li a0, 16
  call randBelow
  addi a0, a0, -8
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 12
  call randBelow
  neg t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  addi a1, t0, -10
  call fxVel
  ; fx.e16.ts:88  fxAdd(K_BUBBLE, x + i16(randBelow(12)) - 6, y + 4, 0)
  li a0, 12
  call randBelow
  add t0, s2, a0
  li a0, 5
  addi a1, t0, -6
  addi a2, s3, 4
  li a3, 0
  call fxAdd
  ; fx.e16.ts:89  n--
  addi s1, s1, -1
.L3:
  bltu zero, s1, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:94 chainShow(x, y, n) at -O1
;   x in s1
;   y in s2
;   n in s3
chainShow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; n
  ; fx.e16.ts:95  fxVel(0, -12)
  li a0, 0
  li a1, 65524
  call fxVel
  ; fx.e16.ts:96  fxAdd(K_CHAIN, x, y, n)
  li a0, 6
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call fxAdd
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:100 plusShow(x, y, n) at -O1
;   x in s1
;   y in s2
;   n in s3
plusShow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; n
  ; fx.e16.ts:101  fxVel(0, -10)
  li a0, 0
  li a1, 65526
  call fxVel
  ; fx.e16.ts:102  fxAdd(K_PLUS, x, y, n)
  li a0, 7
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call fxAdd
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:105 fxClear() at -O1
;   k in a0
fxClear:
  ; fx.e16.ts:106  let k: u16 = 0
  li a0, 0 ; k
  ; fx.e16.ts:107  while (k < FX_N) {
  j .L3
.L1:
  ; fx.e16.ts:108  fxK[k] = 0
  slli t0, a0, 1
  sw zero, fxK(t0)
  ; fx.e16.ts:109  k++
  addi a0, a0, 1
.L3:
  li t0, 32
  bltu a0, t0, .L1
.return:
  ret

; fx.e16.ts:114 fxStep(camY) at -O1
;   camY in s3
;   k in s1
;   kind in s2
fxStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; camY
  ; fx.e16.ts:115  let k: u16 = 0
  li s1, 0 ; k
  ; fx.e16.ts:116  while (k < FX_N) {
  j .L3
.L1:
  ; fx.e16.ts:117  const kind = fxK[k]
  slli t0, s1, 1
  lw s2, fxK(t0)
  ; fx.e16.ts:118  if (kind === K_CHAIN || kind === K_PLUS) fxOne(k, kind, camY)
  li t0, 6
  beq s2, t0, .L6
  li t0, 7
  bne s2, t0, .L5
.L6:
  ; fx.e16.ts:118  fxOne(k, kind, camY)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call fxOne
.L5:
  ; fx.e16.ts:119  k++
  addi s1, s1, 1
.L3:
  li t0, 32
  bltu s1, t0, .L1
  ; fx.e16.ts:121  k = 0
  li s1, 0 ; k
  ; fx.e16.ts:122  while (k < FX_N) {
  j .L9
.L7:
  ; fx.e16.ts:123  const kind = fxK[k]
  slli t0, s1, 1
  lw s2, fxK(t0)
  ; fx.e16.ts:124  if (kind !== 0 && kind !== K_CHAIN && kind !== K_PLUS) fxOne(k, kind, camY)
  beq s2, zero, .L11
  li t0, 6
  beq s2, t0, .L11
  li t0, 7
  beq s2, t0, .L11
  ; fx.e16.ts:124  fxOne(k, kind, camY)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call fxOne
.L11:
  ; fx.e16.ts:125  k++
  addi s1, s1, 1
.L9:
  li t0, 32
  bltu s1, t0, .L7
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:129 fxOne(k, kind, camY) at -O1
;   k in s1
;   kind in 0(fp)
;   camY in 2(fp)
;   t in s2
;   x in 4(fp)
;   y in s3
fxOne:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 0(fp) ; kind
  sw a2, 2(fp) ; camY
  ; fx.e16.ts:130  const t = fxT[k] + 1
  slli t0, s1, 1
  lw t0, fxT(t0)
  addi s2, t0, 1
  ; fx.e16.ts:131  fxT[k] = t
  slli t0, s1, 1
  sw s2, fxT(t0)
  ; fx.e16.ts:132  if (t >= lifeOf(kind)) {
  lw a0, 0(fp)
  call lifeOf
  bltu s2, a0, .L1
  ; fx.e16.ts:133  fxK[k] = 0
  slli t0, s1, 1
  sw zero, fxK(t0)
  ; fx.e16.ts:134  return
  j .return
.L1:
  ; fx.e16.ts:136  fxMove(k, kind, t)
  mv a0, s1
  lw a1, 0(fp)
  mv a2, s2
  call fxMove
  ; fx.e16.ts:137  const x = i16(fxX[k] >> 4)
  slli t0, s1, 1
  lw t0, fxX(t0)
  srli t0, t0, 4
  sw t0, 4(fp) ; x
  ; fx.e16.ts:138  const y = i16(wrap16(fxY[k] - (camY << 4))) >> 4
  slli t0, s1, 1
  lw t0, fxY(t0)
  lw t1, 2(fp) ; camY
  slli t1, t1, 4
  sub t0, t0, t1
  srai s3, t0, 4
  ; fx.e16.ts:139  if (y < -16 || y > 296) return
  li t0, 65520
  blt s3, t0, .L3
  li t0, 296
  bge t0, s3, .L2
.L3:
  ; fx.e16.ts:139  return
  j .return
.L2:
  ; fx.e16.ts:140  fxDraw(k, x, y)
  mv a0, s1
  lw a1, 4(fp)
  mv a2, s3
  call fxDraw
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; fx.e16.ts:144 lifeOf(kind) at -O1
;   kind in a0
lifeOf:
  ; fx.e16.ts:145  if (kind === K_POP) return 15
  li t0, 1
  bne a0, t0, .L1
  ; fx.e16.ts:145  return 15
  li a0, 15
  ret
.L1:
  ; fx.e16.ts:146  if (kind === K_DUST) return 20
  li t0, 2
  bne a0, t0, .L2
  ; fx.e16.ts:146  return 20
  li a0, 20
  ret
.L2:
  ; fx.e16.ts:147  if (kind === K_SPARK) return 12
  li t0, 3
  bne a0, t0, .L3
  ; fx.e16.ts:147  return 12
  li a0, 12
  ret
.L3:
  ; fx.e16.ts:148  if (kind === K_STAR) return 30
  li t0, 4
  bne a0, t0, .L4
  ; fx.e16.ts:148  return 30
  li a0, 30
  ret
.L4:
  ; fx.e16.ts:149  if (kind === K_BUBBLE) return 40
  li t0, 5
  bne a0, t0, .L5
  ; fx.e16.ts:149  return 40
  li a0, 40
  ret
.L5:
  ; fx.e16.ts:150  return 50
  li a0, 50
.return:
  ret

; fx.e16.ts:154 fxMove(k, kind, t) at -O1
;   k in a0
;   kind in a1
;   t in a2
fxMove:
  ; fx.e16.ts:155  fxX[k] = fxX[k] + fxVX[k]
  slli t0, a0, 1
  slli t1, a0, 1
  lw t1, fxX(t1)
  slli t2, a0, 1
  lw t2, fxVX(t2)
  add t1, t1, t2
  sw t1, fxX(t0)
  ; fx.e16.ts:156  fxY[k] = fxY[k] + fxVY[k]
  slli t0, a0, 1
  slli t1, a0, 1
  lw t1, fxY(t1)
  slli t2, a0, 1
  lw t2, fxVY(t2)
  add t1, t1, t2
  sw t1, fxY(t0)
  ; fx.e16.ts:157  if (kind === K_STAR || kind === K_SPARK) fxVY[k] = fxVY[k] + 3
  li t0, 4
  beq a1, t0, .L2
  li t0, 3
  bne a1, t0, .L1
.L2:
  ; fx.e16.ts:157  fxVY[k] = fxVY[k] + 3
  slli t0, a0, 1
  slli t1, a0, 1
  lw t1, fxVY(t1)
  addi t1, t1, 3
  sw t1, fxVY(t0)
  j .L3
.L1:
  ; fx.e16.ts:158  if (kind === K_DUST && (t & 3) === 0) {
  li t0, 2
  bne a1, t0, .L4
  andi t0, a2, 3
  bne t0, zero, .L4
  ; fx.e16.ts:159  fxVX[k] = u16(i16(fxVX[k]) >> 1)
  slli t0, a0, 1
  slli t1, a0, 1
  lw t1, fxVX(t1)
  srai t1, t1, 1
  sw t1, fxVX(t0)
  ; fx.e16.ts:160  fxVY[k] = u16(i16(fxVY[k]) >> 1)
  slli t0, a0, 1
  slli t1, a0, 1
  lw t1, fxVY(t1)
  srai t1, t1, 1
  sw t1, fxVY(t0)
  j .L5
.L4:
  ; fx.e16.ts:161  if ((kind === K_CHAIN || kind === K_PLUS) && t > 20) fxVY[k] = 0
  li t0, 6
  beq a1, t0, .L7
  li t0, 7
  bne a1, t0, .L6
.L7:
  li t0, 20
  bgeu t0, a2, .L6
  ; fx.e16.ts:161  fxVY[k] = 0
  slli t0, a0, 1
  sw zero, fxVY(t0)
.L6:
.L5:
.L3:
.return:
  ret

; fx.e16.ts:164 fxDraw(k, x, y) at -O1
;   k in 2(fp)
;   x in s2
;   y in s3
;   kind in 0(fp)
;   t in s1
fxDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 2(fp) ; k
  mv s2, a1 ; x
  mv s3, a2 ; y
  ; fx.e16.ts:165  const kind = fxK[k]
  lw t0, 2(fp) ; k
  slli t0, t0, 1
  lw t0, fxK(t0)
  sw t0, 0(fp) ; kind
  ; fx.e16.ts:166  const t = fxT[k]
  lw t0, 2(fp) ; k
  slli t0, t0, 1
  lw s1, fxT(t0)
  ; fx.e16.ts:167  const fx = 6 << 10
  ; fx.e16.ts:168  if (kind === K_POP) spr(x, y, (POP_TILE + div(t, 3) * 4) | (fxA[k] << 10), S16)
  li t0, 1
  lw t1, 0(fp) ; kind
  bne t1, t0, .L1
  ; fx.e16.ts:168  spr(x, y, (POP_TILE + div(t, 3) * 4) | (fxA[k] << 10), S16)
  li t0, 3
  divu t0, s1, t0
  slli t0, t0, 2
  lw t1, 2(fp) ; k
  slli t1, t1, 1
  lw t1, fxA(t1)
  slli t1, t1, 10
  addi t0, t0, 261
  or t0, t0, t1
  mv a0, s2
  mv a1, s3
  mv a2, t0
  li a3, 1
  call spr
  j .L2
.L1:
  ; fx.e16.ts:169  if (kind === K_DUST) spr(x, y, (FX_TILE + (t >> 2 > 3 ? 3 : t >> 2)) | fx, S8)
  li t0, 2
  lw t1, 0(fp) ; kind
  bne t1, t0, .L3
  ; fx.e16.ts:169  spr(x, y, (FX_TILE + (t >> 2 > 3 ? 3 : t >> 2)) | fx, S8)
  srli t0, s1, 2
  mv t1, s3
  li t2, 433
  mv t3, t0
  mv t0, s2
  li a1, 3
  bgeu a1, t3, .L4
  li t3, 3
  j .L5
.L4:
  srli t3, s1, 2
.L5:
  add t2, t2, t3
  ori t2, t2, 6144
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 0
  call spr
  j .L6
.L3:
  ; fx.e16.ts:170  if (kind === K_SPARK) spr(x, y, (FX_TILE + 4 + ((t >> 1) & 1)) | fx, S8)
  li t0, 3
  lw t1, 0(fp) ; kind
  bne t1, t0, .L7
  ; fx.e16.ts:170  spr(x, y, (FX_TILE + 4 + ((t >> 1) & 1)) | fx, S8)
  srli t0, s1, 1
  andi t0, t0, 1
  addi t0, t0, 437
  ori t0, t0, 6144
  mv a0, s2
  mv a1, s3
  mv a2, t0
  li a3, 0
  call spr
  j .L8
.L7:
  ; fx.e16.ts:171  if (kind === K_BUBBLE) spr(x, y, (FX_TILE + 6 + (t > 20 ? 1 : 0)) | fx, S8)
  li t0, 5
  lw t1, 0(fp) ; kind
  bne t1, t0, .L9
  ; fx.e16.ts:171  spr(x, y, (FX_TILE + 6 + (t > 20 ? 1 : 0)) | fx, S8)
  mv t0, s2
  mv t1, s3
  li t2, 439
  mv t3, s1
  li a1, 20
  bgeu a1, t3, .L10
  li t3, 1
  j .L11
.L10:
  li t3, 0
.L11:
  add t2, t2, t3
  ori t2, t2, 6144
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 0
  call spr
  j .L12
.L9:
  ; fx.e16.ts:172  if (kind === K_STAR) {
  li t0, 4
  lw t1, 0(fp) ; kind
  bne t1, t0, .L13
  ; fx.e16.ts:173  if (t < 20 || (t & 2) !== 0) spr(x, y, (FX_TILE + 8 + ((t >> 2) & 1)) | fx, S8)
  li t0, 20
  bltu s1, t0, .L15
  andi t0, s1, 2
  beq t0, zero, .L16
.L15:
  ; fx.e16.ts:173  spr(x, y, (FX_TILE + 8 + ((t >> 2) & 1)) | fx, S8)
  srli t0, s1, 2
  andi t0, t0, 1
  addi t0, t0, 441
  ori t0, t0, 6144
  mv a0, s2
  mv a1, s3
  mv a2, t0
  li a3, 0
  call spr
  j .L16
.L13:
  ; fx.e16.ts:174  if (t < 36 || (t & 2) !== 0) wordDraw(x, y, kind, fxA[k])
  li t0, 36
  bltu s1, t0, .L18
  andi t0, s1, 2
  beq t0, zero, .L17
.L18:
  ; fx.e16.ts:174  wordDraw(x, y, kind, fxA[k])
  lw t0, 2(fp) ; k
  slli t0, t0, 1
  lw t0, fxA(t0)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  mv a3, t0
  call wordDraw
.L17:
.L16:
.L12:
.L8:
.L6:
.L2:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fx.e16.ts:183 wordDraw(x, y, kind, n) at -O1
;   x in 10(fp)
;   y in s2
;   kind in 4(fp)
;   n in s3
;   digits in 0(fp)
;   width in 6(fp)
;   at in s1
;   d in 2(fp)
;   v in 8(fp)
;   gold.c in 12(fp)
wordDraw:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s1, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  sw a0, 10(fp) ; x
  mv s2, a1 ; y
  sw a2, 4(fp) ; kind
  mv s3, a3 ; n
  ; fx.e16.ts:184  const digits: u16 = n >= 1000 ? 4 : n >= 100 ? 3 : n >= 10 ? 2 : 1
  li t0, 1000
  bltu s3, t0, .L1
  li t0, 4
  j .L2
.L1:
  li t0, 100
  bltu s3, t0, .L3
  li t0, 3
  j .L4
.L3:
  li t0, 10
  bltu s3, t0, .L5
  li t0, 2
  j .L6
.L5:
  li t0, 1
.L6:
.L4:
.L2:
  sw t0, 0(fp) ; digits
  ; fx.e16.ts:185  const width: u16 = kind === K_CHAIN ? digits + 6 : digits + 1
  li t0, 6
  lw t1, 4(fp) ; kind
  bne t1, t0, .L7
  lw t0, 0(fp) ; digits
  addi t0, t0, 6
  j .L8
.L7:
  lw t0, 0(fp) ; digits
  addi t0, t0, 1
.L8:
  sw t0, 6(fp) ; width
  ; fx.e16.ts:186  let at = x - i16(width * 4)
  lw t0, 6(fp) ; width
  slli t0, t0, 2
  lw t1, 10(fp) ; x
  sub s1, t1, t0
  ; fx.e16.ts:187  if (at < 90) at = 90
  li t0, 90
  bge s1, t0, .L9
  ; fx.e16.ts:187  at = 90
  li s1, 90 ; at
.L9:
  ; fx.e16.ts:188  if (at + i16(width * 8) > 230) at = 230 - i16(width * 8)
  lw t0, 6(fp) ; width
  slli t0, t0, 3
  add t0, s1, t0
  li t1, 230
  bge t1, t0, .L10
  ; fx.e16.ts:188  at = 230 - i16(width * 8)
  lw t0, 6(fp) ; width
  slli t0, t0, 3
  li t1, 230
  sub s1, t1, t0
.L10:
  ; fx.e16.ts:189  if (kind === K_PLUS) {
  li t0, 7
  lw t1, 4(fp) ; kind
  bne t1, t0, .L11
  ; fx.e16.ts:190  spr(at, y, gold(43), S8)
  mv a0, s1
  mv a1, s2
  li a2, 7179
  li a3, 0
  call spr
  ; fx.e16.ts:191  at = at + 8
  addi s1, s1, 8
.L11:
  ; fx.e16.ts:193  let d = digits
  lw t0, 0(fp) ; digits
  sw t0, 2(fp) ; d
  ; fx.e16.ts:194  let v = n
  sw s3, 8(fp) ; v
  ; fx.e16.ts:195  while (d > 0) {
  j .L14
.L12:
  ; fx.e16.ts:196  d--
  lw t0, 2(fp) ; d
  addi t0, t0, -1
  sw t0, 2(fp) ; d
  ; fx.e16.ts:197  spr(at + i16(d * 8), y, gold(48 + (v % 10)), S8)
  lw t0, 2(fp) ; d
  slli t0, t0, 3
  add t0, s1, t0
  li t1, 10
  lw t2, 8(fp) ; v
  remu t2, t2, t1
  addi t2, t2, 48
  sw t2, 12(fp) ; gold.c
  ; fx.e16.ts:179  return (FONT_TILE + c - 32) | (7 << 10)
  lw t1, 12(fp) ; gold.c
  addi t1, t1, -32
  ori t1, t1, 7168
  mv a0, t0
  mv a1, s2
  mv a2, t1
  li a3, 0
  call spr
  ; fx.e16.ts:198  v = div(v, 10)
  li t0, 10
  lw t1, 8(fp) ; v
  divu t1, t1, t0
  sw t1, 8(fp) ; v
.L14:
  lw t0, 2(fp) ; d
  bltu zero, t0, .L12
  ; fx.e16.ts:200  if (kind !== K_CHAIN) return
  li t0, 6
  lw t1, 4(fp) ; kind
  beq t1, t0, .L16
  ; fx.e16.ts:200  return
  j .return
.L16:
  ; fx.e16.ts:201  at = at + i16(digits * 8) + 8
  lw t0, 0(fp) ; digits
  slli t0, t0, 3
  add t0, s1, t0
  addi s1, t0, 8
  ; fx.e16.ts:202  spr(at, y, gold(67), S8)
  mv a0, s1
  mv a1, s2
  li a2, 7203
  li a3, 0
  call spr
  ; fx.e16.ts:203  spr(at + 8, y, gold(72), S8)
  addi a0, s1, 8
  mv a1, s2
  li a2, 7208
  li a3, 0
  call spr
  ; fx.e16.ts:204  spr(at + 16, y, gold(65), S8)
  addi a0, s1, 16
  mv a1, s2
  li a2, 7201
  li a3, 0
  call spr
  ; fx.e16.ts:205  spr(at + 24, y, gold(73), S8)
  addi a0, s1, 24
  mv a1, s2
  li a2, 7209
  li a3, 0
  call spr
  ; fx.e16.ts:206  spr(at + 32, y, gold(78), S8)
  addi a0, s1, 32
  mv a1, s2
  li a2, 7214
  li a3, 0
  call spr
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s1, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; panel.e16.ts:22 hudLabels() at -O1
hudLabels:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; panel.e16.ts:23  say(1, 1, str('DEPTH'), W_GOLD)
  li a0, 1
  li a1, 1
  la a2, str_27
  li a3, 6
  call say
  ; panel.e16.ts:24  say(1, 6, str('STRATUM'), W_GOLD)
  li a0, 1
  li a1, 6
  la a2, str_28
  li a3, 6
  call say
  ; panel.e16.ts:25  say(1, 9, str('SCORE'), W_GOLD)
  li a0, 1
  li a1, 9
  la a2, str_29
  li a3, 6
  call say
  ; panel.e16.ts:26  say(1, 12, str('BEST'), W_GOLD)
  li a0, 1
  li a1, 12
  la a2, str_30
  li a3, 6
  call say
  ; panel.e16.ts:27  say(6, 16, str('0'), W_WHITE)
  li a0, 6
  li a1, 16
  la a2, str_31
  li a3, 7
  call say
  ; panel.e16.ts:28  say(6, 19, str('100'), W_WHITE)
  li a0, 6
  li a1, 19
  la a2, str_32
  li a3, 7
  call say
  ; panel.e16.ts:29  say(6, 22, str('200'), W_WHITE)
  li a0, 6
  li a1, 22
  la a2, str_33
  li a3, 7
  call say
  ; panel.e16.ts:30  say(6, 25, str('300'), W_WHITE)
  li a0, 6
  li a1, 25
  la a2, str_34
  li a3, 7
  call say
  ; panel.e16.ts:31  say(6, 28, str('400'), W_WHITE)
  li a0, 6
  li a1, 28
  la a2, str_35
  li a3, 7
  call say
  ; panel.e16.ts:32  say(6, 31, str('500'), W_GOLD)
  li a0, 6
  li a1, 31
  la a2, str_36
  li a3, 6
  call say
  ; panel.e16.ts:33  say(30, 1, str('AIR'), W_GOLD)
  li a0, 30
  li a1, 1
  la a2, str_37
  li a3, 6
  call say
  ; panel.e16.ts:34  say(31, 20, str('DRILLERS'), W_GOLD)
  li a0, 31
  li a1, 20
  la a2, str_38
  li a3, 6
  call say
  ; panel.e16.ts:35  say(31, 23, str('CHAIN'), W_GOLD)
  li a0, 31
  li a1, 23
  la a2, str_39
  li a3, 6
  call say
  ; panel.e16.ts:36  say(31, 26, str('CAPSULES'), W_GOLD)
  li a0, 31
  li a1, 26
  la a2, str_40
  li a3, 6
  call say
  ; panel.e16.ts:37  shownDepth = 0xffff
  li t0, 65535
  sw t0, 0x1f86(zero)
  ; panel.e16.ts:38  shownAir = 0xffff
  li t0, 65535
  sw t0, 0x1f88(zero)
  ; panel.e16.ts:39  shownLives = 0xffff
  li t0, 65535
  sw t0, 0x1f8a(zero)
  ; panel.e16.ts:40  shownChain = 0xffff
  li t0, 65535
  sw t0, 0x1f8c(zero)
  ; panel.e16.ts:41  shownCaps = 0xffff
  li t0, 65535
  sw t0, 0x1f8e(zero)
  ; panel.e16.ts:42  shownScore = 0xffff
  li t0, 65535
  sw t0, 0x1f90(zero)
  ; panel.e16.ts:43  shownBest = 0xffff
  li t0, 65535
  sw t0, 0x1f92(zero)
  ; panel.e16.ts:44  shownStratum = 0xffff
  li t0, 65535
  sw t0, 0x1f94(zero)
  ; panel.e16.ts:45  shownLow = 0xffff
  li t0, 65535
  sw t0, 0x1f96(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; panel.e16.ts:49 hudStep(depth, air, lives, frame) at -O1
;   depth in s2
;   air in 0(fp)
;   lives in s3
;   frame in 2(fp)
;   k in s1
hudStep:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; depth
  sw a1, 0(fp) ; air
  mv s3, a2 ; lives
  sw a3, 2(fp) ; frame
  ; panel.e16.ts:50  if (depth !== shownDepth) {
  lw t0, 0x1f86(zero)
  beq s2, t0, .L1
  ; panel.e16.ts:51  shownDepth = depth
  sw s2, 0x1f86(zero)
  ; panel.e16.ts:52  bigDepth(depth)
  mv a0, s2
  call bigDepth
  ; panel.e16.ts:53  gauge(depth)
  mv a0, s2
  call gauge
.L1:
  ; panel.e16.ts:55  airShow(air, frame)
  lw a0, 0(fp)
  lw a1, 2(fp)
  call airShow
  ; panel.e16.ts:56  if (lives !== shownLives) {
  lw t0, 0x1f8a(zero)
  beq s3, t0, .L2
  ; panel.e16.ts:57  shownLives = lives
  sw s3, 0x1f8a(zero)
  ; panel.e16.ts:58  let k: u16 = 0
  li s1, 0 ; k
  ; panel.e16.ts:59  while (k < 8) {
  j .L5
.L3:
  ; panel.e16.ts:60  vpoke(cellAt(1, 31 + k, 21), (ICONS_TILE + (k < lives ? 0 : 1)) | (SL_PANEL << 10) | 0x8000)
  li a0, 1
  addi a1, s1, 31
  li a2, 21
  call cellAt
  mv t0, a0
  li t1, 142
  mv t2, s1
  mv t3, s3
  bgeu t2, t3, .L7
  li t2, 0
  j .L8
.L7:
  li t2, 1
.L8:
  add t1, t1, t2
  ori t1, t1, 7168
  li t2, 32768
  or t1, t1, t2
  mv a0, t0
  mv a1, t1
  call vpoke
  ; panel.e16.ts:61  k++
  addi s1, s1, 1
.L5:
  li t0, 8
  bltu s1, t0, .L3
.L2:
  ; panel.e16.ts:64  scoreLine()
  call scoreLine
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; panel.e16.ts:68 airShow(air, frame) at -O1
;   air in s1
;   frame in s0
;   low in s2
;   warn in s3
airShow:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; air
  mv s0, a1 ; frame
  ; panel.e16.ts:69  const low: u16 = air <= 25 && (frame & 16) !== 0 ? 1 : 0
  li t0, 25
  bltu t0, s1, .L1
  andi t0, s0, 16
  beq t0, zero, .L1
  li t0, 1
  j .L2
.L1:
  li t0, 0
.L2:
  mv s2, t0 ; low
  ; panel.e16.ts:70  if (air === shownAir && low === shownLow) return
  lw t0, 0x1f88(zero)
  bne s1, t0, .L3
  lw t0, 0x1f96(zero)
  bne s2, t0, .L3
  ; panel.e16.ts:70  return
  j .return
.L3:
  ; panel.e16.ts:71  shownAir = air
  sw s1, 0x1f88(zero)
  ; panel.e16.ts:72  shownLow = low
  sw s2, 0x1f96(zero)
  ; panel.e16.ts:73  tank(air)
  mv a0, s1
  call tank
  ; panel.e16.ts:74  const warn = air <= 25
  li t0, 25
  sltu t0, t0, s1
  xori s3, t0, 1
  ; panel.e16.ts:75  figure(cellAt(1, 32, 18), air, 3, warn && low === 0 ? W_RED : W_WHITE)
  li t0, 43328
  mv t1, s1
  li t2, 3
  mv t3, s3
  beqz t3, .L4
  mv t3, s2
  li a1, 0
  bne t3, a1, .L4
  li t3, 1
  j .L5
.L4:
  li t3, 7
.L5:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call figure
  ; panel.e16.ts:76  vpoke(cellAt(1, 36, 18), glyph(37, warn ? W_RED : W_WHITE))
  li t0, 43336
  li t1, 37
  mv t2, s3
  beqz t2, .L6
  li t2, 1
  j .L7
.L6:
  li t2, 7
.L7:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  mv a1, t2
  call glyph
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call vpoke
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; panel.e16.ts:80 hudCounts(chain, caps) at -O1
;   chain in s1
;   caps in s2
hudCounts:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; chain
  mv s2, a1 ; caps
  ; panel.e16.ts:81  if (chain !== shownChain) {
  lw t0, 0x1f8c(zero)
  beq s1, t0, .L1
  ; panel.e16.ts:82  shownChain = chain
  sw s1, 0x1f8c(zero)
  ; panel.e16.ts:83  figure(cellAt(1, 31, 24), chain, 4, W_GOLD)
  li a0, 44094
  mv a1, s1
  li a2, 4
  li a3, 6
  call figure
.L1:
  ; panel.e16.ts:85  if (caps !== shownCaps) {
  lw t0, 0x1f8e(zero)
  beq s2, t0, .L2
  ; panel.e16.ts:86  shownCaps = caps
  sw s2, 0x1f8e(zero)
  ; panel.e16.ts:87  figure(cellAt(1, 31, 27), caps, 4, W_WHITE)
  li a0, 44478
  mv a1, s2
  li a2, 4
  li a3, 7
  call figure
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; panel.e16.ts:92 scoreLine() at -O1
;   key in s1
;   bkey in s2
scoreLine:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; panel.e16.ts:93  const key = score[0] ^ (score[1] << 3)
  lw t0, score(zero)
  lw t1, score+2(zero)
  slli t1, t1, 3
  xor s1, t0, t1
  ; panel.e16.ts:94  if (key !== shownScore) {
  lw t0, 0x1f90(zero)
  beq s1, t0, .L1
  ; panel.e16.ts:95  shownScore = key
  sw s1, 0x1f90(zero)
  ; panel.e16.ts:96  scoreShow(cellAt(1, 1, 10), addr(score), (FONT_TILE + 16) | (W_WHITE << 10) | 0x8000)
  li a0, 42242
  la a1, score
  li a2, 39952
  call scoreShow
.L1:
  ; panel.e16.ts:98  const bkey = best[0] ^ (best[1] << 3)
  lw t0, best(zero)
  lw t1, best+2(zero)
  slli t1, t1, 3
  xor s2, t0, t1
  ; panel.e16.ts:99  if (bkey !== shownBest) {
  lw t0, 0x1f92(zero)
  beq s2, t0, .L2
  ; panel.e16.ts:100  shownBest = bkey
  sw s2, 0x1f92(zero)
  ; panel.e16.ts:101  scoreShow(cellAt(1, 1, 13), addr(best), (FONT_TILE + 16) | (W_GOLD << 10) | 0x8000)
  li a0, 42626
  la a1, best
  li a2, 38928
  call scoreShow
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; panel.e16.ts:106 stratumShow(s) at -O1
;   s in s1
;   name in s2
stratumShow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; s
  ; panel.e16.ts:107  if (s === shownStratum) return
  lw t0, 0x1f94(zero)
  bne s1, t0, .L1
  ; panel.e16.ts:107  return
  j .return
.L1:
  ; panel.e16.ts:108  shownStratum = s
  sw s1, 0x1f94(zero)
  ; panel.e16.ts:109  unsay(1, 7, 8)
  li a0, 1
  li a1, 7
  li a2, 8
  call unsay
  ; panel.e16.ts:110  if (s < 5) vpoke(cellAt(1, 1, 7), glyph(49 + s, W_GOLD))
  li t0, 5
  bgeu s1, t0, .L2
  ; panel.e16.ts:110  vpoke(cellAt(1, 1, 7), glyph(49 + s, W_GOLD))
  addi a0, s1, 49
  li a1, 6
  call glyph
  mv a1, a0
  li a0, 41858
  call vpoke
.L2:
  ; panel.e16.ts:111  let name = str('LOAM')
  la s2, str_41
  ; panel.e16.ts:112  if (s === 1) name = str('CLAY')
  li t0, 1
  bne s1, t0, .L3
  ; panel.e16.ts:112  name = str('CLAY')
  la s2, str_42
  j .L4
.L3:
  ; panel.e16.ts:113  if (s === 2) name = str('SLATE')
  li t0, 2
  bne s1, t0, .L5
  ; panel.e16.ts:113  name = str('SLATE')
  la s2, str_43
  j .L6
.L5:
  ; panel.e16.ts:114  if (s === 3) name = str('MAGMA')
  li t0, 3
  bne s1, t0, .L7
  ; panel.e16.ts:114  name = str('MAGMA')
  la s2, str_44
  j .L8
.L7:
  ; panel.e16.ts:115  if (s === 4) name = str('GEODE')
  li t0, 4
  bne s1, t0, .L9
  ; panel.e16.ts:115  name = str('GEODE')
  la s2, str_45
  j .L10
.L9:
  ; panel.e16.ts:116  if (s >= 5) name = str('CORE')
  li t0, 5
  bltu s1, t0, .L11
  ; panel.e16.ts:116  name = str('CORE')
  la s2, str_46
.L11:
.L10:
.L8:
.L6:
.L4:
  ; panel.e16.ts:117  say(3, 7, name, W_WHITE)
  li a0, 3
  li a1, 7
  mv a2, s2
  li a3, 7
  call say
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; panel.e16.ts:121 bigDepth(depth) at -O1
;   depth in s3
;   v in s2
;   k in s1
bigDepth:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; depth
  ; panel.e16.ts:122  let v = depth
  mv s2, s3 ; v
  ; panel.e16.ts:123  let k: u16 = 0
  li s1, 0 ; k
  ; panel.e16.ts:124  while (k < 3) {
  j .L3
.L1:
  ; panel.e16.ts:125  bigDigit(5 - k * 2, v % 10)
  slli t0, s1, 1
  li t1, 5
  sub t1, t1, t0
  li t0, 10
  remu t0, s2, t0
  mv a0, t1
  mv a1, t0
  call bigDigit
  ; panel.e16.ts:126  v = div(v, 10)
  li t0, 10
  divu s2, s2, t0
  ; panel.e16.ts:127  k++
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
  ; panel.e16.ts:129  vpoke(cellAt(1, 7, 4), glyph(77, W_WHITE))
  li a0, 41486
  li a1, 39981
  call vpoke
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; panel.e16.ts:132 bigDigit(x, d) at -O1
;   x in s2
;   d in s3
;   t in s0
;   k in s1
bigDigit:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; x
  mv s3, a1 ; d
  ; panel.e16.ts:133  const t = DIGITS_TILE + d * 6
  slli t1, s3, 2
  slli t0, s3, 1
  add t0, t0, t1
  addi s0, t0, 64
  ; panel.e16.ts:134  let k: u16 = 0
  li s1, 0 ; k
  ; panel.e16.ts:135  while (k < 6) {
  j .L3
.L1:
  ; panel.e16.ts:136  vpoke(cellAt(1, x + (k & 1), 2 + (k >> 1)), (t + k) | (SL_PANEL << 10) | 0x8000)
  andi t0, s1, 1
  add t0, s2, t0
  srli t1, s1, 1
  li a0, 1
  mv a1, t0
  addi a2, t1, 2
  call cellAt
  add t0, s0, s1
  ori t0, t0, 7168
  li t1, 32768
  or a1, t0, t1
  call vpoke
  ; panel.e16.ts:137  k++
  addi s1, s1, 1
.L3:
  li t0, 6
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; panel.e16.ts:142 gauge(depth) at -O1
;   depth in s3
;   at in s2
;   k in s1
;   t in s0
gauge:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  mv s3, a0 ; depth
  ; panel.e16.ts:143  let at = div(depth * 3, 100)
  slli t1, s3, 1
  add t0, t1, s3
  li t1, 100
  divu s2, t0, t1
  ; panel.e16.ts:144  if (at > 14) at = 14
  li t0, 14
  bgeu t0, s2, .L1
  ; panel.e16.ts:144  at = 14
  li s2, 14 ; at
.L1:
  ; panel.e16.ts:145  let k: u16 = 0
  li s1, 0 ; k
  ; panel.e16.ts:146  while (k < 15) {
  j .L4
.L2:
  ; panel.e16.ts:147  const t: u16 = k < at ? 4 : k === at ? 2 : 3
  bgeu s1, s2, .L6
  li t0, 4
  j .L7
.L6:
  bne s1, s2, .L8
  li t0, 2
  j .L9
.L8:
  li t0, 3
.L9:
.L7:
  mv s0, t0 ; t
  ; panel.e16.ts:148  vpoke(cellAt(1, 4, 16 + k), (ICONS_TILE + t) | (SL_PANEL << 10) | 0x8000)
  li a0, 1
  li a1, 4
  addi a2, s1, 16
  call cellAt
  addi t0, s0, 142
  ori t0, t0, 7168
  li t1, 32768
  or a1, t0, t1
  call vpoke
  ; panel.e16.ts:149  k++
  addi s1, s1, 1
.L4:
  li t0, 15
  bltu s1, t0, .L2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; panel.e16.ts:154 tank(air) at -O1
;   air in 4(fp)
;   level in s3
;   k in s1
;   bottom in 0(fp)
;   f in s2
;   y in 2(fp)
tank:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 4(fp) ; air
  ; panel.e16.ts:155  const level = div(air * 112, 100)
  li t0, 112
  lw t1, 4(fp) ; air
  mul t1, t1, t0
  li t0, 100
  divu s3, t1, t0
  ; panel.e16.ts:156  let k: u16 = 0
  li s1, 0 ; k
  ; panel.e16.ts:157  while (k < 14) {
  j .L3
.L1:
  ; panel.e16.ts:158  const bottom = k * 8
  slli t0, s1, 3
  sw t0, 0(fp) ; bottom
  ; panel.e16.ts:159  let f: u16 = 0
  li s2, 0 ; f
  ; panel.e16.ts:160  if (level >= bottom + 8) f = 8
  lw t0, 0(fp) ; bottom
  addi t0, t0, 8
  bltu s3, t0, .L5
  ; panel.e16.ts:160  f = 8
  li s2, 8 ; f
  j .L6
.L5:
  ; panel.e16.ts:161  if (level > bottom) f = level - bottom
  lw t0, 0(fp) ; bottom
  bgeu t0, s3, .L7
  ; panel.e16.ts:161  f = level - bottom
  lw t0, 0(fp) ; bottom
  sub s2, s3, t0
.L7:
.L6:
  ; panel.e16.ts:162  const y = 16 - k
  li t0, 16
  sub t0, t0, s1
  sw t0, 2(fp) ; y
  ; panel.e16.ts:163  vpoke(cellAt(1, 34, y), (TANK_TILE + f * 2) | (SL_PANEL << 10) | 0x8000)
  li a0, 1
  li a1, 34
  lw a2, 2(fp)
  call cellAt
  slli t0, s2, 1
  addi t0, t0, 124
  ori t0, t0, 7168
  li t1, 32768
  or a1, t0, t1
  call vpoke
  ; panel.e16.ts:164  vpoke(cellAt(1, 35, y), (TANK_TILE + f * 2 + 1) | (SL_PANEL << 10) | 0x8000)
  li a0, 1
  li a1, 35
  lw a2, 2(fp)
  call cellAt
  slli t0, s2, 1
  addi t0, t0, 125
  ori t0, t0, 7168
  li t1, 32768
  or a1, t0, t1
  call vpoke
  ; panel.e16.ts:165  k++
  addi s1, s1, 1
.L3:
  li t0, 14
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

str_27:
  .byte 68, 69, 80, 84, 72, 0
str_28:
  .byte 83, 84, 82, 65, 84, 85, 77, 0
str_29:
  .byte 83, 67, 79, 82, 69, 0
str_30:
  .byte 66, 69, 83, 84, 0
str_31:
  .byte 48, 0
str_32:
  .byte 49, 48, 48, 0
str_33:
  .byte 50, 48, 48, 0
str_34:
  .byte 51, 48, 48, 0
str_35:
  .byte 52, 48, 48, 0
str_36:
  .byte 53, 48, 48, 0
str_37:
  .byte 65, 73, 82, 0
str_38:
  .byte 68, 82, 73, 76, 76, 69, 82, 83, 0
str_39:
  .byte 67, 72, 65, 73, 78, 0
str_40:
  .byte 67, 65, 80, 83, 85, 76, 69, 83, 0
str_41:
  .byte 76, 79, 65, 77, 0
str_42:
  .byte 67, 76, 65, 89, 0
str_43:
  .byte 83, 76, 65, 84, 69, 0
str_44:
  .byte 77, 65, 71, 77, 65, 0
str_45:
  .byte 71, 69, 79, 68, 69, 0
str_46:
  .byte 67, 79, 82, 69, 0
  .align 2
