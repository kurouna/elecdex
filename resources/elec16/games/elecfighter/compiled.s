; Made by e16c from lib/kit.e16.ts, lib/sound.e16.ts, engine/main.e16.ts, engine/data.e16.ts, engine/input.e16.ts, engine/fighter.e16.ts, engine/hit.e16.ts, engine/draw.e16.ts, scenes/match.e16.ts, cpu/ai.e16.ts, cpu/habit.e16.ts, scenes/pause.e16.ts, engine/look.e16.ts, engine/audio.e16.ts, scenes/title.e16.ts, scenes/select.e16.ts, scenes/result.e16.ts, assets.e16.ts: do not edit.

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
; screen at 0x0ca6
; seenN at 0x0ea8
; liveN at 0x0eaa
; stageNow at 0x153e
; groundY at 0x1540
; lineBack at 0x176a
; scrollCam at 0x176c
; scrollMade at 0x176e
; scrollTop at 0x1770
; buttonSet at 0x181c
; ringAt at 0x189e
; hitstop at 0x1990
; camX at 0x1996
; bandAt at 0x1998
; timeShown at 0x19ae
; logT at 0x19b8
; round at 0x19ba
; draws at 0x19c0
; outcome at 0x19c2
; ladderAt at 0x19d2
; ladderEnd at 0x19d4
; continues at 0x19d6
; clearSec at 0x19d8
; clearT at 0x19da
; soundPhase at 0x1e62
; soundTime at 0x1e64
; songNow at 0x1ecc
; menuOn at 0x1fee
; menuAt at 0x1ff0
; streak at 0x1ffa
; contN at 0x1ffe
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
seenS = 0x0ca8 ; 128 bytes
seenF = 0x0d28 ; 128 bytes
seenX = 0x0da8 ; 128 bytes
seenY = 0x0e28 ; 128 bytes
seenL = 0x0eac ; 64 bytes
slMovesB = 0x0eec ; 8 bytes
slMovesA = 0x0ef4 ; 8 bytes
slPosesB = 0x0efc ; 8 bytes
slPosesA = 0x0f04 ; 8 bytes
slProfB = 0x0f0c ; 8 bytes
slProfA = 0x0f14 ; 8 bytes
slName = 0x0f1c ; 8 bytes
slArtB = 0x0f24 ; 8 bytes
slArtA = 0x0f2c ; 8 bytes
slCellsB = 0x0f34 ; 8 bytes
mv = 0x0f3c ; 832 bytes
pr = 0x127c ; 64 bytes
bx = 0x12bc ; 96 bytes
boxPose = 0x131c ; 4 bytes
reach = 0x1320 ; 52 bytes
art = 0x1354 ; 136 bytes
artWant = 0x13dc ; 4 bytes
artHold = 0x13e0 ; 4 bytes
artPic = 0x13e4 ; 4 bytes
stTile = 0x13e8 ; 2 bytes
stTilesB = 0x13ea ; 2 bytes
stTilesA = 0x13ec ; 2 bytes
stTilesN = 0x13ee ; 2 bytes
stMapB = 0x13f0 ; 2 bytes
stRows = 0x13f2 ; 2 bytes
stDataB = 0x13f4 ; 2 bytes
stDataA = 0x13f6 ; 2 bytes
stageWords = 0x13f8 ; 326 bytes
bandNext = 0x1542 ; 72 bytes
lineTab = 0x158a ; 480 bytes
opp = 0x1772 ; 128 bytes
wrow = 0x17f2 ; 20 bytes
oppName = 0x1806 ; 10 bytes
ctl = 0x1810 ; 4 bytes
extHeld = 0x1814 ; 4 bytes
lastHeld = 0x1818 ; 4 bytes
ringH = 0x181e ; 64 bytes
ringD = 0x185e ; 64 bytes
fX = 0x18a0 ; 4 bytes
fY = 0x18a4 ; 4 bytes
fZ = 0x18a8 ; 4 bytes
fVX = 0x18ac ; 4 bytes
fVY = 0x18b0 ; 4 bytes
fVZ = 0x18b4 ; 4 bytes
fFace = 0x18b8 ; 4 bytes
fState = 0x18bc ; 4 bytes
fStateT = 0x18c0 ; 4 bytes
fLife = 0x18c4 ; 4 bytes
fMove = 0x18c8 ; 4 bytes
fMoveF = 0x18cc ; 4 bytes
fHitDone = 0x18d0 ; 4 bytes
fCombo = 0x18d4 ; 4 bytes
fComboMax = 0x18d8 ; 4 bytes
fStun = 0x18dc ; 4 bytes
fCrouch = 0x18e0 ; 4 bytes
fAir = 0x18e4 ; 4 bytes
fAirUsed = 0x18e8 ; 4 bytes
fKnock = 0x18ec ; 4 bytes
fJump = 0x18f0 ; 4 bytes
fThrowInv = 0x18f4 ; 4 bytes
fThrowBack = 0x18f8 ; 4 bytes
fPush = 0x18fc ; 4 bytes
fSlot = 0x1900 ; 4 bytes
fPose = 0x1904 ; 4 bytes
fWin = 0x1908 ; 4 bytes
fBreath = 0x190c ; 4 bytes
fRowT = 0x1910 ; 4 bytes
fRowWas = 0x1914 ; 4 bytes
was = 0x1918 ; 4 bytes
before = 0x191c ; 4 bytes
wb = 0x1920 ; 96 bytes
how = 0x1980 ; 4 bytes
moveOf = 0x1984 ; 4 bytes
struck = 0x1988 ; 4 bytes
dealt = 0x198c ; 4 bytes
threw = 0x1992 ; 4 bytes
trail = 0x199a ; 4 bytes
trailT = 0x199e ; 4 bytes
shownLife = 0x19a2 ; 4 bytes
shownTrail = 0x19a6 ; 4 bytes
lowShown = 0x19aa ; 4 bytes
logOff = 0x19b0 ; 2 bytes
logWait = 0x19b2 ; 6 bytes
wins = 0x19bc ; 4 bytes
choice = 0x19c4 ; 6 bytes
ladder = 0x19ca ; 8 bytes
plan = 0x19dc ; 4 bytes
planT = 0x19e0 ; 4 bytes
planStep = 0x19e4 ; 4 bytes
planB = 0x19e8 ; 4 bytes
thinkT = 0x19ec ; 4 bytes
outWas = 0x19f0 ; 4 bytes
gId = 0x19f4 ; 4 bytes
gHold = 0x19f8 ; 4 bytes
aaArm = 0x19fc ; 4 bytes
punId = 0x1a00 ; 4 bytes
punMove = 0x1a04 ; 4 bytes
punArm = 0x1a08 ; 4 bytes
swing = 0x1a0c ; 4 bytes
swingId = 0x1a10 ; 4 bytes
swA = 0x1a14 ; 4 bytes
swB = 0x1a18 ; 4 bytes
fwdUp = 0x1a1c ; 4 bytes
tapT = 0x1a20 ; 4 bytes
punishes = 0x1a24 ; 4 bytes
minusT = 0x1a28 ; 4 bytes
techArm = 0x1a2c ; 4 bytes
chainArm = 0x1a30 ; 4 bytes
prevState = 0x1a34 ; 4 bytes
lastML = 0x1a38 ; 4 bytes
patNo = 0x1a3c ; 4 bytes
patStep = 0x1a40 ; 4 bytes
patGap = 0x1a44 ; 4 bytes
habitDue = 0x1a48 ; 4 bytes
whims = 0x1a4c ; 4 bytes
seenLate = 0x1a50 ; 4 bytes
thD = 0x1a54 ; 32 bytes
punD = 0x1a74 ; 128 bytes
bw = 0x1af4 ; 40 bytes
otherHalf = 0x1b1c ; 4 bytes
hab = 0x1b20 ; 100 bytes
habSeen = 0x1b84 ; 20 bytes
watchSit = 0x1b98 ; 4 bytes
watchT = 0x1b9c ; 4 bytes
rest = 0x1ba0 ; 4 bytes
backT = 0x1ba4 ; 4 bytes
wasGuarded = 0x1ba8 ; 4 bytes
airStruck = 0x1bac ; 4 bytes
readOn = 0x1bb0 ; 4 bytes
readPred = 0x1bb4 ; 4 bytes
reads = 0x1bb8 ; 4 bytes
readHits = 0x1bbc ; 4 bytes
readMiss = 0x1bc0 ; 4 bytes
habCount = 0x1bc4 ; 4 bytes
habTarget = 0x1bc8 ; 4 bytes
habLast = 0x1bcc ; 4 bytes
habDue = 0x1bd0 ; 4 bytes
habFired = 0x1bd4 ; 4 bytes
habDrawn = 0x1bd8 ; 64 bytes
habDrawnN = 0x1c18 ; 4 bytes
hist = 0x1c1c ; 32 bytes
paused = 0x1c3c ; 2 bytes
fxK = 0x1c3e ; 4 bytes
fxT = 0x1c42 ; 4 bytes
fxX = 0x1c46 ; 4 bytes
fxY = 0x1c4a ; 4 bytes
flashT = 0x1c4e ; 4 bytes
guardT = 0x1c52 ; 4 bytes
hitsN = 0x1c56 ; 4 bytes
shOn = 0x1c5a ; 4 bytes
shX = 0x1c5e ; 128 bytes
shY = 0x1cde ; 128 bytes
shVX = 0x1d5e ; 128 bytes
shVY = 0x1dde ; 128 bytes
palKey = 0x1e5e ; 4 bytes
soundSt = 0x1e66 ; 4 bytes
soundF = 0x1e6a ; 4 bytes
fxSong = 0x1e6e ; 64 bytes
songs = 0x1eae ; 28 bytes
sfxHeard = 0x1eca ; 2 bytes
fig = 0x1ece ; 272 bytes
figTile = 0x1fde ; 8 bytes
figStep = 0x1fe6 ; 8 bytes
bars = 0x1ff2 ; 8 bytes
newRecord = 0x1ffc ; 2 bytes

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
  ; screen = 0
  sw zero, 0x0ca6(zero)
  ; seenN = 0
  sw zero, 0x0ea8(zero)
  ; liveN = 0
  sw zero, 0x0eaa(zero)
  ; stageNow = 0
  sw zero, 0x153e(zero)
  ; groundY = 244
  li t0, 244
  sw t0, 0x1540(zero)
  ; lineBack = 0
  sw zero, 0x176a(zero)
  ; scrollCam = 65535
  li t0, 65535
  sw t0, 0x176c(zero)
  ; scrollMade = 0
  sw zero, 0x176e(zero)
  ; scrollTop = 0
  sw zero, 0x1770(zero)
  ; buttonSet = 0
  sw zero, 0x181c(zero)
  ; ringAt = 0
  sw zero, 0x189e(zero)
  ; hitstop = 0
  sw zero, 0x1990(zero)
  ; camX = 0
  sw zero, 0x1996(zero)
  ; bandAt = 13
  li t0, 13
  sw t0, 0x1998(zero)
  ; timeShown = 65535
  li t0, 65535
  sw t0, 0x19ae(zero)
  ; logT = 65535
  li t0, 65535
  sw t0, 0x19b8(zero)
  ; round = 1
  li t0, 1
  sw t0, 0x19ba(zero)
  ; draws = 0
  sw zero, 0x19c0(zero)
  ; outcome = 0
  sw zero, 0x19c2(zero)
  ; ladderAt = 0
  sw zero, 0x19d2(zero)
  ; ladderEnd = 0
  sw zero, 0x19d4(zero)
  ; continues = 0
  sw zero, 0x19d6(zero)
  ; clearSec = 0
  sw zero, 0x19d8(zero)
  ; clearT = 0
  sw zero, 0x19da(zero)
  ; soundPhase = 65535
  li t0, 65535
  sw t0, 0x1e62(zero)
  ; soundTime = 0
  sw zero, 0x1e64(zero)
  ; songNow = 0
  sw zero, 0x1ecc(zero)
  ; menuOn = 0
  sw zero, 0x1fee(zero)
  ; menuAt = 0
  sw zero, 0x1ff0(zero)
  ; streak = 0
  sw zero, 0x1ffa(zero)
  ; contN = 0
  sw zero, 0x1ffe(zero)
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
  ; cpuHeld: 4 bytes of 0
  li t0, 0x0ca2
  li t1, 4
  mset t0, zero, t1
  ; seenS, seenF, seenX, seenY: 512 bytes of 0
  li t0, 0x0ca8
  li t1, 512
  mset t0, zero, t1
  ; seenL, slMovesB, slMovesA, slPosesB, slPosesA, slProfB, slProfA, slName, slArtB, slArtA, slCellsB, mv, pr, bx, boxPose, reach, art, artWant, artHold, artPic, stTile, stTilesB, stTilesA, stTilesN, stMapB, stRows, stDataB, stDataA, stageWords: 1682 bytes of 0
  li t0, 0x0eac
  li t1, 1682
  mset t0, zero, t1
  ; bandNext, lineTab: 552 bytes of 0
  li t0, 0x1542
  li t1, 552
  mset t0, zero, t1
  ; opp, wrow, oppName, ctl, extHeld, lastHeld: 170 bytes of 0
  li t0, 0x1772
  li t1, 170
  mset t0, zero, t1
  ; ringH, ringD: 128 bytes of 0
  li t0, 0x181e
  li t1, 128
  mset t0, zero, t1
  ; fX, fY, fZ, fVX, fVY, fVZ, fFace, fState, fStateT, fLife, fMove, fMoveF, fHitDone, fCombo, fComboMax, fStun, fCrouch, fAir, fAirUsed, fKnock, fJump, fThrowInv, fThrowBack, fPush, fSlot, fPose, fWin, fBreath, fRowT, fRowWas, was, before, wb, how, moveOf, struck, dealt: 240 bytes of 0
  li t0, 0x18a0
  li t1, 240
  mset t0, zero, t1
  ; threw: 4 bytes of 0
  li t0, 0x1992
  li t1, 4
  mset t0, zero, t1
  ; trail, trailT, shownLife, shownTrail, lowShown: 20 bytes of 0
  li t0, 0x199a
  li t1, 20
  mset t0, zero, t1
  ; logOff, logWait: 8 bytes of 0
  li t0, 0x19b0
  li t1, 8
  mset t0, zero, t1
  ; wins: 4 bytes of 0
  li t0, 0x19bc
  li t1, 4
  mset t0, zero, t1
  ; choice, ladder: 14 bytes of 0
  li t0, 0x19c4
  li t1, 14
  mset t0, zero, t1
  ; plan, planT, planStep, planB, thinkT, outWas, gId, gHold, aaArm, punId, punMove, punArm, swing, swingId, swA, swB, fwdUp, tapT, punishes, minusT, techArm, chainArm, prevState, lastML, patNo, patStep, patGap, habitDue, whims, seenLate, thD, punD, bw, otherHalf, hab, habSeen, watchSit, watchT, rest, backT, wasGuarded, airStruck, readOn, readPred, reads, readHits, readMiss, habCount, habTarget, habLast, habDue, habFired, habDrawn, habDrawnN, hist, paused, fxK, fxT, fxX, fxY, flashT, guardT, hitsN, shOn, shX, shY, shVX, shVY, palKey: 1158 bytes of 0
  li t0, 0x19dc
  li t1, 1158
  mset t0, zero, t1
  ; soundSt, soundF, fxSong, songs, sfxHeard: 102 bytes of 0
  li t0, 0x1e66
  li t1, 102
  mset t0, zero, t1
  ; fig, figTile, figStep: 288 bytes of 0
  li t0, 0x1ece
  li t1, 288
  mset t0, zero, t1
  ; bars: 8 bytes of 0
  li t0, 0x1ff2
  li t1, 8
  mset t0, zero, t1
  ; newRecord: 2 bytes of 0
  li t0, 0x1ffc
  li t1, 2
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
  li a0, 265
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
  li a0, 265
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
  li a0, 265
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

; engine/main.e16.ts:157 screenIs(sc) at -O1
;   sc in a0
screenIs:
  ; engine/main.e16.ts:158  screen = sc
  sw a0, 0x0ca6(zero)
.return:
  ret

; engine/main.e16.ts:161 main() at -O1
main:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:162  kitInit()
  call kitInit
  ; engine/main.e16.ts:163  soundInit()
  call soundInit
  ; engine/main.e16.ts:164  screenOn()
  call screenOn
  ; engine/main.e16.ts:165  palettesIn()
  call palettesIn
  ; engine/main.e16.ts:166  tilesIn()
  call tilesIn
  ; engine/main.e16.ts:167  slotsIn()
  call slotsIn
  ; engine/main.e16.ts:168  stagesIn()
  call stagesIn
  ; engine/main.e16.ts:169  oppNamesIn()
  call oppNamesIn
  ; engine/main.e16.ts:170  audioIn()
  la t0, audioIn
  li t1, 260
  call far_call
  ; engine/main.e16.ts:171  saveLoad()
  la t0, saveLoad
  li t1, 263
  call far_call
  ; engine/main.e16.ts:172  ctl[0] = C_PAD
  sw zero, ctl(zero)
  ; engine/main.e16.ts:173  ctl[1] = C_CPU
  li t0, 1
  sw t0, ctl+2(zero)
  ; engine/main.e16.ts:174  bootLog()
  la t0, bootLog
  li t1, 261
  call far_call
  ; engine/main.e16.ts:175  for (;;) {
.L1:
  ; engine/main.e16.ts:176  titleRun()
  la t0, titleRun
  li t1, 261
  call far_call
  ; engine/main.e16.ts:177  if (selectRun()) ladderPlay()
  la t0, selectRun
  li t1, 262
  call far_call
  beqz a0, .L1
  ; engine/main.e16.ts:177  ladderPlay()
  la t0, ladderPlay
  li t1, 257
  call far_call
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:182 screenOn() at -O1
screenOn:
  ; engine/main.e16.ts:183  poke16(VCTRL, 3)
  li t0, 3
  li t1, 63488
  sw t0, 0(t1)
  ; engine/main.e16.ts:184  poke16(LAYERS, 7)
  li t0, 7
  li t1, 63528
  sw t0, 0(t1)
  ; engine/main.e16.ts:185  poke16(BG0X, 0)
  li t0, 63520
  sw zero, 0(t0)
  ; engine/main.e16.ts:186  poke16(BG0Y, 0)
  li t0, 63522
  sw zero, 0(t0)
  ; engine/main.e16.ts:187  poke16(BG1X, 0)
  li t0, 63524
  sw zero, 0(t0)
  ; engine/main.e16.ts:188  poke16(BG1Y, 508)
  li t0, 508
  li t1, 63526
  sw t0, 0(t1)
.return:
  ret

; engine/main.e16.ts:195 palettesIn() at -O1
palettesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:196  slot(PAL_STAGE, 0)
  li a0, 0
  li a1, 0
  call slot
  ; engine/main.e16.ts:197  slot(PAL_HUD, 1)
  li a0, 1
  li a1, 1
  call slot
  ; engine/main.e16.ts:198  slot(PAL_HUD, 2)
  li a0, 1
  li a1, 2
  call slot
  ; engine/main.e16.ts:199  slot(PAL_HUDDIM, 3)
  li a0, 2
  li a1, 3
  call slot
  ; engine/main.e16.ts:200  slot(PAL_HUD, 4)
  li a0, 1
  li a1, 4
  call slot
  ; engine/main.e16.ts:201  slot(PAL_HUD, 5)
  li a0, 1
  li a1, 5
  call slot
  ; engine/main.e16.ts:202  slot(PAL_BIG, 6)
  li a0, 6
  li a1, 6
  call slot
  ; engine/main.e16.ts:203  slot(PAL_P1, 8)
  li a0, 3
  li a1, 8
  call slot
  ; engine/main.e16.ts:204  slot(PAL_CPU, 9)
  li a0, 4
  li a1, 9
  call slot
  ; engine/main.e16.ts:205  slot(PAL_FX, 10)
  li a0, 5
  li a1, 10
  call slot
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:208 slot(row, s) at -O1
;   row in s1
;   s in s2
slot:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; row
  mv s2, a1 ; s
  ; engine/main.e16.ts:209  palette(row, s)
  mv a0, s1
  mv a1, s2
  call palette
  ; engine/main.e16.ts:210  palKeep(row, s)
  mv a0, s1
  mv a1, s2
  call palKeep
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/main.e16.ts:213 tilesIn() at -O1
tilesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:214  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
  li a0, 265
  li a1, 49954
  li a2, 0
  li a3, 2048
  call load
  ; engine/main.e16.ts:215  load(FONTB_BANK, FONTB_AT, FONTB_TILE * 32, FONTB_BYTES)
  li a0, 265
  li a1, 52002
  li a2, 2048
  li a3, 2048
  call load
  ; engine/main.e16.ts:216  load(DIGITS_BANK, DIGITS_AT, DIGITS_TILE * 32, DIGITS_BYTES)
  li a0, 265
  li a1, 54050
  li a2, 4096
  li a3, 1280
  call load
  ; engine/main.e16.ts:217  load(HUD_BANK, HUD_AT, HUD_TILE * 32, HUD_BYTES)
  li a0, 266
  li a1, 49152
  li a2, 5376
  li a3, 2848
  call load
  ; engine/main.e16.ts:218  load(BIG_BANK, BIG_AT, BIG_TILE * 32, BIG_BYTES)
  li a0, 352
  li a1, 49152
  li a2, 19488
  li a3, 5184
  call load
  ; engine/main.e16.ts:219  load(SPARK_BANK, SPARK_AT, SPARK_TILE * 32, SPARK_BYTES)
  li a0, 351
  li a1, 49152
  li a2, 16416
  li a3, 2560
  call load
  ; engine/main.e16.ts:220  load(SHADOW_BANK, SHADOW_AT, SHADOW_TILE * 32, SHADOW_BYTES)
  li a0, 351
  li a1, 51712
  li a2, 18976
  li a3, 512
  call load
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:224 screenClear() at -O1
screenClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:225  fightClear()
  call fightClear
  ; engine/main.e16.ts:226  vfill(MAP0, stageClearTile(), 64 * 64)
  call stageClearTile
  mv a1, a0
  li a0, 32768
  li a2, 4096
  call vfill
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:234 fightClear() at -O1
fightClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:235  raster(0)
  li a0, 0
  call raster
  ; engine/main.e16.ts:236  hudClear()
  call hudClear
  ; engine/main.e16.ts:237  scrollNext = 0
  sw zero, 0x0c96(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:243 frameBegin() at -O1
frameBegin:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:244  frameShow()
  call frameShow
  ; engine/main.e16.ts:245  frame++
  lw t0, 0x0c94(zero)
  addi t0, t0, 1
  sw t0, 0x0c94(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:252 frameShow() at -O1
frameShow:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:253  seen = frame_wait(seen)
  lw a0, 0x0c92(zero)
  call frame_wait
  sw a0, 0x0c92(zero)
  ; engine/main.e16.ts:254  sprShow()
  call sprShow
  ; engine/main.e16.ts:255  soundTick()
  call soundTick
  ; engine/main.e16.ts:256  artStream()
  call artStream
  ; engine/main.e16.ts:257  poke16(BG0X, scrollNext)
  lw t0, 0x0c96(zero)
  li t1, 63520
  sw t0, 0(t1)
  ; engine/main.e16.ts:258  stageShow()
  call stageShow
  ; engine/main.e16.ts:259  padRead()
  call padRead
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:268 pauseFrame() at -O1
pauseFrame:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:269  frameShow()
  call frameShow
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:275 phaseIs(p) at -O1
;   p in a0
phaseIs:
  ; engine/main.e16.ts:276  phase = p
  sw a0, 0x0c98(zero)
  ; engine/main.e16.ts:277  phaseT = 0
  sw zero, 0x0c9a(zero)
.return:
  ret

; engine/main.e16.ts:280 phaseTick() at -O1
phaseTick:
  ; engine/main.e16.ts:281  phaseT++
  lw t0, 0x0c9a(zero)
  addi t0, t0, 1
  sw t0, 0x0c9a(zero)
.return:
  ret

; engine/main.e16.ts:285 clockReset() at -O1
clockReset:
  ; engine/main.e16.ts:286  timeLeft = 99
  li t0, 99
  sw t0, 0x0c9c(zero)
  ; engine/main.e16.ts:287  timeT = 0
  sw zero, 0x0c9e(zero)
.return:
  ret

; engine/main.e16.ts:294 judgeRound() at -O1
judgeRound:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:295  if (phase !== PH_FIGHT) return
  lw t0, 0x0c98(zero)
  li t1, 1
  beq t0, t1, .L1
  ; engine/main.e16.ts:295  return
  j .return
.L1:
  ; engine/main.e16.ts:296  if (fLife[0] === 0 || fLife[1] === 0) knockedOut()
  lw t0, fLife(zero)
  beq t0, zero, .L3
  lw t0, fLife+2(zero)
  bne t0, zero, .L2
.L3:
  ; engine/main.e16.ts:296  knockedOut()
  call knockedOut
  j .L4
.L2:
  ; engine/main.e16.ts:297  clockStep()
  call clockStep
.L4:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:300 knockedOut() at -O1
;   both in s1
;   hitstopIs.n in s2
knockedOut:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; engine/main.e16.ts:301  const both = fLife[0] === 0 && fLife[1] === 0
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
  ; engine/main.e16.ts:302  roundWon = both ? 2 : fLife[1] === 0 ? 0 : 1
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
  ; engine/main.e16.ts:303  hitstopIs(KO_STOP)
  li s2, 24 ; hitstopIs.n
  ; engine/hit.e16.ts:163  hitstop = n
  sw s2, 0x1990(zero)
  ; engine/main.e16.ts:304  roundOver(both ? str('DOUBLE K.O.') : str('K.O.'))
  beqz s1, .L6
  la t0, str_2
  j .L7
.L6:
  la t0, str_3
.L7:
  mv a0, t0
  call roundOver
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/main.e16.ts:308 clockStep() at -O1
clockStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:309  timeT++
  lw t0, 0x0c9e(zero)
  addi t0, t0, 1
  sw t0, 0x0c9e(zero)
  ; engine/main.e16.ts:310  if (timeT < SECOND) return
  li t1, 60
  bgeu t0, t1, .L1
  ; engine/main.e16.ts:310  return
  j .return
.L1:
  ; engine/main.e16.ts:311  timeT = 0
  sw zero, 0x0c9e(zero)
  ; engine/main.e16.ts:312  timeLeft--
  lw t0, 0x0c9c(zero)
  addi t0, t0, -1
  sw t0, 0x0c9c(zero)
  ; engine/main.e16.ts:313  if (timeLeft > 0) return
  bgeu zero, t0, .L2
  ; engine/main.e16.ts:313  return
  j .return
.L2:
  ; engine/main.e16.ts:314  roundWon = fLife[0] === fLife[1] ? 2 : fLife[0] > fLife[1] ? 0 : 1
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
  ; engine/main.e16.ts:315  roundOver(str('TIME UP'))
  la a0, str_4
  call roundOver
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:318 roundOver(s) at -O1
;   s in s1
roundOver:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; s
  ; engine/main.e16.ts:319  phaseIs(PH_OVER)
  li a0, 2
  call phaseIs
  ; engine/main.e16.ts:320  bandHigh()
  ; engine/draw.e16.ts:257  bandAt = BAND_HIGH
  li t0, 5
  sw t0, 0x1998(zero)
  ; engine/main.e16.ts:321  bandShow(s)
  mv a0, s1
  call bandShow
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/main.e16.ts:341 frameStep() at -O1
;   hitstopIs.n in s1
frameStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; engine/main.e16.ts:342  frameBegin()
  call frameBegin
  ; engine/main.e16.ts:343  struckClear()
  call struckClear
  ; engine/main.e16.ts:344  ringStep()
  call ringStep
  ; engine/main.e16.ts:345  inputsGather()
  call inputsGather
  ; engine/main.e16.ts:346  if (hitstop > 0) {
  lw t0, 0x1990(zero)
  bgeu zero, t0, .L1
  ; engine/main.e16.ts:347  hitstopIs(hitstop - 1)
  lw t0, 0x1990(zero)
  addi s1, t0, -1
  ; engine/hit.e16.ts:163  hitstop = n
  sw s1, 0x1990(zero)
  ; engine/main.e16.ts:348  cpuInputs(false)
  li a0, 0
  call cpuInputs
  ; engine/main.e16.ts:349  seenRecord()
  call seenRecord
  ; engine/main.e16.ts:350  pictureStep()
  call pictureStep
  ; engine/main.e16.ts:351  return
  j .return
.L1:
  ; engine/main.e16.ts:353  liveN = wrap16(liveN + 1)
  lw t0, 0x0eaa(zero)
  addi t0, t0, 1
  sw t0, 0x0eaa(zero)
  ; engine/main.e16.ts:354  cpuInputs(true)
  li a0, 1
  call cpuInputs
  ; engine/main.e16.ts:355  fightersSeen()
  call fightersSeen
  ; engine/main.e16.ts:356  throwsStep()
  call throwsStep
  ; engine/main.e16.ts:357  fighterStep(0)
  li a0, 0
  call fighterStep
  ; engine/main.e16.ts:358  fighterStep(1)
  li a0, 1
  call fighterStep
  ; engine/main.e16.ts:359  motion(0)
  li a0, 0
  call motion
  ; engine/main.e16.ts:360  motion(1)
  li a0, 1
  call motion
  ; engine/main.e16.ts:361  wall(0)
  li a0, 0
  call wall
  ; engine/main.e16.ts:362  wall(1)
  li a0, 1
  call wall
  ; engine/main.e16.ts:363  apart()
  call apart
  ; engine/main.e16.ts:364  bodies()
  call bodies
  ; engine/main.e16.ts:365  boxesWorld()
  call boxesWorld
  ; engine/main.e16.ts:367  if (live()) hitsResolve()
  call live
  beqz a0, .L2
  ; engine/main.e16.ts:367  hitsResolve()
  call hitsResolve
.L2:
  ; engine/main.e16.ts:368  judgeRound()
  call judgeRound
  ; engine/main.e16.ts:369  seenRecord()
  call seenRecord
  ; engine/main.e16.ts:370  cameraStep()
  call cameraStep
  ; engine/main.e16.ts:371  pictureStep()
  call pictureStep
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/main.e16.ts:374 pictureStep() at -O1
pictureStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/main.e16.ts:375  scrollNext = stageScroll(camX)
  lw a0, 0x1996(zero)
  call stageScroll
  sw a0, 0x0c96(zero)
  ; engine/main.e16.ts:376  lookStep()
  la t0, lookStep
  li t1, 260
  call far_call
  ; engine/main.e16.ts:377  hudStep(timeLeft, frame)
  lw t0, 0x0c9c(zero)
  lw t1, 0x0c94(zero)
  mv a0, t0
  mv a1, t1
  call hudStep
  ; engine/main.e16.ts:378  logStep()
  call logStep
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/main.e16.ts:402 seenRecord() at -O1
;   k in s3
;   i in s1
;   e in s2
;   st in s0
seenRecord:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  ; engine/main.e16.ts:403  const k = seenN & 31
  lw t0, 0x0ea8(zero)
  andi s3, t0, 31
  ; engine/main.e16.ts:404  let i: u16 = 0
  li s1, 0 ; i
  ; engine/main.e16.ts:405  while (i < 2) {
  j .L3
.L1:
  ; engine/main.e16.ts:406  const e = i * 32 + k
  slli t0, s1, 5
  add s2, t0, s3
  ; engine/main.e16.ts:407  const st = fState[i]
  slli t0, s1, 1
  lw s0, fState(t0)
  ; engine/main.e16.ts:408  seenS[e] = st | (fMove[i] << 8)
  slli t0, s2, 1
  slli t1, s1, 1
  lw t1, fMove(t1)
  slli t1, t1, 8
  or t1, s0, t1
  sw t1, seenS(t0)
  ; engine/main.e16.ts:409  seenF[e] = ((st === ST_ATTACK ? fMoveF[i] : fStateT[i]) & 255) | (struck[i] << 8)
  slli t0, s2, 1
  addi t0, t0, seenF
  mv t1, s0
  li t2, 5
  bne t1, t2, .L5
  slli t1, s1, 1
  lw t1, fMoveF(t1)
  j .L6
.L5:
  slli t1, s1, 1
  lw t1, fStateT(t1)
.L6:
  andi t1, t1, 255
  slli t2, s1, 1
  lw t2, struck(t2)
  slli t2, t2, 8
  or t1, t1, t2
  sw t1, 0(t0)
  ; engine/main.e16.ts:410  seenX[e] = pointX(i)
  slli t0, s2, 1
  addi t0, t0, seenX
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call pointX
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; engine/main.e16.ts:411  seenY[e] = fAir[i] !== 0 && fY[i] < 16 ? 1 : fY[i] >> 4
  slli t0, s2, 1
  slli t1, s1, 1
  lw t1, fAir(t1)
  addi t0, t0, seenY
  li t2, 0
  beq t1, t2, .L7
  slli t1, s1, 1
  lw t1, fY(t1)
  li t2, 16
  bgeu t1, t2, .L7
  li t1, 1
  j .L8
.L7:
  slli t1, s1, 1
  lw t1, fY(t1)
  srli t1, t1, 4
.L8:
  sw t1, 0(t0)
  ; engine/main.e16.ts:412  i++
  addi s1, s1, 1
.L3:
  li t0, 2
  bltu s1, t0, .L1
  ; engine/main.e16.ts:414  seenL[k] = liveN
  slli t0, s3, 1
  lw t1, 0x0eaa(zero)
  sw t1, seenL(t0)
  ; engine/main.e16.ts:415  seenN = wrap16(seenN + 1)
  lw t0, 0x0ea8(zero)
  addi t0, t0, 1
  sw t0, 0x0ea8(zero)
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; engine/main.e16.ts:419 live() at -O1
live:
  ; engine/main.e16.ts:420  return phase === PH_FIGHT
  lw t0, 0x0c98(zero)
  li t1, 1
  sub t0, t0, t1
  seqz a0, t0
.return:
  ret

; engine/main.e16.ts:424 inputsGather() at -O1
;   i in s1
inputsGather:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; engine/main.e16.ts:425  let i: u16 = 0
  li s1, 0 ; i
  ; engine/main.e16.ts:426  while (i < 2) {
  j .L3
.L1:
  ; engine/main.e16.ts:427  if (!live()) inputNone(i)
  call live
  bnez a0, .L5
  ; engine/main.e16.ts:427  inputNone(i)
  mv a0, s1
  call inputNone
  j .L6
.L5:
  ; engine/main.e16.ts:428  if (ctl[i] === C_PAD) inputPad(i, fFace[i] !== 0)
  slli t0, s1, 1
  lw t0, ctl(t0)
  bne t0, zero, .L7
  ; engine/main.e16.ts:428  inputPad(i, fFace[i] !== 0)
  slli t0, s1, 1
  lw t0, fFace(t0)
  sub t0, t0, zero
  snez t0, t0
  mv a0, s1
  mv a1, t0
  call inputPad
  j .L8
.L7:
  ; engine/main.e16.ts:429  if (ctl[i] !== C_CPU) inputExt(i)
  slli t0, s1, 1
  lw t0, ctl(t0)
  li t1, 1
  beq t0, t1, .L9
  ; engine/main.e16.ts:429  inputExt(i)
  mv a0, s1
  call inputExt
.L9:
.L8:
.L6:
  ; engine/main.e16.ts:430  i++
  addi s1, s1, 1
.L3:
  li t0, 2
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/main.e16.ts:435 cpuInputs(think) at -O1
;   think in s2
;   i in s1
cpuInputs:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; think
  ; engine/main.e16.ts:436  let i: u16 = 0
  li s1, 0 ; i
  ; engine/main.e16.ts:437  while (i < 2) {
  j .L3
.L1:
  ; engine/main.e16.ts:438  if (ctl[i] === C_CPU) {
  slli t0, s1, 1
  lw t0, ctl(t0)
  li t1, 1
  bne t0, t1, .L5
  ; engine/main.e16.ts:439  if (!live()) cpuHeld[i] = 0
  call live
  bnez a0, .L6
  ; engine/main.e16.ts:439  cpuHeld[i] = 0
  slli t0, s1, 1
  sw zero, cpuHeld(t0)
  j .L7
.L6:
  ; engine/main.e16.ts:440  cpuHeld[i] = cpuThink(i, think)
  slli t0, s1, 1
  addi t0, t0, cpuHeld
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  mv a1, s2
  la t0, cpuThink
  li t1, 258
  call far_call
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
.L7:
  ; engine/main.e16.ts:441  inputHeld(i, cpuHeld[i])
  slli t0, s1, 1
  lw t0, cpuHeld(t0)
  mv a0, s1
  mv a1, t0
  call inputHeld
.L5:
  ; engine/main.e16.ts:443  i++
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

; engine/data.e16.ts:152 slotsIn() at -O1
slotsIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/data.e16.ts:153  slotTables(0, S1_MOVES_BANK, S1_MOVES_AT, S1_POSES_BANK)
  li a0, 0
  li a1, 357
  li a2, 50962
  li a3, 357
  call slotTables
  ; engine/data.e16.ts:154  slotPlaces(0, S1_POSES_AT, S1_PROFILE_BANK, S1_PROFILE_AT)
  li a0, 0
  li a1, 51378
  li a2, 358
  li a3, 56836
  call slotPlaces
  ; engine/data.e16.ts:155  slotArt(0, S1_ART_BANK, S1_ART_AT, S1_BANK)
  li a0, 0
  li a1, 358
  li a2, 49152
  li a3, 267
  call slotArt
  ; engine/data.e16.ts:156  slName[0] = str('S1 BALANCE')
  la t0, str_5
  sw t0, slName(zero)
  ; engine/data.e16.ts:157  slotTables(1, S2_MOVES_BANK, S2_MOVES_AT, S2_POSES_BANK)
  li a0, 1
  li a1, 358
  li a2, 56868
  li a3, 359
  call slotTables
  ; engine/data.e16.ts:158  slotPlaces(1, S2_POSES_AT, S2_PROFILE_BANK, S2_PROFILE_AT)
  li a0, 1
  li a1, 49152
  li a2, 360
  li a3, 56836
  call slotPlaces
  ; engine/data.e16.ts:159  slotArt(1, S2_ART_BANK, S2_ART_AT, S2_BANK)
  li a0, 1
  li a1, 360
  li a2, 49152
  li a3, 287
  call slotArt
  ; engine/data.e16.ts:160  slName[1] = str('S2 RUSH')
  la t0, str_6
  sw t0, slName+2(zero)
  ; engine/data.e16.ts:161  slotTables(2, S3_MOVES_BANK, S3_MOVES_AT, S3_POSES_BANK)
  li a0, 2
  li a1, 360
  li a2, 56868
  li a3, 361
  call slotTables
  ; engine/data.e16.ts:162  slotPlaces(2, S3_POSES_AT, S3_PROFILE_BANK, S3_PROFILE_AT)
  li a0, 2
  li a1, 49152
  li a2, 362
  li a3, 56836
  call slotPlaces
  ; engine/data.e16.ts:163  slotArt(2, S3_ART_BANK, S3_ART_AT, S3_BANK)
  li a0, 2
  li a1, 362
  li a2, 49152
  li a3, 305
  call slotArt
  ; engine/data.e16.ts:164  slName[2] = str('S3 POWER')
  la t0, str_7
  sw t0, slName+4(zero)
  ; engine/data.e16.ts:165  slotTables(3, S4_MOVES_BANK, S4_MOVES_AT, S4_POSES_BANK)
  li a0, 3
  li a1, 362
  li a2, 56868
  li a3, 363
  call slotTables
  ; engine/data.e16.ts:166  slotPlaces(3, S4_POSES_AT, S4_PROFILE_BANK, S4_PROFILE_AT)
  li a0, 3
  li a1, 49152
  li a2, 364
  li a3, 56836
  call slotPlaces
  ; engine/data.e16.ts:167  slotArt(3, S4_ART_BANK, S4_ART_AT, S4_BANK)
  li a0, 3
  li a1, 364
  li a2, 49152
  li a3, 328
  call slotArt
  ; engine/data.e16.ts:168  slName[3] = str('S4 OUTBOX')
  la t0, str_8
  sw t0, slName+6(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/data.e16.ts:171 slotTables(k, mb, ma, pb) at -O1
;   k in a0
;   mb in a1
;   ma in a2
;   pb in a3
slotTables:
  ; engine/data.e16.ts:172  slMovesB[k] = mb
  slli t0, a0, 1
  sw a1, slMovesB(t0)
  ; engine/data.e16.ts:173  slMovesA[k] = ma
  slli t0, a0, 1
  sw a2, slMovesA(t0)
  ; engine/data.e16.ts:174  slPosesB[k] = pb
  slli t0, a0, 1
  sw a3, slPosesB(t0)
.return:
  ret

; engine/data.e16.ts:177 slotArt(k, ab, aa, cb) at -O1
;   k in a0
;   ab in a1
;   aa in a2
;   cb in a3
slotArt:
  ; engine/data.e16.ts:178  slArtB[k] = ab
  slli t0, a0, 1
  sw a1, slArtB(t0)
  ; engine/data.e16.ts:179  slArtA[k] = aa
  slli t0, a0, 1
  sw a2, slArtA(t0)
  ; engine/data.e16.ts:180  slCellsB[k] = cb
  slli t0, a0, 1
  sw a3, slCellsB(t0)
.return:
  ret

; engine/data.e16.ts:183 slotPlaces(k, pa, fb, fa) at -O1
;   k in a0
;   pa in a1
;   fb in a2
;   fa in a3
slotPlaces:
  ; engine/data.e16.ts:184  slPosesA[k] = pa
  slli t0, a0, 1
  sw a1, slPosesA(t0)
  ; engine/data.e16.ts:185  slProfB[k] = fb
  slli t0, a0, 1
  sw a2, slProfB(t0)
  ; engine/data.e16.ts:186  slProfA[k] = fa
  slli t0, a0, 1
  sw a3, slProfA(t0)
.return:
  ret

; engine/data.e16.ts:204 fighterLoad(i, s) at -O1
;   i in s2
;   s in s1
;   old in s3
fighterLoad:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; i
  mv s1, a1 ; s
  ; engine/data.e16.ts:205  let old = bank(slMovesB[s])
  slli t0, s1, 1
  lw a0, slMovesB(t0)
  call bank
  mv s3, a0 ; old
  ; engine/data.e16.ts:206  memcpy(addr(mv) + i * MOVES * MOVE_W * 2, slMovesA[s], MOVES * MOVE_W * 2)
  li t0, 13
  mul t0, s2, t0
  slli t0, t0, 4
  slli t0, t0, 1
  slli t1, s1, 1
  lw t1, slMovesA(t1)
  addi a0, t0, mv
  mv a1, t1
  li a2, 416
  mcpy a0, a1, a2
  ; engine/data.e16.ts:207  poke16(IO_BANK, old)
  li t0, 65284
  sw s3, 0(t0)
  ; engine/data.e16.ts:208  old = bank(slProfB[s])
  slli t0, s1, 1
  lw a0, slProfB(t0)
  call bank
  mv s3, a0 ; old
  ; engine/data.e16.ts:209  memcpy(addr(pr) + i * PROF_W * 2, slProfA[s], PROF_W * 2)
  slli t0, s2, 4
  slli t0, t0, 1
  slli t1, s1, 1
  lw t1, slProfA(t1)
  addi a0, t0, pr
  mv a1, t1
  li a2, 32
  mcpy a0, a1, a2
  ; engine/data.e16.ts:210  poke16(IO_BANK, old)
  li t0, 65284
  sw s3, 0(t0)
  ; engine/data.e16.ts:211  boxPose[i] = 0xffff
  slli t0, s2, 1
  li t1, 65535
  sw t1, boxPose(t0)
  ; engine/data.e16.ts:212  reachLoad(i, s)
  mv a0, s2
  mv a1, s1
  call reachLoad
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/data.e16.ts:219 reachLoad(i, s) at -O1
;   i in s2
;   s in s3
;   old in 2(fp)
;   m in s1
;   p in 4(fp)
;   from in 0(fp)
reachLoad:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; i
  mv s3, a1 ; s
  ; engine/data.e16.ts:220  const old = bank(slPosesB[s])
  slli t0, s3, 1
  lw a0, slPosesB(t0)
  call bank
  sw a0, 2(fp) ; old
  ; engine/data.e16.ts:221  let m: u16 = 0
  li s1, 0 ; m
  ; engine/data.e16.ts:222  while (m < MOVES) {
  j .L3
.L1:
  ; engine/data.e16.ts:223  const p = mvAt(i, m, M_POSE) + 1
  mv a0, s2
  mv a1, s1
  li a2, 14
  call mvAt
  addi t0, a0, 1
  sw t0, 4(fp) ; p
  ; engine/data.e16.ts:224  const from = slPosesA[s] + (p * POSE_W + 16) * 2
  slli t0, s3, 1
  lw t0, slPosesA(t0)
  lw t1, 4(fp) ; p
  slli t2, t1, 4
  slli t1, t1, 3
  add t1, t1, t2
  addi t1, t1, 16
  slli t1, t1, 1
  add t0, t0, t1
  sw t0, 0(fp) ; from
  ; engine/data.e16.ts:225  reach[i * MOVES + m] = peek16(from) + peek16(from + 4)
  li t0, 13
  mul t0, s2, t0
  add t0, t0, s1
  slli t0, t0, 1
  lw t1, 0(fp) ; from
  lw t1, 0(t1)
  lw t2, 0(fp) ; from
  lw t2, 4(t2)
  add t1, t1, t2
  sw t1, reach(t0)
  ; engine/data.e16.ts:226  m++
  addi s1, s1, 1
.L3:
  li t0, 13
  bltu s1, t0, .L1
  ; engine/data.e16.ts:228  poke16(IO_BANK, old)
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

; engine/data.e16.ts:235 poseLoad(i, s, p) at -O1
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
  ; engine/data.e16.ts:236  if (boxPose[i] === p) return
  slli t0, s2, 1
  lw t0, boxPose(t0)
  bne t0, s3, .L1
  ; engine/data.e16.ts:236  return
  j .return
.L1:
  ; engine/data.e16.ts:237  boxPose[i] = p
  slli t0, s2, 1
  sw s3, boxPose(t0)
  ; engine/data.e16.ts:238  const old = bank(slPosesB[s])
  lw t0, 0(fp) ; s
  slli t0, t0, 1
  lw a0, slPosesB(t0)
  call bank
  sw a0, 2(fp) ; old
  ; engine/data.e16.ts:239  const from = slPosesA[s] + p * POSE_W * 2
  lw t0, 0(fp) ; s
  slli t0, t0, 1
  lw t0, slPosesA(t0)
  slli t2, s3, 4
  slli t1, s3, 3
  add t1, t1, t2
  slli t1, t1, 1
  add t0, t0, t1
  sw t0, 4(fp) ; from
  ; engine/data.e16.ts:240  let k: u16 = 0
  li s1, 0 ; k
  ; engine/data.e16.ts:241  while (k < POSE_W) {
  j .L4
.L2:
  ; engine/data.e16.ts:242  bx[i * POSE_W + k] = peek16(from + k * 2)
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
  ; engine/data.e16.ts:243  k++
  addi s1, s1, 1
.L4:
  li t0, 24
  bltu s1, t0, .L2
  ; engine/data.e16.ts:245  poke16(IO_BANK, old)
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

; engine/data.e16.ts:253 poseWords(s, at, n, to) at -O1
;   s in s1
;   at in s2
;   n in s3
;   to in 0(fp)
;   old in 2(fp)
poseWords:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; s
  mv s2, a1 ; at
  mv s3, a2 ; n
  sw a3, 0(fp) ; to
  ; engine/data.e16.ts:254  const old = bank(slPosesB[s])
  slli t0, s1, 1
  lw a0, slPosesB(t0)
  call bank
  sw a0, 2(fp) ; old
  ; engine/data.e16.ts:255  memcpy(to, slPosesA[s] + at * 2, n * 2)
  slli t0, s1, 1
  lw t0, slPosesA(t0)
  slli t1, s2, 1
  add t0, t0, t1
  slli t1, s3, 1
  lw a0, 0(fp)
  mv a1, t0
  mv a2, t1
  mcpy a0, a1, a2
  ; engine/data.e16.ts:256  poke16(IO_BANK, old)
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

; engine/data.e16.ts:279 artCopy(i, s, row) at -O1
;   i in s3
;   s in s2
;   row in 0(fp)
;   old in 2(fp)
;   from in 4(fp)
;   k in s1
artCopy:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s3, a0 ; i
  mv s2, a1 ; s
  sw a2, 0(fp) ; row
  ; engine/data.e16.ts:280  const old = bank(slArtB[s])
  slli t0, s2, 1
  lw a0, slArtB(t0)
  call bank
  sw a0, 2(fp) ; old
  ; engine/data.e16.ts:281  const from = slArtA[s] + row * ART_W * 2
  slli t0, s2, 1
  lw t0, slArtA(t0)
  lw t1, 0(fp) ; row
  slli t2, t1, 5
  slli t1, t1, 1
  add t1, t1, t2
  slli t1, t1, 1
  add t0, t0, t1
  sw t0, 4(fp) ; from
  ; engine/data.e16.ts:282  let k: u16 = 0
  li s1, 0 ; k
  ; engine/data.e16.ts:283  while (k < ART_W) {
  j .L3
.L1:
  ; engine/data.e16.ts:284  art[i * ART_W + k] = peek16(from + k * 2)
  slli t1, s3, 5
  slli t0, s3, 1
  add t0, t0, t1
  add t0, t0, s1
  slli t0, t0, 1
  slli t1, s1, 1
  lw t2, 4(fp) ; from
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, art(t0)
  ; engine/data.e16.ts:285  k++
  addi s1, s1, 1
.L3:
  li t0, 34
  bltu s1, t0, .L1
  ; engine/data.e16.ts:287  poke16(IO_BANK, old)
  lw t0, 2(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
  ; engine/data.e16.ts:288  artWant[i] = s + 1
  slli t0, s3, 1
  addi t1, s2, 1
  sw t1, artWant(t0)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/data.e16.ts:296 artStream() at -O1
;   i in s1
;   f in s2
;   b in s3
artStream:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; engine/data.e16.ts:297  let i: u16 = 0
  li s1, 0 ; i
  ; engine/data.e16.ts:298  while (i < 2) {
  j .L3
.L1:
  ; engine/data.e16.ts:299  if (artWant[i] !== 0) {
  slli t0, s1, 1
  lw t0, artWant(t0)
  beq t0, zero, .L5
  ; engine/data.e16.ts:300  const f = art[i * ART_W]
  slli t1, s1, 5
  slli t0, s1, 1
  add t0, t0, t1
  slli t0, t0, 1
  lw s2, art(t0)
  ; engine/data.e16.ts:301  const b = slCellsB[artWant[i] - 1] + (f >> 6)
  slli t0, s1, 1
  lw t0, artWant(t0)
  addi t0, t0, -1
  slli t0, t0, 1
  lw t0, slCellsB(t0)
  srli t1, s2, 6
  add s3, t0, t1
  ; engine/data.e16.ts:302  load(b, 0xc000 + ((f & 63) << 7), (S1_TILE + i * 128) * 32, art[i * ART_W + 1] * 128)
  andi t0, s2, 63
  slli t0, t0, 7
  li t1, 49152
  add t1, t1, t0
  slli t0, s1, 7
  addi t0, t0, 257
  slli t0, t0, 5
  slli t3, s1, 5
  slli t2, s1, 1
  add t2, t2, t3
  addi t2, t2, 1
  slli t2, t2, 1
  lw t2, art(t2)
  slli t2, t2, 7
  mv a0, s3
  mv a1, t1
  mv a2, t0
  mv a3, t2
  call load
  ; engine/data.e16.ts:303  artWant[i] = 0
  slli t0, s1, 1
  sw zero, artWant(t0)
.L5:
  ; engine/data.e16.ts:305  i++
  addi s1, s1, 1
.L3:
  li t0, 2
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/data.e16.ts:314 artPut(s, row, to, tile) at -O1
;   s in s1
;   row in 0(fp)
;   to in s2
;   tile in 2(fp)
;   old in 4(fp)
;   f in s3
artPut:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; s
  sw a1, 0(fp) ; row
  mv s2, a2 ; to
  sw a3, 2(fp) ; tile
  ; engine/data.e16.ts:315  const old = bank(slArtB[s])
  slli t0, s1, 1
  lw a0, slArtB(t0)
  call bank
  sw a0, 4(fp) ; old
  ; engine/data.e16.ts:316  memcpy(to, slArtA[s] + row * ART_W * 2, ART_W * 2)
  slli t0, s1, 1
  lw t0, slArtA(t0)
  lw t1, 0(fp) ; row
  slli t2, t1, 5
  slli t1, t1, 1
  add t1, t1, t2
  slli t1, t1, 1
  add t0, t0, t1
  mv a0, s2
  mv a1, t0
  li a2, 68
  mcpy a0, a1, a2
  ; engine/data.e16.ts:317  poke16(IO_BANK, old)
  lw t0, 4(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
  ; engine/data.e16.ts:318  const f = peek16(to)
  lw s3, 0(s2)
  ; engine/data.e16.ts:319  load(slCellsB[s] + (f >> 6), 0xc000 + ((f & 63) << 7), tile * 32, peek16(to + 2) * 128)
  slli t0, s1, 1
  lw t0, slCellsB(t0)
  srli t1, s3, 6
  add t0, t0, t1
  andi t1, s3, 63
  slli t1, t1, 7
  li t2, 49152
  add t2, t2, t1
  lw t1, 2(fp) ; tile
  slli t1, t1, 5
  lw t3, 2(s2)
  slli t3, t3, 7
  mv a0, t0
  mv a1, t2
  mv a2, t1
  mv a3, t3
  call load
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/data.e16.ts:325 tableWord(b, at, k) at -O1
;   b in s1
;   at in s2
;   k in s3
;   old in 0(fp)
;   v in 2(fp)
tableWord:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; b
  mv s2, a1 ; at
  mv s3, a2 ; k
  ; engine/data.e16.ts:326  const old = bank(b)
  mv a0, s1
  call bank
  sw a0, 0(fp) ; old
  ; engine/data.e16.ts:327  const v = peek16(at + k * 2)
  slli t0, s3, 1
  add t0, s2, t0
  lw t0, 0(t0)
  sw t0, 2(fp) ; v
  ; engine/data.e16.ts:328  poke16(IO_BANK, old)
  lw t0, 0(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
  ; engine/data.e16.ts:329  return v
  lw a0, 2(fp)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/data.e16.ts:333 mvAt(i, m, c) at -O1
;   i in a0
;   m in a1
;   c in a2
mvAt:
  ; engine/data.e16.ts:334  return mv[(i * MOVES + m) * MOVE_W + c]
  li t0, 13
  mul t0, a0, t0
  add t0, t0, a1
  slli t0, t0, 4
  add t0, t0, a2
  slli t0, t0, 1
  lw a0, mv(t0)
.return:
  ret

; engine/data.e16.ts:338 prAt(i, c) at -O1
;   i in a0
;   c in a1
prAt:
  ; engine/data.e16.ts:339  return pr[i * PROF_W + c]
  slli t0, a0, 4
  add t0, t0, a1
  slli t0, t0, 1
  lw a0, pr(t0)
.return:
  ret

; engine/data.e16.ts:354 stagesIn() at -O1
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
  ; engine/data.e16.ts:355  stagePictures(0, GRID_TILE, GRID_TILES_BANK, GRID_TILES_AT)
  li s1, 53248 ; stagePictures.at
  li a3, 353 ; stagePictures.b
  li a2, 771 ; stagePictures.tile
  li a0, 0 ; stagePictures.k
  ; engine/data.e16.ts:362  stTile[k] = tile
  slli t0, a0, 1
  sw a2, stTile(t0)
  ; engine/data.e16.ts:363  stTilesB[k] = b
  slli t0, a0, 1
  sw a3, stTilesB(t0)
  ; engine/data.e16.ts:364  stTilesA[k] = at
  slli t0, a0, 1
  sw s1, stTilesA(t0)
  ; engine/data.e16.ts:356  stagePlaces(0, GRID_TILES_BYTES, GRID_MAP_BANK, GRID_H)
  li s0, 36 ; stagePlaces.rows
  li s3, 354 ; stagePlaces.mapB
  li s2, 3232 ; stagePlaces.n
  li a1, 0 ; stagePlaces.k
  ; engine/data.e16.ts:368  stTilesN[k] = n
  slli t0, a1, 1
  sw s2, stTilesN(t0)
  ; engine/data.e16.ts:369  stMapB[k] = mapB
  slli t0, a1, 1
  sw s3, stMapB(t0)
  ; engine/data.e16.ts:370  stRows[k] = rows
  slli t0, a1, 1
  sw s0, stRows(t0)
  ; engine/data.e16.ts:357  stDataB[0] = STAGE_GRID_BANK
  li t0, 365
  sw t0, stDataB(zero)
  ; engine/data.e16.ts:358  stDataA[0] = STAGE_GRID_AT
  li t0, 51194
  sw t0, stDataA(zero)
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  addi sp, sp, 8
  ret

; engine/data.e16.ts:412 stageLoad(k) at -O1
;   k in s1
;   old in s3
;   y in s2
stageLoad:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; k
  ; engine/data.e16.ts:413  stageNow = k
  sw s1, 0x153e(zero)
  ; engine/data.e16.ts:414  raster(0)
  li a0, 0
  call raster
  ; engine/data.e16.ts:415  const old = bank(stDataB[k])
  slli t0, s1, 1
  lw a0, stDataB(t0)
  call bank
  mv s3, a0 ; old
  ; engine/data.e16.ts:416  memcpy(addr(stageWords), stDataA[k], S_WORDS * 2)
  slli t0, s1, 1
  lw t0, stDataA(t0)
  la a0, stageWords
  mv a1, t0
  li a2, 326
  mcpy a0, a1, a2
  ; engine/data.e16.ts:417  poke16(IO_BANK, old)
  li t0, 65284
  sw s3, 0(t0)
  ; engine/data.e16.ts:418  groundY = stageWords[S_GROUND]
  lw t0, stageWords+6(zero)
  sw t0, 0x1540(zero)
  ; engine/data.e16.ts:419  palette(stageWords[S_PALETTE], 0)
  lw a0, stageWords(zero)
  li a1, 0
  call palette
  ; engine/data.e16.ts:420  palKeep(stageWords[S_PALETTE], 0)
  lw a0, stageWords(zero)
  li a1, 0
  call palKeep
  ; engine/data.e16.ts:421  load(stTilesB[k], stTilesA[k], stTile[k] * 32, stTilesN[k])
  slli t0, s1, 1
  lw t0, stTilesB(t0)
  slli t1, s1, 1
  lw t1, stTilesA(t1)
  slli t2, s1, 1
  lw t2, stTile(t2)
  slli t2, t2, 5
  slli t3, s1, 1
  lw t3, stTilesN(t3)
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call load
  ; engine/data.e16.ts:422  let y: u16 = 0
  li s2, 0 ; y
  ; engine/data.e16.ts:423  while (y < stRows[k]) {
  j .L3
.L1:
  ; engine/data.e16.ts:424  mapRow(stMapB[k], 0xc000 + y * 128, 0, y)
  slli t0, s1, 1
  lw t0, stMapB(t0)
  slli t1, s2, 7
  li t2, 49152
  add t2, t2, t1
  mv a0, t0
  mv a1, t2
  li a2, 0
  mv a3, s2
  call mapRow
  ; engine/data.e16.ts:425  y++
  addi s2, s2, 1
.L3:
  slli t0, s1, 1
  lw t0, stRows(t0)
  bltu s2, t0, .L1
  ; engine/data.e16.ts:428  scrollCam = 0xffff
  li t0, 65535
  sw t0, 0x176c(zero)
  ; engine/data.e16.ts:429  poke16(BG0X, stageScroll(stageWords[S_CENTER]))
  lw a0, stageWords+10(zero)
  call stageScroll
  li t0, 63520
  sw a0, 0(t0)
  ; engine/data.e16.ts:430  stageShow()
  call stageShow
  ; engine/data.e16.ts:431  raster(stageWords[S_RASTER])
  lw a0, stageWords+8(zero)
  call raster
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; engine/data.e16.ts:439 stageScroll(cam) at -O1
;   cam in s2
;   c in s3
;   d in 0(fp)
;   k in s1
;   n in 2(fp)
;   t in 4(fp)
stageScroll:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; cam
  ; engine/data.e16.ts:440  if (cam === scrollCam) return scrollTop
  lw t0, 0x176c(zero)
  bne s2, t0, .L1
  ; engine/data.e16.ts:440  return scrollTop
  lw a0, 0x1770(zero)
  j .return
.L1:
  ; engine/data.e16.ts:441  scrollCam = cam
  sw s2, 0x176c(zero)
  ; engine/data.e16.ts:442  const c = stageWords[S_CENTER]
  lw s3, stageWords+10(zero)
  ; engine/data.e16.ts:443  if (stageWords[S_RASTER] === 0) {
  lw t0, stageWords+8(zero)
  bne t0, zero, .L2
  ; engine/data.e16.ts:444  scrollTop = cam
  sw s2, 0x1770(zero)
  ; engine/data.e16.ts:445  return cam
  mv a0, s2
  j .return
.L2:
  ; engine/data.e16.ts:447  const d = i16(cam - c)
  sub t0, s2, s3
  sw t0, 0(fp) ; d
  ; engine/data.e16.ts:448  let k: u16 = 0
  li s1, 0 ; k
  ; engine/data.e16.ts:449  while (k < 36) {
  j .L5
.L3:
  ; engine/data.e16.ts:450  bandNext[k] = (c + u16(mulShift(d, i16(stageWords[S_BANDS + k]), 4))) & 511
  slli t0, s1, 1
  addi t1, s1, 7
  slli t1, t1, 1
  lw t1, stageWords(t1)
  lw t2, 0(fp) ; d
  mulq t2, t2, t1, 4
  add t2, s3, t2
  andi t2, t2, 511
  sw t2, bandNext(t0)
  ; engine/data.e16.ts:451  k++
  addi s1, s1, 1
.L5:
  li t0, 36
  bltu s1, t0, .L3
  ; engine/data.e16.ts:453  const n = stageLines()
  call stageLines
  sw a0, 2(fp) ; n
  ; engine/data.e16.ts:454  const t = lineBack
  lw t0, 0x176a(zero)
  sw t0, 4(fp) ; t
  ; engine/data.e16.ts:455  k = 0
  li s1, 0 ; k
  ; engine/data.e16.ts:456  while (k < n) {
  j .L9
.L7:
  ; engine/data.e16.ts:457  lineTab[t + k] = (c + u16(mulShift(d, i16(stageWords[S_LINES + k]), 8))) & 511
  lw t0, 4(fp) ; t
  add t0, t0, s1
  slli t0, t0, 1
  addi t1, s1, 43
  slli t1, t1, 1
  lw t1, stageWords(t1)
  lw t2, 0(fp) ; d
  mulq t2, t2, t1, 8
  add t2, s3, t2
  andi t2, t2, 511
  sw t2, lineTab(t0)
  ; engine/data.e16.ts:458  k++
  addi s1, s1, 1
.L9:
  lw t0, 2(fp) ; n
  bltu s1, t0, .L7
  ; engine/data.e16.ts:460  scrollMade = true
  li t0, 1
  sw t0, 0x176e(zero)
  ; engine/data.e16.ts:461  scrollTop = bandNext[0]
  lw t0, bandNext(zero)
  sw t0, 0x1770(zero)
  ; engine/data.e16.ts:462  return scrollTop
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/data.e16.ts:466 stageLines() at -O1
stageLines:
  ; engine/data.e16.ts:467  if (stageWords[S_RASTER] !== 2) return 0
  lw t0, stageWords+8(zero)
  li t1, 2
  beq t0, t1, .L1
  ; engine/data.e16.ts:467  return 0
  li a0, 0
  ret
.L1:
  ; engine/data.e16.ts:468  return stageWords[S_LAST] + 1 - stageWords[S_HORIZON]
  lw t0, stageWords+12(zero)
  lw t1, stageWords+4(zero)
  addi t0, t0, 1
  sub a0, t0, t1
.return:
  ret

; engine/data.e16.ts:472 stageShow() at -O1
stageShow:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/data.e16.ts:473  if (!scrollMade) return
  lw t0, 0x176e(zero)
  bnez t0, .L1
  ; engine/data.e16.ts:473  return
  j .return
.L1:
  ; engine/data.e16.ts:474  scrollMade = false
  sw zero, 0x176e(zero)
  ; engine/data.e16.ts:475  memcpy(RASTER, addr(bandNext), 72)
  li a0, 528
  la a1, bandNext
  li a2, 72
  mcpy a0, a1, a2
  ; engine/data.e16.ts:476  if (stageWords[S_RASTER] !== 2) return
  lw t0, stageWords+8(zero)
  li t1, 2
  beq t0, t1, .L2
  ; engine/data.e16.ts:476  return
  j .return
.L2:
  ; engine/data.e16.ts:477  raster_lines(addr(lineTab) + lineBack * 2, stageWords[S_HORIZON], stageWords[S_LAST])
  lw t0, 0x176a(zero)
  slli t0, t0, 1
  lw t1, stageWords+4(zero)
  lw t2, stageWords+12(zero)
  addi a0, t0, lineTab
  mv a1, t1
  mv a2, t2
  call raster_lines
  ; engine/data.e16.ts:478  lineBack = LINES_MAX - lineBack
  lw t0, 0x176a(zero)
  li t1, 120
  sub t1, t1, t0
  sw t1, 0x176a(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/data.e16.ts:482 stageMusic() at -O1
stageMusic:
  ; engine/data.e16.ts:483  return stageWords[S_MUSIC]
  lw a0, stageWords+2(zero)
.return:
  ret

; engine/data.e16.ts:487 stageClearTile() at -O1
stageClearTile:
  ; engine/data.e16.ts:488  return stTile[0]
  lw a0, stTile(zero)
.return:
  ret

; engine/data.e16.ts:539 oppLoad(i, k, pos) at -O1
;   i in s2
;   k in 4(fp)
;   pos in 2(fp)
;   old in 6(fp)
;   c in s1
;   least/r in s3
;   r/read in 0(fp)
oppLoad:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s2, a0 ; i
  sw a1, 4(fp) ; k
  sw a2, 2(fp) ; pos
  ; engine/data.e16.ts:540  const old = bank(OPPONENTS_BANK)
  li a0, 365
  call bank
  sw a0, 6(fp) ; old
  ; engine/data.e16.ts:541  let c: u16 = 0
  li s1, 0 ; c
  ; engine/data.e16.ts:542  while (c < OW) {
  j .L3
.L1:
  ; engine/data.e16.ts:543  opp[i * OW + c] = peek16(OPPONENTS_AT + (k * OW + c) * 2)
  slli t0, s2, 5
  add t0, t0, s1
  slli t0, t0, 1
  lw t1, 4(fp) ; k
  slli t1, t1, 5
  add t1, t1, s1
  slli t1, t1, 1
  li t2, 51520
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, opp(t0)
  ; engine/data.e16.ts:544  c++
  addi s1, s1, 1
.L3:
  li t0, 32
  bltu s1, t0, .L1
  ; engine/data.e16.ts:546  poke16(IO_BANK, old)
  lw t0, 6(fp) ; old
  li t1, 65284
  sw t0, 0(t1)
  ; engine/data.e16.ts:547  c = O_R_GUARD
  li s1, 3 ; c
  ; engine/data.e16.ts:548  while (c <= O_R_SWITCH) {
  j .L7
.L5:
  ; engine/data.e16.ts:549  const least = c === O_R_TECH ? TECH_MIN : REACT_MIN
  li t0, 6
  bne s1, t0, .L9
  li t0, 4
  j .L10
.L9:
  li t0, 8
.L10:
  mv s3, t0 ; least/r
  ; engine/data.e16.ts:550  const r = opp[i * OW + c]
  slli t0, s2, 5
  add t0, t0, s1
  slli t0, t0, 1
  lw t0, opp(t0)
  sw t0, 0(fp) ; r/read
  ; engine/data.e16.ts:551  opp[i * OW + c] = r >= least + pos * 2 ? r - pos * 2 : least
  slli t0, s2, 5
  add t0, t0, s1
  slli t0, t0, 1
  lw t1, 2(fp) ; pos
  slli t1, t1, 1
  add t1, s3, t1
  addi t0, t0, opp
  mv t2, t1
  lw t1, 0(fp)
  bltu t1, t2, .L11
  lw t1, 2(fp) ; pos
  slli t1, t1, 1
  lw t2, 0(fp) ; r/read
  sub t1, t2, t1
  j .L12
.L11:
  mv t1, s3
.L12:
  sw t1, 0(t0)
  ; engine/data.e16.ts:552  c++
  addi s1, s1, 1
.L7:
  li t0, 7
  bgeu t0, s1, .L5
  ; engine/data.e16.ts:555  const r = opp[i * OW + O_READ]
  slli t0, s2, 5
  addi t0, t0, 11
  slli t0, t0, 1
  lw s3, opp(t0)
  ; engine/data.e16.ts:556  if (r === 0) return
  bne s3, zero, .L13
  ; engine/data.e16.ts:556  return
  j .return
.L13:
  ; engine/data.e16.ts:557  const read = r + pos * READ_STEP
  li t0, 26
  lw t1, 2(fp) ; pos
  mul t1, t1, t0
  add t1, s3, t1
  sw t1, 0(fp) ; r/read
  ; engine/data.e16.ts:558  opp[i * OW + O_READ] = read > 255 ? 255 : read
  slli t0, s2, 5
  addi t0, t0, 11
  slli t0, t0, 1
  addi t0, t0, opp
  lw t1, 0(fp)
  li t2, 255
  bgeu t2, t1, .L14
  li t1, 255
  j .L15
.L14:
  lw t1, 0(fp)
.L15:
  sw t1, 0(t0)
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s2, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; engine/data.e16.ts:562 oppWord(k, c) at -O1
;   k in s1
;   c in s2
;   old in s3
;   v in s0
oppWord:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; k
  mv s2, a1 ; c
  ; engine/data.e16.ts:563  const old = bank(OPPONENTS_BANK)
  li a0, 365
  call bank
  mv s3, a0 ; old
  ; engine/data.e16.ts:564  const v = peek16(OPPONENTS_AT + (k * OW + c) * 2)
  slli t0, s1, 5
  add t0, t0, s2
  slli t0, t0, 1
  li t1, 51520
  add t1, t1, t0
  lw s0, 0(t1)
  ; engine/data.e16.ts:565  poke16(IO_BANK, old)
  li t0, 65284
  sw s3, 0(t0)
  ; engine/data.e16.ts:566  return v
  mv a0, s0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; engine/data.e16.ts:571 weightsLoad(i, band, sit) at -O1
;   i in s2
;   band in s3
;   sit in 0(fp)
;   old in 2(fp)
;   from in 4(fp)
;   k in s1
weightsLoad:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; i
  mv s3, a1 ; band
  sw a2, 0(fp) ; sit
  ; engine/data.e16.ts:572  const old = bank(WEIGHTS_BANK)
  li a0, 365
  call bank
  sw a0, 2(fp) ; old
  ; engine/data.e16.ts:573  const from = WEIGHTS_AT + (opp[i * OW + O_WEIGHTS] * 18 + band * 6 + sit) * 10 * 2
  slli t0, s2, 5
  addi t0, t0, 25
  slli t0, t0, 1
  lw t0, opp(t0)
  slli t1, t0, 4
  slli t0, t0, 1
  add t0, t0, t1
  slli t2, s3, 2
  slli t1, s3, 1
  add t1, t1, t2
  add t0, t0, t1
  lw t1, 0(fp) ; sit
  add t0, t0, t1
  slli t1, t0, 3
  slli t0, t0, 1
  add t0, t0, t1
  slli t0, t0, 1
  li t1, 51840
  add t1, t1, t0
  sw t1, 4(fp) ; from
  ; engine/data.e16.ts:574  let k: u16 = 0
  li s1, 0 ; k
  ; engine/data.e16.ts:575  while (k < 10) {
  j .L3
.L1:
  ; engine/data.e16.ts:576  wrow[k] = peek16(from + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t2, 4(fp) ; from
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, wrow(t0)
  ; engine/data.e16.ts:577  k++
  addi s1, s1, 1
.L3:
  li t0, 10
  bltu s1, t0, .L1
  ; engine/data.e16.ts:579  poke16(IO_BANK, old)
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

; engine/data.e16.ts:583 patternWord(p, k) at -O1
;   p in s1
;   k in s2
;   old in s3
;   v in s0
patternWord:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; p
  mv s2, a1 ; k
  ; engine/data.e16.ts:584  const old = bank(PATTERNS_BANK)
  li a0, 365
  call bank
  mv s3, a0 ; old
  ; engine/data.e16.ts:585  const v = peek16(PATTERNS_AT + (p * 8 + k) * 2)
  slli t0, s1, 3
  add t0, t0, s2
  slli t0, t0, 1
  li t1, 53640
  add t1, t1, t0
  lw s0, 0(t1)
  ; engine/data.e16.ts:586  poke16(IO_BANK, old)
  li t0, 65284
  sw s3, 0(t0)
  ; engine/data.e16.ts:587  return v
  mv a0, s0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; engine/data.e16.ts:592 oppNamesIn() at -O1
oppNamesIn:
  ; engine/data.e16.ts:593  oppName[0] = str('PACKET')
  la t0, str_9
  sw t0, oppName(zero)
  ; engine/data.e16.ts:594  oppName[1] = str('MAINFRAME')
  la t0, str_10
  sw t0, oppName+2(zero)
  ; engine/data.e16.ts:595  oppName[2] = str('DAEMON')
  la t0, str_11
  sw t0, oppName+4(zero)
  ; engine/data.e16.ts:596  oppName[3] = str('KERNEL')
  la t0, str_12
  sw t0, oppName+6(zero)
  ; engine/data.e16.ts:597  oppName[4] = str('ROOT')
  la t0, str_13
  sw t0, oppName+8(zero)
.return:
  ret

; engine/input.e16.ts:42 buttonSetIs(t) at -O1
;   t in a0
buttonSetIs:
  ; engine/input.e16.ts:43  buttonSet = t & 1
  andi t0, a0, 1
  sw t0, 0x181c(zero)
.return:
  ret

; engine/input.e16.ts:53 ringStep() at -O1
ringStep:
  ; engine/input.e16.ts:54  ringAt = (ringAt + 1) & 15
  lw t0, 0x189e(zero)
  addi t0, t0, 1
  andi t0, t0, 15
  sw t0, 0x189e(zero)
  ; engine/input.e16.ts:55  ringH[ringAt] = 0
  lw t0, 0x189e(zero)
  slli t0, t0, 1
  sw zero, ringH(t0)
  ; engine/input.e16.ts:56  ringD[ringAt] = 0
  lw t0, 0x189e(zero)
  slli t0, t0, 1
  sw zero, ringD(t0)
  ; engine/input.e16.ts:57  ringH[16 + ringAt] = 0
  lw t0, 0x189e(zero)
  addi t0, t0, 16
  slli t0, t0, 1
  sw zero, ringH(t0)
  ; engine/input.e16.ts:58  ringD[16 + ringAt] = 0
  lw t0, 0x189e(zero)
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
  lw t1, 0x189e(zero)
  add t0, t0, t1
  slli t0, t0, 1
  sw a1, ringH(t0)
  ; engine/input.e16.ts:76  ringD[i * 16 + ringAt] = down
  slli t0, a0, 4
  lw t1, 0x189e(zero)
  add t0, t0, t1
  slli t0, t0, 1
  sw a2, ringD(t0)
.return:
  ret

; engine/input.e16.ts:84 inputPad(i, faceRight) at -O1
;   i in s0
;   faceRight in s2
;   p in s3
;   held in s1
inputPad:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  mv s0, a0 ; i
  mv s2, a1 ; faceRight
  ; engine/input.e16.ts:85  const p = padNow()
  ; lib/kit.e16.ts:328  return padIs
  lw s3, 0x0884(zero)
  ; engine/input.e16.ts:86  let held = padButtons(p)
  mv a0, s3
  call padButtons
  mv s1, a0 ; held
  ; engine/input.e16.ts:87  if ((p & B_LEFT) !== 0) held |= faceRight ? I_BACK : I_FWD
  andi t0, s3, 4
  beq t0, zero, .L1
  ; engine/input.e16.ts:87  held |= faceRight ? I_BACK : I_FWD
  mv t0, s1
  mv t1, s2
  beqz t1, .L2
  li t1, 4
  j .L3
.L2:
  li t1, 8
.L3:
  or s1, t0, t1
.L1:
  ; engine/input.e16.ts:88  if ((p & B_RIGHT) !== 0) held |= faceRight ? I_FWD : I_BACK
  andi t0, s3, 8
  beq t0, zero, .L4
  ; engine/input.e16.ts:88  held |= faceRight ? I_FWD : I_BACK
  mv t0, s1
  mv t1, s2
  beqz t1, .L5
  li t1, 8
  j .L6
.L5:
  li t1, 4
.L6:
  or s1, t0, t1
.L4:
  ; engine/input.e16.ts:89  inputPut(i, held, padPresses(faceRight))
  mv a0, s2
  call padPresses
  mv a1, s1
  mv a2, a0
  mv a0, s0
  call inputPut
  ; engine/input.e16.ts:90  lastHeld[i] = held
  slli t0, s0, 1
  sw s1, lastHeld(t0)
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; engine/input.e16.ts:94 lightKick() at -O1
lightKick:
  ; engine/input.e16.ts:95  return buttonSet === 0 ? B_B : B_A
  lw t0, 0x181c(zero)
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
  lw t0, 0x181c(zero)
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

; engine/input.e16.ts:115 padPresses(faceRight) at -O1
;   faceRight in s2
;   down in s1
padPresses:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; faceRight
  ; engine/input.e16.ts:116  let down: u16 = 0
  li s1, 0 ; down
  ; engine/input.e16.ts:117  if (pressed(B_LEFT)) down |= faceRight ? I_BACK : I_FWD
  li a0, 4
  call pressed
  beqz a0, .L1
  ; engine/input.e16.ts:117  down |= faceRight ? I_BACK : I_FWD
  mv t0, s1
  mv t1, s2
  beqz t1, .L2
  li t1, 4
  j .L3
.L2:
  li t1, 8
.L3:
  or s1, t0, t1
.L1:
  ; engine/input.e16.ts:118  if (pressed(B_RIGHT)) down |= faceRight ? I_FWD : I_BACK
  li a0, 8
  call pressed
  beqz a0, .L4
  ; engine/input.e16.ts:118  down |= faceRight ? I_FWD : I_BACK
  mv t0, s1
  mv t1, s2
  beqz t1, .L5
  li t1, 8
  j .L6
.L5:
  li t1, 4
.L6:
  or s1, t0, t1
.L4:
  ; engine/input.e16.ts:119  if (pressed(B_Y)) down |= I_LP
  li a0, 128
  call pressed
  beqz a0, .L7
  ; engine/input.e16.ts:119  down |= I_LP
  ori s1, s1, 16
.L7:
  ; engine/input.e16.ts:120  if (pressed(B_X)) down |= I_HP
  li a0, 64
  call pressed
  beqz a0, .L8
  ; engine/input.e16.ts:120  down |= I_HP
  ori s1, s1, 32
.L8:
  ; engine/input.e16.ts:121  if (pressed(lightKick())) down |= I_LK
  call lightKick
  call pressed
  beqz a0, .L9
  ; engine/input.e16.ts:121  down |= I_LK
  ori s1, s1, 64
.L9:
  ; engine/input.e16.ts:122  if (pressed(heavyKick())) down |= I_HK
  call heavyKick
  call pressed
  beqz a0, .L10
  ; engine/input.e16.ts:122  down |= I_HK
  ori s1, s1, 128
.L10:
  ; engine/input.e16.ts:123  if (pressed(B_UP)) down |= I_UP
  li a0, 1
  call pressed
  beqz a0, .L11
  ; engine/input.e16.ts:123  down |= I_UP
  ori s1, s1, 1
.L11:
  ; engine/input.e16.ts:124  if (pressed(B_DOWN)) down |= I_DOWN
  li a0, 2
  call pressed
  beqz a0, .L12
  ; engine/input.e16.ts:124  down |= I_DOWN
  ori s1, s1, 2
.L12:
  ; engine/input.e16.ts:125  return down
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; engine/input.e16.ts:129 inputHeld(i, held) at -O1
;   i in s1
;   held in s2
inputHeld:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; held
  ; engine/input.e16.ts:130  inputPut(i, held, held & ~lastHeld[i])
  slli t0, s1, 1
  lw t0, lastHeld(t0)
  not t0, t0
  and t0, s2, t0
  mv a0, s1
  mv a1, s2
  mv a2, t0
  call inputPut
  ; engine/input.e16.ts:131  lastHeld[i] = held
  slli t0, s1, 1
  sw s2, lastHeld(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/input.e16.ts:135 inputExt(i) at -O1
;   i in s1
inputExt:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/input.e16.ts:136  inputHeld(i, extHeld[i])
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

; engine/input.e16.ts:140 inputNone(i) at -O1
;   i in s1
inputNone:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/input.e16.ts:141  inputHeld(i, 0)
  mv a0, s1
  li a1, 0
  call inputHeld
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/input.e16.ts:145 heldNow(i) at -O1
;   i in a0
heldNow:
  ; engine/input.e16.ts:146  return ringH[i * 16 + ringAt]
  slli t0, a0, 4
  lw t1, 0x189e(zero)
  add t0, t0, t1
  slli t0, t0, 1
  lw a0, ringH(t0)
.return:
  ret

; engine/input.e16.ts:150 buffered(i, mask) at -O1
;   i in s1
;   mask in s2
buffered:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; mask
  ; engine/input.e16.ts:151  return pressedIn(i, mask, BUFFER)
  mv a0, s1
  mv a1, s2
  li a2, 8
  call pressedIn
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/input.e16.ts:155 pressedIn(i, mask, n) at -O1
;   i in a0
;   mask in a1
;   n in a2
;   out in s1
;   k in a3
;   at in s2
pressedIn:
  addi sp, sp, -4
  sw s1, 0(sp)
  sw s2, 2(sp)
  ; engine/input.e16.ts:156  let out: u16 = 0
  li s1, 0 ; out
  ; engine/input.e16.ts:157  let k: u16 = 0
  li a3, 0 ; k
  ; engine/input.e16.ts:158  let at = ringAt
  lw s2, 0x189e(zero)
  ; engine/input.e16.ts:159  while (k < n && k < BUFFER) {
  j .L3
.L1:
  ; engine/input.e16.ts:160  out |= ringD[i * 16 + at]
  slli t0, a0, 4
  add t0, t0, s2
  slli t0, t0, 1
  lw t0, ringD(t0)
  or s1, s1, t0
  ; engine/input.e16.ts:161  at = (at + 15) & 15
  addi t0, s2, 15
  andi s2, t0, 15
  ; engine/input.e16.ts:162  k++
  addi a3, a3, 1
.L3:
  bgeu a3, a2, .L5
  li t0, 8
  bltu a3, t0, .L1
.L5:
  ; engine/input.e16.ts:164  return out & mask
  and a0, s1, a1
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  addi sp, sp, 4
  ret

; engine/input.e16.ts:168 pressNow(i) at -O1
;   i in a0
pressNow:
  ; engine/input.e16.ts:169  return ringD[i * 16 + ringAt]
  slli t0, a0, 4
  lw t1, 0x189e(zero)
  add t0, t0, t1
  slli t0, t0, 1
  lw a0, ringD(t0)
.return:
  ret

; engine/input.e16.ts:173 pressedBefore(i, mask, n) at -O1
;   i in a0
;   mask in a1
;   n in a2
;   k in a3
pressedBefore:
  ; engine/input.e16.ts:174  let k: u16 = 1
  li a3, 1 ; k
  ; engine/input.e16.ts:175  while (k <= n) {
  j .L3
.L1:
  ; engine/input.e16.ts:176  if ((ringD[i * 16 + ((ringAt - k) & 15)] & mask) !== 0) return true
  slli t0, a0, 4
  lw t1, 0x189e(zero)
  sub t1, t1, a3
  andi t1, t1, 15
  add t0, t0, t1
  slli t0, t0, 1
  lw t0, ringD(t0)
  and t0, t0, a1
  beq t0, zero, .L5
  ; engine/input.e16.ts:176  return true
  li a0, 1
  ret
.L5:
  ; engine/input.e16.ts:177  k++
  addi a3, a3, 1
.L3:
  bgeu a2, a3, .L1
  ; engine/input.e16.ts:179  return false
  li a0, 0
.return:
  ret

; engine/input.e16.ts:183 consume(i, mask) at -O1
;   i in a0
;   mask in a1
;   k in a2
;   at in a3
consume:
  ; engine/input.e16.ts:184  let k: u16 = 0
  li a2, 0 ; k
  ; engine/input.e16.ts:185  let at = ringAt
  lw a3, 0x189e(zero)
  ; engine/input.e16.ts:186  while (k < BUFFER) {
  j .L3
.L1:
  ; engine/input.e16.ts:187  ringD[i * 16 + at] &= ~mask
  slli t0, a0, 4
  add t0, t0, a3
  slli t0, t0, 1
  addi t0, t0, ringD
  mv t1, t0
  lw t1, 0(t1)
  not t2, a1
  and t1, t1, t2
  sw t1, 0(t0)
  ; engine/input.e16.ts:188  at = (at + 15) & 15
  addi t0, a3, 15
  andi a3, t0, 15
  ; engine/input.e16.ts:189  k++
  addi a2, a2, 1
.L3:
  li t0, 8
  bltu a2, t0, .L1
.return:
  ret

; engine/fighter.e16.ts:181 fighterReset(i) at -O1
;   i in s1
;   left in s2
fighterReset:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:182  const left = i === 0
  sub t0, s1, zero
  seqz s2, t0
  ; engine/fighter.e16.ts:183  fX[i] = (left ? 256 - START_HALF : 256 + START_HALF) * 16
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
  ; engine/fighter.e16.ts:184  fY[i] = 0
  slli t0, s1, 1
  sw zero, fY(t0)
  ; engine/fighter.e16.ts:185  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/fighter.e16.ts:186  fVY[i] = 0
  slli t0, s1, 1
  sw zero, fVY(t0)
  ; engine/fighter.e16.ts:187  fFace[i] = left ? 1 : 0
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
  ; engine/fighter.e16.ts:188  fState[i] = ST_STAND
  slli t0, s1, 1
  sw zero, fState(t0)
  ; engine/fighter.e16.ts:189  fStateT[i] = 0
  slli t0, s1, 1
  sw zero, fStateT(t0)
  ; engine/fighter.e16.ts:190  fLife[i] = prAt(i, P_LIFE)
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
  ; engine/fighter.e16.ts:191  fMove[i] = 0
  slli t0, s1, 1
  sw zero, fMove(t0)
  ; engine/fighter.e16.ts:192  fMoveF[i] = 0
  slli t0, s1, 1
  sw zero, fMoveF(t0)
  ; engine/fighter.e16.ts:193  fHitDone[i] = 0
  slli t0, s1, 1
  sw zero, fHitDone(t0)
  ; engine/fighter.e16.ts:194  fCombo[i] = 0
  slli t0, s1, 1
  sw zero, fCombo(t0)
  ; engine/fighter.e16.ts:195  fStun[i] = 0
  slli t0, s1, 1
  sw zero, fStun(t0)
  ; engine/fighter.e16.ts:196  fCrouch[i] = 0
  slli t0, s1, 1
  sw zero, fCrouch(t0)
  ; engine/fighter.e16.ts:197  fAir[i] = 0
  slli t0, s1, 1
  sw zero, fAir(t0)
  ; engine/fighter.e16.ts:198  fAirUsed[i] = 0
  slli t0, s1, 1
  sw zero, fAirUsed(t0)
  ; engine/fighter.e16.ts:199  fKnock[i] = 0
  slli t0, s1, 1
  sw zero, fKnock(t0)
  ; engine/fighter.e16.ts:200  fPush[i] = 0
  slli t0, s1, 1
  sw zero, fPush(t0)
  ; engine/fighter.e16.ts:201  fThrowInv[i] = 0
  slli t0, s1, 1
  sw zero, fThrowInv(t0)
  ; engine/fighter.e16.ts:202  fWin[i] = 0
  slli t0, s1, 1
  sw zero, fWin(t0)
  ; engine/fighter.e16.ts:203  fBreath[i] = 0
  slli t0, s1, 1
  sw zero, fBreath(t0)
  ; engine/fighter.e16.ts:204  fPose[i] = PO_STAND
  slli t0, s1, 1
  sw zero, fPose(t0)
  ; engine/fighter.e16.ts:205  boxPose[i] = 0xffff
  slli t0, s1, 1
  li t1, 65535
  sw t1, boxPose(t0)
  ; engine/fighter.e16.ts:206  artHold[i] = 0
  slli t0, s1, 1
  sw zero, artHold(t0)
  ; engine/fighter.e16.ts:207  artPic[i] = 0xffff
  slli t0, s1, 1
  li t1, 65535
  sw t1, artPic(t0)
  ; engine/fighter.e16.ts:208  fRowT[i] = 0
  slli t0, s1, 1
  sw zero, fRowT(t0)
  ; engine/fighter.e16.ts:209  fRowWas[i] = PO_STAND
  slli t0, s1, 1
  sw zero, fRowWas(t0)
  ; engine/fighter.e16.ts:210  poseLoad(i, fSlot[i], PO_STAND)
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

; engine/fighter.e16.ts:214 faceSign(i) at -O1
;   i in a0
faceSign:
  ; engine/fighter.e16.ts:215  return fFace[i] !== 0 ? 1 : -1
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

; engine/fighter.e16.ts:224 pointX(i) at -O1
;   i in a0
pointX:
  ; engine/fighter.e16.ts:225  return fFace[i] !== 0 ? fX[i] >> 4 : (fX[i] + 15) >> 4
  slli t0, a0, 1
  lw t0, fFace(t0)
  beq t0, zero, .L1
  slli t0, a0, 1
  lw t0, fX(t0)
  srli t0, t0, 4
  j .L2
.L1:
  slli t0, a0, 1
  lw t0, fX(t0)
  addi t0, t0, 15
  srli t0, t0, 4
.L2:
  mv a0, t0
.return:
  ret

; engine/fighter.e16.ts:228 enter(i, st) at -O1
;   i in a0
;   st in a1
enter:
  ; engine/fighter.e16.ts:229  fState[i] = st
  slli t0, a0, 1
  sw a1, fState(t0)
  ; engine/fighter.e16.ts:230  fStateT[i] = 0
  slli t0, a0, 1
  sw zero, fStateT(t0)
  ; engine/fighter.e16.ts:231  fRowT[i] = 0xffff
  slli t0, a0, 1
  li t1, 65535
  sw t1, fRowT(t0)
.return:
  ret

; engine/fighter.e16.ts:235 fightersSeen() at -O1
fightersSeen:
  ; engine/fighter.e16.ts:236  was[0] = fX[0]
  lw t0, fX(zero)
  sw t0, was(zero)
  ; engine/fighter.e16.ts:237  was[1] = fX[1]
  lw t0, fX+2(zero)
  sw t0, was+2(zero)
.return:
  ret

; engine/fighter.e16.ts:246 fighterStep(i) at -O1
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
  ; engine/fighter.e16.ts:247  if (fThrowInv[i] > 0) fThrowInv[i]--
  slli t0, s1, 1
  lw t0, fThrowInv(t0)
  bgeu zero, t0, .L1
  ; engine/fighter.e16.ts:247  fThrowInv[i]--
  slli t0, s1, 1
  addi t0, t0, fThrowInv
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
.L1:
  ; engine/fighter.e16.ts:248  const st = fState[i]
  slli t0, s1, 1
  lw s2, fState(t0)
  ; engine/fighter.e16.ts:249  if (st === ST_THROW || st === ST_THROWN) {
  li t0, 11
  beq s2, t0, .L3
  li t0, 12
  bne s2, t0, .L2
.L3:
  ; engine/fighter.e16.ts:250  poseSet(i)
  mv a0, s1
  call poseSet
  ; engine/fighter.e16.ts:251  return
  j .return
.L2:
  ; engine/fighter.e16.ts:253  if (st === ST_ATTACK) attackStep(i)
  li t0, 5
  bne s2, t0, .L4
  ; engine/fighter.e16.ts:253  attackStep(i)
  mv a0, s1
  call attackStep
  j .L5
.L4:
  ; engine/fighter.e16.ts:254  if (st === ST_DASH || st === ST_BACKDASH) dashStep(i, st)
  li t0, 13
  beq s2, t0, .L7
  li t0, 14
  bne s2, t0, .L6
.L7:
  ; engine/fighter.e16.ts:254  dashStep(i, st)
  mv a0, s1
  mv a1, s2
  call dashStep
  j .L8
.L6:
  ; engine/fighter.e16.ts:255  if (st === ST_HIT || st === ST_GUARD) stunStep(i)
  li t0, 6
  beq s2, t0, .L10
  li t0, 7
  bne s2, t0, .L9
.L10:
  ; engine/fighter.e16.ts:255  stunStep(i)
  mv a0, s1
  call stunStep
  j .L11
.L9:
  ; engine/fighter.e16.ts:256  if (st === ST_PREJUMP) prejumpStep(i)
  li t0, 2
  bne s2, t0, .L12
  ; engine/fighter.e16.ts:256  prejumpStep(i)
  mv a0, s1
  call prejumpStep
  j .L13
.L12:
  ; engine/fighter.e16.ts:257  if (st === ST_JUMP) jumpStep(i)
  li t0, 3
  bne s2, t0, .L14
  ; engine/fighter.e16.ts:257  jumpStep(i)
  mv a0, s1
  call jumpStep
  j .L15
.L14:
  ; engine/fighter.e16.ts:258  timedStep(i, st)
  mv a0, s1
  mv a1, s2
  call timedStep
.L15:
.L13:
.L11:
.L8:
.L5:
  ; engine/fighter.e16.ts:259  const now = fState[i]
  slli t0, s1, 1
  lw s3, fState(t0)
  ; engine/fighter.e16.ts:260  if (now === ST_STAND || now === ST_CROUCH) freeStep(i)
  beq s3, zero, .L17
  li t0, 1
  bne s3, t0, .L16
.L17:
  ; engine/fighter.e16.ts:260  freeStep(i)
  mv a0, s1
  call freeStep
.L16:
  ; engine/fighter.e16.ts:261  if (fAir[i] !== 0) fVY[i] = wrap16(fVY[i] - prAt(i, P_GRAVITY))
  slli t0, s1, 1
  lw t0, fAir(t0)
  beq t0, zero, .L18
  ; engine/fighter.e16.ts:261  fVY[i] = wrap16(fVY[i] - prAt(i, P_GRAVITY))
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
.L18:
  ; engine/fighter.e16.ts:262  poseSet(i)
  mv a0, s1
  call poseSet
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:266 timedStep(i, st) at -O1
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
  ; engine/fighter.e16.ts:267  if (st !== ST_LAND && st !== ST_DOWN && st !== ST_WAKE) return
  li t0, 4
  beq s2, t0, .L1
  li t0, 8
  beq s2, t0, .L1
  li t0, 9
  beq s2, t0, .L1
  ; engine/fighter.e16.ts:267  return
  j .return
.L1:
  ; engine/fighter.e16.ts:268  fStateT[i]++
  slli t0, s1, 1
  addi t0, t0, fStateT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:269  const t = fStateT[i]
  slli t0, s1, 1
  lw s3, fStateT(t0)
  ; engine/fighter.e16.ts:270  if (st === ST_LAND && t >= LAND_F) enter(i, ST_STAND)
  li t0, 4
  bne s2, t0, .L2
  li t0, 3
  bltu s3, t0, .L2
  ; engine/fighter.e16.ts:270  enter(i, ST_STAND)
  mv a0, s1
  li a1, 0
  call enter
.L2:
  ; engine/fighter.e16.ts:271  if (st === ST_DOWN && t >= DOWN_F) enter(i, fLife[i] === 0 ? ST_DEAD : ST_WAKE)
  li t0, 8
  bne s2, t0, .L3
  li t0, 36
  bltu s3, t0, .L3
  ; engine/fighter.e16.ts:271  enter(i, fLife[i] === 0 ? ST_DEAD : ST_WAKE)
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
  ; engine/fighter.e16.ts:272  if (st === ST_WAKE && t >= WAKE_F) {
  li t0, 9
  bne s2, t0, .L6
  li t0, 12
  bltu s3, t0, .L6
  ; engine/fighter.e16.ts:273  enter(i, ST_STAND)
  mv a0, s1
  li a1, 0
  call enter
  ; engine/fighter.e16.ts:274  fThrowInv[i] = WAKE_THROW_INVUL
  slli t0, s1, 1
  li t1, 2
  sw t1, fThrowInv(t0)
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:279 freeStep(i) at -O1
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
  ; engine/fighter.e16.ts:280  faceOther(i)
  mv a0, s1
  call faceOther
  ; engine/fighter.e16.ts:281  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/fighter.e16.ts:282  fCombo[i] = 0
  slli t0, s1, 1
  sw zero, fCombo(t0)
  ; engine/fighter.e16.ts:283  const held = heldNow(i)
  mv a0, s1
  call heldNow
  mv s2, a0 ; held
  ; engine/fighter.e16.ts:284  const crouch = (held & I_DOWN) !== 0
  andi t0, s2, 2
  sub t0, t0, zero
  snez s3, t0
  ; engine/fighter.e16.ts:285  if (attackTry(i, crouch ? 1 : 0)) return
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
  ; engine/fighter.e16.ts:285  return
  j .return
.L1:
  ; engine/fighter.e16.ts:286  if (!crouch && dashTry(i)) return
  bnez s3, .L4
  mv a0, s1
  call dashTry
  beqz a0, .L4
  ; engine/fighter.e16.ts:286  return
  j .return
.L4:
  ; engine/fighter.e16.ts:287  if ((held & I_UP) !== 0) {
  andi t0, s2, 1
  beq t0, zero, .L5
  ; engine/fighter.e16.ts:288  enter(i, ST_PREJUMP)
  mv a0, s1
  li a1, 2
  call enter
  ; engine/fighter.e16.ts:289  fJump[i] = (held & I_FWD) !== 0 ? 1 : (held & I_BACK) !== 0 ? 2 : 0
  slli t0, s1, 1
  andi t1, s2, 8
  addi t0, t0, fJump
  li t2, 0
  beq t1, t2, .L6
  li t1, 1
  j .L7
.L6:
  andi t1, s2, 4
  li t2, 0
  beq t1, t2, .L8
  li t1, 2
  j .L9
.L8:
  li t1, 0
.L9:
.L7:
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:290  return
  j .return
.L5:
  ; engine/fighter.e16.ts:292  if (crouch) {
  beqz s3, .L10
  ; engine/fighter.e16.ts:293  if (fState[i] !== ST_CROUCH) enter(i, ST_CROUCH)
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 1
  beq t0, t1, .L11
  ; engine/fighter.e16.ts:293  enter(i, ST_CROUCH)
  mv a0, s1
  li a1, 1
  call enter
.L11:
  ; engine/fighter.e16.ts:294  return
  j .return
.L10:
  ; engine/fighter.e16.ts:296  if (fState[i] !== ST_STAND) enter(i, ST_STAND)
  slli t0, s1, 1
  lw t0, fState(t0)
  beq t0, zero, .L12
  ; engine/fighter.e16.ts:296  enter(i, ST_STAND)
  mv a0, s1
  li a1, 0
  call enter
.L12:
  ; engine/fighter.e16.ts:297  walk(i, held)
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

; engine/fighter.e16.ts:301 faceOther(i) at -O1
;   i in a0
faceOther:
  ; engine/fighter.e16.ts:302  if (was[1 - i] > fX[i]) fFace[i] = 1
  li t0, 1
  sub t0, t0, a0
  slli t0, t0, 1
  lw t0, was(t0)
  slli t1, a0, 1
  lw t1, fX(t1)
  bgeu t1, t0, .L1
  ; engine/fighter.e16.ts:302  fFace[i] = 1
  slli t0, a0, 1
  li t1, 1
  sw t1, fFace(t0)
  j .L2
.L1:
  ; engine/fighter.e16.ts:303  if (was[1 - i] < fX[i]) fFace[i] = 0
  li t0, 1
  sub t0, t0, a0
  slli t0, t0, 1
  lw t0, was(t0)
  slli t1, a0, 1
  lw t1, fX(t1)
  bgeu t0, t1, .L3
  ; engine/fighter.e16.ts:303  fFace[i] = 0
  slli t0, a0, 1
  sw zero, fFace(t0)
.L3:
.L2:
.return:
  ret

; engine/fighter.e16.ts:307 walk(i, held) at -O1
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
  ; engine/fighter.e16.ts:308  const s = faceSign(i)
  mv a0, s1
  call faceSign
  mv s3, a0 ; s
  ; engine/fighter.e16.ts:309  if ((held & I_FWD) !== 0) fVX[i] = u16(s * i16(prAt(i, P_WALK_F)))
  andi t0, s2, 8
  beq t0, zero, .L1
  ; engine/fighter.e16.ts:309  fVX[i] = u16(s * i16(prAt(i, P_WALK_F)))
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
  ; engine/fighter.e16.ts:310  if ((held & I_BACK) !== 0) fVX[i] = u16(-s * i16(prAt(i, P_WALK_B)))
  andi t0, s2, 4
  beq t0, zero, .L3
  ; engine/fighter.e16.ts:310  fVX[i] = u16(-s * i16(prAt(i, P_WALK_B)))
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

; engine/fighter.e16.ts:317 attackTry(i, posture) at -O1
;   i in s3
;   posture in s0
;   b in s1
;   col in s2
attackTry:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; i
  mv s0, a1 ; posture
  ; engine/fighter.e16.ts:318  const b = buffered(i, I_ATTACKS)
  mv a0, s3
  li a1, 240
  call buffered
  mv s1, a0 ; b
  ; engine/fighter.e16.ts:319  if (b === 0) return false
  bne s1, zero, .L1
  ; engine/fighter.e16.ts:319  return false
  li a0, 0
  j .return
.L1:
  ; engine/fighter.e16.ts:320  if (posture === 0 && (b & I_HP) !== 0 && throwTry(i)) return true
  bne s0, zero, .L2
  andi t0, s1, 32
  beq t0, zero, .L2
  mv a0, s3
  call throwTry
  beqz a0, .L2
  ; engine/fighter.e16.ts:320  return true
  li a0, 1
  j .return
.L2:
  ; engine/fighter.e16.ts:321  let col: u16 = 0
  li s2, 0 ; col
  ; engine/fighter.e16.ts:322  if ((b & I_HP) !== 0) col = 1
  andi t0, s1, 32
  beq t0, zero, .L3
  ; engine/fighter.e16.ts:322  col = 1
  li s2, 1 ; col
  j .L4
.L3:
  ; engine/fighter.e16.ts:323  if ((b & I_HK) !== 0) col = 3
  andi t0, s1, 128
  beq t0, zero, .L5
  ; engine/fighter.e16.ts:323  col = 3
  li s2, 3 ; col
  j .L6
.L5:
  ; engine/fighter.e16.ts:324  if ((b & I_LP) !== 0) col = 0
  andi t0, s1, 16
  beq t0, zero, .L7
  ; engine/fighter.e16.ts:324  col = 0
  li s2, 0 ; col
  j .L8
.L7:
  ; engine/fighter.e16.ts:325  col = 2
  li s2, 2 ; col
.L8:
.L6:
.L4:
  ; engine/fighter.e16.ts:326  consume(i, I_ATTACKS)
  mv a0, s3
  li a1, 240
  call consume
  ; engine/fighter.e16.ts:327  moveStart(i, posture * 4 + col)
  slli t0, s0, 2
  add t0, t0, s2
  mv a0, s3
  mv a1, t0
  call moveStart
  ; engine/fighter.e16.ts:328  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; engine/fighter.e16.ts:336 throwTry(i) at -O1
;   i in s1
;   held in s2
;   d in s3
throwTry:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:337  const held = heldNow(i)
  mv a0, s1
  call heldNow
  mv s2, a0 ; held
  ; engine/fighter.e16.ts:338  if ((held & (I_FWD | I_BACK)) === 0) return false
  andi t0, s2, 12
  bne t0, zero, .L1
  ; engine/fighter.e16.ts:338  return false
  li a0, 0
  j .return
.L1:
  ; engine/fighter.e16.ts:339  const d = 1 - i
  li t0, 1
  sub s3, t0, s1
  ; engine/fighter.e16.ts:340  if (fY[d] !== 0 || fY[i] !== 0) return false
  slli t0, s3, 1
  lw t0, fY(t0)
  bne t0, zero, .L3
  slli t0, s1, 1
  lw t0, fY(t0)
  beq t0, zero, .L2
.L3:
  ; engine/fighter.e16.ts:340  return false
  li a0, 0
  j .return
.L2:
  ; engine/fighter.e16.ts:341  if (throwGap(i, was[i], was[d]) > prAt(i, P_THROW)) return false
  slli t0, s1, 1
  lw t0, was(t0)
  slli t1, s3, 1
  lw t1, was(t1)
  mv a0, s1
  mv a1, t0
  mv a2, t1
  call throwGap
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 8
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu a0, t0, .L4
  ; engine/fighter.e16.ts:341  return false
  li a0, 0
  j .return
.L4:
  ; engine/fighter.e16.ts:342  consume(i, I_ATTACKS)
  mv a0, s1
  li a1, 240
  call consume
  ; engine/fighter.e16.ts:343  fThrowBack[i] = (held & I_FWD) !== 0 ? 0 : 1
  slli t0, s1, 1
  andi t1, s2, 8
  addi t0, t0, fThrowBack
  li t2, 0
  beq t1, t2, .L5
  li t1, 0
  j .L6
.L5:
  li t1, 1
.L6:
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:344  moveStart(i, MV_THROW)
  mv a0, s1
  li a1, 12
  call moveStart
  ; engine/fighter.e16.ts:345  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:349 throwGap(a, xa, xd) at -O1
;   a in 2(fp)
;   xa in s1
;   xd in s2
;   dx in s3
;   h in 0(fp)
throwGap:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 2(fp) ; a
  mv s1, a1 ; xa
  mv s2, a2 ; xd
  ; engine/fighter.e16.ts:350  const dx = (xa > xd ? xa - xd : xd - xa) >> 4
  bgeu s2, s1, .L1
  sub t0, s1, s2
  j .L2
.L1:
  sub t0, s2, s1
.L2:
  srli s3, t0, 4
  ; engine/fighter.e16.ts:351  const h = half(1 - a)
  lw t0, 2(fp) ; a
  li t1, 1
  sub a0, t1, t0
  call half
  sw a0, 0(fp) ; h
  ; engine/fighter.e16.ts:352  return dx > h ? dx - h : 0
  lw t0, 0(fp) ; h
  bgeu t0, s3, .L3
  lw t0, 0(fp) ; h
  sub t0, s3, t0
  j .L4
.L3:
  li t0, 0
.L4:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/fighter.e16.ts:359 dashTry(i) at -O1
;   i in s1
;   now in s2
;   s in s3
dashTry:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:360  const now = pressNow(i)
  mv a0, s1
  call pressNow
  mv s2, a0 ; now
  ; engine/fighter.e16.ts:361  const s = faceSign(i)
  mv a0, s1
  call faceSign
  mv s3, a0 ; s
  ; engine/fighter.e16.ts:362  if ((now & I_FWD) !== 0 && pressedBefore(i, I_FWD, DASH_GAP)) {
  andi t0, s2, 8
  beq t0, zero, .L1
  mv a0, s1
  li a1, 8
  li a2, 10
  call pressedBefore
  beqz a0, .L1
  ; engine/fighter.e16.ts:363  consume(i, I_FWD | I_BACK)
  mv a0, s1
  li a1, 12
  call consume
  ; engine/fighter.e16.ts:364  enter(i, ST_DASH)
  mv a0, s1
  li a1, 13
  call enter
  ; engine/fighter.e16.ts:365  fVX[i] = u16(s * i16(prAt(i, P_DASH_V)))
  slli t0, s1, 1
  addi t0, t0, fVX
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 11
  call prAt
  mul t0, s3, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; engine/fighter.e16.ts:366  return true
  li a0, 1
  j .return
.L1:
  ; engine/fighter.e16.ts:368  if ((now & I_BACK) !== 0 && pressedBefore(i, I_BACK, DASH_GAP)) {
  andi t0, s2, 4
  beq t0, zero, .L2
  mv a0, s1
  li a1, 4
  li a2, 10
  call pressedBefore
  beqz a0, .L2
  ; engine/fighter.e16.ts:369  consume(i, I_FWD | I_BACK)
  mv a0, s1
  li a1, 12
  call consume
  ; engine/fighter.e16.ts:370  enter(i, ST_BACKDASH)
  mv a0, s1
  li a1, 14
  call enter
  ; engine/fighter.e16.ts:371  fVX[i] = u16(-s * i16(prAt(i, P_BACK_V)))
  slli t0, s1, 1
  neg t1, s3
  addi t0, t0, fVX
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  mv a0, s1
  li a1, 13
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mul t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; engine/fighter.e16.ts:372  return true
  li a0, 1
  j .return
.L2:
  ; engine/fighter.e16.ts:374  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:378 dashStep(i, st) at -O1
;   i in s1
;   st in s0
;   fwd in s2
;   s in s3
dashStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; i
  mv s0, a1 ; st
  ; engine/fighter.e16.ts:379  fStateT[i]++
  slli t0, s1, 1
  addi t0, t0, fStateT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:380  const fwd = st === ST_DASH
  li t0, 13
  sub t0, s0, t0
  seqz s2, t0
  ; engine/fighter.e16.ts:381  if (fStateT[i] >= prAt(i, fwd ? P_DASH_F : P_BACK_F)) {
  slli t0, s1, 1
  lw t0, fStateT(t0)
  mv t1, s1
  mv t2, s2
  beqz t2, .L2
  li t2, 10
  j .L3
.L2:
  li t2, 12
.L3:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  mv a1, t2
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu t0, a0, .L1
  ; engine/fighter.e16.ts:382  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/fighter.e16.ts:383  enter(i, ST_STAND)
  mv a0, s1
  li a1, 0
  call enter
  ; engine/fighter.e16.ts:384  return
  j .return
.L1:
  ; engine/fighter.e16.ts:386  const s = faceSign(i)
  mv a0, s1
  call faceSign
  mv s3, a0 ; s
  ; engine/fighter.e16.ts:387  fVX[i] = fwd ? u16(s * i16(prAt(i, P_DASH_V))) : u16(-s * i16(prAt(i, P_BACK_V)))
  slli t0, s1, 1
  addi t0, t0, fVX
  mv t1, s2
  beqz t1, .L4
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 11
  call prAt
  mul t0, s3, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  j .L5
.L4:
  neg t1, s3
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  mv a0, s1
  li a1, 13
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  mul t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
.L5:
  sw t1, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; engine/fighter.e16.ts:391 throwInvul(d) at -O1
;   d in a0
;   st in a1
throwInvul:
  ; engine/fighter.e16.ts:392  const st = fState[d]
  slli t0, a0, 1
  lw a1, fState(t0)
  ; engine/fighter.e16.ts:393  if (st === ST_WAKE || fThrowInv[d] > 0) return true
  li t0, 9
  beq a1, t0, .L2
  slli t0, a0, 1
  lw t0, fThrowInv(t0)
  bgeu zero, t0, .L1
.L2:
  ; engine/fighter.e16.ts:393  return true
  li a0, 1
  ret
.L1:
  ; engine/fighter.e16.ts:394  return st === ST_BACKDASH && fStateT[d] < BACKDASH_THROW_INVUL
  li t0, 14
  sub t0, a1, t0
  seqz t0, t0
  mv t1, t0
  beqz t1, .L3
  slli t0, a0, 1
  lw t0, fStateT(t0)
  sltiu t0, t0, 6
.L3:
  mv a0, t0
.return:
  ret

; engine/fighter.e16.ts:401 strikeInvul(d) at -O1
;   d in a0
;   st in a1
strikeInvul:
  ; engine/fighter.e16.ts:402  const st = fState[d]
  slli t0, a0, 1
  lw a1, fState(t0)
  ; engine/fighter.e16.ts:403  if (fKnock[d] !== 0) return true
  slli t0, a0, 1
  lw t0, fKnock(t0)
  beq t0, zero, .L1
  ; engine/fighter.e16.ts:403  return true
  li a0, 1
  ret
.L1:
  ; engine/fighter.e16.ts:404  return st === ST_DOWN || st === ST_WAKE || st === ST_DEAD
  li t0, 8
  sub t0, a1, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 9
  sub t0, a1, t0
  seqz t0, t0
.L3:
  mv t1, t0
  bnez t1, .L2
  li t0, 10
  sub t0, a1, t0
  seqz t0, t0
.L2:
  mv a0, t0
.return:
  ret

; engine/fighter.e16.ts:412 upperSafe(d, bottom) at -O1
;   d in s1
;   bottom in 2(fp)
;   m in s2
;   v in s3
;   f in 0(fp)
upperSafe:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; d
  sw a1, 2(fp) ; bottom
  ; engine/fighter.e16.ts:413  if (fState[d] !== ST_ATTACK) return false
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 5
  beq t0, t1, .L1
  ; engine/fighter.e16.ts:413  return false
  li a0, 0
  j .return
.L1:
  ; engine/fighter.e16.ts:414  const m = fMove[d]
  slli t0, s1, 1
  lw s2, fMove(t0)
  ; engine/fighter.e16.ts:415  if ((mvAt(d, m, M_FLAGS) & F_ANTIAIR) === 0) return false
  mv a0, s1
  mv a1, s2
  li a2, 12
  call mvAt
  andi t0, a0, 4
  bne t0, zero, .L2
  ; engine/fighter.e16.ts:415  return false
  li a0, 0
  j .return
.L2:
  ; engine/fighter.e16.ts:416  const v = mvAt(d, m, M_INVUL)
  mv a0, s1
  mv a1, s2
  li a2, 13
  call mvAt
  mv s3, a0 ; v
  ; engine/fighter.e16.ts:417  const f = fMoveF[d]
  slli t0, s1, 1
  lw t0, fMoveF(t0)
  sw t0, 0(fp) ; f
  ; engine/fighter.e16.ts:418  if (f < (v & 255) || f > v >> 8) return false
  andi t0, s3, 255
  lw t1, 0(fp) ; f
  bltu t1, t0, .L4
  srli t0, s3, 8
  lw t1, 0(fp) ; f
  bgeu t0, t1, .L3
.L4:
  ; engine/fighter.e16.ts:418  return false
  li a0, 0
  j .return
.L3:
  ; engine/fighter.e16.ts:419  return bottom - i16(fY[d] >> 4) >= UPPER
  slli t0, s1, 1
  lw t0, fY(t0)
  srli t0, t0, 4
  lw t1, 2(fp) ; bottom
  sub t1, t1, t0
  li t0, 28
  slt t1, t1, t0
  xori a0, t1, 1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/fighter.e16.ts:423 moveStart(i, m) at -O1
;   i in s1
;   m in s2
moveStart:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; m
  ; engine/fighter.e16.ts:424  enter(i, ST_ATTACK)
  mv a0, s1
  li a1, 5
  call enter
  ; engine/fighter.e16.ts:425  fMove[i] = m
  slli t0, s1, 1
  sw s2, fMove(t0)
  ; engine/fighter.e16.ts:426  fMoveF[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fMoveF(t0)
  ; engine/fighter.e16.ts:427  fHitDone[i] = 0
  slli t0, s1, 1
  sw zero, fHitDone(t0)
  ; engine/fighter.e16.ts:428  if (fAir[i] === 0) fVX[i] = 0
  slli t0, s1, 1
  lw t0, fAir(t0)
  bne t0, zero, .L1
  ; engine/fighter.e16.ts:428  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  j .L2
.L1:
  ; engine/fighter.e16.ts:429  fAirUsed[i] = 1
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

; engine/fighter.e16.ts:433 attackStep(i) at -O1
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
  ; engine/fighter.e16.ts:434  fMoveF[i]++
  slli t0, s1, 1
  addi t0, t0, fMoveF
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:435  const m = fMove[i]
  slli t0, s1, 1
  lw s2, fMove(t0)
  ; engine/fighter.e16.ts:436  const total = mvAt(i, m, M_STARTUP) + mvAt(i, m, M_ACTIVE) + mvAt(i, m, M_RECOVERY) - 1
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
  ; engine/fighter.e16.ts:437  if (fMoveF[i] > total) {
  slli t0, s1, 1
  lw t0, fMoveF(t0)
  bgeu s3, t0, .L1
  ; engine/fighter.e16.ts:438  if (fAir[i] !== 0) enter(i, ST_JUMP)
  slli t0, s1, 1
  lw t0, fAir(t0)
  beq t0, zero, .L2
  ; engine/fighter.e16.ts:438  enter(i, ST_JUMP)
  mv a0, s1
  li a1, 3
  call enter
  j .L3
.L2:
  ; engine/fighter.e16.ts:439  enter(i, (heldNow(i) & I_DOWN) !== 0 ? ST_CROUCH : ST_STAND)
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
  ; engine/fighter.e16.ts:440  return
  j .return
.L1:
  ; engine/fighter.e16.ts:442  chainTry(i, m)
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

; engine/fighter.e16.ts:449 chainTry(i, m) at -O1
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
  ; engine/fighter.e16.ts:450  if (fHitDone[i] === 0 || (mvAt(i, m, M_FLAGS) & F_CHAIN) === 0) return
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
  ; engine/fighter.e16.ts:450  return
  j .return
.L1:
  ; engine/fighter.e16.ts:451  const s = mvAt(i, m, M_STARTUP)
  mv a0, s1
  mv a1, s3
  li a2, 0
  call mvAt
  sw a0, 0(fp) ; s
  ; engine/fighter.e16.ts:452  const f = fMoveF[i]
  slli t0, s1, 1
  lw t0, fMoveF(t0)
  sw t0, 2(fp) ; f
  ; engine/fighter.e16.ts:453  if (f < s || f >= s + mvAt(i, m, M_ACTIVE) + CHAIN_LATE) return
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
  ; engine/fighter.e16.ts:453  return
  j .return
.L3:
  ; engine/fighter.e16.ts:454  const kind = mvAt(i, m, M_KIND)
  mv a0, s1
  mv a1, s3
  li a2, 11
  call mvAt
  sw a0, 4(fp) ; kind
  ; engine/fighter.e16.ts:455  const button = (kind & K_KICK) !== 0 ? I_HK : I_HP
  lw t0, 4(fp) ; kind
  andi t0, t0, 1
  beq t0, zero, .L5
  li t0, 128
  j .L6
.L5:
  li t0, 32
.L6:
  sw t0, 6(fp) ; button
  ; engine/fighter.e16.ts:456  if (buffered(i, button) === 0) return
  mv a0, s1
  lw a1, 6(fp)
  call buffered
  bne a0, zero, .L7
  ; engine/fighter.e16.ts:456  return
  j .return
.L7:
  ; engine/fighter.e16.ts:457  let h: u16 = 0
  li s2, 0 ; h
  ; engine/fighter.e16.ts:458  while (h < MOVES - 1) {
  j .L10
.L8:
  ; engine/fighter.e16.ts:459  if (mvAt(i, h, M_KIND) === (kind | K_HEAVY)) {
  mv a0, s1
  mv a1, s2
  li a2, 11
  call mvAt
  lw t0, 4(fp) ; kind
  ori t0, t0, 2
  bne a0, t0, .L12
  ; engine/fighter.e16.ts:460  consume(i, I_ATTACKS)
  mv a0, s1
  li a1, 240
  call consume
  ; engine/fighter.e16.ts:461  moveStart(i, h)
  mv a0, s1
  mv a1, s2
  call moveStart
  ; engine/fighter.e16.ts:462  return
  j .return
.L12:
  ; engine/fighter.e16.ts:464  h++
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

; engine/fighter.e16.ts:469 stunStep(i) at -O1
;   i in s1
stunStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:470  if (fStun[i] > 0) {
  slli t0, s1, 1
  lw t0, fStun(t0)
  bgeu zero, t0, .L1
  ; engine/fighter.e16.ts:471  fStun[i]--
  slli t0, s1, 1
  addi t0, t0, fStun
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:472  if (fState[i] === ST_GUARD) fCrouch[i] = (heldNow(i) & I_DOWN) !== 0 ? 1 : 0
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 7
  bne t0, t1, .L2
  ; engine/fighter.e16.ts:472  fCrouch[i] = (heldNow(i) & I_DOWN) !== 0 ? 1 : 0
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
  ; engine/fighter.e16.ts:473  return
  j .return
.L1:
  ; engine/fighter.e16.ts:475  if (fKnock[i] !== 0) return
  slli t0, s1, 1
  lw t0, fKnock(t0)
  beq t0, zero, .L5
  ; engine/fighter.e16.ts:475  return
  j .return
.L5:
  ; engine/fighter.e16.ts:476  enter(i, fCrouch[i] !== 0 ? ST_CROUCH : ST_STAND)
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

; engine/fighter.e16.ts:480 prejumpStep(i) at -O1
;   i in s1
;   s in s2
prejumpStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:481  fStateT[i]++
  slli t0, s1, 1
  addi t0, t0, fStateT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:482  if (fStateT[i] < PREJUMP_F) return
  slli t0, s1, 1
  lw t0, fStateT(t0)
  li t1, 3
  bgeu t0, t1, .L1
  ; engine/fighter.e16.ts:482  return
  j .return
.L1:
  ; engine/fighter.e16.ts:483  const s = faceSign(i)
  mv a0, s1
  call faceSign
  mv s2, a0 ; s
  ; engine/fighter.e16.ts:484  fAir[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fAir(t0)
  ; engine/fighter.e16.ts:485  fAirUsed[i] = 0
  slli t0, s1, 1
  sw zero, fAirUsed(t0)
  ; engine/fighter.e16.ts:486  fVY[i] = prAt(i, P_JUMP)
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
  ; engine/fighter.e16.ts:487  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/fighter.e16.ts:488  if (fJump[i] === 1) fVX[i] = u16(s * i16(prAt(i, P_JUMP_F)))
  slli t0, s1, 1
  lw t0, fJump(t0)
  li t1, 1
  bne t0, t1, .L2
  ; engine/fighter.e16.ts:488  fVX[i] = u16(s * i16(prAt(i, P_JUMP_F)))
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
  ; engine/fighter.e16.ts:489  if (fJump[i] === 2) fVX[i] = u16(-s * i16(prAt(i, P_JUMP_B)))
  slli t0, s1, 1
  lw t0, fJump(t0)
  li t1, 2
  bne t0, t1, .L3
  ; engine/fighter.e16.ts:489  fVX[i] = u16(-s * i16(prAt(i, P_JUMP_B)))
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
  ; engine/fighter.e16.ts:490  enter(i, ST_JUMP)
  mv a0, s1
  li a1, 3
  call enter
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/fighter.e16.ts:494 jumpStep(i) at -O1
;   i in s1
jumpStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:495  if (fAirUsed[i] === 0) attackTry(i, 2)
  slli t0, s1, 1
  lw t0, fAirUsed(t0)
  bne t0, zero, .L1
  ; engine/fighter.e16.ts:495  attackTry(i, 2)
  mv a0, s1
  li a1, 2
  call attackTry
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/fighter.e16.ts:499 poseSet(i) at -O1
;   i in s1
;   st in s3
;   p in s2
poseSet:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:500  const st = fState[i]
  slli t0, s1, 1
  lw s3, fState(t0)
  ; engine/fighter.e16.ts:501  let p: u16 = PO_STAND
  li s2, 0 ; p
  ; engine/fighter.e16.ts:502  if (st === ST_ATTACK) p = attackPose(i)
  li t0, 5
  bne s3, t0, .L1
  ; engine/fighter.e16.ts:502  p = attackPose(i)
  mv a0, s1
  call attackPose
  mv s2, a0 ; p
  j .L2
.L1:
  ; engine/fighter.e16.ts:503  if (st === ST_STAND) p = standPose(i)
  bne s3, zero, .L3
  ; engine/fighter.e16.ts:503  p = standPose(i)
  mv a0, s1
  call standPose
  mv s2, a0 ; p
  j .L4
.L3:
  ; engine/fighter.e16.ts:504  if (st === ST_JUMP) p = i16(fVY[i]) > 0 ? PO_JUMP : PO_JUMP_FALL
  li t0, 3
  bne s3, t0, .L5
  ; engine/fighter.e16.ts:504  p = i16(fVY[i]) > 0 ? PO_JUMP : PO_JUMP_FALL
  slli t0, s1, 1
  lw t0, fVY(t0)
  bge zero, t0, .L6
  li t0, 3
  j .L7
.L6:
  li t0, 55
.L7:
  mv s2, t0 ; p
  j .L8
.L5:
  ; engine/fighter.e16.ts:505  if (st === ST_HIT) p = fKnock[i] !== 0 ? PO_FALLING : PO_HIT + fCrouch[i]
  li t0, 6
  bne s3, t0, .L9
  ; engine/fighter.e16.ts:505  p = fKnock[i] !== 0 ? PO_FALLING : PO_HIT + fCrouch[i]
  slli t0, s1, 1
  lw t0, fKnock(t0)
  beq t0, zero, .L10
  li t0, 11
  j .L11
.L10:
  slli t0, s1, 1
  lw t0, fCrouch(t0)
  addi t0, t0, 5
.L11:
  mv s2, t0 ; p
  j .L12
.L9:
  ; engine/fighter.e16.ts:506  if (st === ST_GUARD) p = PO_GUARD + fCrouch[i]
  li t0, 7
  bne s3, t0, .L13
  ; engine/fighter.e16.ts:506  p = PO_GUARD + fCrouch[i]
  slli t0, s1, 1
  lw t0, fCrouch(t0)
  addi s2, t0, 7
  j .L14
.L13:
  ; engine/fighter.e16.ts:507  p = statePose(st)
  mv a0, s3
  call statePose
  mv s2, a0 ; p
.L14:
.L12:
.L8:
.L4:
.L2:
  ; engine/fighter.e16.ts:508  if (p !== fPose[i] || fRowT[i] === 0xffff) {
  slli t0, s1, 1
  lw t0, fPose(t0)
  bne s2, t0, .L16
  slli t0, s1, 1
  lw t0, fRowT(t0)
  li t1, 65535
  bne t0, t1, .L15
.L16:
  ; engine/fighter.e16.ts:509  fRowWas[i] = fPose[i]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fPose(t1)
  sw t1, fRowWas(t0)
  ; engine/fighter.e16.ts:510  fRowT[i] = 0
  slli t0, s1, 1
  sw zero, fRowT(t0)
  j .L17
.L15:
  ; engine/fighter.e16.ts:511  fRowT[i]++
  slli t0, s1, 1
  addi t0, t0, fRowT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
.L17:
  ; engine/fighter.e16.ts:512  fPose[i] = p
  slli t0, s1, 1
  sw s2, fPose(t0)
  ; engine/fighter.e16.ts:513  poseLoad(i, fSlot[i], p)
  slli t0, s1, 1
  lw t0, fSlot(t0)
  mv a0, s1
  mv a1, t0
  mv a2, s2
  call poseLoad
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:517 statePose(st) at -O1
;   st in a0
statePose:
  ; engine/fighter.e16.ts:518  if (st === ST_CROUCH) return PO_CROUCH
  li t0, 1
  bne a0, t0, .L1
  ; engine/fighter.e16.ts:518  return PO_CROUCH
  li a0, 1
  ret
.L1:
  ; engine/fighter.e16.ts:519  if (st === ST_PREJUMP) return PO_PREJUMP
  li t0, 2
  bne a0, t0, .L2
  ; engine/fighter.e16.ts:519  return PO_PREJUMP
  li a0, 2
  ret
.L2:
  ; engine/fighter.e16.ts:520  if (st === ST_LAND) return PO_LAND
  li t0, 4
  bne a0, t0, .L3
  ; engine/fighter.e16.ts:520  return PO_LAND
  li a0, 4
  ret
.L3:
  ; engine/fighter.e16.ts:521  if (st === ST_DOWN || st === ST_DEAD) return PO_DOWN
  li t0, 8
  beq a0, t0, .L5
  li t0, 10
  bne a0, t0, .L4
.L5:
  ; engine/fighter.e16.ts:521  return PO_DOWN
  li a0, 9
  ret
.L4:
  ; engine/fighter.e16.ts:522  if (st === ST_WAKE) return PO_WAKE
  li t0, 9
  bne a0, t0, .L6
  ; engine/fighter.e16.ts:522  return PO_WAKE
  li a0, 10
  ret
.L6:
  ; engine/fighter.e16.ts:523  if (st === ST_THROW) return PO_THROWING
  li t0, 11
  bne a0, t0, .L7
  ; engine/fighter.e16.ts:523  return PO_THROWING
  li a0, 49
  ret
.L7:
  ; engine/fighter.e16.ts:524  if (st === ST_THROWN) return PO_THROWN
  li t0, 12
  bne a0, t0, .L8
  ; engine/fighter.e16.ts:524  return PO_THROWN
  li a0, 58
  ret
.L8:
  ; engine/fighter.e16.ts:525  if (st === ST_DASH) return PO_DASH
  li t0, 13
  bne a0, t0, .L9
  ; engine/fighter.e16.ts:525  return PO_DASH
  li a0, 56
  ret
.L9:
  ; engine/fighter.e16.ts:526  if (st === ST_BACKDASH) return PO_BACKDASH
  li t0, 14
  bne a0, t0, .L10
  ; engine/fighter.e16.ts:526  return PO_BACKDASH
  li a0, 57
  ret
.L10:
  ; engine/fighter.e16.ts:527  return PO_STAND
  li a0, 0
.return:
  ret

; engine/fighter.e16.ts:534 standPose(i) at -O1
;   i in a0
;   s in a1
standPose:
  ; engine/fighter.e16.ts:535  if (fWin[i] !== 0) return PO_WIN
  slli t0, a0, 1
  lw t0, fWin(t0)
  beq t0, zero, .L1
  ; engine/fighter.e16.ts:535  return PO_WIN
  li a0, 59
  ret
.L1:
  ; engine/fighter.e16.ts:536  if (fVX[i] !== 0) {
  slli t0, a0, 1
  lw t0, fVX(t0)
  beq t0, zero, .L2
  ; engine/fighter.e16.ts:538  const s = fFace[i] !== 0 ? fX[i] >> 7 : wrap16(0 - ((fX[i] + 127) >> 7))
  slli t0, a0, 1
  lw t0, fFace(t0)
  beq t0, zero, .L3
  slli t0, a0, 1
  lw t0, fX(t0)
  srli t0, t0, 7
  j .L4
.L3:
  slli t0, a0, 1
  lw t0, fX(t0)
  addi t0, t0, 127
  srli t0, t0, 7
  sub t0, zero, t0
.L4:
  mv a1, t0 ; s
  ; engine/fighter.e16.ts:539  return PO_WALK + (s & 3)
  andi t0, a1, 3
  addi a0, t0, 51
  ret
.L2:
  ; engine/fighter.e16.ts:541  fBreath[i]++
  slli t0, a0, 1
  addi t0, t0, fBreath
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/fighter.e16.ts:542  return (fBreath[i] & 32) !== 0 ? PO_IDLE : PO_STAND
  slli t0, a0, 1
  lw t0, fBreath(t0)
  andi t0, t0, 32
  beq t0, zero, .L5
  li t0, 60
  j .L6
.L5:
  li t0, 0
.L6:
  mv a0, t0
.return:
  ret

; engine/fighter.e16.ts:545 attackPose(i) at -O1
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
  ; engine/fighter.e16.ts:546  const m = fMove[i]
  slli t0, s1, 1
  lw s2, fMove(t0)
  ; engine/fighter.e16.ts:547  const s = mvAt(i, m, M_STARTUP)
  mv a0, s1
  mv a1, s2
  li a2, 0
  call mvAt
  sw a0, 0(fp) ; s
  ; engine/fighter.e16.ts:548  const f = fMoveF[i]
  slli t0, s1, 1
  lw t0, fMoveF(t0)
  sw t0, 2(fp) ; f
  ; engine/fighter.e16.ts:549  const base = mvAt(i, m, M_POSE)
  mv a0, s1
  mv a1, s2
  li a2, 14
  call mvAt
  mv s3, a0 ; base
  ; engine/fighter.e16.ts:550  if (f < s) return base
  lw t0, 0(fp) ; s
  lw t1, 2(fp) ; f
  bgeu t1, t0, .L1
  ; engine/fighter.e16.ts:550  return base
  mv a0, s3
  j .return
.L1:
  ; engine/fighter.e16.ts:551  if (f < s + mvAt(i, m, M_ACTIVE)) return base + 1
  mv a0, s1
  mv a1, s2
  li a2, 1
  call mvAt
  lw t0, 0(fp) ; s
  add t0, t0, a0
  lw t1, 2(fp) ; f
  bgeu t1, t0, .L2
  ; engine/fighter.e16.ts:551  return base + 1
  addi a0, s3, 1
  j .return
.L2:
  ; engine/fighter.e16.ts:552  return base + 2
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

; engine/fighter.e16.ts:556 inStartup(i) at -O1
;   i in s1
inStartup:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:557  return fState[i] === ST_ATTACK && fMoveF[i] < mvAt(i, fMove[i], M_STARTUP)
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

; engine/fighter.e16.ts:561 inActive(i) at -O1
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
  ; engine/fighter.e16.ts:562  if (fState[i] !== ST_ATTACK) return false
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 5
  beq t0, t1, .L1
  ; engine/fighter.e16.ts:562  return false
  li a0, 0
  j .return
.L1:
  ; engine/fighter.e16.ts:563  const s = mvAt(i, fMove[i], M_STARTUP)
  slli t0, s1, 1
  lw t0, fMove(t0)
  mv a0, s1
  mv a1, t0
  li a2, 0
  call mvAt
  mv s2, a0 ; s
  ; engine/fighter.e16.ts:564  const f = fMoveF[i]
  slli t0, s1, 1
  lw s3, fMoveF(t0)
  ; engine/fighter.e16.ts:565  return f >= s && f < s + mvAt(i, fMove[i], M_ACTIVE)
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

; engine/fighter.e16.ts:571 motion(i) at -O1
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
  ; engine/fighter.e16.ts:572  before[i] = fX[i]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  sw t1, before(t0)
  ; engine/fighter.e16.ts:573  const p = i16(fPush[i])
  slli t0, s1, 1
  lw s2, fPush(t0)
  ; engine/fighter.e16.ts:574  fX[i] = u16(i16(fX[i]) + i16(fVX[i]) + p)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  slli t2, s1, 1
  lw t2, fVX(t2)
  add t1, t1, t2
  add t1, t1, s2
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:575  if (p > FRICTION) fPush[i] = u16(p - FRICTION)
  li t0, 4
  bge t0, s2, .L1
  ; engine/fighter.e16.ts:575  fPush[i] = u16(p - FRICTION)
  slli t0, s1, 1
  addi t1, s2, -4
  sw t1, fPush(t0)
  j .L2
.L1:
  ; engine/fighter.e16.ts:576  if (p < -FRICTION) fPush[i] = u16(p + FRICTION)
  li t0, 65532
  bge s2, t0, .L3
  ; engine/fighter.e16.ts:576  fPush[i] = u16(p + FRICTION)
  slli t0, s1, 1
  addi t1, s2, 4
  sw t1, fPush(t0)
  j .L4
.L3:
  ; engine/fighter.e16.ts:577  fPush[i] = 0
  slli t0, s1, 1
  sw zero, fPush(t0)
.L4:
.L2:
  ; engine/fighter.e16.ts:578  if (fAir[i] === 0) return
  slli t0, s1, 1
  lw t0, fAir(t0)
  bne t0, zero, .L5
  ; engine/fighter.e16.ts:578  return
  j .return
.L5:
  ; engine/fighter.e16.ts:579  const y = i16(fY[i]) + i16(fVY[i])
  slli t0, s1, 1
  lw t0, fY(t0)
  slli t1, s1, 1
  lw t1, fVY(t1)
  add s3, t0, t1
  ; engine/fighter.e16.ts:580  if (y > 0) {
  bge zero, s3, .L6
  ; engine/fighter.e16.ts:581  fY[i] = u16(y)
  slli t0, s1, 1
  sw s3, fY(t0)
  ; engine/fighter.e16.ts:582  return
  j .return
.L6:
  ; engine/fighter.e16.ts:584  land(i)
  mv a0, s1
  call land
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/fighter.e16.ts:587 land(i) at -O1
;   i in s1
;   st in s2
land:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:588  fY[i] = 0
  slli t0, s1, 1
  sw zero, fY(t0)
  ; engine/fighter.e16.ts:589  fVY[i] = 0
  slli t0, s1, 1
  sw zero, fVY(t0)
  ; engine/fighter.e16.ts:590  fVX[i] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/fighter.e16.ts:591  fAir[i] = 0
  slli t0, s1, 1
  sw zero, fAir(t0)
  ; engine/fighter.e16.ts:592  fAirUsed[i] = 0
  slli t0, s1, 1
  sw zero, fAirUsed(t0)
  ; engine/fighter.e16.ts:593  const st = fState[i]
  slli t0, s1, 1
  lw s2, fState(t0)
  ; engine/fighter.e16.ts:594  if (st === ST_HIT && fKnock[i] !== 0) {
  li t0, 6
  bne s2, t0, .L1
  slli t0, s1, 1
  lw t0, fKnock(t0)
  beq t0, zero, .L1
  ; engine/fighter.e16.ts:595  fKnock[i] = 0
  slli t0, s1, 1
  sw zero, fKnock(t0)
  ; engine/fighter.e16.ts:596  enter(i, ST_DOWN)
  mv a0, s1
  li a1, 8
  call enter
  j .L2
.L1:
  ; engine/fighter.e16.ts:597  if (st === ST_JUMP || st === ST_ATTACK) enter(i, ST_LAND)
  li t0, 3
  beq s2, t0, .L4
  li t0, 5
  bne s2, t0, .L3
.L4:
  ; engine/fighter.e16.ts:597  enter(i, ST_LAND)
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

; engine/fighter.e16.ts:601 half(i) at -O1
;   i in a0
half:
  ; engine/fighter.e16.ts:602  return bx[i * POSE_W + 2] >> 1
  slli t1, a0, 4
  slli t0, a0, 3
  add t0, t0, t1
  addi t0, t0, 2
  slli t0, t0, 1
  lw t0, bx(t0)
  srli a0, t0, 1
.return:
  ret

; engine/fighter.e16.ts:610 wall(i) at -O1
;   i in s1
;   h in 0(fp)
;   lo in 2(fp)
;   hi in 4(fp)
;   p in s2
;   into in s3
wall:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:611  const h = half(i)
  mv a0, s1
  call half
  sw a0, 0(fp) ; h
  ; engine/fighter.e16.ts:612  const lo = (RING_L + h) * 16
  lw t0, 0(fp) ; h
  addi t0, t0, 32
  slli t0, t0, 4
  sw t0, 2(fp) ; lo
  ; engine/fighter.e16.ts:613  const hi = (RING_R - h) * 16
  lw t0, 0(fp) ; h
  li t1, 480
  sub t1, t1, t0
  slli t1, t1, 4
  sw t1, 4(fp) ; hi
  ; engine/fighter.e16.ts:614  const p = i16(fPush[i])
  slli t0, s1, 1
  lw s2, fPush(t0)
  ; engine/fighter.e16.ts:615  let into = false
  li s3, 0 ; into
  ; engine/fighter.e16.ts:616  if (fX[i] < lo) {
  slli t0, s1, 1
  lw t0, fX(t0)
  lw t1, 2(fp) ; lo
  bgeu t0, t1, .L1
  ; engine/fighter.e16.ts:617  fX[i] = lo
  slli t0, s1, 1
  lw t1, 2(fp) ; lo
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:618  into = p < 0
  slti s3, s2, 0
.L1:
  ; engine/fighter.e16.ts:620  if (fX[i] > hi) {
  slli t0, s1, 1
  lw t0, fX(t0)
  lw t1, 4(fp) ; hi
  bgeu t1, t0, .L2
  ; engine/fighter.e16.ts:621  fX[i] = hi
  slli t0, s1, 1
  lw t1, 4(fp) ; hi
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:622  into = p > 0
  slt s3, zero, s2
.L2:
  ; engine/fighter.e16.ts:624  if (!into || (fState[i] !== ST_HIT && fState[i] !== ST_GUARD)) return
  beqz s3, .L4
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 6
  beq t0, t1, .L3
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 7
  beq t0, t1, .L3
.L4:
  ; engine/fighter.e16.ts:624  return
  j .return
.L3:
  ; engine/fighter.e16.ts:625  fPush[1 - i] = u16(-p)
  li t0, 1
  sub t0, t0, s1
  slli t0, t0, 1
  neg t1, s2
  sw t1, fPush(t0)
  ; engine/fighter.e16.ts:626  fPush[i] = 0
  slli t0, s1, 1
  sw zero, fPush(t0)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/fighter.e16.ts:633 apart() at -O1
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
  ; engine/fighter.e16.ts:634  const l = fX[0] <= fX[1] ? 0 : 1
  lw t0, fX(zero)
  lw t1, fX+2(zero)
  bltu t1, t0, .L1
  li t0, 0
  j .L2
.L1:
  li t0, 1
.L2:
  mv a0, t0 ; l
  ; engine/fighter.e16.ts:635  const r = 1 - l
  li t0, 1
  sub a1, t0, a0
  ; engine/fighter.e16.ts:636  const gap = fX[r] - fX[l]
  slli t0, a1, 1
  lw t0, fX(t0)
  slli t1, a0, 1
  lw t1, fX(t1)
  sub s2, t0, t1
  ; engine/fighter.e16.ts:637  if (gap <= MAX_APART * 16) return
  li t0, 4096
  bltu t0, s2, .L3
  ; engine/fighter.e16.ts:637  return
  j .return
.L3:
  ; engine/fighter.e16.ts:638  const excess = gap - MAX_APART * 16
  addi a3, s2, -4096
  ; engine/fighter.e16.ts:639  const outL = before[l] > fX[l] ? before[l] - fX[l] : 0
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
  ; engine/fighter.e16.ts:640  const outR = fX[r] > before[r] ? fX[r] - before[r] : 0
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
  ; engine/fighter.e16.ts:641  let cutL: u16 = 0
  li a2, 0 ; cutL
  ; engine/fighter.e16.ts:642  let cutR: u16 = 0
  li s1, 0 ; cutR
  ; engine/fighter.e16.ts:643  if (outL > 0 && outR > 0) {
  bgeu zero, s3, .L8
  bgeu zero, s0, .L8
  ; engine/fighter.e16.ts:644  cutL = (excess + 1) >> 1
  addi t0, a3, 1
  srli a2, t0, 1
  ; engine/fighter.e16.ts:645  cutR = cutL
  mv s1, a2 ; cutR
  j .L9
.L8:
  ; engine/fighter.e16.ts:646  if (outL > 0) cutL = excess
  bgeu zero, s3, .L10
  ; engine/fighter.e16.ts:646  cutL = excess
  mv a2, a3 ; cutL
  j .L11
.L10:
  ; engine/fighter.e16.ts:647  cutR = excess
  mv s1, a3 ; cutR
.L11:
.L9:
  ; engine/fighter.e16.ts:648  fX[l] = fX[l] + cutL
  slli t0, a0, 1
  slli t1, a0, 1
  lw t1, fX(t1)
  add t1, t1, a2
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:649  fX[r] = fX[r] - cutR
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

; engine/fighter.e16.ts:656 bodies() at -O1
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
  ; engine/fighter.e16.ts:657  if (fAir[0] !== 0 || fAir[1] !== 0) return
  lw t0, fAir(zero)
  bne t0, zero, .L2
  lw t0, fAir+2(zero)
  beq t0, zero, .L1
.L2:
  ; engine/fighter.e16.ts:657  return
  j .return
.L1:
  ; engine/fighter.e16.ts:658  const l = leftOne()
  call leftOne
  mv s1, a0 ; l
  ; engine/fighter.e16.ts:659  const r = 1 - l
  li t0, 1
  sub s2, t0, s1
  ; engine/fighter.e16.ts:660  const reach = (half(l) + half(r)) * 16
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
  ; engine/fighter.e16.ts:661  const gap = fX[r] - fX[l]
  slli t0, s2, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fX(t1)
  sub t0, t0, t1
  sw t0, 0(fp) ; gap
  ; engine/fighter.e16.ts:662  if (gap >= reach) return
  lw t0, 0(fp) ; gap
  bltu t0, s3, .L3
  ; engine/fighter.e16.ts:662  return
  j .return
.L3:
  ; engine/fighter.e16.ts:663  const each = (reach - gap + 1) >> 1
  lw t0, 0(fp) ; gap
  sub t0, s3, t0
  addi t0, t0, 1
  srli t0, t0, 1
  sw t0, 2(fp) ; each
  ; engine/fighter.e16.ts:664  fX[l] = wrap16(fX[l] - each)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  lw t2, 2(fp) ; each
  sub t1, t1, t2
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:665  fX[r] = fX[r] + each
  slli t0, s2, 1
  slli t1, s2, 1
  lw t1, fX(t1)
  lw t2, 2(fp) ; each
  add t1, t1, t2
  sw t1, fX(t0)
  ; engine/fighter.e16.ts:666  wall(l)
  mv a0, s1
  call wall
  ; engine/fighter.e16.ts:667  wall(r)
  mv a0, s2
  call wall
  ; engine/fighter.e16.ts:668  const still = fX[r] - fX[l]
  slli t0, s2, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fX(t1)
  sub t0, t0, t1
  sw t0, 4(fp) ; still
  ; engine/fighter.e16.ts:669  if (still >= reach) return
  lw t0, 4(fp) ; still
  bltu t0, s3, .L4
  ; engine/fighter.e16.ts:669  return
  j .return
.L4:
  ; engine/fighter.e16.ts:670  const left = reach - still
  lw t0, 4(fp) ; still
  sub t0, s3, t0
  sw t0, 6(fp) ; left
  ; engine/fighter.e16.ts:671  if (fX[l] <= (RING_L + half(l)) * 16) fX[r] = fX[r] + left
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
  ; engine/fighter.e16.ts:671  fX[r] = fX[r] + left
  slli t0, s2, 1
  slli t1, s2, 1
  lw t1, fX(t1)
  lw t2, 6(fp) ; left
  add t1, t1, t2
  sw t1, fX(t0)
  j .L6
.L5:
  ; engine/fighter.e16.ts:672  fX[l] = fX[l] - left
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

; engine/fighter.e16.ts:676 leftOne() at -O1
leftOne:
  ; engine/fighter.e16.ts:677  if (fX[0] < fX[1]) return 0
  lw t0, fX(zero)
  lw t1, fX+2(zero)
  bgeu t0, t1, .L1
  ; engine/fighter.e16.ts:677  return 0
  li a0, 0
  ret
.L1:
  ; engine/fighter.e16.ts:678  if (fX[1] < fX[0]) return 1
  lw t0, fX+2(zero)
  lw t1, fX(zero)
  bgeu t0, t1, .L2
  ; engine/fighter.e16.ts:678  return 1
  li a0, 1
  ret
.L2:
  ; engine/fighter.e16.ts:679  return fFace[1] !== 0 && fFace[0] === 0 ? 1 : 0
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

; engine/fighter.e16.ts:683 comboNote(d) at -O1
;   d in a0
comboNote:
  ; engine/fighter.e16.ts:684  if (fCombo[d] > fComboMax[d]) fComboMax[d] = fCombo[d]
  slli t0, a0, 1
  lw t0, fCombo(t0)
  slli t1, a0, 1
  lw t1, fComboMax(t1)
  bgeu t1, t0, .L1
  ; engine/fighter.e16.ts:684  fComboMax[d] = fCombo[d]
  slli t0, a0, 1
  slli t1, a0, 1
  lw t1, fCombo(t1)
  sw t1, fComboMax(t0)
.L1:
.return:
  ret

; engine/fighter.e16.ts:688 pushOf(push, weight, towardsRight) at -O1
;   push in a0
;   weight in a1
;   towardsRight in a2
;   v in a3
pushOf:
  ; engine/fighter.e16.ts:689  const v = div(push * 100, weight)
  li t0, 100
  mul t0, a0, t0
  divu a3, t0, a1
  ; engine/fighter.e16.ts:690  return towardsRight ? v : wrap16(0 - v)
  beqz a2, .L1
  mv t0, a3
  j .L2
.L1:
  sub t0, zero, a3
.L2:
  mv a0, t0
.return:
  ret

; engine/fighter.e16.ts:694 free(i) at -O1
;   i in a0
free:
  ; engine/fighter.e16.ts:695  return fState[i] === ST_STAND || fState[i] === ST_CROUCH
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

; engine/fighter.e16.ts:699 holdsBack(i) at -O1
;   i in s1
holdsBack:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; engine/fighter.e16.ts:700  return (heldNow(i) & I_BACK) !== 0
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

; engine/hit.e16.ts:83 boxesWorld() at -O1
boxesWorld:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/hit.e16.ts:84  boxesOf(0)
  li a0, 0
  call boxesOf
  ; engine/hit.e16.ts:85  boxesOf(1)
  li a0, 1
  call boxesOf
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/hit.e16.ts:88 boxesOf(i) at -O1
;   i in s2
;   x in 2(fp)
;   y in 10(fp)
;   right in 12(fp)
;   k in s3
;   at in s1
;   w in 0(fp)
;   bx0 in 4(fp)
;   left in 6(fp)
;   top in 8(fp)
boxesOf:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s1, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  mv s2, a0 ; i
  ; engine/hit.e16.ts:89  const x = i16(pointX(i))
  mv a0, s2
  call pointX
  sw a0, 2(fp) ; x
  ; engine/hit.e16.ts:90  const y = i16(fY[i] >> 4)
  slli t0, s2, 1
  lw t0, fY(t0)
  srli t0, t0, 4
  sw t0, 10(fp) ; y
  ; engine/hit.e16.ts:91  const right = fFace[i] !== 0
  slli t0, s2, 1
  lw t0, fFace(t0)
  sub t0, t0, zero
  snez t0, t0
  sw t0, 12(fp) ; right
  ; engine/hit.e16.ts:92  let k: u16 = 0
  li s3, 0 ; k
  ; engine/hit.e16.ts:93  while (k < BOXES) {
  j .L3
.L1:
  ; engine/hit.e16.ts:94  const at = i * POSE_W + k * 4
  slli t1, s2, 4
  slli t0, s2, 3
  add t0, t0, t1
  slli t1, s3, 2
  add s1, t0, t1
  ; engine/hit.e16.ts:95  const w = i16(bx[at + 2])
  addi t0, s1, 2
  slli t0, t0, 1
  lw t0, bx(t0)
  sw t0, 0(fp) ; w
  ; engine/hit.e16.ts:96  if (w === 0) {
  lw t0, 0(fp) ; w
  bne t0, zero, .L5
  ; engine/hit.e16.ts:97  wb[at] = 0
  slli t0, s1, 1
  sw zero, wb(t0)
  ; engine/hit.e16.ts:98  wb[at + 1] = 0
  addi t0, s1, 1
  slli t0, t0, 1
  sw zero, wb(t0)
  j .L6
.L5:
  ; engine/hit.e16.ts:100  const bx0 = i16(bx[at])
  slli t0, s1, 1
  lw t0, bx(t0)
  sw t0, 4(fp) ; bx0
  ; engine/hit.e16.ts:101  const left = right ? x + bx0 : x - bx0 - w
  lw t0, 12(fp) ; right
  beqz t0, .L7
  lw t0, 4(fp) ; bx0
  lw t1, 2(fp) ; x
  add t0, t1, t0
  j .L8
.L7:
  lw t0, 4(fp) ; bx0
  lw t1, 2(fp) ; x
  sub t1, t1, t0
  lw t0, 0(fp) ; w
  sub t0, t1, t0
.L8:
  sw t0, 6(fp) ; left
  ; engine/hit.e16.ts:102  const top = y + i16(bx[at + 1])
  addi t0, s1, 1
  slli t0, t0, 1
  lw t0, bx(t0)
  lw t1, 10(fp) ; y
  add t1, t1, t0
  sw t1, 8(fp) ; top
  ; engine/hit.e16.ts:103  wb[at] = u16(left)
  slli t0, s1, 1
  lw t1, 6(fp) ; left
  sw t1, wb(t0)
  ; engine/hit.e16.ts:104  wb[at + 1] = u16(left + w)
  addi t0, s1, 1
  slli t0, t0, 1
  lw t1, 0(fp) ; w
  lw t2, 6(fp) ; left
  add t2, t2, t1
  sw t2, wb(t0)
  ; engine/hit.e16.ts:105  wb[at + 2] = u16(top)
  addi t0, s1, 2
  slli t0, t0, 1
  lw t1, 8(fp) ; top
  sw t1, wb(t0)
  ; engine/hit.e16.ts:106  wb[at + 3] = u16(top - i16(bx[at + 3]))
  addi t0, s1, 3
  slli t0, t0, 1
  addi t1, s1, 3
  slli t1, t1, 1
  lw t1, bx(t1)
  lw t2, 8(fp) ; top
  sub t2, t2, t1
  sw t2, wb(t0)
.L6:
  ; engine/hit.e16.ts:108  k++
  addi s3, s3, 1
.L3:
  li t0, 6
  bltu s3, t0, .L1
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s1, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; engine/hit.e16.ts:113 overlap(a, ka, b, kb) at -O1
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
  ; engine/hit.e16.ts:114  const p = a * POSE_W + ka * 4
  slli t1, a0, 4
  slli t0, a0, 3
  add t0, t0, t1
  slli t1, a1, 2
  add s1, t0, t1
  ; engine/hit.e16.ts:115  const q = b * POSE_W + kb * 4
  slli t1, a2, 4
  slli t0, a2, 3
  add t0, t0, t1
  slli t1, a3, 2
  add s2, t0, t1
  ; engine/hit.e16.ts:116  return (
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

; engine/hit.e16.ts:128 strikes(a) at -O1
;   a in s1
;   d in s3
;   h in s0
;   k in s2
strikes:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  mv s1, a0 ; a
  ; engine/hit.e16.ts:129  if (!inActive(a) || fHitDone[a] !== 0) return false
  mv a0, s1
  call inActive
  beqz a0, .L2
  slli t0, s1, 1
  lw t0, fHitDone(t0)
  beq t0, zero, .L1
.L2:
  ; engine/hit.e16.ts:129  return false
  li a0, 0
  j .return
.L1:
  ; engine/hit.e16.ts:130  if (mvAt(a, fMove[a], M_HEIGHT) === H_THROW) return false
  slli t0, s1, 1
  lw t0, fMove(t0)
  mv a0, s1
  mv a1, t0
  li a2, 10
  call mvAt
  li t0, 4
  bne a0, t0, .L3
  ; engine/hit.e16.ts:130  return false
  li a0, 0
  j .return
.L3:
  ; engine/hit.e16.ts:131  const d = 1 - a
  li t0, 1
  sub s3, t0, s1
  ; engine/hit.e16.ts:132  if (strikeInvul(d)) return false
  mv a0, s3
  call strikeInvul
  beqz a0, .L4
  ; engine/hit.e16.ts:132  return false
  li a0, 0
  j .return
.L4:
  ; engine/hit.e16.ts:133  let h: u16 = 4
  li s0, 4 ; h
  ; engine/hit.e16.ts:134  while (h < 6) {
  j .L7
.L5:
  ; engine/hit.e16.ts:135  let k: u16 = 1
  li s2, 1 ; k
  ; engine/hit.e16.ts:136  while (k < 4) {
  j .L11
.L9:
  ; engine/hit.e16.ts:137  if (overlap(a, h, d, k) && !upperSafe(d, i16(wb[d * POSE_W + k * 4 + 3]))) return true
  mv a0, s1
  mv a1, s0
  mv a2, s3
  mv a3, s2
  call overlap
  beqz a0, .L13
  slli t1, s3, 4
  slli t0, s3, 3
  add t0, t0, t1
  slli t1, s2, 2
  add t0, t0, t1
  addi t0, t0, 3
  slli t0, t0, 1
  lw t0, wb(t0)
  mv a0, s3
  mv a1, t0
  call upperSafe
  bnez a0, .L13
  ; engine/hit.e16.ts:137  return true
  li a0, 1
  j .return
.L13:
  ; engine/hit.e16.ts:138  k++
  addi s2, s2, 1
.L11:
  li t0, 4
  bltu s2, t0, .L9
  ; engine/hit.e16.ts:140  h++
  addi s0, s0, 1
.L7:
  li t0, 6
  bltu s0, t0, .L5
  ; engine/hit.e16.ts:142  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; engine/hit.e16.ts:162 hitstopIs(n) at -O1
;   n in a0
hitstopIs:
  ; engine/hit.e16.ts:163  hitstop = n
  sw a0, 0x1990(zero)
.return:
  ret

; engine/hit.e16.ts:168 scaleOf(n) at -O1
;   n in a0
;   k in a1
scaleOf:
  ; engine/hit.e16.ts:169  const k = n > SCALE_LAST ? SCALE_LAST : n
  li t0, 6
  bgeu t0, a0, .L1
  li t0, 6
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a1, t0 ; k
  ; engine/hit.e16.ts:170  if (k === 0) return 256
  bne a1, zero, .L3
  ; engine/hit.e16.ts:170  return 256
  li a0, 256
  ret
.L3:
  ; engine/hit.e16.ts:171  if (k === 1) return 230
  li t0, 1
  bne a1, t0, .L4
  ; engine/hit.e16.ts:171  return 230
  li a0, 230
  ret
.L4:
  ; engine/hit.e16.ts:172  if (k === 2) return 205
  li t0, 2
  bne a1, t0, .L5
  ; engine/hit.e16.ts:172  return 205
  li a0, 205
  ret
.L5:
  ; engine/hit.e16.ts:173  if (k === 3) return 179
  li t0, 3
  bne a1, t0, .L6
  ; engine/hit.e16.ts:173  return 179
  li a0, 179
  ret
.L6:
  ; engine/hit.e16.ts:174  if (k === 4) return 154
  li t0, 4
  bne a1, t0, .L7
  ; engine/hit.e16.ts:174  return 154
  li a0, 154
  ret
.L7:
  ; engine/hit.e16.ts:175  if (k === 5) return 128
  li t0, 5
  bne a1, t0, .L8
  ; engine/hit.e16.ts:175  return 128
  li a0, 128
  ret
.L8:
  ; engine/hit.e16.ts:176  return 102
  li a0, 102
.return:
  ret

; engine/hit.e16.ts:180 damageOf(base, n, counter) at -O1
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
  ; engine/hit.e16.ts:181  let f = scaleOf(n - 1)
  lw t0, 0(fp) ; n
  addi a0, t0, -1
  call scaleOf
  mv s1, a0 ; f
  ; engine/hit.e16.ts:182  if (counter) f = f + ((f * 13) >> 6)
  lw t0, 2(fp) ; counter
  beqz t0, .L1
  ; engine/hit.e16.ts:182  f = f + ((f * 13) >> 6)
  li t0, 13
  mul t0, s1, t0
  srli t0, t0, 6
  add s1, s1, t0
.L1:
  ; engine/hit.e16.ts:183  const d = (base * f + 128) >> 8
  mul t0, s3, s1
  addi t0, t0, 128
  srli s2, t0, 8
  ; engine/hit.e16.ts:184  return d === 0 ? 1 : d
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

; engine/hit.e16.ts:188 struckClear() at -O1
struckClear:
  ; engine/hit.e16.ts:189  struck[0] = 0
  sw zero, struck(zero)
  ; engine/hit.e16.ts:190  struck[1] = 0
  sw zero, struck+2(zero)
  ; engine/hit.e16.ts:191  dealt[0] = 0
  sw zero, dealt(zero)
  ; engine/hit.e16.ts:192  dealt[1] = 0
  sw zero, dealt+2(zero)
  ; engine/hit.e16.ts:193  threw[0] = 0
  sw zero, threw(zero)
  ; engine/hit.e16.ts:194  threw[1] = 0
  sw zero, threw+2(zero)
.return:
  ret

; engine/hit.e16.ts:201 hitsResolve() at -O1
;   t0 in s3
;   t1 in s0
;   s0 in s1
;   s1 in s2
hitsResolve:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  ; engine/hit.e16.ts:202  const t0 = throwHolds(0)
  li a0, 0
  call throwHolds
  mv s3, a0 ; t0
  ; engine/hit.e16.ts:203  const t1 = throwHolds(1)
  li a0, 1
  call throwHolds
  mv s0, a0 ; t1
  ; engine/hit.e16.ts:204  if (t0 && t1) {
  beqz s3, .L1
  beqz s0, .L1
  ; engine/hit.e16.ts:205  fHitDone[0] = 1
  li t0, 1
  sw t0, fHitDone(zero)
  ; engine/hit.e16.ts:206  fHitDone[1] = 1
  li t0, 1
  sw t0, fHitDone+2(zero)
  ; engine/hit.e16.ts:207  techBoth()
  call techBoth
  ; engine/hit.e16.ts:208  return
  j .return
.L1:
  ; engine/hit.e16.ts:210  const s0 = strikes(0)
  li a0, 0
  call strikes
  mv s1, a0 ; s0
  ; engine/hit.e16.ts:211  const s1 = strikes(1)
  li a0, 1
  call strikes
  mv s2, a0 ; s1
  ; engine/hit.e16.ts:212  if (s0) judge(0)
  beqz s1, .L2
  ; engine/hit.e16.ts:212  judge(0)
  li a0, 0
  call judge
.L2:
  ; engine/hit.e16.ts:213  if (s1) judge(1)
  beqz s2, .L3
  ; engine/hit.e16.ts:213  judge(1)
  li a0, 1
  call judge
.L3:
  ; engine/hit.e16.ts:214  if (s0) deal(0)
  beqz s1, .L4
  ; engine/hit.e16.ts:214  deal(0)
  li a0, 0
  call deal
.L4:
  ; engine/hit.e16.ts:215  if (s1) deal(1)
  beqz s2, .L5
  ; engine/hit.e16.ts:215  deal(1)
  li a0, 1
  call deal
.L5:
  ; engine/hit.e16.ts:216  if (t0 && !s1) hold(0)
  beqz s3, .L6
  bnez s2, .L6
  ; engine/hit.e16.ts:216  hold(0)
  li a0, 0
  call hold
.L6:
  ; engine/hit.e16.ts:217  if (t1 && !s0) hold(1)
  beqz s0, .L7
  bnez s1, .L7
  ; engine/hit.e16.ts:217  hold(1)
  li a0, 1
  call hold
.L7:
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; engine/hit.e16.ts:237 throwHolds(a) at -O1
;   a in s1
;   d in s2
throwHolds:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; a
  ; engine/hit.e16.ts:238  if (fState[a] !== ST_ATTACK || fMove[a] !== MV_THROW) return false
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 5
  bne t0, t1, .L2
  slli t0, s1, 1
  lw t0, fMove(t0)
  li t1, 12
  beq t0, t1, .L1
.L2:
  ; engine/hit.e16.ts:238  return false
  li a0, 0
  j .return
.L1:
  ; engine/hit.e16.ts:239  if (!inActive(a) || fHitDone[a] !== 0) return false
  mv a0, s1
  call inActive
  beqz a0, .L4
  slli t0, s1, 1
  lw t0, fHitDone(t0)
  beq t0, zero, .L3
.L4:
  ; engine/hit.e16.ts:239  return false
  li a0, 0
  j .return
.L3:
  ; engine/hit.e16.ts:240  const d = 1 - a
  li t0, 1
  sub s2, t0, s1
  ; engine/hit.e16.ts:241  if (fAir[a] !== 0 || fAir[d] !== 0 || fY[d] !== 0) return false
  slli t0, s1, 1
  lw t0, fAir(t0)
  bne t0, zero, .L6
  slli t0, s2, 1
  lw t0, fAir(t0)
  bne t0, zero, .L6
  slli t0, s2, 1
  lw t0, fY(t0)
  beq t0, zero, .L5
.L6:
  ; engine/hit.e16.ts:241  return false
  li a0, 0
  j .return
.L5:
  ; engine/hit.e16.ts:242  if (!throwable(fState[d]) || throwInvul(d)) return false
  slli t0, s2, 1
  lw a0, fState(t0)
  call throwable
  beqz a0, .L8
  mv a0, s2
  call throwInvul
  beqz a0, .L7
.L8:
  ; engine/hit.e16.ts:242  return false
  li a0, 0
  j .return
.L7:
  ; engine/hit.e16.ts:243  return throwGap(a, fX[a], fX[d]) <= prAt(a, P_THROW)
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s2, 1
  lw t1, fX(t1)
  mv a0, s1
  mv a1, t0
  mv a2, t1
  call throwGap
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 8
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  sltu t0, a0, t0
  xori a0, t0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/hit.e16.ts:247 throwable(st) at -O1
;   st in a0
throwable:
  ; engine/hit.e16.ts:248  if (st === ST_STAND || st === ST_CROUCH || st === ST_ATTACK || st === ST_LAND) return true
  beq a0, zero, .L2
  li t0, 1
  beq a0, t0, .L2
  li t0, 5
  beq a0, t0, .L2
  li t0, 4
  bne a0, t0, .L1
.L2:
  ; engine/hit.e16.ts:248  return true
  li a0, 1
  ret
.L1:
  ; engine/hit.e16.ts:249  return st === ST_DASH || st === ST_BACKDASH
  li t0, 13
  sub t0, a0, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L3
  li t0, 14
  sub t0, a0, t0
  seqz t0, t0
.L3:
  mv a0, t0
.return:
  ret

; engine/hit.e16.ts:253 hold(a) at -O1
;   a in s1
;   d in s2
hold:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; a
  ; engine/hit.e16.ts:254  const d = 1 - a
  li t0, 1
  sub s2, t0, s1
  ; engine/hit.e16.ts:255  fHitDone[a] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fHitDone(t0)
  ; engine/hit.e16.ts:256  enter(a, ST_THROW)
  mv a0, s1
  li a1, 11
  call enter
  ; engine/hit.e16.ts:257  enter(d, ST_THROWN)
  mv a0, s2
  li a1, 12
  call enter
  ; engine/hit.e16.ts:258  fVX[a] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/hit.e16.ts:259  fVX[d] = 0
  slli t0, s2, 1
  sw zero, fVX(t0)
  ; engine/hit.e16.ts:260  fPush[a] = 0
  slli t0, s1, 1
  sw zero, fPush(t0)
  ; engine/hit.e16.ts:261  fPush[d] = 0
  slli t0, s2, 1
  sw zero, fPush(t0)
  ; engine/hit.e16.ts:262  fStun[d] = 0
  slli t0, s2, 1
  sw zero, fStun(t0)
  ; engine/hit.e16.ts:263  fCombo[d] = 0
  slli t0, s2, 1
  sw zero, fCombo(t0)
  ; engine/hit.e16.ts:264  threw[a] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, threw(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/hit.e16.ts:272 throwsStep() at -O1
;   d in s2
;   a in s1
throwsStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; engine/hit.e16.ts:273  let d: u16 = 0
  li s2, 0 ; d
  ; engine/hit.e16.ts:274  while (d < 2) {
  j .L3
.L1:
  ; engine/hit.e16.ts:275  if (fState[d] === ST_THROWN) thrownStep(d)
  slli t0, s2, 1
  lw t0, fState(t0)
  li t1, 12
  bne t0, t1, .L5
  ; engine/hit.e16.ts:275  thrownStep(d)
  mv a0, s2
  call thrownStep
.L5:
  ; engine/hit.e16.ts:276  d++
  addi s2, s2, 1
.L3:
  li t0, 2
  bltu s2, t0, .L1
  ; engine/hit.e16.ts:278  let a: u16 = 0
  li s1, 0 ; a
  ; engine/hit.e16.ts:279  while (a < 2) {
  j .L8
.L6:
  ; engine/hit.e16.ts:280  if (fState[a] === ST_THROW) {
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 11
  bne t0, t1, .L10
  ; engine/hit.e16.ts:281  fStateT[a]++
  slli t0, s1, 1
  addi t0, t0, fStateT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/hit.e16.ts:282  if (fStateT[a] >= THROW_F) enter(a, ST_STAND)
  slli t0, s1, 1
  lw t0, fStateT(t0)
  li t1, 26
  bltu t0, t1, .L11
  ; engine/hit.e16.ts:282  enter(a, ST_STAND)
  mv a0, s1
  li a1, 0
  call enter
.L11:
.L10:
  ; engine/hit.e16.ts:284  a++
  addi s1, s1, 1
.L8:
  li t0, 2
  bltu s1, t0, .L6
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; engine/hit.e16.ts:288 thrownStep(d) at -O1
;   d in s1
;   t in s2
thrownStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; d
  ; engine/hit.e16.ts:289  fStateT[d]++
  slli t0, s1, 1
  addi t0, t0, fStateT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/hit.e16.ts:290  const t = fStateT[d]
  slli t0, s1, 1
  lw s2, fStateT(t0)
  ; engine/hit.e16.ts:291  if (t <= TECH_F && techPressed(d)) {
  li t0, 7
  bltu t0, s2, .L1
  mv a0, s1
  call techPressed
  beqz a0, .L1
  ; engine/hit.e16.ts:292  consume(d, I_ATTACKS)
  mv a0, s1
  li a1, 240
  call consume
  ; engine/hit.e16.ts:293  techBoth()
  call techBoth
  ; engine/hit.e16.ts:294  return
  j .return
.L1:
  ; engine/hit.e16.ts:296  if (t >= SLAM_F) slam(1 - d, d)
  li t0, 16
  bltu s2, t0, .L2
  ; engine/hit.e16.ts:296  slam(1 - d, d)
  li t0, 1
  sub a0, t0, s1
  mv a1, s1
  call slam
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/hit.e16.ts:304 techPressed(d) at -O1
;   d in s1
techPressed:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; d
  ; engine/hit.e16.ts:305  if ((heldNow(d) & (I_FWD | I_BACK)) === 0) return false
  mv a0, s1
  call heldNow
  andi t0, a0, 12
  bne t0, zero, .L1
  ; engine/hit.e16.ts:305  return false
  li a0, 0
  j .return
.L1:
  ; engine/hit.e16.ts:306  return pressedIn(d, I_HP, fStateT[d]) !== 0
  slli t0, s1, 1
  lw t0, fStateT(t0)
  mv a0, s1
  li a1, 32
  mv a2, t0
  call pressedIn
  sub t0, a0, zero
  snez a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/hit.e16.ts:310 techBoth() at -O1
;   l in s2
;   r in s3
;   i in s1
techBoth:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; engine/hit.e16.ts:311  const l = fX[0] <= fX[1] ? 0 : 1
  lw t0, fX(zero)
  lw t1, fX+2(zero)
  bltu t1, t0, .L1
  li t0, 0
  j .L2
.L1:
  li t0, 1
.L2:
  mv s2, t0 ; l
  ; engine/hit.e16.ts:312  const r = 1 - l
  li t0, 1
  sub s3, t0, s2
  ; engine/hit.e16.ts:313  let i: u16 = 0
  li s1, 0 ; i
  ; engine/hit.e16.ts:314  while (i < 2) {
  j .L5
.L3:
  ; engine/hit.e16.ts:315  enter(i, ST_GUARD)
  mv a0, s1
  li a1, 7
  call enter
  ; engine/hit.e16.ts:316  fStun[i] = TECH_STUN
  slli t0, s1, 1
  li t1, 12
  sw t1, fStun(t0)
  ; engine/hit.e16.ts:317  fCrouch[i] = 0
  slli t0, s1, 1
  sw zero, fCrouch(t0)
  ; engine/hit.e16.ts:318  fKnock[i] = 0
  slli t0, s1, 1
  sw zero, fKnock(t0)
  ; engine/hit.e16.ts:319  i++
  addi s1, s1, 1
.L5:
  li t0, 2
  bltu s1, t0, .L3
  ; engine/hit.e16.ts:321  fPush[l] = u16(-TECH_PUSH)
  slli t0, s2, 1
  li t1, 65480
  sw t1, fPush(t0)
  ; engine/hit.e16.ts:322  fPush[r] = TECH_PUSH
  slli t0, s3, 1
  li t1, 56
  sw t1, fPush(t0)
  ; engine/hit.e16.ts:323  logPost(LOG_TECH, 0, 0)
  li a0, 4
  li a1, 0
  li a2, 0
  call logPost
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; engine/hit.e16.ts:330 slam(a, d) at -O1
;   a in s2
;   d in s1
;   toRight in 2(fp)
;   dmg in s3
;   stop in 0(fp)
slam:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; a
  mv s1, a1 ; d
  ; engine/hit.e16.ts:331  if (fThrowBack[a] !== 0) fX[d] = u16(i16(fX[a]) * 2 - i16(fX[d]))
  slli t0, s2, 1
  lw t0, fThrowBack(t0)
  beq t0, zero, .L1
  ; engine/hit.e16.ts:331  fX[d] = u16(i16(fX[a]) * 2 - i16(fX[d]))
  slli t0, s1, 1
  slli t1, s2, 1
  lw t1, fX(t1)
  slli t1, t1, 1
  slli t2, s1, 1
  lw t2, fX(t2)
  sub t1, t1, t2
  sw t1, fX(t0)
.L1:
  ; engine/hit.e16.ts:332  const toRight = fX[d] > fX[a]
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s2, 1
  lw t1, fX(t1)
  sltu t0, t1, t0
  sw t0, 2(fp) ; toRight
  ; engine/hit.e16.ts:334  const dmg = live() ? damageOf(mvAt(a, MV_THROW, M_DAMAGE), 1, false) : 0
  call live
  beqz a0, .L2
  mv a0, s2
  li a1, 12
  li a2, 3
  call mvAt
  li a1, 1
  li a2, 0
  call damageOf
  mv t0, a0
  j .L3
.L2:
  li t0, 0
.L3:
  mv s3, t0 ; dmg
  ; engine/hit.e16.ts:335  fLife[d] = dmg >= fLife[d] ? 0 : fLife[d] - dmg
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fLife(t1)
  addi t0, t0, fLife
  mv t2, t1
  mv t1, s3
  bltu t1, t2, .L4
  li t1, 0
  j .L5
.L4:
  slli t1, s1, 1
  lw t1, fLife(t1)
  sub t1, t1, s3
.L5:
  sw t1, 0(t0)
  ; engine/hit.e16.ts:336  dealt[a] = dmg
  slli t0, s2, 1
  sw s3, dealt(t0)
  ; engine/hit.e16.ts:337  struck[a] = 4
  slli t0, s2, 1
  li t1, 4
  sw t1, struck(t0)
  ; engine/hit.e16.ts:338  enter(d, ST_DOWN)
  mv a0, s1
  li a1, 8
  call enter
  ; engine/hit.e16.ts:339  fPush[d] = pushOf(THROW_PUSH, prAt(d, P_WEIGHT), toRight)
  slli t0, s1, 1
  addi t0, t0, fPush
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 1
  call prAt
  mv a1, a0
  li a0, 40
  lw a2, 2(fp)
  call pushOf
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; engine/hit.e16.ts:340  const stop = mvAt(a, MV_THROW, M_HITSTOP)
  mv a0, s2
  li a1, 12
  li a2, 7
  call mvAt
  sw a0, 0(fp) ; stop
  ; engine/hit.e16.ts:341  if (stop > hitstop) hitstop = stop
  lw t0, 0x1990(zero)
  lw t1, 0(fp) ; stop
  bgeu t0, t1, .L6
  ; engine/hit.e16.ts:341  hitstop = stop
  lw t0, 0(fp) ; stop
  sw t0, 0x1990(zero)
.L6:
  ; engine/hit.e16.ts:342  logPost(LOG_THROW, a, MV_THROW)
  li a0, 3
  mv a1, s2
  li a2, 12
  call logPost
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/hit.e16.ts:346 crouched(d) at -O1
;   d in s1
;   st in s2
crouched:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; d
  ; engine/hit.e16.ts:347  const st = fState[d]
  slli t0, s1, 1
  lw s2, fState(t0)
  ; engine/hit.e16.ts:348  if (st === ST_CROUCH) return true
  li t0, 1
  bne s2, t0, .L1
  ; engine/hit.e16.ts:348  return true
  li a0, 1
  j .return
.L1:
  ; engine/hit.e16.ts:349  if (st === ST_GUARD || st === ST_HIT) return fCrouch[d] !== 0
  li t0, 7
  beq s2, t0, .L3
  li t0, 6
  bne s2, t0, .L2
.L3:
  ; engine/hit.e16.ts:349  return fCrouch[d] !== 0
  slli t0, s1, 1
  lw t0, fCrouch(t0)
  sub t0, t0, zero
  snez a0, t0
  j .return
.L2:
  ; engine/hit.e16.ts:350  if (st === ST_ATTACK) return (mvAt(d, fMove[d], M_KIND) & K_CROUCH) !== 0
  li t0, 5
  bne s2, t0, .L4
  ; engine/hit.e16.ts:350  return (mvAt(d, fMove[d], M_KIND) & K_CROUCH) !== 0
  slli t0, s1, 1
  lw t0, fMove(t0)
  mv a0, s1
  mv a1, t0
  li a2, 11
  call mvAt
  andi t0, a0, 4
  sub t0, t0, zero
  snez a0, t0
  j .return
.L4:
  ; engine/hit.e16.ts:351  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/hit.e16.ts:358 guards(d, height) at -O1
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
  ; engine/hit.e16.ts:359  if (fAir[d] !== 0) return false
  slli t0, s1, 1
  lw t0, fAir(t0)
  beq t0, zero, .L1
  ; engine/hit.e16.ts:359  return false
  li a0, 0
  j .return
.L1:
  ; engine/hit.e16.ts:360  const guarding = fState[d] === ST_GUARD || (free(d) && holdsBack(d))
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
  ; engine/hit.e16.ts:361  if (!guarding) return false
  bnez s3, .L4
  ; engine/hit.e16.ts:361  return false
  li a0, 0
  j .return
.L4:
  ; engine/hit.e16.ts:362  if (height === H_HIGH) return true
  li t0, 1
  bne s2, t0, .L5
  ; engine/hit.e16.ts:362  return true
  li a0, 1
  j .return
.L5:
  ; engine/hit.e16.ts:363  if (height === H_LOW) return crouched(d)
  li t0, 2
  bne s2, t0, .L6
  ; engine/hit.e16.ts:363  return crouched(d)
  mv a0, s1
  call crouched
  j .return
.L6:
  ; engine/hit.e16.ts:364  return !crouched(d)
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

; engine/hit.e16.ts:368 judge(a) at -O1
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
  ; engine/hit.e16.ts:369  const d = 1 - a
  li t0, 1
  sub s3, t0, s2
  ; engine/hit.e16.ts:370  const m = fMove[a]
  slli t0, s2, 1
  lw s0, fMove(t0)
  ; engine/hit.e16.ts:371  moveOf[a] = m
  slli t0, s2, 1
  sw s0, moveOf(t0)
  ; engine/hit.e16.ts:372  let w: u16 = 0
  li s1, 0 ; w
  ; engine/hit.e16.ts:373  if (guards(d, mvAt(a, m, M_HEIGHT))) w |= W_GUARDED
  mv a0, s2
  mv a1, s0
  li a2, 10
  call mvAt
  mv a1, a0
  mv a0, s3
  call guards
  beqz a0, .L1
  ; engine/hit.e16.ts:373  w |= W_GUARDED
  ori s1, s1, 1
  j .L2
.L1:
  ; engine/hit.e16.ts:374  if (inStartup(d)) w |= W_COUNTER
  mv a0, s3
  call inStartup
  beqz a0, .L3
  ; engine/hit.e16.ts:374  w |= W_COUNTER
  ori s1, s1, 2
.L3:
.L2:
  ; engine/hit.e16.ts:375  if (fState[d] === ST_HIT) w |= W_AGAIN
  slli t0, s3, 1
  lw t0, fState(t0)
  li t1, 6
  bne t0, t1, .L4
  ; engine/hit.e16.ts:375  w |= W_AGAIN
  ori s1, s1, 4
.L4:
  ; engine/hit.e16.ts:376  if (crouched(d)) w |= W_CROUCH
  mv a0, s3
  call crouched
  beqz a0, .L5
  ; engine/hit.e16.ts:376  w |= W_CROUCH
  ori s1, s1, 8
.L5:
  ; engine/hit.e16.ts:377  how[a] = w
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

; engine/hit.e16.ts:381 deal(a) at -O1
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
  ; engine/hit.e16.ts:382  const d = 1 - a
  li t0, 1
  sub s1, t0, s2
  ; engine/hit.e16.ts:383  const m = moveOf[a]
  slli t0, s2, 1
  lw s3, moveOf(t0)
  ; engine/hit.e16.ts:384  const w = how[a]
  slli t0, s2, 1
  lw t0, how(t0)
  sw t0, 0(fp) ; w
  ; engine/hit.e16.ts:385  const toRight = fFace[a] !== 0
  slli t0, s2, 1
  lw t0, fFace(t0)
  sub t0, t0, zero
  snez t0, t0
  sw t0, 6(fp) ; toRight
  ; engine/hit.e16.ts:386  const weight = prAt(d, P_WEIGHT)
  mv a0, s1
  li a1, 1
  call prAt
  sw a0, 8(fp) ; weight
  ; engine/hit.e16.ts:387  fHitDone[a] = 1
  slli t0, s2, 1
  li t1, 1
  sw t1, fHitDone(t0)
  ; engine/hit.e16.ts:388  fCrouch[d] = (w & W_CROUCH) !== 0 ? 1 : 0
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
  ; engine/hit.e16.ts:391  fVX[d] = 0
  slli t0, s1, 1
  sw zero, fVX(t0)
  ; engine/hit.e16.ts:392  const stop = mvAt(a, m, M_HITSTOP)
  mv a0, s2
  mv a1, s3
  li a2, 7
  call mvAt
  sw a0, 10(fp) ; stop
  ; engine/hit.e16.ts:393  if (stop > hitstop) hitstop = stop
  lw t0, 0x1990(zero)
  lw t1, 10(fp) ; stop
  bgeu t0, t1, .L3
  ; engine/hit.e16.ts:393  hitstop = stop
  lw t0, 10(fp) ; stop
  sw t0, 0x1990(zero)
.L3:
  ; engine/hit.e16.ts:394  if ((w & W_GUARDED) !== 0) {
  lw t0, 0(fp) ; w
  andi t0, t0, 1
  beq t0, zero, .L4
  ; engine/hit.e16.ts:395  enter(d, ST_GUARD)
  mv a0, s1
  li a1, 7
  call enter
  ; engine/hit.e16.ts:396  fStun[d] = mvAt(a, m, M_BLOCKSTUN)
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
  ; engine/hit.e16.ts:397  fPush[d] = pushOf(mvAt(a, m, M_PUSH_GUARD), weight, toRight)
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
  ; engine/hit.e16.ts:398  struck[a] = 2
  slli t0, s2, 1
  li t1, 2
  sw t1, struck(t0)
  ; engine/hit.e16.ts:399  return
  j .return
.L4:
  ; engine/hit.e16.ts:401  const counter = (w & W_COUNTER) !== 0
  lw t0, 0(fp) ; w
  andi t0, t0, 2
  sub t0, t0, zero
  snez t0, t0
  sw t0, 2(fp) ; counter
  ; engine/hit.e16.ts:402  const n = (w & W_AGAIN) !== 0 ? fCombo[d] + 1 : 1
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
  ; engine/hit.e16.ts:403  const dmg = damageOf(mvAt(a, m, M_DAMAGE), n, counter)
  mv a0, s2
  mv a1, s3
  li a2, 3
  call mvAt
  lw a1, 12(fp)
  lw a2, 2(fp)
  call damageOf
  sw a0, 4(fp) ; dmg
  ; engine/hit.e16.ts:404  fLife[d] = dmg >= fLife[d] ? 0 : fLife[d] - dmg
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
  ; engine/hit.e16.ts:405  fCombo[d] = n
  slli t0, s1, 1
  lw t1, 12(fp) ; n
  sw t1, fCombo(t0)
  ; engine/hit.e16.ts:406  comboNote(d)
  mv a0, s1
  call comboNote
  ; engine/hit.e16.ts:407  dealt[a] = dmg
  slli t0, s2, 1
  lw t1, 4(fp) ; dmg
  sw t1, dealt(t0)
  ; engine/hit.e16.ts:408  struck[a] = counter ? 3 : 1
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
  ; engine/hit.e16.ts:409  if (counter) logPost(LOG_COUNTER, a, m)
  lw t0, 2(fp) ; counter
  beqz t0, .L11
  ; engine/hit.e16.ts:409  logPost(LOG_COUNTER, a, m)
  li a0, 1
  mv a1, s2
  mv a2, s3
  call logPost
  j .L12
.L11:
  ; engine/hit.e16.ts:410  if ((mvAt(a, m, M_FLAGS) & F_ANTIAIR) !== 0 && fAir[d] !== 0) logPost(LOG_AA, a, m)
  mv a0, s2
  mv a1, s3
  li a2, 12
  call mvAt
  andi t0, a0, 4
  beq t0, zero, .L13
  slli t0, s1, 1
  lw t0, fAir(t0)
  beq t0, zero, .L13
  ; engine/hit.e16.ts:410  logPost(LOG_AA, a, m)
  li a0, 2
  mv a1, s2
  mv a2, s3
  call logPost
.L13:
.L12:
  ; engine/hit.e16.ts:411  const push = pushOf(mvAt(a, m, M_PUSH_HIT), weight, toRight)
  mv a0, s2
  mv a1, s3
  li a2, 8
  call mvAt
  lw a1, 8(fp)
  lw a2, 6(fp)
  call pushOf
  sw a0, 14(fp) ; push
  ; engine/hit.e16.ts:412  const down = (mvAt(a, m, M_FLAGS) & F_KNOCKDOWN) !== 0
  mv a0, s2
  mv a1, s3
  li a2, 12
  call mvAt
  andi t0, a0, 2
  sub t0, t0, zero
  snez t0, t0
  sw t0, 16(fp) ; down
  ; engine/hit.e16.ts:413  if (down || fAir[d] !== 0 || fLife[d] === 0) {
  lw t0, 16(fp) ; down
  bnez t0, .L15
  slli t0, s1, 1
  lw t0, fAir(t0)
  bne t0, zero, .L15
  slli t0, s1, 1
  lw t0, fLife(t0)
  bne t0, zero, .L14
.L15:
  ; engine/hit.e16.ts:414  knock(d, push)
  mv a0, s1
  lw a1, 14(fp)
  call knock
  ; engine/hit.e16.ts:415  return
  j .return
.L14:
  ; engine/hit.e16.ts:417  enter(d, ST_HIT)
  mv a0, s1
  li a1, 6
  call enter
  ; engine/hit.e16.ts:418  fStun[d] = mvAt(a, m, M_HITSTUN) + (counter ? 4 : 0)
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
  beqz t2, .L16
  li t2, 4
  j .L17
.L16:
  li t2, 0
.L17:
  add t1, t1, t2
  sw t1, 0(t0)
  ; engine/hit.e16.ts:419  fPush[d] = push
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

; engine/hit.e16.ts:426 knock(d, push) at -O1
;   d in s1
;   push in s2
knock:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; d
  mv s2, a1 ; push
  ; engine/hit.e16.ts:427  fStun[d] = 0
  slli t0, s1, 1
  sw zero, fStun(t0)
  ; engine/hit.e16.ts:428  if (fAir[d] !== 0) {
  slli t0, s1, 1
  lw t0, fAir(t0)
  beq t0, zero, .L1
  ; engine/hit.e16.ts:429  enter(d, ST_HIT)
  mv a0, s1
  li a1, 6
  call enter
  ; engine/hit.e16.ts:430  fKnock[d] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fKnock(t0)
  ; engine/hit.e16.ts:431  fVY[d] = 32
  slli t0, s1, 1
  li t1, 32
  sw t1, fVY(t0)
  ; engine/hit.e16.ts:432  fVX[d] = push
  slli t0, s1, 1
  sw s2, fVX(t0)
  ; engine/hit.e16.ts:433  return
  j .return
.L1:
  ; engine/hit.e16.ts:435  enter(d, ST_DOWN)
  mv a0, s1
  li a1, 8
  call enter
  ; engine/hit.e16.ts:436  fPush[d] = push
  slli t0, s1, 1
  sw s2, fPush(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:19 cameraStep() at -O1
;   mid in a1
;   c in a0
cameraStep:
  ; engine/draw.e16.ts:20  const mid = i16((fX[0] + fX[1]) >> 5)
  lw t0, fX(zero)
  lw t1, fX+2(zero)
  add t0, t0, t1
  srli a1, t0, 5
  ; engine/draw.e16.ts:21  let c = mid - 160
  addi a0, a1, -160
  ; engine/draw.e16.ts:22  if (c < 0) c = 0
  bge a0, zero, .L1
  ; engine/draw.e16.ts:22  c = 0
  li a0, 0 ; c
.L1:
  ; engine/draw.e16.ts:23  if (c > CAM_MAX) c = CAM_MAX
  li t0, 192
  bge t0, a0, .L2
  ; engine/draw.e16.ts:23  c = CAM_MAX
  li a0, 192 ; c
.L2:
  ; engine/draw.e16.ts:24  camX = u16(c)
  sw a0, 0x1996(zero)
.return:
  ret

; engine/draw.e16.ts:70 say(x, y, s, sl) at -O1
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
  ; engine/draw.e16.ts:71  let at = cellAt(1, x, y)
  li a0, 1
  lw a1, 0(fp)
  lw a2, 2(fp)
  call cellAt
  mv s2, a0 ; at
  ; engine/draw.e16.ts:72  let c = peek(s)
  lbu s3, 0(s1)
  ; engine/draw.e16.ts:73  while (c !== 0) {
  j .L3
.L1:
  ; engine/draw.e16.ts:74  vpoke(at, (FONT_TILE + c - 32) | (sl << 10) | FRONT)
  lw t0, 4(fp) ; sl
  slli t0, t0, 10
  addi t1, s3, -32
  or t1, t1, t0
  li t0, 32768
  or t1, t1, t0
  mv a0, s2
  mv a1, t1
  call vpoke
  ; engine/draw.e16.ts:75  at = wrap16(at + 2)
  addi s2, s2, 2
  ; engine/draw.e16.ts:76  s++
  addi s1, s1, 1
  ; engine/draw.e16.ts:77  c = peek(s)
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

; engine/draw.e16.ts:81 hudTile(x, y, t, sl) at -O1
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
  ; engine/draw.e16.ts:82  vpoke(cellAt(1, x, y), (HUD_TILE + t) | (sl << 10) | FRONT)
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

; engine/draw.e16.ts:90 hudClear() at -O1
;   y in s1
hudClear:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; engine/draw.e16.ts:91  let y: u16 = 0
  li s1, 0 ; y
  ; engine/draw.e16.ts:92  while (y < 36) {
  j .L3
.L1:
  ; engine/draw.e16.ts:93  vfill(cellAt(1, 0, y), HUD_TILE + T_CLEAR, 40)
  li a0, 1
  li a1, 0
  mv a2, s1
  call cellAt
  li a1, 168
  li a2, 40
  call vfill
  ; engine/draw.e16.ts:94  y++
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
  ; engine/draw.e16.ts:96  vfill(cellAt(1, 0, 63), HUD_TILE + T_CLEAR, 40)
  li a0, 49024
  li a1, 168
  li a2, 40
  call vfill
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/draw.e16.ts:100 hudFresh() at -O1
hudFresh:
  ; engine/draw.e16.ts:101  shownLife[0] = 0xffff
  li t0, 65535
  sw t0, shownLife(zero)
  ; engine/draw.e16.ts:102  shownLife[1] = 0xffff
  li t0, 65535
  sw t0, shownLife+2(zero)
  ; engine/draw.e16.ts:103  timeShown = 0xffff
  li t0, 65535
  sw t0, 0x19ae(zero)
  ; engine/draw.e16.ts:104  trail[0] = fLife[0]
  lw t0, fLife(zero)
  sw t0, trail(zero)
  ; engine/draw.e16.ts:105  trail[1] = fLife[1]
  lw t0, fLife+2(zero)
  sw t0, trail+2(zero)
  ; engine/draw.e16.ts:106  lowShown[0] = 2
  li t0, 2
  sw t0, lowShown(zero)
  ; engine/draw.e16.ts:107  lowShown[1] = 2
  li t0, 2
  sw t0, lowShown+2(zero)
.return:
  ret

; engine/draw.e16.ts:111 hudStep(time, frame) at -O1
;   time in s1
;   frame in s2
hudStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; time
  mv s2, a1 ; frame
  ; engine/draw.e16.ts:112  barStep(0, frame)
  li a0, 0
  mv a1, s2
  call barStep
  ; engine/draw.e16.ts:113  barStep(1, frame)
  li a0, 1
  mv a1, s2
  call barStep
  ; engine/draw.e16.ts:114  if (time !== timeShown) timeShow(time)
  lw t0, 0x19ae(zero)
  beq s1, t0, .L1
  ; engine/draw.e16.ts:114  timeShow(time)
  mv a0, s1
  call timeShow
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:117 barStep(i, frame) at -O1
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
  ; engine/draw.e16.ts:118  const life = fLife[i]
  slli t0, s1, 1
  lw s2, fLife(t0)
  ; engine/draw.e16.ts:119  if (life < shownLife[i] && shownLife[i] !== 0xffff) trailT[i] = 0
  slli t0, s1, 1
  lw t0, shownLife(t0)
  bgeu s2, t0, .L1
  slli t0, s1, 1
  lw t0, shownLife(t0)
  li t1, 65535
  beq t0, t1, .L1
  ; engine/draw.e16.ts:119  trailT[i] = 0
  slli t0, s1, 1
  sw zero, trailT(t0)
.L1:
  ; engine/draw.e16.ts:120  if (trail[i] > life) {
  slli t0, s1, 1
  lw t0, trail(t0)
  bgeu s2, t0, .L2
  ; engine/draw.e16.ts:121  if (trailT[i] < TRAIL_WAIT) trailT[i]++
  slli t0, s1, 1
  lw t0, trailT(t0)
  li t1, 20
  bgeu t0, t1, .L3
  ; engine/draw.e16.ts:121  trailT[i]++
  slli t0, s1, 1
  addi t0, t0, trailT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  j .L5
.L3:
  ; engine/draw.e16.ts:122  trail[i]--
  slli t0, s1, 1
  addi t0, t0, trail
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
  j .L5
.L2:
  ; engine/draw.e16.ts:123  trail[i] = life
  slli t0, s1, 1
  sw s2, trail(t0)
.L5:
  ; engine/draw.e16.ts:124  lowStep(i, life, frame)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call lowStep
  ; engine/draw.e16.ts:125  if (life === shownLife[i] && trail[i] === shownTrail[i]) return
  slli t0, s1, 1
  lw t0, shownLife(t0)
  bne s2, t0, .L6
  slli t0, s1, 1
  lw t0, trail(t0)
  slli t1, s1, 1
  lw t1, shownTrail(t1)
  bne t0, t1, .L6
  ; engine/draw.e16.ts:125  return
  j .return
.L6:
  ; engine/draw.e16.ts:126  shownLife[i] = life
  slli t0, s1, 1
  sw s2, shownLife(t0)
  ; engine/draw.e16.ts:127  shownTrail[i] = trail[i]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, trail(t1)
  sw t1, shownTrail(t0)
  ; engine/draw.e16.ts:128  barDraw(i)
  mv a0, s1
  call barDraw
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; engine/draw.e16.ts:132 lowStep(i, life, frame) at -O1
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
  ; engine/draw.e16.ts:133  const max = prAt(i, P_LIFE)
  mv a0, s2
  li a1, 0
  call prAt
  sw a0, 4(fp) ; max
  ; engine/draw.e16.ts:134  let state: u16 = 0
  li s1, 0 ; state
  ; engine/draw.e16.ts:135  if (life * 4 < max) state = (frame & 16) !== 0 ? 1 : 3
  lw t0, 0(fp) ; life
  slli t0, t0, 2
  lw t1, 4(fp) ; max
  bgeu t0, t1, .L1
  ; engine/draw.e16.ts:135  state = (frame & 16) !== 0 ? 1 : 3
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
  ; engine/draw.e16.ts:136  if (state === lowShown[i]) return
  slli t0, s2, 1
  lw t0, lowShown(t0)
  bne s1, t0, .L4
  ; engine/draw.e16.ts:136  return
  j .return
.L4:
  ; engine/draw.e16.ts:137  lowShown[i] = state
  slli t0, s2, 1
  sw s1, lowShown(t0)
  ; engine/draw.e16.ts:138  const sl = SL_P1 + i
  addi s3, s2, 1
  ; engine/draw.e16.ts:139  if (state === 0) colour(sl, C_LIFE, palCopy[sl * 16 + C_LIFE])
  bne s1, zero, .L5
  ; engine/draw.e16.ts:139  colour(sl, C_LIFE, palCopy[sl * 16 + C_LIFE])
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
  ; engine/draw.e16.ts:140  colour(sl, C_LIFE, state === 1 ? RED : RED_DIM)
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

; engine/draw.e16.ts:144 barPoints(i, v) at -O1
;   i in s1
;   v in s2
barPoints:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; v
  ; engine/draw.e16.ts:145  return div(v * 120, prAt(i, P_LIFE))
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

; engine/draw.e16.ts:149 barDraw(i) at -O1
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
  ; engine/draw.e16.ts:150  const l = barPoints(i, fLife[i])
  slli t0, s2, 1
  lw t0, fLife(t0)
  mv a0, s2
  mv a1, t0
  call barPoints
  sw a0, 0(fp) ; l
  ; engine/draw.e16.ts:151  const t = barPoints(i, trail[i])
  slli t0, s2, 1
  lw t0, trail(t0)
  mv a0, s2
  mv a1, t0
  call barPoints
  sw a0, 2(fp) ; t
  ; engine/draw.e16.ts:152  const sl = (SL_P1 + i) << 10
  addi t0, s2, 1
  slli t0, t0, 10
  sw t0, 4(fp) ; sl
  ; engine/draw.e16.ts:153  let c: u16 = 0
  li s1, 0 ; c
  ; engine/draw.e16.ts:154  while (c < BAR_CELLS) {
  j .L3
.L1:
  ; engine/draw.e16.ts:155  const lc = cellPart(l, c)
  lw a0, 0(fp)
  mv a1, s1
  call cellPart
  sw a0, 6(fp) ; lc
  ; engine/draw.e16.ts:156  const tc = cellPart(t, c)
  lw a0, 2(fp)
  mv a1, s1
  call cellPart
  sw a0, 8(fp) ; tc
  ; engine/draw.e16.ts:157  const tile = (HUD_TILE + T_BAR + lc * 9 + tc) | sl | FRONT
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
  ; engine/draw.e16.ts:158  if (i === 0) vpoke(cellAt(1, 2 + c, BAR_ROW), tile)
  bne s2, zero, .L5
  ; engine/draw.e16.ts:158  vpoke(cellAt(1, 2 + c, BAR_ROW), tile)
  li a0, 1
  addi a1, s1, 2
  li a2, 2
  call cellAt
  mv a1, s3
  call vpoke
  j .L6
.L5:
  ; engine/draw.e16.ts:159  vpoke(cellAt(1, 37 - c, BAR_ROW), tile | FLIP)
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
  ; engine/draw.e16.ts:160  c++
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

; engine/draw.e16.ts:165 cellPart(p, c) at -O1
;   p in a0
;   c in a1
;   from in a2
cellPart:
  ; engine/draw.e16.ts:166  const from = c * 8
  slli a2, a1, 3
  ; engine/draw.e16.ts:167  if (p <= from) return 0
  bltu a2, a0, .L1
  ; engine/draw.e16.ts:167  return 0
  li a0, 0
  ret
.L1:
  ; engine/draw.e16.ts:168  return p - from >= 8 ? 8 : p - from
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

; engine/draw.e16.ts:172 timeShow(t) at -O1
;   t in s1
;   tens in s2
timeShow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; t
  ; engine/draw.e16.ts:173  if (timeShown === 0xffff || t <= 10 !== timeShown <= 10) {
  lw t0, 0x19ae(zero)
  li t1, 65535
  beq t0, t1, .L2
  li t0, 10
  sltu t0, t0, s1
  xori t0, t0, 1
  lw t1, 0x19ae(zero)
  li t2, 10
  sltu t1, t2, t1
  xori t1, t1, 1
  beq t0, t1, .L1
.L2:
  ; engine/draw.e16.ts:174  colour(SL_TIME, 1, t <= 10 ? RED : palCopy[SL_TIME * 16 + 1])
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
  ; engine/draw.e16.ts:176  timeShown = t
  sw s1, 0x19ae(zero)
  ; engine/draw.e16.ts:177  const tens = div(t, 10)
  li t0, 10
  divu s2, s1, t0
  ; engine/draw.e16.ts:178  bigDigit(18, tens)
  li a0, 18
  mv a1, s2
  call bigDigit
  ; engine/draw.e16.ts:179  bigDigit(20, t - tens * 10)
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

; engine/draw.e16.ts:182 bigDigit(x, d) at -O1
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
  ; engine/draw.e16.ts:183  const tile = (DIGITS_TILE + d * 4) | (SL_TIME << 10) | FRONT
  slli t0, s3, 2
  addi t0, t0, 128
  ori t0, t0, 4096
  li t1, 32768
  or s2, t0, t1
  ; engine/draw.e16.ts:184  vpoke(cellAt(1, x, 1), tile)
  li a0, 1
  mv a1, s1
  li a2, 1
  call cellAt
  mv a1, s2
  call vpoke
  ; engine/draw.e16.ts:185  vpoke(cellAt(1, x + 1, 1), tile + 1)
  li a0, 1
  addi a1, s1, 1
  li a2, 1
  call cellAt
  addi a1, s2, 1
  call vpoke
  ; engine/draw.e16.ts:186  vpoke(cellAt(1, x, 2), tile + 2)
  li a0, 1
  mv a1, s1
  li a2, 2
  call cellAt
  addi a1, s2, 2
  call vpoke
  ; engine/draw.e16.ts:187  vpoke(cellAt(1, x + 1, 2), tile + 3)
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

; engine/draw.e16.ts:199 bigWidth(s) at -O1
;   s in a0
;   n in a1
;   k in a2
;   c in a3
bigWidth:
  ; engine/draw.e16.ts:200  let n: u16 = 0
  li a1, 0 ; n
  ; engine/draw.e16.ts:201  let k: u16 = 0
  li a2, 0 ; k
  ; engine/draw.e16.ts:202  let c = peek(s)
  lbu a3, 0(a0)
  ; engine/draw.e16.ts:203  while (c !== 0) {
  j .L3
.L1:
  ; engine/draw.e16.ts:204  n = n + (c === 32 ? 1 : 2)
  mv t0, a1
  mv t1, a3
  li t2, 32
  bne t1, t2, .L5
  li t1, 1
  j .L6
.L5:
  li t1, 2
.L6:
  add a1, t0, t1
  ; engine/draw.e16.ts:205  k++
  addi a2, a2, 1
  ; engine/draw.e16.ts:206  c = peek(s + k)
  add t0, a0, a2
  lbu a3, 0(t0)
.L3:
  bne a3, zero, .L1
  ; engine/draw.e16.ts:208  return n
  mv a0, a1
.return:
  ret

; engine/draw.e16.ts:212 bigSay(x, y, s, sl) at -O1
;   x in 10(fp)
;   y in 2(fp)
;   s in 4(fp)
;   sl in 12(fp)
;   at in s2
;   k in s3
;   c in 0(fp)
;   g in 6(fp)
;   t in 8(fp)
;   r in s1
bigSay:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s1, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  sw a0, 10(fp) ; x
  sw a1, 2(fp) ; y
  sw a2, 4(fp) ; s
  sw a3, 12(fp) ; sl
  ; engine/draw.e16.ts:213  let at = x
  lw s2, 10(fp) ; x
  ; engine/draw.e16.ts:214  let k: u16 = 0
  li s3, 0 ; k
  ; engine/draw.e16.ts:215  let c = peek(s)
  lw t0, 4(fp) ; s
  lbu t0, 0(t0)
  sw t0, 0(fp) ; c
  ; engine/draw.e16.ts:216  while (c !== 0) {
  j .L3
.L1:
  ; engine/draw.e16.ts:217  const g = bigIndex(c)
  lw a0, 0(fp)
  la t0, bigIndex
  li t1, 259
  call far_call
  sw a0, 6(fp) ; g
  ; engine/draw.e16.ts:218  if (g === 0xffff) at++
  li t0, 65535
  lw t1, 6(fp) ; g
  bne t1, t0, .L5
  ; engine/draw.e16.ts:218  at++
  addi s2, s2, 1
  j .L6
.L5:
  ; engine/draw.e16.ts:220  const t = (BIG_TILE + g * 6) | (sl << 10) | FRONT
  lw t0, 6(fp) ; g
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  lw t1, 12(fp) ; sl
  slli t1, t1, 10
  addi t0, t0, 609
  or t0, t0, t1
  li t1, 32768
  or t0, t0, t1
  sw t0, 8(fp) ; t
  ; engine/draw.e16.ts:221  let r: u16 = 0
  li s1, 0 ; r
  ; engine/draw.e16.ts:222  while (r < 3) {
  j .L9
.L7:
  ; engine/draw.e16.ts:223  vpoke(cellAt(1, at, y + r), t + r * 2)
  lw t0, 2(fp) ; y
  add t0, t0, s1
  li a0, 1
  mv a1, s2
  mv a2, t0
  call cellAt
  slli t0, s1, 1
  lw t1, 8(fp) ; t
  add a1, t1, t0
  call vpoke
  ; engine/draw.e16.ts:224  vpoke(cellAt(1, at + 1, y + r), t + r * 2 + 1)
  lw t0, 2(fp) ; y
  add t0, t0, s1
  li a0, 1
  addi a1, s2, 1
  mv a2, t0
  call cellAt
  slli t0, s1, 1
  lw t1, 8(fp) ; t
  add t1, t1, t0
  addi a1, t1, 1
  call vpoke
  ; engine/draw.e16.ts:225  r++
  addi s1, s1, 1
.L9:
  li t0, 3
  bltu s1, t0, .L7
  ; engine/draw.e16.ts:227  at = at + 2
  addi s2, s2, 2
.L6:
  ; engine/draw.e16.ts:229  k++
  addi s3, s3, 1
  ; engine/draw.e16.ts:230  c = peek(s + k)
  lw t0, 4(fp) ; s
  add t0, t0, s3
  lbu t0, 0(t0)
  sw t0, 0(fp) ; c
.L3:
  lw t0, 0(fp) ; c
  bne t0, zero, .L1
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s1, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; engine/draw.e16.ts:235 bigCentred(y, s) at -O1
;   y in s2
;   s in s1
bigCentred:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; y
  mv s1, a1 ; s
  ; engine/draw.e16.ts:236  bigSay(20 - (bigWidth(s) >> 1), y, s, SL_BIG)
  mv a0, s1
  call bigWidth
  srli t0, a0, 1
  li t1, 20
  sub a0, t1, t0
  mv a1, s2
  mv a2, s1
  li a3, 6
  call bigSay
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:240 bandShow(s) at -O1
;   s in s2
;   r in s1
bandShow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; s
  ; engine/draw.e16.ts:241  vfill(cellAt(1, 0, bandAt), (HUD_TILE + T_BAND_TOP) | (SL_P1 << 10) | FRONT, 40)
  lw t0, 0x1998(zero)
  li a0, 1
  li a1, 0
  mv a2, t0
  call cellAt
  li a1, 33966
  li a2, 40
  call vfill
  ; engine/draw.e16.ts:242  let r: u16 = 1
  li s1, 1 ; r
  ; engine/draw.e16.ts:243  while (r < BAND_ROWS - 1) {
  j .L3
.L1:
  ; engine/draw.e16.ts:244  vfill(cellAt(1, 0, bandAt + r), (HUD_TILE + T_BAND) | (SL_P1 << 10) | FRONT, 40)
  lw t0, 0x1998(zero)
  add t0, t0, s1
  li a0, 1
  li a1, 0
  mv a2, t0
  call cellAt
  li a1, 33965
  li a2, 40
  call vfill
  ; engine/draw.e16.ts:245  r++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
  ; engine/draw.e16.ts:247  vfill(
  lw t0, 0x1998(zero)
  li a0, 1
  li a1, 0
  addi a2, t0, 5
  call cellAt
  li a1, 33967
  li a2, 40
  call vfill
  ; engine/draw.e16.ts:252  bigCentred(bandAt + 1, s)
  lw t0, 0x1998(zero)
  addi a0, t0, 1
  mv a1, s2
  call bigCentred
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; engine/draw.e16.ts:256 bandHigh() at -O1
bandHigh:
  ; engine/draw.e16.ts:257  bandAt = BAND_HIGH
  li t0, 5
  sw t0, 0x1998(zero)
.return:
  ret

; engine/draw.e16.ts:261 bandClear() at -O1
bandClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/draw.e16.ts:262  vfill(cellAt(1, 0, bandAt), HUD_TILE + T_CLEAR, 64 * BAND_ROWS)
  lw t0, 0x1998(zero)
  li a0, 1
  li a1, 0
  mv a2, t0
  call cellAt
  li a1, 168
  li a2, 384
  call vfill
  ; engine/draw.e16.ts:263  bandAt = BAND_ROW
  li t0, 13
  sw t0, 0x1998(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/draw.e16.ts:287 logPost(kind, side, move) at -O1
;   kind in a0
;   side in a1
;   move in a2
logPost:
  ; engine/draw.e16.ts:288  if (logOff[0] !== 0) return
  lw t0, logOff(zero)
  beq t0, zero, .L1
  ; engine/draw.e16.ts:288  return
  ret
.L1:
  ; engine/draw.e16.ts:289  logWait[0] = kind
  sw a0, logWait(zero)
  ; engine/draw.e16.ts:290  logWait[1] = side
  sw a1, logWait+2(zero)
  ; engine/draw.e16.ts:291  logWait[2] = move
  sw a2, logWait+4(zero)
.return:
  ret

; engine/draw.e16.ts:295 logStep() at -O1
;   f in s1
logStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; engine/draw.e16.ts:296  if (logWait[0] !== 0) {
  lw t0, logWait(zero)
  beq t0, zero, .L1
  ; engine/draw.e16.ts:297  logClear()
  call logClear
  ; engine/draw.e16.ts:298  palMix(SL_LOG, 0, 0)
  li a0, 5
  li a1, 0
  li a2, 0
  call palMix
  ; engine/draw.e16.ts:299  logDraw(logWait[0], logWait[1], logWait[2])
  lw t0, logWait(zero)
  lw t1, logWait+2(zero)
  lw t2, logWait+4(zero)
  mv a0, t0
  mv a1, t1
  mv a2, t2
  la t0, logDraw
  li t1, 259
  call far_call
  ; engine/draw.e16.ts:300  logWait[0] = 0
  sw zero, logWait(zero)
  ; engine/draw.e16.ts:301  logT = 0
  sw zero, 0x19b8(zero)
  ; engine/draw.e16.ts:302  return
  j .return
.L1:
  ; engine/draw.e16.ts:304  if (logT === 0xffff) return
  lw t0, 0x19b8(zero)
  li t1, 65535
  bne t0, t1, .L2
  ; engine/draw.e16.ts:304  return
  j .return
.L2:
  ; engine/draw.e16.ts:305  logT++
  lw t0, 0x19b8(zero)
  addi t0, t0, 1
  sw t0, 0x19b8(zero)
  ; engine/draw.e16.ts:306  if (logT <= LOG_SHOW) return
  li t1, 60
  bltu t1, t0, .L3
  ; engine/draw.e16.ts:306  return
  j .return
.L3:
  ; engine/draw.e16.ts:307  const f = logT - LOG_SHOW
  lw t0, 0x19b8(zero)
  addi s1, t0, -60
  ; engine/draw.e16.ts:308  if (f < LOG_FADE) {
  li t0, 16
  bgeu s1, t0, .L4
  ; engine/draw.e16.ts:309  palMix(SL_LOG, 0, f)
  li a0, 5
  li a1, 0
  mv a2, s1
  call palMix
  ; engine/draw.e16.ts:310  return
  j .return
.L4:
  ; engine/draw.e16.ts:312  logGone()
  call logGone
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/draw.e16.ts:316 logGone() at -O1
logGone:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/draw.e16.ts:317  logClear()
  call logClear
  ; engine/draw.e16.ts:318  palMix(SL_LOG, 0, 0)
  li a0, 5
  li a1, 0
  li a2, 0
  call palMix
  ; engine/draw.e16.ts:319  logT = 0xffff
  li t0, 65535
  sw t0, 0x19b8(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/draw.e16.ts:322 logClear() at -O1
logClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/draw.e16.ts:323  vfill(cellAt(1, 0, LOG_ROW), HUD_TILE + T_CLEAR, 40)
  li a0, 45312
  li a1, 168
  li a2, 40
  call vfill
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/draw.e16.ts:327 hudRows(y, n) at -O1
;   y in s1
;   n in s2
hudRows:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; y
  mv s2, a1 ; n
  ; engine/draw.e16.ts:328  vfill(cellAt(1, 0, y), HUD_TILE + T_CLEAR, 64 * n)
  li a0, 1
  li a1, 0
  mv a2, s1
  call cellAt
  li t0, 64
  mul t0, t0, s2
  li a1, 168
  mv a2, t0
  call vfill
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

str_2:
  .byte 68, 79, 85, 66, 76, 69, 32, 75, 46, 79, 46, 0
str_3:
  .byte 75, 46, 79, 46, 0
str_4:
  .byte 84, 73, 77, 69, 32, 85, 80, 0
str_5:
  .byte 83, 49, 32, 66, 65, 76, 65, 78, 67, 69, 0
str_6:
  .byte 83, 50, 32, 82, 85, 83, 72, 0
str_7:
  .byte 83, 51, 32, 80, 79, 87, 69, 82, 0
str_8:
  .byte 83, 52, 32, 79, 85, 84, 66, 79, 88, 0
str_9:
  .byte 80, 65, 67, 75, 69, 84, 0
str_10:
  .byte 77, 65, 73, 78, 70, 82, 65, 77, 69, 0
str_11:
  .byte 68, 65, 69, 77, 79, 78, 0
str_12:
  .byte 75, 69, 82, 78, 69, 76, 0
str_13:
  .byte 82, 79, 79, 84, 0
  .align 2
e16c_fixed_end:

  .bank 1
  .org 0xc000
; scenes/match.e16.ts:112 ladderPlay() at -O1
;   k in s1
;   won in s2
ladderPlay:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; scenes/match.e16.ts:113  ladderBuild()
  call ladderBuild
  ; scenes/match.e16.ts:114  habitLadder()
  la t0, habitLadder
  li t1, 264
  call far_call
  ; scenes/match.e16.ts:115  ladderEnd = 0
  sw zero, 0x19d4(zero)
  ; scenes/match.e16.ts:116  continues = 0
  sw zero, 0x19d6(zero)
  ; scenes/match.e16.ts:117  clearSec = 0
  sw zero, 0x19d8(zero)
  ; scenes/match.e16.ts:118  clearT = 0
  sw zero, 0x19da(zero)
  ; scenes/match.e16.ts:119  let k = choice[1]
  lw s1, choice+2(zero)
  ; scenes/match.e16.ts:120  while (k < LADDER) {
  j .L3
.L1:
  ; scenes/match.e16.ts:121  ladderAt = k
  sw s1, 0x19d2(zero)
  ; scenes/match.e16.ts:122  matchPlay(ladder[k], k)
  slli t0, s1, 1
  lw a0, ladder(t0)
  mv a1, s1
  call matchPlay
  ; scenes/match.e16.ts:123  if (outcome === QUIT) {
  lw t0, 0x19c2(zero)
  li t1, 4
  bne t0, t1, .L5
  ; scenes/match.e16.ts:124  ladderEnd = 3
  li t0, 3
  sw t0, 0x19d4(zero)
  ; scenes/match.e16.ts:125  return
  j .return
.L5:
  ; scenes/match.e16.ts:127  const won = outcome === 1
  lw t0, 0x19c2(zero)
  li t1, 1
  sub t0, t0, t1
  seqz s2, t0
  ; scenes/match.e16.ts:128  resultShow(ladder[k])
  slli t0, s1, 1
  lw a0, ladder(t0)
  la t0, resultShow
  li t1, 263
  call far_call
  ; scenes/match.e16.ts:129  if (won) k++
  beqz s2, .L6
  ; scenes/match.e16.ts:129  k++
  addi s1, s1, 1
  j .L7
.L6:
  ; scenes/match.e16.ts:130  if (continueAsk()) continues++
  la t0, continueAsk
  li t1, 263
  call far_call
  beqz a0, .L8
  ; scenes/match.e16.ts:130  continues++
  lw t0, 0x19d6(zero)
  addi t0, t0, 1
  sw t0, 0x19d6(zero)
  j .L9
.L8:
  ; scenes/match.e16.ts:132  ladderEnd = 2
  li t0, 2
  sw t0, 0x19d4(zero)
  ; scenes/match.e16.ts:133  gameOver()
  la t0, gameOver
  li t1, 263
  call far_call
  ; scenes/match.e16.ts:134  return
  j .return
.L9:
.L7:
.L3:
  li t0, 4
  bltu s1, t0, .L1
  ; scenes/match.e16.ts:137  ladderEnd = 1
  li t0, 1
  sw t0, 0x19d4(zero)
  ; scenes/match.e16.ts:138  systemClear()
  la t0, systemClear
  li t1, 263
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes/match.e16.ts:145 ladderBuild() at -O1
;   n in s2
;   k in s1
;   mirror in s3
ladderBuild:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; scenes/match.e16.ts:146  let n: u16 = 0
  li s2, 0 ; n
  ; scenes/match.e16.ts:147  let k: u16 = 0
  li s1, 0 ; k
  ; scenes/match.e16.ts:148  while (k < OPPONENTS && n < LADDER - 1) {
  j .L3
.L1:
  ; scenes/match.e16.ts:149  const mirror = (oppWord(k, O_FLAGS) & OF_MIRROR) !== 0
  mv a0, s1
  li a1, 24
  call oppWord
  andi t0, a0, 16
  sub t0, t0, zero
  snez s3, t0
  ; scenes/match.e16.ts:150  if (!mirror && oppWord(k, O_SLOT) !== choice[0]) {
  bnez s3, .L5
  mv a0, s1
  li a1, 0
  call oppWord
  lw t0, choice(zero)
  beq a0, t0, .L5
  ; scenes/match.e16.ts:151  ladder[n] = k
  slli t0, s2, 1
  sw s1, ladder(t0)
  ; scenes/match.e16.ts:152  n++
  addi s2, s2, 1
.L5:
  ; scenes/match.e16.ts:154  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bgeu s1, t0, .L6
  li t0, 3
  bltu s2, t0, .L1
.L6:
  ; scenes/match.e16.ts:156  k = 0
  li s1, 0 ; k
  ; scenes/match.e16.ts:157  while (k < OPPONENTS && n < LADDER) {
  j .L9
.L7:
  ; scenes/match.e16.ts:158  if ((oppWord(k, O_FLAGS) & OF_MIRROR) !== 0) {
  mv a0, s1
  li a1, 24
  call oppWord
  andi t0, a0, 16
  beq t0, zero, .L11
  ; scenes/match.e16.ts:159  ladder[n] = k
  slli t0, s2, 1
  sw s1, ladder(t0)
  ; scenes/match.e16.ts:160  n++
  addi s2, s2, 1
.L11:
  ; scenes/match.e16.ts:162  k++
  addi s1, s1, 1
.L9:
  li t0, 5
  bgeu s1, t0, .L12
  li t0, 4
  bltu s2, t0, .L7
.L12:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; scenes/match.e16.ts:169 matchPlay(k, pos) at -O1
;   k in s1
;   pos in s2
matchPlay:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; pos
  ; scenes/match.e16.ts:170  oppLoad(1, k, pos)
  li a0, 1
  mv a1, s1
  mv a2, s2
  call oppLoad
  ; scenes/match.e16.ts:171  oppLoad(0, choice[2], 0)
  lw t0, choice+4(zero)
  li a0, 0
  mv a1, t0
  li a2, 0
  call oppLoad
  ; scenes/match.e16.ts:172  fSlot[0] = choice[0]
  lw t0, choice(zero)
  sw t0, fSlot(zero)
  ; scenes/match.e16.ts:173  fSlot[1] = (opp[OW + O_FLAGS] & OF_MIRROR) !== 0 ? choice[0] : opp[OW + O_SLOT]
  lw t0, opp+112(zero)
  andi t1, t0, 16
  li t0, fSlot+2
  li t2, 0
  beq t1, t2, .L1
  lw t1, choice(zero)
  j .L2
.L1:
  lw t1, opp+64(zero)
.L2:
  sw t1, 0(t0)
  ; scenes/match.e16.ts:174  fighterLoad(0, fSlot[0])
  lw t0, fSlot(zero)
  li a0, 0
  mv a1, t0
  call fighterLoad
  ; scenes/match.e16.ts:175  fighterLoad(1, fSlot[1])
  lw t0, fSlot+2(zero)
  li a0, 1
  mv a1, t0
  call fighterLoad
  ; scenes/match.e16.ts:176  sidePalette()
  call sidePalette
  ; scenes/match.e16.ts:177  fightClear()
  call fightClear
  ; scenes/match.e16.ts:178  stageLoad(opp[OW + O_STAGE])
  lw a0, opp+66(zero)
  call stageLoad
  ; scenes/match.e16.ts:179  cpuMatchSet(0)
  li a0, 0
  la t0, cpuMatchSet
  li t1, 258
  call far_call
  ; scenes/match.e16.ts:180  cpuMatchSet(1)
  li a0, 1
  la t0, cpuMatchSet
  li t1, 258
  call far_call
  ; scenes/match.e16.ts:181  wins[0] = 0
  sw zero, wins(zero)
  ; scenes/match.e16.ts:182  wins[1] = 0
  sw zero, wins+2(zero)
  ; scenes/match.e16.ts:183  round = 1
  li t0, 1
  sw t0, 0x19ba(zero)
  ; scenes/match.e16.ts:184  draws = 0
  sw zero, 0x19c0(zero)
  ; scenes/match.e16.ts:185  outcome = 0
  sw zero, 0x19c2(zero)
  ; scenes/match.e16.ts:186  fComboMax[0] = 0
  sw zero, fComboMax(zero)
  ; scenes/match.e16.ts:187  fComboMax[1] = 0
  sw zero, fComboMax+2(zero)
  ; scenes/match.e16.ts:188  hitsN[0] = 0
  sw zero, hitsN(zero)
  ; scenes/match.e16.ts:189  hitsN[1] = 0
  sw zero, hitsN+2(zero)
  ; scenes/match.e16.ts:190  versusRun(k)
  mv a0, s1
  la t0, versusRun
  li t1, 262
  call far_call
  ; scenes/match.e16.ts:191  music(stageMusic())
  call stageMusic
  la t0, music
  li t1, 260
  call far_call
  ; scenes/match.e16.ts:192  while (outcome === 0) roundPlay()
  j .L5
.L3:
  ; scenes/match.e16.ts:192  roundPlay()
  call roundPlay
.L5:
  lw t0, 0x19c2(zero)
  beq t0, zero, .L3
  ; scenes/match.e16.ts:193  if (outcome === QUIT) return
  lw t0, 0x19c2(zero)
  li t1, 4
  bne t0, t1, .L7
  ; scenes/match.e16.ts:193  return
  j .return
.L7:
  ; scenes/match.e16.ts:194  phaseIs(PH_END)
  li a0, 3
  call phaseIs
  ; scenes/match.e16.ts:195  bandHigh()
  call bandHigh
  ; scenes/match.e16.ts:196  if (outcome === 1) {
  lw t0, 0x19c2(zero)
  li t1, 1
  bne t0, t1, .L8
  ; scenes/match.e16.ts:197  bandShow(str('YOU WIN'))
  la a0, str_14
  call bandShow
  ; scenes/match.e16.ts:198  music(M_WIN)
  li a0, 4
  la t0, music
  li t1, 260
  call far_call
  j .L14
.L8:
  ; scenes/match.e16.ts:200  bandShow(outcome === 2 ? str('YOU LOSE') : str('BOTH LOSE'))
  lw t0, 0x19c2(zero)
  li t1, 2
  bne t0, t1, .L10
  la t0, str_15
  j .L11
.L10:
  la t0, str_16
.L11:
  mv a0, t0
  call bandShow
  ; scenes/match.e16.ts:201  music(M_LOSE)
  li a0, 5
  la t0, music
  li t1, 260
  call far_call
  ; scenes/match.e16.ts:203  while (phaseT < END_F) {
  j .L14
.L12:
  ; scenes/match.e16.ts:204  frameStep()
  call frameStep
  ; scenes/match.e16.ts:205  phaseTick()
  call phaseTick
.L14:
  lw t0, 0x0c9a(zero)
  li t1, 150
  bltu t0, t1, .L12
  ; scenes/match.e16.ts:207  bandClear()
  call bandClear
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes/match.e16.ts:214 sidePalette() at -O1
sidePalette:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/match.e16.ts:215  palette(PAL_CPU, 9)
  li a0, 4
  li a1, 9
  call palette
  ; scenes/match.e16.ts:216  palKeep(PAL_CPU, 9)
  li a0, 4
  li a1, 9
  call palKeep
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/match.e16.ts:220 roundPlay() at -O1
;   roundWord.n in s1
roundPlay:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; scenes/match.e16.ts:221  screenIs(SC_FIGHT)
  li a0, 6
  call screenIs
  ; scenes/match.e16.ts:222  fighterReset(0)
  li a0, 0
  call fighterReset
  ; scenes/match.e16.ts:223  fighterReset(1)
  li a0, 1
  call fighterReset
  ; scenes/match.e16.ts:224  ringClear()
  call ringClear
  ; scenes/match.e16.ts:225  hitstopIs(0)
  li a0, 0
  call hitstopIs
  ; scenes/match.e16.ts:226  clockReset()
  call clockReset
  ; scenes/match.e16.ts:227  cpuRoundReset(0)
  li a0, 0
  la t0, cpuRoundReset
  li t1, 258
  call far_call
  ; scenes/match.e16.ts:228  cpuRoundReset(1)
  li a0, 1
  la t0, cpuRoundReset
  li t1, 258
  call far_call
  ; scenes/match.e16.ts:229  palKey[0] = 0xffff
  li t0, 65535
  sw t0, palKey(zero)
  ; scenes/match.e16.ts:230  palKey[1] = 0xffff
  li t0, 65535
  sw t0, palKey+2(zero)
  ; scenes/match.e16.ts:231  hudDraw()
  call hudDraw
  ; scenes/match.e16.ts:232  bandShow(roundWord(round))
  lw s1, 0x19ba(zero)
  ; scenes/match.e16.ts:296  if (n === 1) return str('ROUND 1')
  li t0, 1
  bne s1, t0, .I1.L1
  ; scenes/match.e16.ts:296  return str('ROUND 1')
  la t0, str_20
  j .I1_end
.I1.L1:
  ; scenes/match.e16.ts:297  if (n === 2) return str('ROUND 2')
  li t0, 2
  bne s1, t0, .I1.L2
  ; scenes/match.e16.ts:297  return str('ROUND 2')
  la t0, str_21
  j .I1_end
.I1.L2:
  ; scenes/match.e16.ts:298  return str('ROUND 3')
  la t0, str_22
.I1_end:
  mv a0, t0
  call bandShow
  ; scenes/match.e16.ts:233  phaseIs(PH_ROUND)
  li a0, 0
  call phaseIs
  ; scenes/match.e16.ts:234  for (;;) {
.L1:
  ; scenes/match.e16.ts:235  frameStep()
  call frameStep
  ; scenes/match.e16.ts:236  phaseTick()
  call phaseTick
  ; scenes/match.e16.ts:237  clockOn()
  ; scenes/match.e16.ts:248  clearT++
  lw t0, 0x19da(zero)
  addi t0, t0, 1
  sw t0, 0x19da(zero)
  ; scenes/match.e16.ts:249  if (clearT < CLOCK_SECOND) return
  li t1, 60
  bgeu t0, t1, .I2.L1
  ; scenes/match.e16.ts:249  return
  j .I2_end
.I2.L1:
  ; scenes/match.e16.ts:250  clearT = 0
  sw zero, 0x19da(zero)
  ; scenes/match.e16.ts:251  clearSec++
  lw t0, 0x19d8(zero)
  addi t0, t0, 1
  sw t0, 0x19d8(zero)
.I2_end:
  ; scenes/match.e16.ts:238  if (phase === PH_FIGHT && pressed(B_START) && pauseRun() !== 0) {
  lw t0, 0x0c98(zero)
  li t1, 1
  bne t0, t1, .L5
  li a0, 1024
  call pressed
  beqz a0, .L5
  la t0, pauseRun
  li t1, 259
  call far_call
  beq a0, zero, .L5
  ; scenes/match.e16.ts:239  outcome = QUIT
  li t0, 4
  sw t0, 0x19c2(zero)
  ; scenes/match.e16.ts:240  return
  j .return
.L5:
  ; scenes/match.e16.ts:242  if (phaseStep()) return
  call phaseStep
  beqz a0, .L1
  ; scenes/match.e16.ts:242  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/match.e16.ts:255 matchHud() at -O1
matchHud:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/match.e16.ts:256  hudClear()
  call hudClear
  ; scenes/match.e16.ts:257  hudDraw()
  call hudDraw
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/match.e16.ts:265 hudDraw() at -O1
hudDraw:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/match.e16.ts:266  heading(0)
  li a0, 0
  call heading
  ; scenes/match.e16.ts:267  heading(22)
  li a0, 22
  call heading
  ; scenes/match.e16.ts:268  say(2, 1, slName[fSlot[0]], SL_P1)
  lw t0, fSlot(zero)
  slli t0, t0, 1
  lw t0, slName(t0)
  li a0, 2
  li a1, 1
  mv a2, t0
  li a3, 1
  call say
  ; scenes/match.e16.ts:269  say(13, 1, str('P1'), SL_DIM)
  li a0, 13
  li a1, 1
  la a2, str_17
  li a3, 3
  call say
  ; scenes/match.e16.ts:270  say(24, 1, str('CPU'), SL_P1)
  li a0, 24
  li a1, 1
  la a2, str_18
  li a3, 1
  call say
  ; scenes/match.e16.ts:271  say(28, 1, slName[fSlot[1]], SL_DIM)
  lw t0, fSlot+2(zero)
  slli t0, t0, 1
  lw t0, slName(t0)
  li a0, 28
  li a1, 1
  mv a2, t0
  li a3, 3
  call say
  ; scenes/match.e16.ts:272  say(18, 3, str('TIME'), SL_DIM)
  li a0, 18
  li a1, 3
  la a2, str_19
  li a3, 3
  call say
  ; scenes/match.e16.ts:273  lamps(15, wins[0], false)
  lw t0, wins(zero)
  li a0, 15
  mv a1, t0
  li a2, 0
  call lamps
  ; scenes/match.e16.ts:274  lamps(23, wins[1], true)
  lw t0, wins+2(zero)
  li a0, 23
  mv a1, t0
  li a2, 1
  call lamps
  ; scenes/match.e16.ts:275  hudFresh()
  call hudFresh
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/match.e16.ts:278 heading(x) at -O1
;   x in s1
heading:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; x
  ; scenes/match.e16.ts:279  hudTile(x, 1, T_RULE, SL_P1)
  mv a0, s1
  li a1, 1
  li a2, 1
  li a3, 1
  call hudTile
  ; scenes/match.e16.ts:280  hudTile(x + 1, 1, T_TICK, SL_P1)
  addi a0, s1, 1
  li a1, 1
  li a2, 2
  li a3, 1
  call hudTile
  ; scenes/match.e16.ts:281  vpoke(cellAt(1, x + 16, 1), (HUD_TILE + T_TICK) | (SL_P1 << 10) | FRONT | FLIP)
  li a0, 1
  addi a1, s1, 16
  li a2, 1
  call cellAt
  li a1, 42154
  call vpoke
  ; scenes/match.e16.ts:282  hudTile(x + 17, 1, T_RULE, SL_P1)
  addi a0, s1, 17
  li a1, 1
  li a2, 1
  li a3, 1
  call hudTile
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/match.e16.ts:286 lamps(x, n, right) at -O1
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
  ; scenes/match.e16.ts:287  let k: u16 = 0
  li s1, 0 ; k
  ; scenes/match.e16.ts:288  while (k < 2) {
  j .L3
.L1:
  ; scenes/match.e16.ts:289  const lit = right ? k < n : 1 - k < n
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
  ; scenes/match.e16.ts:290  hudTile(x + k, 3, T_LAMP + (lit ? 1 : 0), SL_P1)
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
  ; scenes/match.e16.ts:291  k++
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

; scenes/match.e16.ts:305 phaseStep() at -O1
phaseStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/match.e16.ts:306  if (phase === PH_ROUND && phaseT >= ROUND_F) {
  lw t0, 0x0c98(zero)
  bne t0, zero, .L1
  lw t0, 0x0c9a(zero)
  li t1, 45
  bltu t0, t1, .L1
  ; scenes/match.e16.ts:307  phaseIs(PH_FIGHT)
  li a0, 1
  call phaseIs
  ; scenes/match.e16.ts:308  bandShow(str('FIGHT'))
  la a0, str_23
  call bandShow
  j .L2
.L1:
  ; scenes/match.e16.ts:309  if (phase === PH_FIGHT && phaseT === FIGHT_BAND_F) bandClear()
  lw t0, 0x0c98(zero)
  li t1, 1
  bne t0, t1, .L3
  lw t0, 0x0c9a(zero)
  li t1, 30
  bne t0, t1, .L3
  ; scenes/match.e16.ts:309  bandClear()
  call bandClear
  j .L4
.L3:
  ; scenes/match.e16.ts:310  if (phase === PH_OVER && phaseT === SUB_AT) {
  lw t0, 0x0c98(zero)
  li t1, 2
  bne t0, t1, .L5
  lw t0, 0x0c9a(zero)
  li t1, 20
  bne t0, t1, .L5
  ; scenes/match.e16.ts:311  if (roundWon === 0) bandSub(str('P1 TAKES THE ROUND'))
  lw t0, 0x0ca0(zero)
  bne t0, zero, .L6
  ; scenes/match.e16.ts:311  bandSub(str('P1 TAKES THE ROUND'))
  la a0, str_24
  call bandSub
  j .L10
.L6:
  ; scenes/match.e16.ts:312  if (roundWon === 1) bandSub(str('CPU TAKES THE ROUND'))
  lw t0, 0x0ca0(zero)
  li t1, 1
  bne t0, t1, .L8
  ; scenes/match.e16.ts:312  bandSub(str('CPU TAKES THE ROUND'))
  la a0, str_25
  call bandSub
  j .L10
.L8:
  ; scenes/match.e16.ts:313  bandSub(str('DRAW'))
  la a0, str_26
  call bandSub
  j .L10
.L5:
  ; scenes/match.e16.ts:314  if (phase === PH_OVER && phaseT >= OVER_F) {
  lw t0, 0x0c98(zero)
  li t1, 2
  bne t0, t1, .L11
  lw t0, 0x0c9a(zero)
  li t1, 120
  bltu t0, t1, .L11
  ; scenes/match.e16.ts:315  roundScore()
  call roundScore
  ; scenes/match.e16.ts:316  return true
  li a0, 1
  j .return
.L11:
.L10:
.L4:
.L2:
  ; scenes/match.e16.ts:318  return false
  li a0, 0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/match.e16.ts:325 bandSub(s) at -O1
;   s in 0(fp)
;   y in 2(fp)
;   n in s1
;   at in s3
;   k in s2
bandSub:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 0(fp) ; s
  ; scenes/match.e16.ts:326  const y = bandAt + 4
  lw t0, 0x1998(zero)
  addi t0, t0, 4
  sw t0, 2(fp) ; y
  ; scenes/match.e16.ts:327  vfill(cellAt(1, 0, y), (HUD_TILE + T_BAND) | (SL_P1 << 10) | FRONT, 40)
  li a0, 1
  li a1, 0
  lw a2, 2(fp)
  call cellAt
  li a1, 33965
  li a2, 40
  call vfill
  ; scenes/match.e16.ts:328  let n: u16 = 0
  li s1, 0 ; n
  ; scenes/match.e16.ts:329  while (peek(s + n) !== 0) n++
  j .L3
.L1:
  ; scenes/match.e16.ts:329  n++
  addi s1, s1, 1
.L3:
  lw t0, 0(fp) ; s
  add t0, t0, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; scenes/match.e16.ts:330  let at = cellAt(1, 20 - (n >> 1), y)
  srli t0, s1, 1
  li t1, 20
  sub t1, t1, t0
  li a0, 1
  mv a1, t1
  lw a2, 2(fp)
  call cellAt
  mv s3, a0 ; at
  ; scenes/match.e16.ts:331  let k: u16 = 0
  li s2, 0 ; k
  ; scenes/match.e16.ts:332  while (k < n) {
  j .L7
.L5:
  ; scenes/match.e16.ts:333  vpoke(at, (FONTB_TILE + peek(s + k) - 32) | (SL_P1 << 10) | FRONT)
  lw t0, 0(fp) ; s
  add t0, t0, s2
  lbu t0, 0(t0)
  addi t0, t0, 32
  ori t0, t0, 1024
  li t1, 32768
  or t0, t0, t1
  mv a0, s3
  mv a1, t0
  call vpoke
  ; scenes/match.e16.ts:334  at = wrap16(at + 2)
  addi s3, s3, 2
  ; scenes/match.e16.ts:335  k++
  addi s2, s2, 1
.L7:
  bltu s2, s1, .L5
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; scenes/match.e16.ts:340 roundScore() at -O1
roundScore:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/match.e16.ts:341  bandClear()
  call bandClear
  ; scenes/match.e16.ts:342  if (roundWon === 2) {
  lw t0, 0x0ca0(zero)
  li t1, 2
  bne t0, t1, .L1
  ; scenes/match.e16.ts:343  draws++
  lw t0, 0x19c0(zero)
  addi t0, t0, 1
  sw t0, 0x19c0(zero)
  ; scenes/match.e16.ts:344  if (draws >= DRAWS_LOST) outcome = 3
  li t1, 3
  bltu t0, t1, .L2
  ; scenes/match.e16.ts:344  outcome = 3
  li t0, 3
  sw t0, 0x19c2(zero)
.L2:
  ; scenes/match.e16.ts:345  return
  j .return
.L1:
  ; scenes/match.e16.ts:347  draws = 0
  sw zero, 0x19c0(zero)
  ; scenes/match.e16.ts:348  wins[roundWon]++
  lw t0, 0x0ca0(zero)
  slli t0, t0, 1
  addi t0, t0, wins
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; scenes/match.e16.ts:349  round++
  lw t0, 0x19ba(zero)
  addi t0, t0, 1
  sw t0, 0x19ba(zero)
  ; scenes/match.e16.ts:350  if (wins[roundWon] >= WINS) outcome = roundWon + 1
  lw t0, 0x0ca0(zero)
  slli t0, t0, 1
  lw t0, wins(t0)
  li t1, 2
  bltu t0, t1, .L3
  ; scenes/match.e16.ts:350  outcome = roundWon + 1
  lw t0, 0x0ca0(zero)
  addi t0, t0, 1
  sw t0, 0x19c2(zero)
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

str_14:
  .byte 89, 79, 85, 32, 87, 73, 78, 0
str_15:
  .byte 89, 79, 85, 32, 76, 79, 83, 69, 0
str_16:
  .byte 66, 79, 84, 72, 32, 76, 79, 83, 69, 0
str_17:
  .byte 80, 49, 0
str_18:
  .byte 67, 80, 85, 0
str_19:
  .byte 84, 73, 77, 69, 0
str_20:
  .byte 82, 79, 85, 78, 68, 32, 49, 0
str_21:
  .byte 82, 79, 85, 78, 68, 32, 50, 0
str_22:
  .byte 82, 79, 85, 78, 68, 32, 51, 0
str_23:
  .byte 70, 73, 71, 72, 84, 0
str_24:
  .byte 80, 49, 32, 84, 65, 75, 69, 83, 32, 84, 72, 69, 32, 82, 79, 85, 78, 68, 0
str_25:
  .byte 67, 80, 85, 32, 84, 65, 75, 69, 83, 32, 84, 72, 69, 32, 82, 79, 85, 78, 68, 0
str_26:
  .byte 68, 82, 65, 87, 0
  .align 2

  .bank 2
  .org 0xc000
; cpu/ai.e16.ts:226 cpuRoundReset(i) at -O1
;   i in s1
cpuRoundReset:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; cpu/ai.e16.ts:227  plan[i] = A_NONE
  slli t0, s1, 1
  li t1, 255
  sw t1, plan(t0)
  ; cpu/ai.e16.ts:228  thinkT[i] = 0
  slli t0, s1, 1
  sw zero, thinkT(t0)
  ; cpu/ai.e16.ts:229  outWas[i] = 0
  slli t0, s1, 1
  sw zero, outWas(t0)
  ; cpu/ai.e16.ts:230  gId[i] = 0xffff
  slli t0, s1, 1
  li t1, 65535
  sw t1, gId(t0)
  ; cpu/ai.e16.ts:231  gHold[i] = 0
  slli t0, s1, 1
  sw zero, gHold(t0)
  ; cpu/ai.e16.ts:232  aaArm[i] = 0
  slli t0, s1, 1
  sw zero, aaArm(t0)
  ; cpu/ai.e16.ts:233  punId[i] = 0xffff
  slli t0, s1, 1
  li t1, 65535
  sw t1, punId(t0)
  ; cpu/ai.e16.ts:234  punArm[i] = 0
  slli t0, s1, 1
  sw zero, punArm(t0)
  ; cpu/ai.e16.ts:235  fwdUp[i] = 255
  slli t0, s1, 1
  li t1, 255
  sw t1, fwdUp(t0)
  ; cpu/ai.e16.ts:236  tapT[i] = 0
  slli t0, s1, 1
  sw zero, tapT(t0)
  ; cpu/ai.e16.ts:237  swing[i] = WARY + 16
  slli t0, s1, 1
  li t1, 48
  sw t1, swing(t0)
  ; cpu/ai.e16.ts:238  swingId[i] = 0xffff
  slli t0, s1, 1
  li t1, 65535
  sw t1, swingId(t0)
  ; cpu/ai.e16.ts:239  swA[i] = longest(i) + EDGE
  slli t0, s1, 1
  addi t0, t0, swA
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call longest
  addi t0, a0, 6
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; cpu/ai.e16.ts:240  swB[i] = swA[i]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, swA(t1)
  sw t1, swB(t0)
  ; cpu/ai.e16.ts:241  minusT[i] = 0
  slli t0, s1, 1
  sw zero, minusT(t0)
  ; cpu/ai.e16.ts:242  techArm[i] = 0
  slli t0, s1, 1
  sw zero, techArm(t0)
  ; cpu/ai.e16.ts:243  chainArm[i] = 0
  slli t0, s1, 1
  sw zero, chainArm(t0)
  ; cpu/ai.e16.ts:244  prevState[i] = 0
  slli t0, s1, 1
  sw zero, prevState(t0)
  ; cpu/ai.e16.ts:245  patNo[i] = 0
  slli t0, s1, 1
  sw zero, patNo(t0)
  ; cpu/ai.e16.ts:246  habitDue[i] = 0
  slli t0, s1, 1
  sw zero, habitDue(t0)
  ; cpu/ai.e16.ts:247  watchReset(i)
  mv a0, s1
  la t0, watchReset
  li t1, 264
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; cpu/ai.e16.ts:255 cpuMatchSet(i) at -O1
;   i in s1
cpuMatchSet:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; cpu/ai.e16.ts:256  whims[i] = 0
  slli t0, s1, 1
  sw zero, whims(t0)
  ; cpu/ai.e16.ts:257  punishes[i] = 0
  slli t0, s1, 1
  sw zero, punishes(t0)
  ; cpu/ai.e16.ts:258  seenLate[i] = 0xffff
  slli t0, s1, 1
  li t1, 65535
  sw t1, seenLate(t0)
  ; cpu/ai.e16.ts:259  habitMatch(i)
  mv a0, s1
  la t0, habitMatch
  li t1, 264
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; cpu/ai.e16.ts:268 cpuMeasure(i) at -O1
;   i in s1
cpuMeasure:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; cpu/ai.e16.ts:269  if (ctl[i] === C_CPU) measure(i)
  slli t0, s1, 1
  lw t0, ctl(t0)
  li t1, 1
  bne t0, t1, .L1
  ; cpu/ai.e16.ts:269  measure(i)
  mv a0, s1
  call measure
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; cpu/ai.e16.ts:273 row(i, c) at -O1
;   i in a0
;   c in a1
row:
  ; cpu/ai.e16.ts:274  return opp[i * OW + c]
  slli t0, a0, 5
  add t0, t0, a1
  slli t0, t0, 1
  lw a0, opp(t0)
.return:
  ret

; cpu/ai.e16.ts:281 seenAt(i, j, age) at -O1
;   i in a0
;   j in a1
;   age in a2
seenAt:
  ; cpu/ai.e16.ts:282  if (age < seenLate[i]) seenLate[i] = age
  slli t0, a0, 1
  lw t0, seenLate(t0)
  bgeu a2, t0, .L1
  ; cpu/ai.e16.ts:282  seenLate[i] = age
  slli t0, a0, 1
  sw a2, seenLate(t0)
.L1:
  ; cpu/ai.e16.ts:283  return j * 32 + ((seenN - age) & 31)
  slli t0, a1, 5
  lw t1, 0x0ea8(zero)
  sub t1, t1, a2
  andi t1, t1, 31
  add a0, t0, t1
.return:
  ret

; cpu/ai.e16.ts:287 apartAt(i, age) at -O1
;   i in s1
;   age in s0
;   a in s2
;   b in s3
apartAt:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; i
  mv s0, a1 ; age
  ; cpu/ai.e16.ts:288  const a = seenX[seenAt(i, i, age)]
  mv a0, s1
  mv a1, s1
  mv a2, s0
  call seenAt
  slli t0, a0, 1
  lw s2, seenX(t0)
  ; cpu/ai.e16.ts:289  const b = seenX[seenAt(i, 1 - i, age)]
  li t0, 1
  sub t0, t0, s1
  mv a0, s1
  mv a1, t0
  mv a2, s0
  call seenAt
  slli t0, a0, 1
  lw s3, seenX(t0)
  ; cpu/ai.e16.ts:290  return a > b ? a - b : b - a
  bgeu s3, s2, .L1
  sub t0, s2, s3
  j .L2
.L1:
  sub t0, s3, s2
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:294 distTo(i, e) at -O1
;   i in s3
;   e in s0
;   a in s1
;   b in s2
distTo:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; i
  mv s0, a1 ; e
  ; cpu/ai.e16.ts:295  const a = pointX(i)
  mv a0, s3
  call pointX
  mv s1, a0 ; a
  ; cpu/ai.e16.ts:296  const b = seenX[e]
  slli t0, s0, 1
  lw s2, seenX(t0)
  ; cpu/ai.e16.ts:297  return a > b ? a - b : b - a
  bgeu s2, s1, .L1
  sub t0, s1, s2
  j .L2
.L1:
  sub t0, s2, s1
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:304 cpuThink(i, think) at -O1
;   i in s1
;   think in s0
;   j in s3
;   out in s2
cpuThink:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  mv s1, a0 ; i
  mv s0, a1 ; think
  ; cpu/ai.e16.ts:305  const j = 1 - i
  li t0, 1
  sub s3, t0, s1
  ; cpu/ai.e16.ts:306  observe(i, j)
  mv a0, s1
  mv a1, s3
  la t0, observe
  li t1, 264
  call far_call
  ; cpu/ai.e16.ts:307  habitStep(i, j)
  mv a0, s1
  mv a1, s3
  la t0, habitStep
  li t1, 264
  call far_call
  ; cpu/ai.e16.ts:308  if (!think) return outWas[i]
  bnez s0, .L1
  ; cpu/ai.e16.ts:308  return outWas[i]
  slli t0, s1, 1
  lw a0, outWas(t0)
  j .return
.L1:
  ; cpu/ai.e16.ts:309  counters(i, j)
  mv a0, s1
  mv a1, s3
  call counters
  ; cpu/ai.e16.ts:310  let out = reflex(i, j)
  mv a0, s1
  mv a1, s3
  call reflex
  mv s2, a0 ; out
  ; cpu/ai.e16.ts:311  if (out === 0xffff) out = planned(i, j)
  li t0, 65535
  bne s2, t0, .L2
  ; cpu/ai.e16.ts:311  out = planned(i, j)
  mv a0, s1
  mv a1, s3
  call planned
  mv s2, a0 ; out
.L2:
  ; cpu/ai.e16.ts:312  out = undashed(i, chainStep(i, out))
  mv a0, s1
  mv a1, s2
  call chainStep
  mv a1, a0
  mv a0, s1
  call undashed
  mv s2, a0 ; out
  ; cpu/ai.e16.ts:313  outWas[i] = out
  slli t0, s1, 1
  sw s2, outWas(t0)
  ; cpu/ai.e16.ts:314  prevState[i] = fState[i]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fState(t1)
  sw t1, prevState(t0)
  ; cpu/ai.e16.ts:315  return out
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:319 counters(i, j) at -O1
;   i in s1
;   j in s2
;   e in s3
counters:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  mv s2, a1 ; j
  ; cpu/ai.e16.ts:320  swingStep(i, j)
  mv a0, s1
  mv a1, s2
  call swingStep
  ; cpu/ai.e16.ts:321  punishArm(i, j)
  mv a0, s1
  mv a1, s2
  call punishArm
  ; cpu/ai.e16.ts:322  if (minusT[i] > 0) minusT[i]--
  slli t0, s1, 1
  lw t0, minusT(t0)
  bgeu zero, t0, .L1
  ; cpu/ai.e16.ts:322  minusT[i]--
  slli t0, s1, 1
  addi t0, t0, minusT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
.L1:
  ; cpu/ai.e16.ts:324  const e = i * 32 + ((seenN - 1) & 31)
  slli t0, s1, 5
  lw t1, 0x0ea8(zero)
  addi t1, t1, -1
  andi t1, t1, 31
  add s3, t0, t1
  ; cpu/ai.e16.ts:325  if (seenF[e] >> 8 === 2) minusT[i] = MINUS_F
  slli t0, s3, 1
  lw t0, seenF(t0)
  srli t0, t0, 8
  li t1, 2
  bne t0, t1, .L2
  ; cpu/ai.e16.ts:325  minusT[i] = MINUS_F
  slli t0, s1, 1
  li t1, 30
  sw t1, minusT(t0)
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:333 undashed(i, out) at -O1
;   i in a0
;   out in a1
;   tapping in a2
undashed:
  ; cpu/ai.e16.ts:334  const tapping = tapT[i] > 0
  slli t0, a0, 1
  lw t0, tapT(t0)
  sltu a2, zero, t0
  ; cpu/ai.e16.ts:335  if (tapping) tapT[i]--
  beqz a2, .L1
  ; cpu/ai.e16.ts:335  tapT[i]--
  slli t0, a0, 1
  addi t0, t0, tapT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
.L1:
  ; cpu/ai.e16.ts:336  if ((outWas[i] & I_FWD) !== 0) fwdUp[i] = 0
  slli t0, a0, 1
  lw t0, outWas(t0)
  andi t0, t0, 8
  beq t0, zero, .L2
  ; cpu/ai.e16.ts:336  fwdUp[i] = 0
  slli t0, a0, 1
  sw zero, fwdUp(t0)
  j .L3
.L2:
  ; cpu/ai.e16.ts:337  if (fwdUp[i] < 255) fwdUp[i]++
  slli t0, a0, 1
  lw t0, fwdUp(t0)
  li t1, 255
  bgeu t0, t1, .L4
  ; cpu/ai.e16.ts:337  fwdUp[i]++
  slli t0, a0, 1
  addi t0, t0, fwdUp
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
.L4:
.L3:
  ; cpu/ai.e16.ts:338  if (tapping || (out & I_FWD) === 0 || (outWas[i] & I_FWD) !== 0 || fwdUp[i] > DASH_GAP) return out
  bnez a2, .L6
  andi t0, a1, 8
  beq t0, zero, .L6
  slli t0, a0, 1
  lw t0, outWas(t0)
  andi t0, t0, 8
  bne t0, zero, .L6
  slli t0, a0, 1
  lw t0, fwdUp(t0)
  li t1, 10
  bgeu t1, t0, .L5
.L6:
  ; cpu/ai.e16.ts:338  return out
  mv a0, a1
  ret
.L5:
  ; cpu/ai.e16.ts:339  return out & ~I_FWD
  andi a0, a1, -9
.return:
  ret

; cpu/ai.e16.ts:345 reflex(i, j) at -O1
;   i in s1
;   j in s2
;   st in s3
;   aa in 0(fp)
;   g in 2(fp)
reflex:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; i
  mv s2, a1 ; j
  ; cpu/ai.e16.ts:346  const st = fState[i]
  slli t0, s1, 1
  lw s3, fState(t0)
  ; cpu/ai.e16.ts:347  if (st === ST_THROWN) return tech(i, j)
  li t0, 12
  bne s3, t0, .L1
  ; cpu/ai.e16.ts:347  return tech(i, j)
  mv a0, s1
  mv a1, s2
  call tech
  j .return
.L1:
  ; cpu/ai.e16.ts:348  techArm[i] = 0
  slli t0, s1, 1
  sw zero, techArm(t0)
  ; cpu/ai.e16.ts:349  if (!free(i) && st !== ST_GUARD) return 0xffff
  mv a0, s1
  call free
  bnez a0, .L2
  li t0, 7
  beq s3, t0, .L2
  ; cpu/ai.e16.ts:349  return 0xffff
  li a0, 65535
  j .return
.L2:
  ; cpu/ai.e16.ts:350  const aa = antiAir(i, j)
  mv a0, s1
  mv a1, s2
  call antiAir
  sw a0, 0(fp) ; aa
  ; cpu/ai.e16.ts:351  if (aa !== 0xffff) return aa
  li t0, 65535
  lw t1, 0(fp) ; aa
  beq t1, t0, .L3
  ; cpu/ai.e16.ts:351  return aa
  lw a0, 0(fp)
  j .return
.L3:
  ; cpu/ai.e16.ts:352  const g = guard(i, j)
  mv a0, s1
  mv a1, s2
  call guard
  sw a0, 2(fp) ; g
  ; cpu/ai.e16.ts:353  if (g !== 0xffff) return g
  li t0, 65535
  lw t1, 2(fp) ; g
  beq t1, t0, .L4
  ; cpu/ai.e16.ts:353  return g
  lw a0, 2(fp)
  j .return
.L4:
  ; cpu/ai.e16.ts:354  return punish(i, j)
  mv a0, s1
  mv a1, s2
  call punish
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; cpu/ai.e16.ts:360 tech(i, j) at -O1
;   i in s1
;   j in s2
;   e in s3
tech:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  mv s2, a1 ; j
  ; cpu/ai.e16.ts:361  if (techArm[i] === 2) return 0
  slli t0, s1, 1
  lw t0, techArm(t0)
  li t1, 2
  bne t0, t1, .L1
  ; cpu/ai.e16.ts:361  return 0
  li a0, 0
  j .return
.L1:
  ; cpu/ai.e16.ts:362  const e = seenAt(i, j, row(i, O_R_TECH))
  mv a0, s1
  li a1, 6
  call row
  mv a1, s2
  mv a2, a0
  mv a0, s1
  call seenAt
  mv s3, a0 ; e
  ; cpu/ai.e16.ts:363  if ((seenS[e] & 255) !== ST_THROW) return 0
  slli t0, s3, 1
  lw t0, seenS(t0)
  andi t0, t0, 255
  li t1, 11
  beq t0, t1, .L2
  ; cpu/ai.e16.ts:363  return 0
  li a0, 0
  j .return
.L2:
  ; cpu/ai.e16.ts:364  if (techArm[i] === 0) techArm[i] = randBelow(256) < row(i, O_GUARD) ? 1 : 2
  slli t0, s1, 1
  lw t0, techArm(t0)
  bne t0, zero, .L3
  ; cpu/ai.e16.ts:364  techArm[i] = randBelow(256) < row(i, O_GUARD) ? 1 : 2
  slli t0, s1, 1
  addi t0, t0, techArm
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 256
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 8
  call row
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv t2, a0
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  bgeu t1, t2, .L4
  li t1, 1
  j .L5
.L4:
  li t1, 2
.L5:
  sw t1, 0(t0)
.L3:
  ; cpu/ai.e16.ts:365  if (techArm[i] === 2) return 0
  slli t0, s1, 1
  lw t0, techArm(t0)
  li t1, 2
  bne t0, t1, .L6
  ; cpu/ai.e16.ts:365  return 0
  li a0, 0
  j .return
.L6:
  ; cpu/ai.e16.ts:366  if ((outWas[i] & I_HP) !== 0) return I_BACK
  slli t0, s1, 1
  lw t0, outWas(t0)
  andi t0, t0, 32
  beq t0, zero, .L7
  ; cpu/ai.e16.ts:366  return I_BACK
  li a0, 4
  j .return
.L7:
  ; cpu/ai.e16.ts:367  techArm[i] = 2
  slli t0, s1, 1
  li t1, 2
  sw t1, techArm(t0)
  ; cpu/ai.e16.ts:368  return I_BACK | I_HP
  li a0, 36
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:376 guard(i, j) at -O1
;   i in s1
;   j in s2
;   guarding in 2(fp)
;   e in s3
;   st in 10(fp)
;   m in 0(fp)
;   f in 6(fp)
;   id in 8(fp)
;   crouch in 4(fp)
guard:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s1, a0 ; i
  mv s2, a1 ; j
  ; cpu/ai.e16.ts:377  const guarding = fState[i] === ST_GUARD
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 7
  sub t0, t0, t1
  seqz t0, t0
  sw t0, 2(fp) ; guarding
  ; cpu/ai.e16.ts:378  const e = seenAt(i, j, row(i, guarding ? O_R_SWITCH : O_R_GUARD))
  mv t0, s1
  mv t1, s2
  mv t2, s1
  lw t3, 2(fp)
  beqz t3, .L1
  li t3, 7
  j .L2
.L1:
  li t3, 3
.L2:
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  mv a0, t2
  mv a1, t3
  call row
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  call seenAt
  mv s3, a0 ; e
  ; cpu/ai.e16.ts:379  const st = seenS[e] & 255
  slli t0, s3, 1
  lw t0, seenS(t0)
  andi t0, t0, 255
  sw t0, 10(fp) ; st
  ; cpu/ai.e16.ts:380  const m = seenS[e] >> 8
  slli t0, s3, 1
  lw t0, seenS(t0)
  srli t0, t0, 8
  sw t0, 0(fp) ; m
  ; cpu/ai.e16.ts:381  if (st !== ST_ATTACK || m === MV_THROW || distTo(i, e) > reaches(j, m)) {
  li t0, 5
  lw t1, 10(fp) ; st
  bne t1, t0, .L4
  li t0, 12
  lw t1, 0(fp) ; m
  beq t1, t0, .L4
  mv a0, s1
  mv a1, s3
  call distTo
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  lw a1, 0(fp)
  call reaches
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu a0, t0, .L3
.L4:
  ; cpu/ai.e16.ts:382  return guarding ? gHold[i] : 0xffff
  lw t0, 2(fp) ; guarding
  beqz t0, .L5
  slli t0, s1, 1
  lw t0, gHold(t0)
  j .L6
.L5:
  li t0, 65535
.L6:
  mv a0, t0
  j .return
.L3:
  ; cpu/ai.e16.ts:384  const f = framesOf(e)
  mv a0, s3
  call framesOf
  sw a0, 6(fp) ; f
  ; cpu/ai.e16.ts:385  if (f >= mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE)) return guarding ? gHold[i] : 0xffff
  mv a0, s2
  lw a1, 0(fp)
  li a2, 0
  call mvAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  lw a1, 0(fp)
  li a2, 1
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 6(fp) ; f
  bltu t1, t0, .L7
  ; cpu/ai.e16.ts:385  return guarding ? gHold[i] : 0xffff
  lw t0, 2(fp) ; guarding
  beqz t0, .L8
  slli t0, s1, 1
  lw t0, gHold(t0)
  j .L9
.L8:
  li t0, 65535
.L9:
  mv a0, t0
  j .return
.L7:
  ; cpu/ai.e16.ts:386  const id = (seenN - f) & 0x7fff
  lw t0, 0x0ea8(zero)
  lw t1, 6(fp) ; f
  sub t0, t0, t1
  li t1, 32767
  and t0, t0, t1
  sw t0, 8(fp) ; id
  ; cpu/ai.e16.ts:387  if (gId[i] !== id) {
  slli t0, s1, 1
  lw t0, gId(t0)
  lw t1, 8(fp) ; id
  beq t0, t1, .L10
  ; cpu/ai.e16.ts:388  gId[i] = id
  slli t0, s1, 1
  lw t1, 8(fp) ; id
  sw t1, gId(t0)
  ; cpu/ai.e16.ts:389  let crouch = mvAt(j, m, M_HEIGHT) !== H_MID && seenY[e] === 0
  mv a0, s2
  lw a1, 0(fp)
  li a2, 10
  call mvAt
  li t0, 3
  sub t0, a0, t0
  snez t0, t0
  mv t1, t0
  beqz t1, .L11
  slli t0, s3, 1
  lw t0, seenY(t0)
  sub t0, t0, zero
  seqz t0, t0
.L11:
  sw t0, 4(fp) ; crouch
  ; cpu/ai.e16.ts:390  if (randBelow(256) >= row(i, O_GUARD)) crouch = !crouch
  li a0, 256
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 8
  call row
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu t0, a0, .L12
  ; cpu/ai.e16.ts:390  crouch = !crouch
  lw t0, 4(fp) ; crouch
  seqz t0, t0
  sw t0, 4(fp) ; crouch
.L12:
  ; cpu/ai.e16.ts:391  gHold[i] = I_BACK | (crouch ? I_DOWN : 0)
  slli t0, s1, 1
  addi t0, t0, gHold
  li t1, 4
  lw t2, 4(fp)
  beqz t2, .L13
  li t2, 2
  j .L14
.L13:
  li t2, 0
.L14:
  or t1, t1, t2
  sw t1, 0(t0)
.L10:
  ; cpu/ai.e16.ts:393  return gHold[i]
  slli t0, s1, 1
  lw a0, gHold(t0)
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; cpu/ai.e16.ts:397 framesOf(e) at -O1
;   e in a0
framesOf:
  ; cpu/ai.e16.ts:398  return seenF[e] & 255
  slli t0, a0, 1
  lw t0, seenF(t0)
  andi a0, t0, 255
.return:
  ret

; cpu/ai.e16.ts:406 antiAir(i, j) at -O1
;   i in s1
;   j in s0
;   r in s3
;   e in s2
antiAir:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  mv s1, a0 ; i
  mv s0, a1 ; j
  ; cpu/ai.e16.ts:407  const r = row(i, O_R_AA)
  mv a0, s1
  li a1, 4
  call row
  mv s3, a0 ; r
  ; cpu/ai.e16.ts:408  const e = seenAt(i, j, r)
  mv a0, s1
  mv a1, s0
  mv a2, s3
  call seenAt
  mv s2, a0 ; e
  ; cpu/ai.e16.ts:409  if (seenY[e] === 0 && (seenS[e] & 255) !== ST_PREJUMP) {
  slli t0, s2, 1
  lw t0, seenY(t0)
  bne t0, zero, .L1
  slli t0, s2, 1
  lw t0, seenS(t0)
  andi t0, t0, 255
  li t1, 2
  beq t0, t1, .L1
  ; cpu/ai.e16.ts:410  aaArm[i] = 0
  slli t0, s1, 1
  sw zero, aaArm(t0)
  ; cpu/ai.e16.ts:411  return 0xffff
  li a0, 65535
  j .return
.L1:
  ; cpu/ai.e16.ts:413  if (aaArm[i] === 0) aaArm[i] = randBelow(256) < row(i, O_AA) ? 1 : 2
  slli t0, s1, 1
  lw t0, aaArm(t0)
  bne t0, zero, .L2
  ; cpu/ai.e16.ts:413  aaArm[i] = randBelow(256) < row(i, O_AA) ? 1 : 2
  slli t0, s1, 1
  addi t0, t0, aaArm
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 256
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 9
  call row
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv t2, a0
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  bgeu t1, t2, .L3
  li t1, 1
  j .L4
.L3:
  li t1, 2
.L4:
  sw t1, 0(t0)
.L2:
  ; cpu/ai.e16.ts:414  if (aaArm[i] === 2) return distTo(i, e) < THREAT ? I_BACK : 0xffff
  slli t0, s1, 1
  lw t0, aaArm(t0)
  li t1, 2
  bne t0, t1, .L5
  ; cpu/ai.e16.ts:414  return distTo(i, e) < THREAT ? I_BACK : 0xffff
  mv a0, s1
  mv a1, s2
  call distTo
  li t0, 110
  bgeu a0, t0, .L6
  li t0, 4
  j .L7
.L6:
  li t0, 65535
.L7:
  mv a0, t0
  j .return
.L5:
  ; cpu/ai.e16.ts:415  if (aaArm[i] === 3) return I_DOWN
  slli t0, s1, 1
  lw t0, aaArm(t0)
  li t1, 3
  bne t0, t1, .L8
  ; cpu/ai.e16.ts:415  return I_DOWN
  li a0, 2
  j .return
.L8:
  ; cpu/ai.e16.ts:416  return aaPress(i, e, r)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call aaPress
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:420 aaPress(i, e, r) at -O1
;   i in s1
;   e in s3
;   r in s2
aaPress:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; i
  mv s3, a1 ; e
  mv s2, a2 ; r
  ; cpu/ai.e16.ts:421  if (!coming(i, r)) return 0xffff
  mv a0, s1
  mv a1, s2
  call coming
  bnez a0, .L1
  ; cpu/ai.e16.ts:421  return 0xffff
  li a0, 65535
  j .return
.L1:
  ; cpu/ai.e16.ts:422  if (distTo(i, e) > aaReach(r) || (outWas[i] & I_HP) !== 0) return I_DOWN
  mv a0, s1
  mv a1, s3
  call distTo
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call aaReach
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu a0, t0, .L3
  slli t0, s1, 1
  lw t0, outWas(t0)
  andi t0, t0, 32
  beq t0, zero, .L2
.L3:
  ; cpu/ai.e16.ts:422  return I_DOWN
  li a0, 2
  j .return
.L2:
  ; cpu/ai.e16.ts:423  aaArm[i] = 3
  slli t0, s1, 1
  li t1, 3
  sw t1, aaArm(t0)
  ; cpu/ai.e16.ts:424  return I_DOWN | I_HP
  li a0, 34
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:428 aaReach(r) at -O1
;   r in a0
aaReach:
  ; cpu/ai.e16.ts:429  return 20 + (((r + 7) * 9) >> 2)
  addi t0, a0, 7
  slli t1, t0, 3
  add t0, t1, t0
  srli t0, t0, 2
  addi a0, t0, 20
.return:
  ret

; cpu/ai.e16.ts:433 coming(i, r) at -O1
;   i in s1
;   r in s2
coming:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; r
  ; cpu/ai.e16.ts:434  return apartAt(i, r) < apartAt(i, r + 2)
  mv a0, s1
  mv a1, s2
  call apartAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  addi a1, s2, 2
  call apartAt
  lw t0, 0(sp)
  addi sp, sp, 2
  sltu a0, t0, a0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; cpu/ai.e16.ts:461 boxesMeet() at -O1
;   most in a2
;   h in a0
;   hw in a3
;   b in a1
;   hurtW in s1
;   ht in s2
;   bt in s3
;   apart in s0
boxesMeet:
  addi sp, sp, -8
  sw s1, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  ; cpu/ai.e16.ts:462  let most: u16 = 0
  li a2, 0 ; most
  ; cpu/ai.e16.ts:463  let h: u16 = BW_HIT
  li a0, 12 ; h
  ; cpu/ai.e16.ts:464  while (h < BW_HIT + 8) {
  j .L3
.L1:
  ; cpu/ai.e16.ts:465  const hw = i16(bw[h + 2])
  addi t0, a0, 2
  slli t0, t0, 1
  lw a3, bw(t0)
  ; cpu/ai.e16.ts:466  let b: u16 = BW_HURT
  li a1, 0 ; b
  ; cpu/ai.e16.ts:467  while (hw !== 0 && b < BW_HURT + 12) {
  j .L7
.L5:
  ; cpu/ai.e16.ts:468  const hurtW = i16(bw[b + 2])
  addi t0, a1, 2
  slli t0, t0, 1
  lw s1, bw(t0)
  ; cpu/ai.e16.ts:469  const ht = i16(bw[h + 1])
  addi t0, a0, 1
  slli t0, t0, 1
  lw s2, bw(t0)
  ; cpu/ai.e16.ts:470  const bt = i16(bw[b + 1])
  addi t0, a1, 1
  slli t0, t0, 1
  lw s3, bw(t0)
  ; cpu/ai.e16.ts:471  const apart = i16(bw[h]) + hw + i16(bw[b]) + hurtW - 1
  slli t0, a0, 1
  lw t0, bw(t0)
  add t0, t0, a3
  slli t1, a1, 1
  lw t1, bw(t1)
  add t0, t0, t1
  add t0, t0, s1
  addi s0, t0, -1
  ; cpu/ai.e16.ts:472  if (
  beq s1, zero, .L9
  addi t0, a0, 3
  slli t0, t0, 1
  lw t0, bw(t0)
  sub t0, s2, t0
  bge t0, s3, .L9
  addi t0, a1, 3
  slli t0, t0, 1
  lw t0, bw(t0)
  sub t0, s3, t0
  bge t0, s2, .L9
  bge a2, s0, .L9
  ; cpu/ai.e16.ts:478  most = u16(apart)
  mv a2, s0 ; most
.L9:
  ; cpu/ai.e16.ts:480  b = b + 4
  addi a1, a1, 4
.L7:
  beq a3, zero, .L10
  li t0, 12
  bltu a1, t0, .L5
.L10:
  ; cpu/ai.e16.ts:482  h = h + 4
  addi a0, a0, 4
.L3:
  li t0, 20
  bltu a0, t0, .L1
  ; cpu/ai.e16.ts:484  return most
  mv a0, a2
.return:
  lw s1, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:488 measured(f, p, hit) at -O1
;   f in s1
;   p in s2
;   hit in s3
measured:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; f
  mv s2, a1 ; p
  mv s3, a2 ; hit
  ; cpu/ai.e16.ts:489  if (hit) poseWords(fSlot[f], p * POSE_W + 16, 8, addr(bw) + BW_HIT * 2)
  beqz s3, .L1
  ; cpu/ai.e16.ts:489  poseWords(fSlot[f], p * POSE_W + 16, 8, addr(bw) + BW_HIT * 2)
  slli t0, s1, 1
  lw t0, fSlot(t0)
  slli t2, s2, 4
  slli t1, s2, 3
  add t1, t1, t2
  mv a0, t0
  addi a1, t1, 16
  li a2, 8
  li a3, bw+24
  call poseWords
  j .L2
.L1:
  ; cpu/ai.e16.ts:490  poseWords(fSlot[f], p * POSE_W + 4, 12, addr(bw) + BW_HURT * 2)
  slli t0, s1, 1
  lw t0, fSlot(t0)
  slli t2, s2, 4
  slli t1, s2, 3
  add t1, t1, t2
  mv a0, t0
  addi a1, t1, 4
  li a2, 12
  la a3, bw
  call poseWords
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:498 measure(i) at -O1
;   i in s1
;   j in s3
;   m in s2
;   k in s0
measure:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; i
  ; cpu/ai.e16.ts:499  const j = 1 - i
  li t0, 1
  sub s3, t0, s1
  ; cpu/ai.e16.ts:500  poseWords(fSlot[j], 0, 4, addr(bw))
  slli t0, s3, 1
  lw a0, fSlot(t0)
  li a1, 0
  li a2, 4
  la a3, bw
  call poseWords
  ; cpu/ai.e16.ts:501  otherHalf[i] = bw[2] >> 1
  slli t0, s1, 1
  lw t1, bw+4(zero)
  srli t1, t1, 1
  sw t1, otherHalf(t0)
  ; cpu/ai.e16.ts:502  let m: u16 = 0
  li s2, 0 ; m
  ; cpu/ai.e16.ts:503  while (m < 8) {
  j .L3
.L1:
  ; cpu/ai.e16.ts:504  measured(i, 0, false)
  mv a0, s1
  li a1, 0
  li a2, 0
  call measured
  ; cpu/ai.e16.ts:505  measured(j, mvAt(j, m, M_POSE) + 1, true)
  mv a0, s3
  mv a1, s2
  li a2, 14
  call mvAt
  addi a1, a0, 1
  mv a0, s3
  li a2, 1
  call measured
  ; cpu/ai.e16.ts:506  thD[i * 8 + m] = boxesMeet()
  slli t0, s1, 3
  add t0, t0, s2
  slli t0, t0, 1
  addi t0, t0, thD
  addi sp, sp, -2
  sw t0, 0(sp)
  call boxesMeet
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; cpu/ai.e16.ts:507  measured(j, mvAt(j, m, M_POSE) + 2, false)
  mv a0, s3
  mv a1, s2
  li a2, 14
  call mvAt
  addi a1, a0, 2
  mv a0, s3
  li a2, 0
  call measured
  ; cpu/ai.e16.ts:508  let k: u16 = 0
  li s0, 0 ; k
  ; cpu/ai.e16.ts:509  while (k < PUNISHERS) {
  j .L7
.L5:
  ; cpu/ai.e16.ts:510  measured(i, mvAt(i, k, M_POSE) + 1, true)
  mv a0, s1
  mv a1, s0
  li a2, 14
  call mvAt
  addi a1, a0, 1
  mv a0, s1
  li a2, 1
  call measured
  ; cpu/ai.e16.ts:511  punD[i * 32 + k * 8 + m] = boxesMeet()
  slli t0, s1, 5
  slli t1, s0, 3
  add t0, t0, t1
  add t0, t0, s2
  slli t0, t0, 1
  addi t0, t0, punD
  addi sp, sp, -2
  sw t0, 0(sp)
  call boxesMeet
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; cpu/ai.e16.ts:512  k++
  addi s0, s0, 1
.L7:
  li t0, 4
  bltu s0, t0, .L5
  ; cpu/ai.e16.ts:514  m++
  addi s2, s2, 1
.L3:
  li t0, 8
  bltu s2, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:519 longest(i) at -O1
;   i in a0
;   most in a2
;   m in a1
longest:
  ; cpu/ai.e16.ts:520  let most: u16 = 0
  li a2, 0 ; most
  ; cpu/ai.e16.ts:521  let m: u16 = 0
  li a1, 0 ; m
  ; cpu/ai.e16.ts:522  while (m < 8) {
  j .L3
.L1:
  ; cpu/ai.e16.ts:523  if (thD[i * 8 + m] > most) most = thD[i * 8 + m]
  slli t0, a0, 3
  add t0, t0, a1
  slli t0, t0, 1
  lw t0, thD(t0)
  bgeu a2, t0, .L5
  ; cpu/ai.e16.ts:523  most = thD[i * 8 + m]
  slli t0, a0, 3
  add t0, t0, a1
  slli t0, t0, 1
  lw a2, thD(t0)
.L5:
  ; cpu/ai.e16.ts:524  m++
  addi a1, a1, 1
.L3:
  li t0, 8
  bltu a1, t0, .L1
  ; cpu/ai.e16.ts:526  return most
  mv a0, a2
.return:
  ret

; cpu/ai.e16.ts:534 reaches(j, m) at -O1
;   j in s2
;   m in s1
reaches:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; j
  mv s1, a1 ; m
  ; cpu/ai.e16.ts:535  if (m < 8) return thD[(1 - j) * 8 + m] + EDGE
  li t0, 8
  bgeu s1, t0, .L1
  ; cpu/ai.e16.ts:535  return thD[(1 - j) * 8 + m] + EDGE
  li t0, 1
  sub t0, t0, s2
  slli t0, t0, 3
  add t0, t0, s1
  slli t0, t0, 1
  lw t0, thD(t0)
  addi a0, t0, 6
  j .return
.L1:
  ; cpu/ai.e16.ts:536  if (m === MV_THROW) return reach[j * MOVES + m] + half(1 - j) + EDGE
  li t0, 12
  bne s1, t0, .L2
  ; cpu/ai.e16.ts:536  return reach[j * MOVES + m] + half(1 - j) + EDGE
  li t0, 13
  mul t0, s2, t0
  add t0, t0, s1
  slli t0, t0, 1
  lw t0, reach(t0)
  li t1, 1
  sub t1, t1, s2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  call half
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi a0, t0, 6
  j .return
.L2:
  ; cpu/ai.e16.ts:537  return THREAT
  li a0, 110
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; cpu/ai.e16.ts:541 moveBegan(e) at -O1
;   e in s1
moveBegan:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; e
  ; cpu/ai.e16.ts:542  return wrap16(seenL[e & 31] - framesOf(e) + 1)
  andi t0, s1, 31
  slli t0, t0, 1
  lw t0, seenL(t0)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call framesOf
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  addi a0, t0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; cpu/ai.e16.ts:546 frameNow(began) at -O1
;   began in a0
frameNow:
  ; cpu/ai.e16.ts:547  return wrap16(liveN - began) + 1
  lw t0, 0x0eaa(zero)
  sub t0, t0, a0
  addi a0, t0, 1
.return:
  ret

; cpu/ai.e16.ts:554 swingStep(i, j) at -O1
;   i in s1
;   j in s3
;   e in s2
;   began in s0
swingStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; i
  mv s3, a1 ; j
  ; cpu/ai.e16.ts:555  if (swing[i] > 0 && (liveN & 1) === 0) swing[i]--
  slli t0, s1, 1
  lw t0, swing(t0)
  bgeu zero, t0, .L1
  lw t0, 0x0eaa(zero)
  andi t0, t0, 1
  bne t0, zero, .L1
  ; cpu/ai.e16.ts:555  swing[i]--
  slli t0, s1, 1
  addi t0, t0, swing
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
.L1:
  ; cpu/ai.e16.ts:556  const e = seenAt(i, j, row(i, O_R_GUARD))
  mv a0, s1
  li a1, 3
  call row
  mv a1, s3
  mv a2, a0
  mv a0, s1
  call seenAt
  mv s2, a0 ; e
  ; cpu/ai.e16.ts:557  if ((seenS[e] & 255) !== ST_ATTACK) return
  slli t0, s2, 1
  lw t0, seenS(t0)
  andi t0, t0, 255
  li t1, 5
  beq t0, t1, .L2
  ; cpu/ai.e16.ts:557  return
  j .return
.L2:
  ; cpu/ai.e16.ts:558  const began = moveBegan(e)
  mv a0, s2
  call moveBegan
  mv s0, a0 ; began
  ; cpu/ai.e16.ts:559  if (began === swingId[i]) return
  slli t0, s1, 1
  lw t0, swingId(t0)
  bne s0, t0, .L3
  ; cpu/ai.e16.ts:559  return
  j .return
.L3:
  ; cpu/ai.e16.ts:560  swingId[i] = began
  slli t0, s1, 1
  sw s0, swingId(t0)
  ; cpu/ai.e16.ts:561  swing[i] = swing[i] > 255 - SWING_ADD ? 255 : swing[i] + SWING_ADD
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, swing(t1)
  addi t0, t0, swing
  li t2, 207
  bgeu t2, t1, .L4
  li t1, 255
  j .L5
.L4:
  slli t1, s1, 1
  lw t1, swing(t1)
  addi t1, t1, 48
.L5:
  sw t1, 0(t0)
  ; cpu/ai.e16.ts:562  if (seenY[e] > 0) return
  slli t0, s2, 1
  lw t0, seenY(t0)
  bgeu zero, t0, .L6
  ; cpu/ai.e16.ts:562  return
  j .return
.L6:
  ; cpu/ai.e16.ts:563  swB[i] = swA[i]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, swA(t1)
  sw t1, swB(t0)
  ; cpu/ai.e16.ts:564  swA[i] = reaches(j, seenS[e] >> 8)
  slli t0, s1, 1
  slli t1, s2, 1
  lw t1, seenS(t1)
  srli t1, t1, 8
  addi t0, t0, swA
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  mv a1, t1
  call reaches
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:571 edge(i) at -O1
;   i in a0
edge:
  ; cpu/ai.e16.ts:572  return swA[i] > swB[i] ? swA[i] : swB[i]
  slli t0, a0, 1
  lw t0, swA(t0)
  slli t1, a0, 1
  lw t1, swB(t1)
  bgeu t1, t0, .L1
  slli t0, a0, 1
  lw t0, swA(t0)
  j .L2
.L1:
  slli t0, a0, 1
  lw t0, swB(t0)
.L2:
  mv a0, t0
.return:
  ret

; cpu/ai.e16.ts:579 punishArm(i, j) at -O1
;   i in s1
;   j in s0
;   e in s2
;   began in s3
punishArm:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; i
  mv s0, a1 ; j
  ; cpu/ai.e16.ts:580  const e = seenAt(i, j, row(i, O_R_PUNISH))
  mv a0, s1
  li a1, 5
  call row
  mv a1, s0
  mv a2, a0
  mv a0, s1
  call seenAt
  mv s2, a0 ; e
  ; cpu/ai.e16.ts:581  if ((seenS[e] & 255) !== ST_ATTACK || seenY[e] > 0) return
  slli t0, s2, 1
  lw t0, seenS(t0)
  andi t0, t0, 255
  li t1, 5
  bne t0, t1, .L2
  slli t0, s2, 1
  lw t0, seenY(t0)
  bgeu zero, t0, .L1
.L2:
  ; cpu/ai.e16.ts:581  return
  j .return
.L1:
  ; cpu/ai.e16.ts:582  const began = moveBegan(e)
  mv a0, s2
  call moveBegan
  mv s3, a0 ; began
  ; cpu/ai.e16.ts:583  if (began === punId[i]) return
  slli t0, s1, 1
  lw t0, punId(t0)
  bne s3, t0, .L3
  ; cpu/ai.e16.ts:583  return
  j .return
.L3:
  ; cpu/ai.e16.ts:584  punId[i] = began
  slli t0, s1, 1
  sw s3, punId(t0)
  ; cpu/ai.e16.ts:585  punMove[i] = seenS[e] >> 8
  slli t0, s1, 1
  slli t1, s2, 1
  lw t1, seenS(t1)
  srli t1, t1, 8
  sw t1, punMove(t0)
  ; cpu/ai.e16.ts:586  punArm[i] = randBelow(256) < row(i, O_PUNISH) ? 1 : 0
  slli t0, s1, 1
  addi t0, t0, punArm
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 256
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 10
  call row
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv t2, a0
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  bgeu t1, t2, .L4
  li t1, 1
  j .L5
.L4:
  li t1, 0
.L5:
  sw t1, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:590 totalOf(j, m) at -O1
;   j in s1
;   m in s2
totalOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; j
  mv s2, a1 ; m
  ; cpu/ai.e16.ts:591  return mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE) + mvAt(j, m, M_RECOVERY) - 1
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
  addi a0, t0, -1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; cpu/ai.e16.ts:601 punish(i, j) at -O1
;   i in s1
;   j in s2
;   m in s3
;   f in 0(fp)
;   total in 4(fp)
;   recA in 6(fp)
;   d in 8(fp)
;   k in 2(fp)
punish:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  mv s1, a0 ; i
  mv s2, a1 ; j
  ; cpu/ai.e16.ts:602  if (punArm[i] !== 1 || !free(i)) return 0xffff
  slli t0, s1, 1
  lw t0, punArm(t0)
  li t1, 1
  bne t0, t1, .L2
  mv a0, s1
  call free
  bnez a0, .L1
.L2:
  ; cpu/ai.e16.ts:602  return 0xffff
  li a0, 65535
  j .return
.L1:
  ; cpu/ai.e16.ts:603  const m = punMove[i]
  slli t0, s1, 1
  lw s3, punMove(t0)
  ; cpu/ai.e16.ts:604  const f = frameNow(punId[i])
  slli t0, s1, 1
  lw a0, punId(t0)
  call frameNow
  sw a0, 0(fp) ; f
  ; cpu/ai.e16.ts:605  const total = totalOf(j, m)
  mv a0, s2
  mv a1, s3
  call totalOf
  sw a0, 4(fp) ; total
  ; cpu/ai.e16.ts:606  const recA = mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE)
  mv a0, s2
  mv a1, s3
  li a2, 0
  call mvAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  mv a1, s3
  li a2, 1
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 6(fp) ; recA
  ; cpu/ai.e16.ts:607  const d = distTo(i, seenAt(i, j, row(i, O_R_PUNISH)))
  mv a0, s1
  li a1, 5
  call row
  mv a1, s2
  mv a2, a0
  mv a0, s1
  call seenAt
  mv a1, a0
  mv a0, s1
  call distTo
  sw a0, 8(fp) ; d
  ; cpu/ai.e16.ts:608  if (f > total) return punishDone(i)
  lw t0, 4(fp) ; total
  lw t1, 0(fp) ; f
  bgeu t0, t1, .L3
  ; cpu/ai.e16.ts:608  return punishDone(i)
  mv a0, s1
  call punishDone
  j .return
.L3:
  ; cpu/ai.e16.ts:609  if (f < recA && d <= reaches(j, m))
  lw t0, 6(fp) ; recA
  lw t1, 0(fp) ; f
  bgeu t1, t0, .L4
  mv a0, s2
  mv a1, s3
  call reaches
  lw t0, 8(fp) ; d
  bltu a0, t0, .L4
  ; cpu/ai.e16.ts:610  return mvAt(j, m, M_HEIGHT) === H_LOW ? I_BACK | I_DOWN : I_BACK
  mv a0, s2
  mv a1, s3
  li a2, 10
  call mvAt
  li t0, 2
  bne a0, t0, .L5
  li t0, 6
  j .L6
.L5:
  li t0, 4
.L6:
  mv a0, t0
  j .return
.L4:
  ; cpu/ai.e16.ts:611  const k = punisher(i, j, f, d)
  mv a0, s1
  mv a1, s2
  lw a2, 0(fp)
  lw a3, 8(fp)
  call punisher
  sw a0, 2(fp) ; k
  ; cpu/ai.e16.ts:612  if (k < PUNISHERS) return punishPress(i, k)
  li t0, 4
  lw t1, 2(fp) ; k
  bgeu t1, t0, .L7
  ; cpu/ai.e16.ts:612  return punishPress(i, k)
  mv a0, s1
  lw a1, 2(fp)
  call punishPress
  j .return
.L7:
  ; cpu/ai.e16.ts:613  if (k === P_EARLY) return 0
  li t0, 4
  lw t1, 2(fp) ; k
  bne t1, t0, .L8
  ; cpu/ai.e16.ts:613  return 0
  li a0, 0
  j .return
.L8:
  ; cpu/ai.e16.ts:614  if (f >= recA && total - f > WALK_F) return I_FWD
  lw t0, 6(fp) ; recA
  lw t1, 0(fp) ; f
  bltu t1, t0, .L9
  lw t0, 0(fp) ; f
  lw t1, 4(fp) ; total
  sub t1, t1, t0
  li t0, 10
  bgeu t0, t1, .L9
  ; cpu/ai.e16.ts:614  return I_FWD
  li a0, 8
  j .return
.L9:
  ; cpu/ai.e16.ts:615  return punishDone(i)
  mv a0, s1
  call punishDone
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; cpu/ai.e16.ts:619 punishDone(i) at -O1
;   i in a0
punishDone:
  ; cpu/ai.e16.ts:620  punArm[i] = 0
  slli t0, a0, 1
  sw zero, punArm(t0)
  ; cpu/ai.e16.ts:621  return 0xffff
  li a0, 65535
.return:
  ret

; cpu/ai.e16.ts:629 punisher(i, j, f, d) at -O1
;   i in s2
;   j in 0(fp)
;   f in 6(fp)
;   d in 8(fp)
;   m in s3
;   total in 10(fp)
;   recA in 12(fp)
;   early in 2(fp)
;   k in s1
;   lands in 4(fp)
punisher:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s1, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  mv s2, a0 ; i
  sw a1, 0(fp) ; j
  sw a2, 6(fp) ; f
  sw a3, 8(fp) ; d
  ; cpu/ai.e16.ts:630  const m = punMove[i]
  slli t0, s2, 1
  lw s3, punMove(t0)
  ; cpu/ai.e16.ts:631  const total = totalOf(j, m)
  lw a0, 0(fp)
  mv a1, s3
  call totalOf
  sw a0, 10(fp) ; total
  ; cpu/ai.e16.ts:632  const recA = mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE)
  lw a0, 0(fp)
  mv a1, s3
  li a2, 0
  call mvAt
  addi sp, sp, -2
  sw a0, 0(sp)
  lw a0, 0(fp)
  mv a1, s3
  li a2, 1
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 12(fp) ; recA
  ; cpu/ai.e16.ts:633  let early = false
  sw zero, 2(fp) ; early
  ; cpu/ai.e16.ts:634  let k: u16 = PUNISHERS
  li s1, 4 ; k
  ; cpu/ai.e16.ts:635  while (k > 0) {
  j .L3
.L1:
  ; cpu/ai.e16.ts:636  k--
  addi s1, s1, -1
  ; cpu/ai.e16.ts:637  const lands = f + mvAt(i, k, M_STARTUP) - 1
  mv a0, s2
  mv a1, s1
  li a2, 0
  call mvAt
  lw t0, 6(fp) ; f
  add t0, t0, a0
  addi t0, t0, -1
  sw t0, 4(fp) ; lands
  ; cpu/ai.e16.ts:638  if (d + SURE <= punReach(i, k, m) && lands <= total) {
  lw t0, 8(fp) ; d
  addi t0, t0, 2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  mv a1, s1
  mv a2, s3
  call punReach
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu a0, t0, .L5
  lw t0, 10(fp) ; total
  lw t1, 4(fp) ; lands
  bltu t0, t1, .L5
  ; cpu/ai.e16.ts:639  if (lands + mvAt(i, k, M_ACTIVE) - 1 >= recA) return k
  mv a0, s2
  mv a1, s1
  li a2, 1
  call mvAt
  lw t0, 4(fp) ; lands
  add t0, t0, a0
  lw t1, 12(fp) ; recA
  addi t0, t0, -1
  bltu t0, t1, .L6
  ; cpu/ai.e16.ts:639  return k
  mv a0, s1
  j .return
.L6:
  ; cpu/ai.e16.ts:640  early = true
  li t0, 1
  sw t0, 2(fp) ; early
.L5:
.L3:
  bltu zero, s1, .L1
  ; cpu/ai.e16.ts:643  return early ? P_EARLY : P_NONE
  lw t0, 2(fp) ; early
  beqz t0, .L7
  li t0, 4
  j .L8
.L7:
  li t0, 5
.L8:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s1, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; cpu/ai.e16.ts:647 punReach(i, k, m) at -O1
;   i in a0
;   k in a1
;   m in a2
punReach:
  ; cpu/ai.e16.ts:648  if (m < 8) return punD[i * 32 + k * 8 + m]
  li t0, 8
  bgeu a2, t0, .L1
  ; cpu/ai.e16.ts:648  return punD[i * 32 + k * 8 + m]
  slli t0, a0, 5
  slli t1, a1, 3
  add t0, t0, t1
  add t0, t0, a2
  slli t0, t0, 1
  lw a0, punD(t0)
  ret
.L1:
  ; cpu/ai.e16.ts:649  return reach[i * MOVES + k] + LEAN
  li t0, 13
  mul t0, a0, t0
  add t0, t0, a1
  slli t0, t0, 1
  lw t0, reach(t0)
  addi a0, t0, 10
.return:
  ret

; cpu/ai.e16.ts:653 punishPress(i, k) at -O1
;   i in a0
;   k in a1
;   b in a2
punishPress:
  ; cpu/ai.e16.ts:654  const b = k === 0 ? I_LP : k === 1 ? I_HP : k === 2 ? I_LK : I_HK
  bne a1, zero, .L1
  li t0, 16
  j .L2
.L1:
  li t0, 1
  bne a1, t0, .L3
  li t0, 32
  j .L4
.L3:
  li t0, 2
  bne a1, t0, .L5
  li t0, 64
  j .L6
.L5:
  li t0, 128
.L6:
.L4:
.L2:
  mv a2, t0 ; b
  ; cpu/ai.e16.ts:655  if ((outWas[i] & b) !== 0) return 0
  slli t0, a0, 1
  lw t0, outWas(t0)
  and t0, t0, a2
  beq t0, zero, .L7
  ; cpu/ai.e16.ts:655  return 0
  li a0, 0
  ret
.L7:
  ; cpu/ai.e16.ts:656  punArm[i] = 0
  slli t0, a0, 1
  sw zero, punArm(t0)
  ; cpu/ai.e16.ts:657  punishes[i]++
  slli t0, a0, 1
  addi t0, t0, punishes
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/ai.e16.ts:658  return b
  mv a0, a2
.return:
  ret

; cpu/ai.e16.ts:662 wary(i) at -O1
;   i in a0
wary:
  ; cpu/ai.e16.ts:663  return swing[i] >= WARY
  slli t0, a0, 1
  lw t0, swing(t0)
  li t1, 32
  sltu t0, t0, t1
  xori a0, t0, 1
.return:
  ret

; cpu/ai.e16.ts:670 opened(i, j) at -O1
;   i in 2(fp)
;   j in s2
;   e in s3
;   st in s1
;   m in 0(fp)
;   f in 4(fp)
opened:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 2(fp) ; i
  mv s2, a1 ; j
  ; cpu/ai.e16.ts:671  const e = seenAt(i, j, row(i, O_R_GUARD))
  lw a0, 2(fp)
  li a1, 3
  call row
  mv a1, s2
  mv a2, a0
  lw a0, 2(fp)
  call seenAt
  mv s3, a0 ; e
  ; cpu/ai.e16.ts:672  const st = seenS[e] & 255
  slli t0, s3, 1
  lw t0, seenS(t0)
  andi s1, t0, 255
  ; cpu/ai.e16.ts:673  if (st === ST_ATTACK) {
  li t0, 5
  bne s1, t0, .L1
  ; cpu/ai.e16.ts:674  if (seenY[e] > 0) return false
  slli t0, s3, 1
  lw t0, seenY(t0)
  bgeu zero, t0, .L2
  ; cpu/ai.e16.ts:674  return false
  li a0, 0
  j .return
.L2:
  ; cpu/ai.e16.ts:675  const m = seenS[e] >> 8
  slli t0, s3, 1
  lw t0, seenS(t0)
  srli t0, t0, 8
  sw t0, 0(fp) ; m
  ; cpu/ai.e16.ts:676  const f = frameNow(moveBegan(e))
  mv a0, s3
  call moveBegan
  call frameNow
  sw a0, 4(fp) ; f
  ; cpu/ai.e16.ts:677  return f >= mvAt(j, m, M_STARTUP) + mvAt(j, m, M_ACTIVE) && f + OPEN_F <= totalOf(j, m)
  mv a0, s2
  lw a1, 0(fp)
  li a2, 0
  call mvAt
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  lw a1, 0(fp)
  li a2, 1
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 4(fp) ; f
  sltu t1, t1, t0
  xori t1, t1, 1
  mv t0, t1
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  beqz t1, .L3
  lw t0, 4(fp) ; f
  addi t0, t0, 6
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  lw a1, 0(fp)
  call totalOf
  lw t0, 0(sp)
  addi sp, sp, 2
  sltu t0, a0, t0
  xori t0, t0, 1
.L3:
  mv a0, t0
  j .return
.L1:
  ; cpu/ai.e16.ts:679  if (st === ST_HIT || st === ST_GUARD || st === ST_DOWN || st === ST_WAKE) return true
  li t0, 6
  beq s1, t0, .L5
  li t0, 7
  beq s1, t0, .L5
  li t0, 8
  beq s1, t0, .L5
  li t0, 9
  bne s1, t0, .L4
.L5:
  ; cpu/ai.e16.ts:679  return true
  li a0, 1
  j .return
.L4:
  ; cpu/ai.e16.ts:680  return st === ST_THROW || st === ST_THROWN || st === ST_DASH || st === ST_BACKDASH
  li t0, 11
  sub t0, s1, t0
  seqz t0, t0
  mv t1, t0
  bnez t1, .L8
  li t0, 12
  sub t0, s1, t0
  seqz t0, t0
.L8:
  mv t1, t0
  bnez t1, .L7
  li t0, 13
  sub t0, s1, t0
  seqz t0, t0
.L7:
  mv t1, t0
  bnez t1, .L6
  li t0, 14
  sub t0, s1, t0
  seqz t0, t0
.L6:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; cpu/ai.e16.ts:687 mayCome(i, j, d) at -O1
;   i in s1
;   j in s2
;   d in s3
mayCome:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  mv s2, a1 ; j
  mv s3, a2 ; d
  ; cpu/ai.e16.ts:688  if (d > edge(i) + COME) return true
  mv a0, s1
  call edge
  addi t0, a0, 10
  bgeu t0, s3, .L1
  ; cpu/ai.e16.ts:688  return true
  li a0, 1
  j .return
.L1:
  ; cpu/ai.e16.ts:689  return !wary(i) || opened(i, j)
  mv a0, s1
  call wary
  seqz t0, a0
  mv t1, t0
  bnez t1, .L2
  mv a0, s1
  mv a1, s2
  call opened
  mv t0, a0
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:693 heldOff(i, d) at -O1
;   i in s1
;   d in s2
heldOff:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; d
  ; cpu/ai.e16.ts:694  return d <= edge(i) ? I_BACK : 0
  mv a0, s1
  call edge
  bltu a0, s2, .L1
  li t0, 4
  j .L2
.L1:
  li t0, 0
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; cpu/ai.e16.ts:698 stepIn(i, j, d) at -O1
;   i in s2
;   j in s3
;   d in s1
stepIn:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; i
  mv s3, a1 ; j
  mv s1, a2 ; d
  ; cpu/ai.e16.ts:699  return mayCome(i, j, d > 2 ? d - 2 : 0) ? I_FWD : heldOff(i, d)
  mv t0, s2
  mv t1, s3
  mv t2, s1
  li t3, 2
  bgeu t3, t2, .L3
  addi t2, s1, -2
  j .L4
.L3:
  li t2, 0
.L4:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call mayCome
  beqz a0, .L1
  li t0, 8
  j .L2
.L1:
  mv a0, s2
  mv a1, s1
  call heldOff
  mv t0, a0
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:705 chainStep(i, out) at -O1
;   i in s1
;   out in s2
;   m in s3
;   kind in 0(fp)
;   b in 2(fp)
chainStep:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; i
  mv s2, a1 ; out
  ; cpu/ai.e16.ts:706  if (fState[i] !== ST_ATTACK) {
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 5
  beq t0, t1, .L1
  ; cpu/ai.e16.ts:707  chainArm[i] = 0
  slli t0, s1, 1
  sw zero, chainArm(t0)
  ; cpu/ai.e16.ts:708  return out
  mv a0, s2
  j .return
.L1:
  ; cpu/ai.e16.ts:710  const m = fMove[i]
  slli t0, s1, 1
  lw s3, fMove(t0)
  ; cpu/ai.e16.ts:711  if (fHitDone[i] === 0 || (mvAt(i, m, M_FLAGS) & F_CHAIN) === 0 || chainArm[i] !== 0) return out
  slli t0, s1, 1
  lw t0, fHitDone(t0)
  beq t0, zero, .L3
  mv a0, s1
  mv a1, s3
  li a2, 12
  call mvAt
  andi t0, a0, 1
  beq t0, zero, .L3
  slli t0, s1, 1
  lw t0, chainArm(t0)
  beq t0, zero, .L2
.L3:
  ; cpu/ai.e16.ts:711  return out
  mv a0, s2
  j .return
.L2:
  ; cpu/ai.e16.ts:712  chainArm[i] = randBelow(256) < row(i, O_CHAIN) ? 1 : 2
  slli t0, s1, 1
  addi t0, t0, chainArm
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 256
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 16
  call row
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv t2, a0
  xor t0, t0, t1
  xor t1, t1, t0
  xor t0, t0, t1
  bgeu t1, t2, .L4
  li t1, 1
  j .L5
.L4:
  li t1, 2
.L5:
  sw t1, 0(t0)
  ; cpu/ai.e16.ts:713  if (chainArm[i] === 2) return out
  slli t0, s1, 1
  lw t0, chainArm(t0)
  li t1, 2
  bne t0, t1, .L6
  ; cpu/ai.e16.ts:713  return out
  mv a0, s2
  j .return
.L6:
  ; cpu/ai.e16.ts:714  const kind = mvAt(i, m, M_KIND)
  mv a0, s1
  mv a1, s3
  li a2, 11
  call mvAt
  sw a0, 0(fp) ; kind
  ; cpu/ai.e16.ts:715  const b = (kind & K_KICK) !== 0 ? I_HK : I_HP
  lw t0, 0(fp) ; kind
  andi t0, t0, 1
  beq t0, zero, .L7
  li t0, 128
  j .L8
.L7:
  li t0, 32
.L8:
  sw t0, 2(fp) ; b
  ; cpu/ai.e16.ts:716  if ((outWas[i] & b) !== 0) {
  slli t0, s1, 1
  lw t0, outWas(t0)
  lw t1, 2(fp) ; b
  and t0, t0, t1
  beq t0, zero, .L9
  ; cpu/ai.e16.ts:717  chainArm[i] = 0
  slli t0, s1, 1
  sw zero, chainArm(t0)
  ; cpu/ai.e16.ts:718  return 0
  li a0, 0
  j .return
.L9:
  ; cpu/ai.e16.ts:720  return b | ((kind & K_CROUCH) !== 0 ? I_DOWN : 0)
  lw t0, 0(fp) ; kind
  andi t1, t0, 4
  lw t0, 2(fp)
  li t2, 0
  beq t1, t2, .L10
  li t1, 2
  j .L11
.L10:
  li t1, 0
.L11:
  or a0, t0, t1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; cpu/ai.e16.ts:725 planned(i, j) at -O1
;   i in s1
;   j in s2
;   st in s3
planned:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; i
  mv s2, a1 ; j
  ; cpu/ai.e16.ts:726  const st = fState[i]
  slli t0, s1, 1
  lw s3, fState(t0)
  ; cpu/ai.e16.ts:727  if (st === ST_PREJUMP || st === ST_JUMP || (st === ST_ATTACK && fAirUsed[i] !== 0)) {
  li t0, 2
  beq s3, t0, .L2
  li t0, 3
  beq s3, t0, .L2
  li t0, 5
  bne s3, t0, .L1
  slli t0, s1, 1
  lw t0, fAirUsed(t0)
  beq t0, zero, .L1
.L2:
  ; cpu/ai.e16.ts:728  return airStep(i, j)
  mv a0, s1
  mv a1, s2
  call airStep
  j .return
.L1:
  ; cpu/ai.e16.ts:730  if (!free(i)) return 0
  mv a0, s1
  call free
  bnez a0, .L3
  ; cpu/ai.e16.ts:730  return 0
  li a0, 0
  j .return
.L3:
  ; cpu/ai.e16.ts:731  if (prevState[i] === ST_WAKE && randBelow(256) < WAKE_CHANCE) planSet(i, row(i, O_WAKE), 0)
  slli t0, s1, 1
  lw t0, prevState(t0)
  li t1, 9
  bne t0, t1, .L4
  li a0, 256
  call randBelow
  li t0, 179
  bgeu a0, t0, .L4
  ; cpu/ai.e16.ts:731  planSet(i, row(i, O_WAKE), 0)
  mv a0, s1
  li a1, 17
  call row
  mv a1, a0
  mv a0, s1
  li a2, 0
  call planSet
.L4:
  ; cpu/ai.e16.ts:732  if (habitDue[i] !== 0) {
  slli t0, s1, 1
  lw t0, habitDue(t0)
  beq t0, zero, .L5
  ; cpu/ai.e16.ts:733  habitDue[i] = 0
  slli t0, s1, 1
  sw zero, habitDue(t0)
  ; cpu/ai.e16.ts:734  patternStart(i, row(i, O_PATTERN))
  mv a0, s1
  li a1, 18
  call row
  mv a1, a0
  mv a0, s1
  call patternStart
.L5:
  ; cpu/ai.e16.ts:736  if (thinkT[i] > 0) thinkT[i]--
  slli t0, s1, 1
  lw t0, thinkT(t0)
  bgeu zero, t0, .L6
  ; cpu/ai.e16.ts:736  thinkT[i]--
  slli t0, s1, 1
  addi t0, t0, thinkT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
.L6:
  ; cpu/ai.e16.ts:737  if (plan[i] === A_NONE || (thinkT[i] === 0 && patNo[i] === 0)) think(i, j)
  slli t0, s1, 1
  lw t0, plan(t0)
  li t1, 255
  beq t0, t1, .L8
  slli t0, s1, 1
  lw t0, thinkT(t0)
  bne t0, zero, .L7
  slli t0, s1, 1
  lw t0, patNo(t0)
  bne t0, zero, .L7
.L8:
  ; cpu/ai.e16.ts:737  think(i, j)
  mv a0, s1
  mv a1, s2
  call think
.L7:
  ; cpu/ai.e16.ts:738  return act(i, j)
  mv a0, s1
  mv a1, s2
  call act
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:742 planSet(i, a, f) at -O1
;   i in s1
;   a in s3
;   f in s2
planSet:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; i
  mv s3, a1 ; a
  mv s2, a2 ; f
  ; cpu/ai.e16.ts:743  plan[i] = a
  slli t0, s1, 1
  sw s3, plan(t0)
  ; cpu/ai.e16.ts:744  planT[i] = f !== 0 ? f : row(i, O_THINK) + 8
  slli t0, s1, 1
  addi t0, t0, planT
  mv t1, s2
  li t2, 0
  beq t1, t2, .L1
  mv t1, s2
  j .L2
.L1:
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 2
  call row
  lw t0, 0(sp)
  addi sp, sp, 2
  addi t1, a0, 8
.L2:
  sw t1, 0(t0)
  ; cpu/ai.e16.ts:745  planStep[i] = 0
  slli t0, s1, 1
  sw zero, planStep(t0)
  ; cpu/ai.e16.ts:746  planB[i] = randBelow(2)
  slli t0, s1, 1
  addi t0, t0, planB
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 2
  call randBelow
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:750 planEnd(i) at -O1
;   i in s1
planEnd:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; cpu/ai.e16.ts:751  plan[i] = A_NONE
  slli t0, s1, 1
  li t1, 255
  sw t1, plan(t0)
  ; cpu/ai.e16.ts:752  if (patNo[i] === 0) return
  slli t0, s1, 1
  lw t0, patNo(t0)
  bne t0, zero, .L1
  ; cpu/ai.e16.ts:752  return
  j .return
.L1:
  ; cpu/ai.e16.ts:753  patStep[i]++
  slli t0, s1, 1
  addi t0, t0, patStep
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/ai.e16.ts:754  patternStep(i)
  mv a0, s1
  call patternStep
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; cpu/ai.e16.ts:758 patternStart(i, p) at -O1
;   i in s1
;   p in s2
patternStart:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; p
  ; cpu/ai.e16.ts:759  patNo[i] = p
  slli t0, s1, 1
  sw s2, patNo(t0)
  ; cpu/ai.e16.ts:760  patStep[i] = 0
  slli t0, s1, 1
  sw zero, patStep(t0)
  ; cpu/ai.e16.ts:761  patternStep(i)
  mv a0, s1
  call patternStep
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; cpu/ai.e16.ts:764 patternStep(i) at -O1
;   i in s1
;   k in s2
;   a in s3
;   f in s0
patternStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; i
  ; cpu/ai.e16.ts:765  const k = patStep[i]
  slli t0, s1, 1
  lw s2, patStep(t0)
  ; cpu/ai.e16.ts:766  const a = k < 4 ? patternWord(patNo[i], k * 2) : 255
  li t0, 4
  bgeu s2, t0, .L1
  slli t0, s1, 1
  lw t0, patNo(t0)
  slli t1, s2, 1
  mv a0, t0
  mv a1, t1
  call patternWord
  mv t0, a0
  j .L2
.L1:
  li t0, 255
.L2:
  mv s3, t0 ; a
  ; cpu/ai.e16.ts:767  if (a === 255) {
  li t0, 255
  bne s3, t0, .L3
  ; cpu/ai.e16.ts:768  patNo[i] = 0
  slli t0, s1, 1
  sw zero, patNo(t0)
  ; cpu/ai.e16.ts:769  return
  j .return
.L3:
  ; cpu/ai.e16.ts:771  const f = patternWord(patNo[i], k * 2 + 1)
  slli t0, s1, 1
  lw t0, patNo(t0)
  slli t1, s2, 1
  mv a0, t0
  addi a1, t1, 1
  call patternWord
  mv s0, a0 ; f
  ; cpu/ai.e16.ts:772  planSet(i, a, f !== 0 ? f : (patGap[i] >> 1) + 1)
  mv t0, s1
  mv t1, s3
  mv t2, s0
  li t3, 0
  beq t2, t3, .L4
  mv t2, s0
  j .L5
.L4:
  slli t2, s1, 1
  lw t2, patGap(t2)
  srli t2, t2, 1
  addi t2, t2, 1
.L5:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call planSet
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:779 think(i, j) at -O1
;   i in s1
;   j in 2(fp)
;   e in s3
;   d in 0(fp)
;   band in 4(fp)
;   a in s2
think:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; i
  sw a1, 2(fp) ; j
  ; cpu/ai.e16.ts:780  thinkT[i] = row(i, O_THINK) + randBelow(8)
  slli t0, s1, 1
  addi t0, t0, thinkT
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 2
  call row
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call randBelow
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; cpu/ai.e16.ts:781  if (randBelow(256) < row(i, O_WHIM)) {
  li a0, 256
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 23
  call row
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L1
  ; cpu/ai.e16.ts:782  whims[i]++
  slli t0, s1, 1
  addi t0, t0, whims
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/ai.e16.ts:783  planSet(i, randBelow(ACTIONS), 0)
  li a0, 10
  call randBelow
  mv a1, a0
  mv a0, s1
  li a2, 0
  call planSet
  ; cpu/ai.e16.ts:784  return
  j .return
.L1:
  ; cpu/ai.e16.ts:786  const e = seenAt(i, j, row(i, O_R_GUARD))
  mv a0, s1
  li a1, 3
  call row
  lw a1, 2(fp)
  mv a2, a0
  mv a0, s1
  call seenAt
  mv s3, a0 ; e
  ; cpu/ai.e16.ts:787  const d = distTo(i, e)
  mv a0, s1
  mv a1, s3
  call distTo
  sw a0, 0(fp) ; d
  ; cpu/ai.e16.ts:788  const band = d < NEAR ? 0 : d < MIDDLE ? 1 : 2
  li t0, 50
  lw t1, 0(fp) ; d
  bgeu t1, t0, .L2
  li t0, 0
  j .L3
.L2:
  li t0, 110
  lw t1, 0(fp) ; d
  bgeu t1, t0, .L4
  li t0, 1
  j .L5
.L4:
  li t0, 2
.L5:
.L3:
  sw t0, 4(fp) ; band
  ; cpu/ai.e16.ts:789  weightsLoad(i, band, situation(i, e))
  mv a0, s1
  mv a1, s3
  call situation
  lw a1, 4(fp)
  mv a2, a0
  mv a0, s1
  call weightsLoad
  ; cpu/ai.e16.ts:790  let a = drawn()
  call drawn
  mv s2, a0 ; a
  ; cpu/ai.e16.ts:791  if ((row(i, O_FLAGS) & OF_FEINT) !== 0 && (a === A_MID || a === A_LOW)) {
  mv a0, s1
  li a1, 24
  call row
  andi t0, a0, 1
  beq t0, zero, .L6
  li t0, 3
  beq s2, t0, .L7
  li t0, 2
  bne s2, t0, .L6
.L7:
  ; cpu/ai.e16.ts:792  if (a === lastML[i] && randBelow(256) < FEINT_CHANCE) a = a === A_MID ? A_LOW : A_MID
  slli t0, s1, 1
  lw t0, lastML(t0)
  bne s2, t0, .L8
  li a0, 256
  call randBelow
  li t0, 160
  bgeu a0, t0, .L8
  ; cpu/ai.e16.ts:792  a = a === A_MID ? A_LOW : A_MID
  li t0, 3
  bne s2, t0, .L9
  li t0, 2
  j .L10
.L9:
  li t0, 3
.L10:
  mv s2, t0 ; a
.L8:
  ; cpu/ai.e16.ts:793  lastML[i] = a
  slli t0, s1, 1
  sw s2, lastML(t0)
.L6:
  ; cpu/ai.e16.ts:795  planSet(i, a, 0)
  mv a0, s1
  mv a1, s2
  li a2, 0
  call planSet
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; cpu/ai.e16.ts:799 drawn() at -O1
;   sum in s2
;   k in s1
;   r in s3
drawn:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; cpu/ai.e16.ts:800  let sum: u16 = 0
  li s2, 0 ; sum
  ; cpu/ai.e16.ts:801  let k: u16 = 0
  li s1, 0 ; k
  ; cpu/ai.e16.ts:802  while (k < ACTIONS) {
  j .L3
.L1:
  ; cpu/ai.e16.ts:803  sum = sum + wrow[k]
  slli t0, s1, 1
  lw t0, wrow(t0)
  add s2, s2, t0
  ; cpu/ai.e16.ts:804  k++
  addi s1, s1, 1
.L3:
  li t0, 10
  bltu s1, t0, .L1
  ; cpu/ai.e16.ts:806  if (sum === 0) return A_WAIT
  bne s2, zero, .L5
  ; cpu/ai.e16.ts:806  return A_WAIT
  li a0, 8
  j .return
.L5:
  ; cpu/ai.e16.ts:807  let r = randBelow(sum)
  mv a0, s2
  call randBelow
  mv s3, a0 ; r
  ; cpu/ai.e16.ts:808  k = 0
  li s1, 0 ; k
  ; cpu/ai.e16.ts:809  while (k < ACTIONS - 1) {
  j .L8
.L6:
  ; cpu/ai.e16.ts:810  if (r < wrow[k]) return k
  slli t0, s1, 1
  lw t0, wrow(t0)
  bgeu s3, t0, .L10
  ; cpu/ai.e16.ts:810  return k
  mv a0, s1
  j .return
.L10:
  ; cpu/ai.e16.ts:811  r = r - wrow[k]
  slli t0, s1, 1
  lw t0, wrow(t0)
  sub s3, s3, t0
  ; cpu/ai.e16.ts:812  k++
  addi s1, s1, 1
.L8:
  li t0, 9
  bltu s1, t0, .L6
  ; cpu/ai.e16.ts:814  return ACTIONS - 1
  li a0, 9
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:818 situation(i, e) at -O1
;   i in s2
;   e in s3
;   st in s1
situation:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; i
  mv s3, a1 ; e
  ; cpu/ai.e16.ts:819  const st = seenS[e] & 255
  slli t0, s3, 1
  lw t0, seenS(t0)
  andi s1, t0, 255
  ; cpu/ai.e16.ts:820  if (st === ST_DOWN || st === ST_WAKE) return SIT_WAKE
  li t0, 8
  beq s1, t0, .L2
  li t0, 9
  bne s1, t0, .L1
.L2:
  ; cpu/ai.e16.ts:820  return SIT_WAKE
  li a0, 4
  j .return
.L1:
  ; cpu/ai.e16.ts:821  if (seenY[e] > 0 || st === ST_PREJUMP) return SIT_AIR
  slli t0, s3, 1
  lw t0, seenY(t0)
  bltu zero, t0, .L4
  li t0, 2
  bne s1, t0, .L3
.L4:
  ; cpu/ai.e16.ts:821  return SIT_AIR
  li a0, 3
  j .return
.L3:
  ; cpu/ai.e16.ts:822  if (st === ST_HIT || st === ST_GUARD) return SIT_PLUS
  li t0, 6
  beq s1, t0, .L6
  li t0, 7
  bne s1, t0, .L5
.L6:
  ; cpu/ai.e16.ts:822  return SIT_PLUS
  li a0, 1
  j .return
.L5:
  ; cpu/ai.e16.ts:823  if (minusT[i] > 0) return SIT_MINUS
  slli t0, s2, 1
  lw t0, minusT(t0)
  bgeu zero, t0, .L7
  ; cpu/ai.e16.ts:823  return SIT_MINUS
  li a0, 2
  j .return
.L7:
  ; cpu/ai.e16.ts:824  if (fLife[i] * 4 < prAt(i, P_LIFE) || cornered(i, e)) return SIT_PRESSED
  slli t0, s2, 1
  lw t0, fLife(t0)
  slli t0, t0, 2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  li a1, 0
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu t0, a0, .L9
  mv a0, s2
  mv a1, s3
  call cornered
  beqz a0, .L8
.L9:
  ; cpu/ai.e16.ts:824  return SIT_PRESSED
  li a0, 5
  j .return
.L8:
  ; cpu/ai.e16.ts:825  return SIT_NEUTRAL
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:829 cornered(i, e) at -O1
;   i in s2
;   e in s3
;   x in s1
cornered:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; i
  mv s3, a1 ; e
  ; cpu/ai.e16.ts:830  const x = pointX(i)
  mv a0, s2
  call pointX
  mv s1, a0 ; x
  ; cpu/ai.e16.ts:831  if (seenX[e] > x) return x < RING_L + CORNER
  slli t0, s3, 1
  lw t0, seenX(t0)
  bgeu s1, t0, .L1
  ; cpu/ai.e16.ts:831  return x < RING_L + CORNER
  sltiu a0, s1, 72
  j .return
.L1:
  ; cpu/ai.e16.ts:832  return x > RING_R - CORNER
  li t0, 440
  sltu a0, t0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:836 act(i, j) at -O1
;   i in s1
;   j in s3
;   a in s2
;   e in 2(fp)
;   d in 0(fp)
act:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; i
  mv s3, a1 ; j
  ; cpu/ai.e16.ts:837  const a = plan[i]
  slli t0, s1, 1
  lw s2, plan(t0)
  ; cpu/ai.e16.ts:838  if (planT[i] === 0) {
  slli t0, s1, 1
  lw t0, planT(t0)
  bne t0, zero, .L1
  ; cpu/ai.e16.ts:839  planEnd(i)
  mv a0, s1
  call planEnd
  ; cpu/ai.e16.ts:840  return 0
  li a0, 0
  j .return
.L1:
  ; cpu/ai.e16.ts:842  planT[i]--
  slli t0, s1, 1
  addi t0, t0, planT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
  ; cpu/ai.e16.ts:843  const e = seenAt(i, j, row(i, O_R_GUARD))
  mv a0, s1
  li a1, 3
  call row
  mv a1, s3
  mv a2, a0
  mv a0, s1
  call seenAt
  sw a0, 2(fp) ; e
  ; cpu/ai.e16.ts:844  const d = distTo(i, e)
  mv a0, s1
  lw a1, 2(fp)
  call distTo
  sw a0, 0(fp) ; d
  ; cpu/ai.e16.ts:845  if (a <= A_MID) return strikeAct(i, j, a, d)
  li t0, 3
  bltu t0, s2, .L2
  ; cpu/ai.e16.ts:845  return strikeAct(i, j, a, d)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  lw a3, 0(fp)
  call strikeAct
  j .return
.L2:
  ; cpu/ai.e16.ts:846  if (a === A_JUMPIN) return jumpIn(i, j, d)
  li t0, 4
  bne s2, t0, .L3
  ; cpu/ai.e16.ts:846  return jumpIn(i, j, d)
  mv a0, s1
  mv a1, s3
  lw a2, 0(fp)
  call jumpIn
  j .return
.L3:
  ; cpu/ai.e16.ts:847  if (a === A_THROW) return throwAct(i, j, d)
  li t0, 5
  bne s2, t0, .L4
  ; cpu/ai.e16.ts:847  return throwAct(i, j, d)
  mv a0, s1
  mv a1, s3
  lw a2, 0(fp)
  call throwAct
  j .return
.L4:
  ; cpu/ai.e16.ts:848  if (a === A_APPROACH) return approach(i, j, d)
  li t0, 6
  bne s2, t0, .L5
  ; cpu/ai.e16.ts:848  return approach(i, j, d)
  mv a0, s1
  mv a1, s3
  lw a2, 0(fp)
  call approach
  j .return
.L5:
  ; cpu/ai.e16.ts:849  if (a === A_GUARD) return (row(i, O_FLAGS) & OF_TURTLE) !== 0 ? I_BACK : I_BACK | I_DOWN
  li t0, 7
  bne s2, t0, .L6
  ; cpu/ai.e16.ts:849  return (row(i, O_FLAGS) & OF_TURTLE) !== 0 ? I_BACK : I_BACK | I_DOWN
  mv a0, s1
  li a1, 24
  call row
  andi t0, a0, 4
  beq t0, zero, .L7
  li t0, 4
  j .L8
.L7:
  li t0, 6
.L8:
  mv a0, t0
  j .return
.L6:
  ; cpu/ai.e16.ts:850  if (a === A_WAIT) return keepRange(i, j, d)
  li t0, 8
  bne s2, t0, .L9
  ; cpu/ai.e16.ts:850  return keepRange(i, j, d)
  mv a0, s1
  mv a1, s3
  lw a2, 0(fp)
  call keepRange
  j .return
.L9:
  ; cpu/ai.e16.ts:851  if (a === A_RETREAT) return retreat(i)
  li t0, 9
  bne s2, t0, .L10
  ; cpu/ai.e16.ts:851  return retreat(i)
  mv a0, s1
  call retreat
  j .return
.L10:
  ; cpu/ai.e16.ts:852  if (a === A_AA) return aaPlan(i, j)
  li t0, 10
  bne s2, t0, .L11
  ; cpu/ai.e16.ts:852  return aaPlan(i, j)
  mv a0, s1
  mv a1, s3
  call aaPlan
  j .return
.L11:
  ; cpu/ai.e16.ts:853  if (a === A_WALK_IN) return stepIn(i, j, d)
  li t0, 11
  bne s2, t0, .L12
  ; cpu/ai.e16.ts:853  return stepIn(i, j, d)
  mv a0, s1
  mv a1, s3
  lw a2, 0(fp)
  call stepIn
  j .return
.L12:
  ; cpu/ai.e16.ts:854  if (a === A_WALK_OUT) return I_BACK
  li t0, 12
  bne s2, t0, .L13
  ; cpu/ai.e16.ts:854  return I_BACK
  li a0, 4
  j .return
.L13:
  ; cpu/ai.e16.ts:855  planEnd(i)
  mv a0, s1
  call planEnd
  ; cpu/ai.e16.ts:856  return 0
  li a0, 0
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; cpu/ai.e16.ts:864 strikeMove(i, a) at -O1
;   i in s0
;   a in s2
;   kick in s3
;   m in s1
strikeMove:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  mv s0, a0 ; i
  mv s2, a1 ; a
  ; cpu/ai.e16.ts:865  const kick = planB[i]
  slli t0, s0, 1
  lw s3, planB(t0)
  ; cpu/ai.e16.ts:866  if (a === A_LIGHT) return kick * 2
  bne s2, zero, .L1
  ; cpu/ai.e16.ts:866  return kick * 2
  slli a0, s3, 1
  j .return
.L1:
  ; cpu/ai.e16.ts:867  if (a === A_HEAVY) return 1 + kick * 2
  li t0, 1
  bne s2, t0, .L2
  ; cpu/ai.e16.ts:867  return 1 + kick * 2
  slli t0, s3, 1
  addi a0, t0, 1
  j .return
.L2:
  ; cpu/ai.e16.ts:868  if (a === A_LOW) return 6 + kick
  li t0, 2
  bne s2, t0, .L3
  ; cpu/ai.e16.ts:868  return 6 + kick
  addi a0, s3, 6
  j .return
.L3:
  ; cpu/ai.e16.ts:869  let m: u16 = 0
  li s1, 0 ; m
  ; cpu/ai.e16.ts:870  while (m < 8) {
  j .L6
.L4:
  ; cpu/ai.e16.ts:871  if (mvAt(i, m, M_HEIGHT) === H_MID) return m
  mv a0, s0
  mv a1, s1
  li a2, 10
  call mvAt
  li t0, 3
  bne a0, t0, .L8
  ; cpu/ai.e16.ts:871  return m
  mv a0, s1
  j .return
.L8:
  ; cpu/ai.e16.ts:872  m++
  addi s1, s1, 1
.L6:
  li t0, 8
  bltu s1, t0, .L4
  ; cpu/ai.e16.ts:874  return 1
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:881 strikeAct(i, j, a, d) at -O1
;   i in s1
;   j in 2(fp)
;   a in 8(fp)
;   d in s2
;   m in s3
;   col in 0(fp)
;   b in 4(fp)
;   down in 6(fp)
strikeAct:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  mv s1, a0 ; i
  sw a1, 2(fp) ; j
  sw a2, 8(fp) ; a
  mv s2, a3 ; d
  ; cpu/ai.e16.ts:882  if (planT[i] > ATTACK_F) planT[i] = ATTACK_F
  slli t0, s1, 1
  lw t0, planT(t0)
  li t1, 40
  bgeu t1, t0, .L1
  ; cpu/ai.e16.ts:882  planT[i] = ATTACK_F
  slli t0, s1, 1
  li t1, 40
  sw t1, planT(t0)
.L1:
  ; cpu/ai.e16.ts:883  const m = strikeMove(i, a)
  mv a0, s1
  lw a1, 8(fp)
  call strikeMove
  mv s3, a0 ; m
  ; cpu/ai.e16.ts:884  if (d > reach[i * MOVES + m] + SLACK) return stepIn(i, j, d)
  li t0, 13
  mul t0, s1, t0
  add t0, t0, s3
  slli t0, t0, 1
  lw t0, reach(t0)
  addi t0, t0, 10
  bgeu t0, s2, .L2
  ; cpu/ai.e16.ts:884  return stepIn(i, j, d)
  mv a0, s1
  lw a1, 2(fp)
  mv a2, s2
  call stepIn
  j .return
.L2:
  ; cpu/ai.e16.ts:885  if (!mayCome(i, j, d)) return heldOff(i, d)
  mv a0, s1
  lw a1, 2(fp)
  mv a2, s2
  call mayCome
  bnez a0, .L3
  ; cpu/ai.e16.ts:885  return heldOff(i, d)
  mv a0, s1
  mv a1, s2
  call heldOff
  j .return
.L3:
  ; cpu/ai.e16.ts:886  const col = m & 3
  andi t0, s3, 3
  sw t0, 0(fp) ; col
  ; cpu/ai.e16.ts:887  const b = col === 0 ? I_LP : col === 1 ? I_HP : col === 2 ? I_LK : I_HK
  lw t0, 0(fp) ; col
  bne t0, zero, .L4
  li t0, 16
  j .L5
.L4:
  li t0, 1
  lw t1, 0(fp) ; col
  bne t1, t0, .L6
  li t0, 32
  j .L7
.L6:
  li t0, 2
  lw t1, 0(fp) ; col
  bne t1, t0, .L8
  li t0, 64
  j .L9
.L8:
  li t0, 128
.L9:
.L7:
.L5:
  sw t0, 4(fp) ; b
  ; cpu/ai.e16.ts:888  const down = m >= 4 ? I_DOWN : 0
  li t0, 4
  bltu s3, t0, .L10
  li t0, 2
  j .L11
.L10:
  li t0, 0
.L11:
  sw t0, 6(fp) ; down
  ; cpu/ai.e16.ts:889  if ((outWas[i] & b) !== 0) return down
  slli t0, s1, 1
  lw t0, outWas(t0)
  lw t1, 4(fp) ; b
  and t0, t0, t1
  beq t0, zero, .L12
  ; cpu/ai.e16.ts:889  return down
  lw a0, 6(fp)
  j .return
.L12:
  ; cpu/ai.e16.ts:890  planEnd(i)
  mv a0, s1
  call planEnd
  ; cpu/ai.e16.ts:891  return b | down
  lw t0, 6(fp) ; down
  lw t1, 4(fp) ; b
  or a0, t1, t0
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; cpu/ai.e16.ts:895 jumpIn(i, j, d) at -O1
;   i in s1
;   j in s3
;   d in s2
jumpIn:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; i
  mv s3, a1 ; j
  mv s2, a2 ; d
  ; cpu/ai.e16.ts:896  if (d > 140) return I_FWD
  li t0, 140
  bgeu t0, s2, .L1
  ; cpu/ai.e16.ts:896  return I_FWD
  li a0, 8
  j .return
.L1:
  ; cpu/ai.e16.ts:897  if (wary(i)) return keepRange(i, j, d)
  mv a0, s1
  call wary
  beqz a0, .L2
  ; cpu/ai.e16.ts:897  return keepRange(i, j, d)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call keepRange
  j .return
.L2:
  ; cpu/ai.e16.ts:898  if ((outWas[i] & I_UP) !== 0) return 0
  slli t0, s1, 1
  lw t0, outWas(t0)
  andi t0, t0, 1
  beq t0, zero, .L3
  ; cpu/ai.e16.ts:898  return 0
  li a0, 0
  j .return
.L3:
  ; cpu/ai.e16.ts:899  planStep[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, planStep(t0)
  ; cpu/ai.e16.ts:900  return I_UP | I_FWD
  li a0, 9
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:904 airStep(i, j) at -O1
;   i in s1
;   j in s3
;   e in s0
;   b in s2
airStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  mv s1, a0 ; i
  mv s3, a1 ; j
  ; cpu/ai.e16.ts:905  if (fAirUsed[i] !== 0 || fState[i] !== ST_JUMP) return 0
  slli t0, s1, 1
  lw t0, fAirUsed(t0)
  bne t0, zero, .L2
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 3
  beq t0, t1, .L1
.L2:
  ; cpu/ai.e16.ts:905  return 0
  li a0, 0
  j .return
.L1:
  ; cpu/ai.e16.ts:906  if (i16(fVY[i]) > 0) return 0
  slli t0, s1, 1
  lw t0, fVY(t0)
  bge zero, t0, .L3
  ; cpu/ai.e16.ts:906  return 0
  li a0, 0
  j .return
.L3:
  ; cpu/ai.e16.ts:907  const e = seenAt(i, j, row(i, O_R_GUARD))
  mv a0, s1
  li a1, 3
  call row
  mv a1, s3
  mv a2, a0
  mv a0, s1
  call seenAt
  mv s0, a0 ; e
  ; cpu/ai.e16.ts:908  if (distTo(i, e) > 56) return 0
  mv a0, s1
  mv a1, s0
  call distTo
  li t0, 56
  bgeu t0, a0, .L4
  ; cpu/ai.e16.ts:908  return 0
  li a0, 0
  j .return
.L4:
  ; cpu/ai.e16.ts:909  const b = planB[i] !== 0 ? I_HK : I_HP
  slli t0, s1, 1
  lw t0, planB(t0)
  beq t0, zero, .L5
  li t0, 128
  j .L6
.L5:
  li t0, 32
.L6:
  mv s2, t0 ; b
  ; cpu/ai.e16.ts:910  if ((outWas[i] & b) !== 0) return 0
  slli t0, s1, 1
  lw t0, outWas(t0)
  and t0, t0, s2
  beq t0, zero, .L7
  ; cpu/ai.e16.ts:910  return 0
  li a0, 0
  j .return
.L7:
  ; cpu/ai.e16.ts:911  if (plan[i] === A_JUMPIN) planEnd(i)
  slli t0, s1, 1
  lw t0, plan(t0)
  li t1, 4
  bne t0, t1, .L8
  ; cpu/ai.e16.ts:911  planEnd(i)
  mv a0, s1
  call planEnd
.L8:
  ; cpu/ai.e16.ts:912  return b
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:920 throwAct(i, j, d) at -O1
;   i in s1
;   j in s3
;   d in s2
;   gap in s0
throwAct:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; i
  mv s3, a1 ; j
  mv s2, a2 ; d
  ; cpu/ai.e16.ts:921  if (planT[i] > ATTACK_F) planT[i] = ATTACK_F
  slli t0, s1, 1
  lw t0, planT(t0)
  li t1, 40
  bgeu t1, t0, .L1
  ; cpu/ai.e16.ts:921  planT[i] = ATTACK_F
  slli t0, s1, 1
  li t1, 40
  sw t1, planT(t0)
.L1:
  ; cpu/ai.e16.ts:922  const gap = d > otherHalf[i] ? d - otherHalf[i] : 0
  slli t0, s1, 1
  lw t0, otherHalf(t0)
  bgeu t0, s2, .L2
  slli t0, s1, 1
  lw t0, otherHalf(t0)
  sub t0, s2, t0
  j .L3
.L2:
  li t0, 0
.L3:
  mv s0, t0 ; gap
  ; cpu/ai.e16.ts:923  if (gap + 4 > prAt(i, P_THROW)) return stepIn(i, j, d)
  mv a0, s1
  li a1, 8
  call prAt
  addi t0, s0, 4
  bgeu a0, t0, .L4
  ; cpu/ai.e16.ts:923  return stepIn(i, j, d)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call stepIn
  j .return
.L4:
  ; cpu/ai.e16.ts:924  if (!mayCome(i, j, d)) return heldOff(i, d)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call mayCome
  bnez a0, .L5
  ; cpu/ai.e16.ts:924  return heldOff(i, d)
  mv a0, s1
  mv a1, s2
  call heldOff
  j .return
.L5:
  ; cpu/ai.e16.ts:925  if ((outWas[i] & I_HP) !== 0) return I_FWD
  slli t0, s1, 1
  lw t0, outWas(t0)
  andi t0, t0, 32
  beq t0, zero, .L6
  ; cpu/ai.e16.ts:925  return I_FWD
  li a0, 8
  j .return
.L6:
  ; cpu/ai.e16.ts:926  planEnd(i)
  mv a0, s1
  call planEnd
  ; cpu/ai.e16.ts:927  return I_FWD | I_HP
  li a0, 40
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:934 approach(i, j, d) at -O1
;   i in s1
;   j in s3
;   d in s2
;   dash in s0
approach:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; i
  mv s3, a1 ; j
  mv s2, a2 ; d
  ; cpu/ai.e16.ts:935  const dash = row(i, O_APPROACH) !== 0
  mv a0, s1
  li a1, 14
  call row
  sub t0, a0, zero
  snez s0, t0
  ; cpu/ai.e16.ts:936  if (dash && d > 70 && (planStep[i] > 0 || mayCome(i, j, d - DASH_PTS))) return taps(i, I_FWD)
  beqz s0, .L1
  li t0, 70
  bgeu t0, s2, .L1
  slli t0, s1, 1
  lw t0, planStep(t0)
  bltu zero, t0, .L2
  mv a0, s1
  mv a1, s3
  addi a2, s2, -36
  call mayCome
  beqz a0, .L1
.L2:
  ; cpu/ai.e16.ts:936  return taps(i, I_FWD)
  mv a0, s1
  li a1, 8
  call taps
  j .return
.L1:
  ; cpu/ai.e16.ts:937  if (d <= liked(i)) {
  mv a0, s1
  call liked
  bltu a0, s2, .L3
  ; cpu/ai.e16.ts:938  planEnd(i)
  mv a0, s1
  call planEnd
  ; cpu/ai.e16.ts:939  return 0
  li a0, 0
  j .return
.L3:
  ; cpu/ai.e16.ts:941  return stepIn(i, j, d)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call stepIn
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; cpu/ai.e16.ts:945 taps(i, dir) at -O1
;   i in s1
;   dir in s3
;   k in s2
taps:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; i
  mv s3, a1 ; dir
  ; cpu/ai.e16.ts:946  tapT[i] = 2
  slli t0, s1, 1
  li t1, 2
  sw t1, tapT(t0)
  ; cpu/ai.e16.ts:947  const k = planStep[i]
  slli t0, s1, 1
  lw s2, planStep(t0)
  ; cpu/ai.e16.ts:948  planStep[i]++
  slli t0, s1, 1
  addi t0, t0, planStep
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/ai.e16.ts:949  if (k >= 3) planEnd(i)
  li t0, 3
  bltu s2, t0, .L1
  ; cpu/ai.e16.ts:949  planEnd(i)
  mv a0, s1
  call planEnd
.L1:
  ; cpu/ai.e16.ts:950  return (k & 1) !== 0 ? dir : 0
  andi t0, s2, 1
  beq t0, zero, .L2
  mv t0, s3
  j .L3
.L2:
  li t0, 0
.L3:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; cpu/ai.e16.ts:954 retreat(i) at -O1
;   i in s1
;   how in s2
retreat:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; cpu/ai.e16.ts:955  const how = row(i, O_RETREAT)
  mv a0, s1
  li a1, 15
  call row
  mv s2, a0 ; how
  ; cpu/ai.e16.ts:956  if (how === 1) return taps(i, I_BACK)
  li t0, 1
  bne s2, t0, .L1
  ; cpu/ai.e16.ts:956  return taps(i, I_BACK)
  mv a0, s1
  li a1, 4
  call taps
  j .return
.L1:
  ; cpu/ai.e16.ts:957  if (how === 2) {
  li t0, 2
  bne s2, t0, .L2
  ; cpu/ai.e16.ts:958  planEnd(i)
  mv a0, s1
  call planEnd
  ; cpu/ai.e16.ts:959  return (outWas[i] & I_UP) !== 0 ? I_BACK : I_UP | I_BACK
  slli t0, s1, 1
  lw t0, outWas(t0)
  andi t0, t0, 1
  beq t0, zero, .L3
  li t0, 4
  j .L4
.L3:
  li t0, 5
.L4:
  mv a0, t0
  j .return
.L2:
  ; cpu/ai.e16.ts:961  return I_BACK
  li a0, 4
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; cpu/ai.e16.ts:965 liked(i) at -O1
;   i in s2
;   r in s1
liked:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; i
  ; cpu/ai.e16.ts:966  const r = row(i, O_RANGE)
  mv a0, s2
  li a1, 12
  call row
  mv s1, a0 ; r
  ; cpu/ai.e16.ts:967  return r !== 0 ? r : histRange()
  beq s1, zero, .L1
  mv t0, s1
  j .L2
.L1:
  la t0, histRange
  li t1, 264
  call far_call
  mv t0, a0
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; cpu/ai.e16.ts:974 keepRange(i, j, d) at -O1
;   i in s1
;   j in 2(fp)
;   d in s2
;   want in s3
;   w in 0(fp)
;   turtle in 4(fp)
keepRange:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; i
  sw a1, 2(fp) ; j
  mv s2, a2 ; d
  ; cpu/ai.e16.ts:975  let want = liked(i)
  mv a0, s1
  call liked
  mv s3, a0 ; want
  ; cpu/ai.e16.ts:976  if (wary(i) && want < edge(i) + COME) want = edge(i) + COME
  mv a0, s1
  call wary
  beqz a0, .L1
  mv a0, s1
  call edge
  addi t0, a0, 10
  bgeu s3, t0, .L1
  ; cpu/ai.e16.ts:976  want = edge(i) + COME
  mv a0, s1
  call edge
  addi s3, a0, 10
.L1:
  ; cpu/ai.e16.ts:977  const w = row(i, O_WIDTH)
  mv a0, s1
  li a1, 13
  call row
  sw a0, 0(fp) ; w
  ; cpu/ai.e16.ts:978  const turtle = (row(i, O_FLAGS) & OF_TURTLE) !== 0
  mv a0, s1
  li a1, 24
  call row
  andi t0, a0, 4
  sub t0, t0, zero
  snez t0, t0
  sw t0, 4(fp) ; turtle
  ; cpu/ai.e16.ts:979  if (d > want + (turtle ? w * 3 : w)) return stepIn(i, j, d)
  mv t0, s2
  mv t1, s3
  lw t2, 4(fp)
  beqz t2, .L3
  lw t2, 0(fp) ; w
  slli t3, t2, 1
  add t2, t3, t2
  j .L4
.L3:
  lw t2, 0(fp)
.L4:
  add t1, t1, t2
  bgeu t1, t0, .L2
  ; cpu/ai.e16.ts:979  return stepIn(i, j, d)
  mv a0, s1
  lw a1, 2(fp)
  mv a2, s2
  call stepIn
  j .return
.L2:
  ; cpu/ai.e16.ts:980  if (d + w < want || (wary(i) && d <= edge(i))) return I_BACK
  lw t0, 0(fp) ; w
  add t0, s2, t0
  bltu t0, s3, .L6
  mv a0, s1
  call wary
  beqz a0, .L5
  mv a0, s1
  call edge
  bltu a0, s2, .L5
.L6:
  ; cpu/ai.e16.ts:980  return I_BACK
  li a0, 4
  j .return
.L5:
  ; cpu/ai.e16.ts:981  return 0
  li a0, 0
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; cpu/ai.e16.ts:985 aaPlan(i, j) at -O1
;   i in s1
;   j in s0
;   r in s2
;   e in s3
aaPlan:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; i
  mv s0, a1 ; j
  ; cpu/ai.e16.ts:986  const r = row(i, O_R_AA)
  mv a0, s1
  li a1, 4
  call row
  mv s2, a0 ; r
  ; cpu/ai.e16.ts:987  const e = seenAt(i, j, r)
  mv a0, s1
  mv a1, s0
  mv a2, s2
  call seenAt
  mv s3, a0 ; e
  ; cpu/ai.e16.ts:988  if (seenY[e] === 0 || distTo(i, e) > aaReach(r)) return I_DOWN
  slli t0, s3, 1
  lw t0, seenY(t0)
  beq t0, zero, .L2
  mv a0, s1
  mv a1, s3
  call distTo
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call aaReach
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu a0, t0, .L1
.L2:
  ; cpu/ai.e16.ts:988  return I_DOWN
  li a0, 2
  j .return
.L1:
  ; cpu/ai.e16.ts:989  if ((outWas[i] & I_HP) !== 0) return I_DOWN
  slli t0, s1, 1
  lw t0, outWas(t0)
  andi t0, t0, 32
  beq t0, zero, .L3
  ; cpu/ai.e16.ts:989  return I_DOWN
  li a0, 2
  j .return
.L3:
  ; cpu/ai.e16.ts:990  planEnd(i)
  mv a0, s1
  call planEnd
  ; cpu/ai.e16.ts:991  return I_DOWN | I_HP
  li a0, 34
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

  .align 2

  .bank 3
  .org 0xc000
; scenes/pause.e16.ts:40 pauseRun() at -O1
;   at in s1
;   quit in s2
pauseRun:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; scenes/pause.e16.ts:41  paused[0] = 1
  li t0, 1
  sw t0, paused(zero)
  ; scenes/pause.e16.ts:42  musicMute(MUSIC)
  li a0, 4095
  call musicMute
  ; scenes/pause.e16.ts:43  dim(DIM)
  li a0, 10
  call dim
  ; scenes/pause.e16.ts:44  pauseShow()
  call pauseShow
  ; scenes/pause.e16.ts:45  let at: u16 = 0
  li s1, 0 ; at
  ; scenes/pause.e16.ts:46  cursor(at)
  mv a0, s1
  call cursor
  ; scenes/pause.e16.ts:47  let quit: u16 = 0
  li s2, 0 ; quit
  ; scenes/pause.e16.ts:48  for (;;) {
.L1:
  ; scenes/pause.e16.ts:49  pauseFrame()
  call pauseFrame
  ; scenes/pause.e16.ts:50  at = menuMove(at)
  mv a0, s1
  call menuMove
  mv s1, a0 ; at
  ; scenes/pause.e16.ts:51  if (pressed(B_START)) break
  li a0, 1024
  call pressed
  beqz a0, .L5
  ; scenes/pause.e16.ts:51  break
  j .L4
.L5:
  ; scenes/pause.e16.ts:52  if (!pressed(B_A)) continue
  li a0, 16
  call pressed
  bnez a0, .L6
  ; scenes/pause.e16.ts:52  continue
  j .L1
.L6:
  ; scenes/pause.e16.ts:53  sfx(X_OK)
  li a0, 15
  la t0, sfx
  li t1, 260
  call far_call
  ; scenes/pause.e16.ts:54  if (at === 0) break
  bne s1, zero, .L7
  ; scenes/pause.e16.ts:54  break
  j .L4
.L7:
  ; scenes/pause.e16.ts:55  if (at === 2) {
  li t0, 2
  bne s1, t0, .L8
  ; scenes/pause.e16.ts:56  quit = 1
  li s2, 1 ; quit
  ; scenes/pause.e16.ts:57  break
  j .L4
.L8:
  ; scenes/pause.e16.ts:59  controlsRun(true)
  li a0, 1
  la t0, controlsRun
  li t1, 261
  call far_call
  ; scenes/pause.e16.ts:60  screenIs(SC_FIGHT)
  li a0, 6
  call screenIs
  ; scenes/pause.e16.ts:61  matchHud()
  la t0, matchHud
  li t1, 257
  call far_call
  ; scenes/pause.e16.ts:62  pauseShow()
  call pauseShow
  ; scenes/pause.e16.ts:63  cursor(at)
  mv a0, s1
  call cursor
  j .L1
.L4:
  ; scenes/pause.e16.ts:65  hudRows(MENU_ROW, 3)
  li a0, 20
  li a1, 3
  call hudRows
  ; scenes/pause.e16.ts:66  bandClear()
  call bandClear
  ; scenes/pause.e16.ts:67  dim(0)
  li a0, 0
  call dim
  ; scenes/pause.e16.ts:69  palKey[0] = 0xffff
  li t0, 65535
  sw t0, palKey(zero)
  ; scenes/pause.e16.ts:70  palKey[1] = 0xffff
  li t0, 65535
  sw t0, palKey+2(zero)
  ; scenes/pause.e16.ts:71  musicMute(0)
  li a0, 0
  call musicMute
  ; scenes/pause.e16.ts:72  paused[0] = 0
  sw zero, paused(zero)
  ; scenes/pause.e16.ts:73  return quit
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes/pause.e16.ts:77 menuMove(at) at -O1
;   at in s2
;   n in s1
menuMove:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  ; scenes/pause.e16.ts:78  let n = at
  mv s1, s2 ; n
  ; scenes/pause.e16.ts:79  if (pressed(B_UP)) n = n === 0 ? 2 : n - 1
  li a0, 1
  call pressed
  beqz a0, .L1
  ; scenes/pause.e16.ts:79  n = n === 0 ? 2 : n - 1
  bne s1, zero, .L2
  li t0, 2
  j .L3
.L2:
  addi t0, s1, -1
.L3:
  mv s1, t0 ; n
.L1:
  ; scenes/pause.e16.ts:80  if (pressed(B_DOWN)) n = n === 2 ? 0 : n + 1
  li a0, 2
  call pressed
  beqz a0, .L4
  ; scenes/pause.e16.ts:80  n = n === 2 ? 0 : n + 1
  li t0, 2
  bne s1, t0, .L5
  li t0, 0
  j .L6
.L5:
  addi t0, s1, 1
.L6:
  mv s1, t0 ; n
.L4:
  ; scenes/pause.e16.ts:81  if (n !== at) {
  beq s1, s2, .L7
  ; scenes/pause.e16.ts:82  cursor(n)
  mv a0, s1
  call cursor
  ; scenes/pause.e16.ts:83  sfx(X_MOVE)
  li a0, 14
  la t0, sfx
  li t1, 260
  call far_call
.L7:
  ; scenes/pause.e16.ts:85  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes/pause.e16.ts:89 dim(t) at -O1
;   t in s1
dim:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; scenes/pause.e16.ts:90  palMix(0, 0, t)
  li a0, 0
  li a1, 0
  mv a2, s1
  call palMix
  ; scenes/pause.e16.ts:91  palMix(8, 0, t)
  li a0, 8
  li a1, 0
  mv a2, s1
  call palMix
  ; scenes/pause.e16.ts:92  palMix(9, 0, t)
  li a0, 9
  li a1, 0
  mv a2, s1
  call palMix
  ; scenes/pause.e16.ts:93  palMix(10, 0, t)
  li a0, 10
  li a1, 0
  mv a2, s1
  call palMix
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/pause.e16.ts:96 pauseShow() at -O1
pauseShow:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/pause.e16.ts:97  bandShow(str('PAUSED'))
  la a0, str_27
  call bandShow
  ; scenes/pause.e16.ts:98  say(16, MENU_ROW, str('RESUME'), PZ_TEXT)
  li a0, 16
  li a1, 20
  la a2, str_28
  li a3, 1
  call say
  ; scenes/pause.e16.ts:99  say(16, MENU_ROW + 1, str('CONTROLS'), PZ_TEXT)
  li a0, 16
  li a1, 21
  la a2, str_29
  li a3, 1
  call say
  ; scenes/pause.e16.ts:100  say(16, MENU_ROW + 2, str('QUIT FIGHT'), PZ_TEXT)
  li a0, 16
  li a1, 22
  la a2, str_30
  li a3, 1
  call say
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/pause.e16.ts:103 cursor(at) at -O1
;   at in s2
;   k in s1
cursor:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  ; scenes/pause.e16.ts:104  let k: u16 = 0
  li s1, 0 ; k
  ; scenes/pause.e16.ts:105  while (k < 3) {
  j .L3
.L1:
  ; scenes/pause.e16.ts:106  say(14, MENU_ROW + k, k === at ? str('>') : str(' '), PZ_TEXT)
  li t0, 14
  addi t1, s1, 20
  mv t2, s1
  mv t3, s2
  bne t2, t3, .L5
  la t2, str_31
  j .L6
.L5:
  la t2, str_32
.L6:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call say
  ; scenes/pause.e16.ts:107  k++
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes/pause.e16.ts:114 logDraw(kind, side, move) at -O1
;   kind in s2
;   side in s3
;   move in s0
;   x in s1
logDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; kind
  mv s3, a1 ; side
  mv s0, a2 ; move
  ; scenes/pause.e16.ts:115  say(1, LOG_ROW, str('>'), SL_LOG)
  li a0, 1
  li a1, 34
  la a2, str_31
  li a3, 5
  call say
  ; scenes/pause.e16.ts:116  let x: u16 = 3
  li s1, 3 ; x
  ; scenes/pause.e16.ts:117  if (kind === LOG_TECH) {
  li t0, 4
  bne s2, t0, .L1
  ; scenes/pause.e16.ts:118  say(x, LOG_ROW, str('THROW TECH'), SL_LOG)
  mv a0, s1
  li a1, 34
  la a2, str_33
  li a3, 5
  call say
  ; scenes/pause.e16.ts:119  return
  j .return
.L1:
  ; scenes/pause.e16.ts:121  if (kind !== LOG_COUNTER && kind !== LOG_AA && kind !== LOG_THROW) {
  li t0, 1
  beq s2, t0, .L2
  li t0, 2
  beq s2, t0, .L2
  li t0, 3
  beq s2, t0, .L2
  ; scenes/pause.e16.ts:122  say(x, LOG_ROW, str('READ'), SL_LOG)
  mv a0, s1
  li a1, 34
  la a2, str_34
  li a3, 5
  call say
  ; scenes/pause.e16.ts:123  return
  j .return
.L2:
  ; scenes/pause.e16.ts:125  x = put(x, side === 0 ? str('P1') : str('CPU')) + 1
  mv t0, s1
  mv t1, s3
  li t2, 0
  bne t1, t2, .L3
  la t1, str_35
  j .L4
.L3:
  la t1, str_36
.L4:
  mv a0, t0
  mv a1, t1
  call put
  addi s1, a0, 1
  ; scenes/pause.e16.ts:126  if (kind === LOG_AA) put(x, str('ANTI-AIR'))
  li t0, 2
  bne s2, t0, .L5
  ; scenes/pause.e16.ts:126  put(x, str('ANTI-AIR'))
  mv a0, s1
  la a1, str_37
  call put
  j .L6
.L5:
  ; scenes/pause.e16.ts:127  if (kind === LOG_THROW) put(x, str('THROW'))
  li t0, 3
  bne s2, t0, .L7
  ; scenes/pause.e16.ts:127  put(x, str('THROW'))
  mv a0, s1
  la a1, str_38
  call put
  j .L8
.L7:
  ; scenes/pause.e16.ts:128  moveName(put(x, str('COUNTER')) + 2, move)
  mv a0, s1
  la a1, str_39
  call put
  addi a0, a0, 2
  mv a1, s0
  call moveName
.L8:
.L6:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; scenes/pause.e16.ts:132 put(x, s) at -O1
;   x in s2
;   s in s3
;   n in s1
put:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; x
  mv s3, a1 ; s
  ; scenes/pause.e16.ts:133  say(x, LOG_ROW, s, SL_LOG)
  mv a0, s2
  li a1, 34
  mv a2, s3
  li a3, 5
  call say
  ; scenes/pause.e16.ts:134  let n: u16 = 0
  li s1, 0 ; n
  ; scenes/pause.e16.ts:135  while (peek(s + n) !== 0) n++
  j .L3
.L1:
  ; scenes/pause.e16.ts:135  n++
  addi s1, s1, 1
.L3:
  add t0, s3, s1
  lbu t0, 0(t0)
  bne t0, zero, .L1
  ; scenes/pause.e16.ts:136  return x + n
  add a0, s2, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; scenes/pause.e16.ts:140 moveName(x, m) at -O1
;   x in 2(fp)
;   m in s3
;   at in s1
;   posture in 0(fp)
;   col in s2
moveName:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 2(fp) ; x
  mv s3, a1 ; m
  ; scenes/pause.e16.ts:141  let at = x
  lw s1, 2(fp) ; x
  ; scenes/pause.e16.ts:142  const posture = m >> 2
  srli t0, s3, 2
  sw t0, 0(fp) ; posture
  ; scenes/pause.e16.ts:143  if (posture === 1) at = put(at, str('CROUCH '))
  li t0, 1
  lw t1, 0(fp) ; posture
  bne t1, t0, .L1
  ; scenes/pause.e16.ts:143  at = put(at, str('CROUCH '))
  mv a0, s1
  la a1, str_40
  call put
  mv s1, a0 ; at
  j .L2
.L1:
  ; scenes/pause.e16.ts:144  if (posture === 2) at = put(at, str('JUMP '))
  li t0, 2
  lw t1, 0(fp) ; posture
  bne t1, t0, .L3
  ; scenes/pause.e16.ts:144  at = put(at, str('JUMP '))
  mv a0, s1
  la a1, str_41
  call put
  mv s1, a0 ; at
.L3:
.L2:
  ; scenes/pause.e16.ts:145  const col = m & 3
  andi s2, s3, 3
  ; scenes/pause.e16.ts:146  if (col === 0) put(at, str('LIGHT PUNCH'))
  bne s2, zero, .L4
  ; scenes/pause.e16.ts:146  put(at, str('LIGHT PUNCH'))
  mv a0, s1
  la a1, str_42
  call put
  j .L5
.L4:
  ; scenes/pause.e16.ts:147  if (col === 1) put(at, str('HEAVY PUNCH'))
  li t0, 1
  bne s2, t0, .L6
  ; scenes/pause.e16.ts:147  put(at, str('HEAVY PUNCH'))
  mv a0, s1
  la a1, str_43
  call put
  j .L7
.L6:
  ; scenes/pause.e16.ts:148  if (col === 2) put(at, str('LIGHT KICK'))
  li t0, 2
  bne s2, t0, .L8
  ; scenes/pause.e16.ts:148  put(at, str('LIGHT KICK'))
  mv a0, s1
  la a1, str_44
  call put
  j .L9
.L8:
  ; scenes/pause.e16.ts:149  put(at, str('HEAVY KICK'))
  mv a0, s1
  la a1, str_45
  call put
.L9:
.L7:
.L5:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; scenes/pause.e16.ts:153 bigIndex(c) at -O1
;   c in a0
;   chars in a3
;   k in a1
;   d in a2
bigIndex:
  ; scenes/pause.e16.ts:154  const chars = str('ABCDEFGHIKLMNOPRSTUVWY.?123')
  la a3, str_46
  ; scenes/pause.e16.ts:155  let k: u16 = 0
  li a1, 0 ; k
  ; scenes/pause.e16.ts:156  let d = peek(chars)
  lbu a2, 0(a3)
  ; scenes/pause.e16.ts:157  while (d !== 0) {
  j .L3
.L1:
  ; scenes/pause.e16.ts:158  if (d === c) return k
  bne a2, a0, .L5
  ; scenes/pause.e16.ts:158  return k
  mv a0, a1
  ret
.L5:
  ; scenes/pause.e16.ts:159  k++
  addi a1, a1, 1
  ; scenes/pause.e16.ts:160  d = peek(chars + k)
  add t0, a3, a1
  lbu a2, 0(t0)
.L3:
  bne a2, zero, .L1
  ; scenes/pause.e16.ts:162  return 0xffff
  li a0, 65535
.return:
  ret

str_27:
  .byte 80, 65, 85, 83, 69, 68, 0
str_28:
  .byte 82, 69, 83, 85, 77, 69, 0
str_29:
  .byte 67, 79, 78, 84, 82, 79, 76, 83, 0
str_30:
  .byte 81, 85, 73, 84, 32, 70, 73, 71, 72, 84, 0
str_31:
  .byte 62, 0
str_32:
  .byte 32, 0
str_33:
  .byte 84, 72, 82, 79, 87, 32, 84, 69, 67, 72, 0
str_34:
  .byte 82, 69, 65, 68, 0
str_35:
  .byte 80, 49, 0
str_36:
  .byte 67, 80, 85, 0
str_37:
  .byte 65, 78, 84, 73, 45, 65, 73, 82, 0
str_38:
  .byte 84, 72, 82, 79, 87, 0
str_39:
  .byte 67, 79, 85, 78, 84, 69, 82, 0
str_40:
  .byte 67, 82, 79, 85, 67, 72, 32, 0
str_41:
  .byte 74, 85, 77, 80, 32, 0
str_42:
  .byte 76, 73, 71, 72, 84, 32, 80, 85, 78, 67, 72, 0
str_43:
  .byte 72, 69, 65, 86, 89, 32, 80, 85, 78, 67, 72, 0
str_44:
  .byte 76, 73, 71, 72, 84, 32, 75, 73, 67, 75, 0
str_45:
  .byte 72, 69, 65, 86, 89, 32, 75, 73, 67, 75, 0
str_46:
  .byte 65, 66, 67, 68, 69, 70, 71, 72, 73, 75, 76, 77, 78, 79, 80, 82, 83, 84, 85, 86, 87, 89, 46, 63, 49, 50, 51, 0
  .align 2

  .bank 4
  .org 0xc000
; engine/look.e16.ts:104 lookStep() at -O1
;   front in s1
lookStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; engine/look.e16.ts:105  eventsTake(0)
  li a0, 0
  call eventsTake
  ; engine/look.e16.ts:106  eventsTake(1)
  li a0, 1
  call eventsTake
  ; engine/look.e16.ts:107  koStep(0)
  li a0, 0
  call koStep
  ; engine/look.e16.ts:108  koStep(1)
  li a0, 1
  call koStep
  ; engine/look.e16.ts:109  picStep(0)
  li a0, 0
  call picStep
  ; engine/look.e16.ts:110  picStep(1)
  li a0, 1
  call picStep
  ; engine/look.e16.ts:111  soundStep()
  call soundStep
  ; engine/look.e16.ts:112  palStep(0)
  li a0, 0
  call palStep
  ; engine/look.e16.ts:113  palStep(1)
  li a0, 1
  call palStep
  ; engine/look.e16.ts:114  sprBegin()
  call sprBegin
  ; engine/look.e16.ts:115  fxSprites(0)
  li a0, 0
  call fxSprites
  ; engine/look.e16.ts:116  fxSprites(1)
  li a0, 1
  call fxSprites
  ; engine/look.e16.ts:117  const front = fState[1] === ST_ATTACK && fState[0] !== ST_ATTACK ? 1 : 0
  lw t0, fState+2(zero)
  li t1, 5
  bne t0, t1, .L1
  lw t0, fState(zero)
  li t1, 5
  beq t0, t1, .L1
  li t0, 1
  j .L2
.L1:
  li t0, 0
.L2:
  mv s1, t0 ; front
  ; engine/look.e16.ts:118  bodySprites(front)
  mv a0, s1
  call bodySprites
  ; engine/look.e16.ts:119  bodySprites(1 - front)
  li t0, 1
  sub a0, t0, s1
  call bodySprites
  ; engine/look.e16.ts:120  shadow(0)
  li a0, 0
  call shadow
  ; engine/look.e16.ts:121  shadow(1)
  li a0, 1
  call shadow
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/look.e16.ts:146 eventsTake(a) at -O1
;   a in s1
;   s in s2
;   d in s3
eventsTake:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; a
  ; engine/look.e16.ts:147  if (flashT[a] > 0) flashT[a]--
  slli t0, s1, 1
  lw t0, flashT(t0)
  bgeu zero, t0, .L1
  ; engine/look.e16.ts:147  flashT[a]--
  slli t0, s1, 1
  addi t0, t0, flashT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
.L1:
  ; engine/look.e16.ts:148  if (guardT[a] > 0) guardT[a]--
  slli t0, s1, 1
  lw t0, guardT(t0)
  bgeu zero, t0, .L2
  ; engine/look.e16.ts:148  guardT[a]--
  slli t0, s1, 1
  addi t0, t0, guardT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
.L2:
  ; engine/look.e16.ts:149  if (fxK[a] !== 0) {
  slli t0, s1, 1
  lw t0, fxK(t0)
  beq t0, zero, .L3
  ; engine/look.e16.ts:150  fxT[a]++
  slli t0, s1, 1
  addi t0, t0, fxT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; engine/look.e16.ts:151  if (fxT[a] >= (fxK[a] === 1 ? SPARK_F : WALL_F)) fxK[a] = 0
  slli t0, s1, 1
  lw t0, fxT(t0)
  slli t1, s1, 1
  lw t1, fxK(t1)
  li t2, 1
  bne t1, t2, .L5
  li t1, 9
  j .L6
.L5:
  li t1, 8
.L6:
  bltu t0, t1, .L4
  ; engine/look.e16.ts:151  fxK[a] = 0
  slli t0, s1, 1
  sw zero, fxK(t0)
.L4:
.L3:
  ; engine/look.e16.ts:153  const s = struck[a]
  slli t0, s1, 1
  lw s2, struck(t0)
  ; engine/look.e16.ts:154  if (s === 0) return
  bne s2, zero, .L7
  ; engine/look.e16.ts:154  return
  j .return
.L7:
  ; engine/look.e16.ts:155  const d = 1 - a
  li t0, 1
  sub s3, t0, s1
  ; engine/look.e16.ts:156  if (s === 1 || s === 3) hitsN[a]++
  li t0, 1
  beq s2, t0, .L9
  li t0, 3
  bne s2, t0, .L8
.L9:
  ; engine/look.e16.ts:156  hitsN[a]++
  slli t0, s1, 1
  addi t0, t0, hitsN
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
.L8:
  ; engine/look.e16.ts:157  if (s === 2) {
  li t0, 2
  bne s2, t0, .L10
  ; engine/look.e16.ts:158  guardT[d] = GUARD_F
  slli t0, s3, 1
  li t1, 2
  sw t1, guardT(t0)
  ; engine/look.e16.ts:159  fxAt(a, 2)
  mv a0, s1
  li a1, 2
  call fxAt
  ; engine/look.e16.ts:160  return
  j .return
.L10:
  ; engine/look.e16.ts:162  flashT[d] = FLASH_F
  slli t0, s3, 1
  li t1, 3
  sw t1, flashT(t0)
  ; engine/look.e16.ts:163  if (s !== 4) fxAt(a, 1)
  li t0, 4
  beq s2, t0, .L11
  ; engine/look.e16.ts:163  fxAt(a, 1)
  mv a0, s1
  li a1, 1
  call fxAt
.L11:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/look.e16.ts:167 fxAt(a, k) at -O1
;   a in a0
;   k in a1
;   o in a2
;   right in a3
fxAt:
  ; engine/look.e16.ts:169  const o = a * POSE_W + 4 * 4
  slli t1, a0, 4
  slli t0, a0, 3
  add t0, t0, t1
  addi a2, t0, 16
  ; engine/look.e16.ts:170  const right = fFace[a] !== 0
  slli t0, a0, 1
  lw t0, fFace(t0)
  sub t0, t0, zero
  snez a3, t0
  ; engine/look.e16.ts:171  fxK[a] = k
  slli t0, a0, 1
  sw a1, fxK(t0)
  ; engine/look.e16.ts:172  fxT[a] = 0
  slli t0, a0, 1
  sw zero, fxT(t0)
  ; engine/look.e16.ts:173  fxX[a] = u16(right ? i16(wb[o + 1]) - 6 : i16(wb[o]) + 6)
  slli t0, a0, 1
  addi t0, t0, fxX
  mv t1, a3
  beqz t1, .L1
  addi t1, a2, 1
  slli t1, t1, 1
  lw t1, wb(t1)
  addi t1, t1, -6
  j .L2
.L1:
  slli t1, a2, 1
  lw t1, wb(t1)
  addi t1, t1, 6
.L2:
  sw t1, 0(t0)
  ; engine/look.e16.ts:174  fxY[a] = u16(i16(groundY) - ((i16(wb[o + 2]) + i16(wb[o + 3])) >> 1))
  slli t0, a0, 1
  lw t1, 0x1540(zero)
  addi t2, a2, 2
  slli t2, t2, 1
  lw t2, wb(t2)
  addi t3, a2, 3
  slli t3, t3, 1
  lw t3, wb(t3)
  add t2, t2, t3
  srai t2, t2, 1
  sub t1, t1, t2
  sw t1, fxY(t0)
.return:
  ret

; engine/look.e16.ts:177 fxSprites(a) at -O1
;   a in s1
;   t in s2
;   f in s3
fxSprites:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; a
  ; engine/look.e16.ts:178  if (fxK[a] === 0) return
  slli t0, s1, 1
  lw t0, fxK(t0)
  bne t0, zero, .L1
  ; engine/look.e16.ts:178  return
  j .return
.L1:
  ; engine/look.e16.ts:179  const t = fxT[a]
  slli t0, s1, 1
  lw s2, fxT(t0)
  ; engine/look.e16.ts:180  let f: u16 = 0
  li s3, 0 ; f
  ; engine/look.e16.ts:181  if (fxK[a] === 1) f = t < 3 ? 0 : t < 6 ? 1 : 2
  slli t0, s1, 1
  lw t0, fxK(t0)
  li t1, 1
  bne t0, t1, .L2
  ; engine/look.e16.ts:181  f = t < 3 ? 0 : t < 6 ? 1 : 2
  li t0, 3
  bgeu s2, t0, .L3
  li t0, 0
  j .L4
.L3:
  li t0, 6
  bgeu s2, t0, .L5
  li t0, 1
  j .L6
.L5:
  li t0, 2
.L6:
.L4:
  mv s3, t0 ; f
  j .L7
.L2:
  ; engine/look.e16.ts:182  f = t < 4 ? 3 : 4
  li t0, 4
  bgeu s2, t0, .L8
  li t0, 3
  j .L9
.L8:
  li t0, 4
.L9:
  mv s3, t0 ; f
.L7:
  ; engine/look.e16.ts:183  spr(i16(fxX[a]) - i16(camX) - 16, i16(fxY[a]) - 16, (SPARK_TILE + f * 16) | FX_PAL, S32)
  slli t0, s1, 1
  lw t0, fxX(t0)
  lw t1, 0x1996(zero)
  sub t0, t0, t1
  slli t1, s1, 1
  lw t1, fxY(t1)
  slli t2, s3, 4
  addi t2, t2, 513
  ori t2, t2, 2048
  addi a0, t0, -16
  addi a1, t1, -16
  mv a2, t2
  li a3, 2
  call spr
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; engine/look.e16.ts:213 picStep(i) at -O1
;   i in s1
;   st in s3
;   pic in s2
picStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; i
  ; engine/look.e16.ts:214  if (artHold[i] !== 0) return
  slli t0, s1, 1
  lw t0, artHold(t0)
  beq t0, zero, .L1
  ; engine/look.e16.ts:214  return
  j .return
.L1:
  ; engine/look.e16.ts:215  const st = fState[i]
  slli t0, s1, 1
  lw s3, fState(t0)
  ; engine/look.e16.ts:216  let pic: u16 = 0
  li s2, 0 ; pic
  ; engine/look.e16.ts:217  if (st === ST_THROW || st === ST_THROWN) pic = throwWord(i, st === ST_THROW ? 0 : 1) & 255
  li t0, 11
  beq s3, t0, .L3
  li t0, 12
  bne s3, t0, .L2
.L3:
  ; engine/look.e16.ts:217  pic = throwWord(i, st === ST_THROW ? 0 : 1) & 255
  mv t0, s1
  mv t1, s3
  li t2, 11
  bne t1, t2, .L4
  li t1, 0
  j .L5
.L4:
  li t1, 1
.L5:
  mv a0, t0
  mv a1, t1
  call throwWord
  andi s2, a0, 255
  j .L6
.L2:
  ; engine/look.e16.ts:219  if (fRowT[i] === 0xffff) return
  slli t0, s1, 1
  lw t0, fRowT(t0)
  li t1, 65535
  bne t0, t1, .L7
  ; engine/look.e16.ts:219  return
  j .return
.L7:
  ; engine/look.e16.ts:220  pic = rowPic(i)
  mv a0, s1
  call rowPic
  mv s2, a0 ; pic
.L6:
  ; engine/look.e16.ts:222  if (pic === artPic[i]) return
  slli t0, s1, 1
  lw t0, artPic(t0)
  bne s2, t0, .L8
  ; engine/look.e16.ts:222  return
  j .return
.L8:
  ; engine/look.e16.ts:223  artPic[i] = pic
  slli t0, s1, 1
  sw s2, artPic(t0)
  ; engine/look.e16.ts:224  artCopy(i, fSlot[i], pic)
  slli t0, s1, 1
  lw t0, fSlot(t0)
  mv a0, s1
  mv a1, t0
  mv a2, s2
  call artCopy
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; engine/look.e16.ts:228 rowPic(i) at -O1
;   i in s2
;   row in s3
;   t in s0
;   p/d/k in s1
rowPic:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; i
  ; engine/look.e16.ts:229  const row = fPose[i] * SEQ_W
  slli t0, s2, 1
  lw t0, fPose(t0)
  slli t1, t0, 3
  slli t0, t0, 1
  add s3, t0, t1
  ; engine/look.e16.ts:230  let t = fRowT[i]
  slli t0, s2, 1
  lw s0, fRowT(t0)
  ; engine/look.e16.ts:231  if (t < TRANS_MOST) {
  li t0, 16
  bgeu s0, t0, .L1
  ; engine/look.e16.ts:232  const p = transPic(i, row, t)
  mv a0, s2
  mv a1, s3
  mv a2, s0
  call transPic
  mv s1, a0 ; p/d/k
  ; engine/look.e16.ts:233  if (p !== NO_PIC) return p
  li t0, 255
  beq s1, t0, .L2
  ; engine/look.e16.ts:233  return p
  mv a0, s1
  j .return
.L2:
.L1:
  ; engine/look.e16.ts:235  if (tableWord(FRAMES_BANK, FRAMES_AT, row) !== 0) {
  li a0, 365
  li a1, 49152
  mv a2, s3
  call tableWord
  beq a0, zero, .L3
  ; engine/look.e16.ts:236  const d = fFace[i] !== 0 ? pointX(i) : wrap16(0 - pointX(i))
  slli t0, s2, 1
  lw t0, fFace(t0)
  beq t0, zero, .L4
  mv a0, s2
  call pointX
  mv t0, a0
  j .L5
.L4:
  mv a0, s2
  call pointX
  sub t0, zero, a0
.L5:
  mv s1, t0 ; p/d/k
  ; engine/look.e16.ts:237  t = d & 7
  andi s0, s1, 7
.L3:
  ; engine/look.e16.ts:239  let k: u16 = 0
  li s1, 0 ; p/d/k
  ; engine/look.e16.ts:240  while (k < SEQ_PICS - 1 && t >= tableWord(FRAMES_BANK, FRAMES_AT, row + 2 + k * 2)) k++
  j .L8
.L6:
  ; engine/look.e16.ts:240  k++
  addi s1, s1, 1
.L8:
  li t0, 3
  bgeu s1, t0, .L10
  slli t0, s1, 1
  addi t1, s3, 2
  add t1, t1, t0
  li a0, 365
  li a1, 49152
  mv a2, t1
  call tableWord
  bgeu s0, a0, .L6
.L10:
  ; engine/look.e16.ts:241  return tableWord(FRAMES_BANK, FRAMES_AT, row + 1 + k * 2)
  slli t0, s1, 1
  addi t1, s3, 1
  add t1, t1, t0
  li a0, 365
  li a1, 49152
  mv a2, t1
  call tableWord
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; engine/look.e16.ts:248 transPic(i, row, t) at -O1
;   i in 8(fp)
;   row in 10(fp)
;   t in s2
;   w in s3
;   k in s1
;   end in 12(fp)
;   was in 0(fp)
;   from in 2(fp)
;   a in 4(fp)
;   b in 6(fp)
transPic:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s1, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  sw a0, 8(fp) ; i
  sw a1, 10(fp) ; row
  mv s2, a2 ; t
  ; engine/look.e16.ts:249  const w = tableWord(FRAMES_BANK, FRAMES_AT, row + SEQ_TRANS)
  lw t0, 10(fp) ; row
  li a0, 365
  li a1, 49152
  addi a2, t0, 9
  call tableWord
  mv s3, a0 ; w
  ; engine/look.e16.ts:250  let k = w & 255
  andi s1, s3, 255
  ; engine/look.e16.ts:251  const end = k + (w >> 8)
  srli t0, s3, 8
  add t0, s1, t0
  sw t0, 12(fp) ; end
  ; engine/look.e16.ts:252  const was = fRowWas[i]
  lw t0, 8(fp) ; i
  slli t0, t0, 1
  lw t0, fRowWas(t0)
  sw t0, 0(fp) ; was
  ; engine/look.e16.ts:253  while (k < end) {
  j .L3
.L1:
  ; engine/look.e16.ts:254  const from = tableWord(TRANS_BANK, TRANS_AT, k * TRANS_W)
  slli t1, s1, 1
  add t0, t1, s1
  li a0, 365
  li a1, 50372
  mv a2, t0
  call tableWord
  sw a0, 2(fp) ; from
  ; engine/look.e16.ts:255  if (was >= (from & 255) && was <= from >> 8) {
  lw t0, 2(fp) ; from
  andi t0, t0, 255
  lw t1, 0(fp) ; was
  bltu t1, t0, .L5
  lw t0, 2(fp) ; from
  srli t0, t0, 8
  lw t1, 0(fp) ; was
  bltu t0, t1, .L5
  ; engine/look.e16.ts:256  const a = tableWord(TRANS_BANK, TRANS_AT, k * TRANS_W + 1)
  slli t1, s1, 1
  add t0, t1, s1
  li a0, 365
  li a1, 50372
  addi a2, t0, 1
  call tableWord
  sw a0, 4(fp) ; a
  ; engine/look.e16.ts:257  if (t < a >> 8) return a & 255
  lw t0, 4(fp) ; a
  srli t0, t0, 8
  bgeu s2, t0, .L6
  ; engine/look.e16.ts:257  return a & 255
  lw t0, 4(fp) ; a
  andi a0, t0, 255
  j .return
.L6:
  ; engine/look.e16.ts:258  const b = tableWord(TRANS_BANK, TRANS_AT, k * TRANS_W + 2)
  slli t1, s1, 1
  add t0, t1, s1
  li a0, 365
  li a1, 50372
  addi a2, t0, 2
  call tableWord
  sw a0, 6(fp) ; b
  ; engine/look.e16.ts:259  return t < b >> 8 ? b & 255 : NO_PIC
  lw t0, 6(fp) ; b
  srli t0, t0, 8
  bgeu s2, t0, .L7
  lw t0, 6(fp) ; b
  andi t0, t0, 255
  j .L8
.L7:
  li t0, 255
.L8:
  mv a0, t0
  j .return
.L5:
  ; engine/look.e16.ts:261  k++
  addi s1, s1, 1
.L3:
  lw t0, 12(fp) ; end
  bltu s1, t0, .L1
  ; engine/look.e16.ts:263  return NO_PIC
  li a0, 255
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s1, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; engine/look.e16.ts:270 throwWord(i, w) at -O1
;   i in s1
;   w in s3
;   a in s2
;   k in s0
throwWord:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; i
  mv s3, a1 ; w
  ; engine/look.e16.ts:271  const a = fState[i] === ST_THROW ? i : 1 - i
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 11
  bne t0, t1, .L1
  mv t0, s1
  j .L2
.L1:
  li t0, 1
  sub t0, t0, s1
.L2:
  mv s2, t0 ; a
  ; engine/look.e16.ts:272  const k = fStateT[a] < THROW_KS ? fStateT[a] : THROW_KS - 1
  slli t0, s2, 1
  lw t0, fStateT(t0)
  li t1, 27
  bgeu t0, t1, .L3
  slli t0, s2, 1
  lw t0, fStateT(t0)
  j .L4
.L3:
  li t0, 26
.L4:
  mv s0, t0 ; k
  ; engine/look.e16.ts:273  return tableWord(THROWS_BANK, THROWS_AT, (fThrowBack[a] * THROW_KS + k) * THROW_W + w)
  slli t0, s2, 1
  lw t0, fThrowBack(t0)
  li t1, 27
  mul t0, t0, t1
  add t0, t0, s0
  slli t0, t0, 2
  add t0, t0, s3
  li a0, 365
  li a1, 50762
  mv a2, t0
  call tableWord
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; engine/look.e16.ts:281 heldX(d) at -O1
;   d in s2
;   a in 0(fp)
;   xa in s1
;   xd in s3
;   g in 4(fp)
;   w in 2(fp)
heldX:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; d
  ; engine/look.e16.ts:282  const a = 1 - d
  li t0, 1
  sub t0, t0, s2
  sw t0, 0(fp) ; a
  ; engine/look.e16.ts:283  const xa = i16(pointX(a))
  lw a0, 0(fp)
  call pointX
  mv s1, a0 ; xa
  ; engine/look.e16.ts:284  const xd = i16(pointX(d))
  mv a0, s2
  call pointX
  mv s3, a0 ; xd
  ; engine/look.e16.ts:285  const g = xd > xa ? xd - xa : xa - xd
  bge s1, s3, .L1
  sub t0, s3, s1
  j .L2
.L1:
  sub t0, s1, s3
.L2:
  sw t0, 4(fp) ; g
  ; engine/look.e16.ts:286  const w = throwWord(d, 2)
  mv a0, s2
  li a1, 2
  call throwWord
  sw a0, 2(fp) ; w
  ; engine/look.e16.ts:287  return xa + faceSign(a) * (idiv(g * lowOf(w), 16) + highOf(w))
  lw a0, 0(fp)
  call faceSign
  addi sp, sp, -2
  sw a0, 0(sp)
  lw a0, 2(fp)
  call lowOf
  lw t0, 4(fp) ; g
  mul t0, t0, a0
  li t1, 16
  div t0, t0, t1
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 2(fp)
  call highOf
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  mul t1, t1, t0
  add a0, s1, t1
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/look.e16.ts:291 lowOf(w) at -O1
;   w in a0
;   v in a1
lowOf:
  ; engine/look.e16.ts:292  const v = i16(w & 255)
  andi a1, a0, 255
  ; engine/look.e16.ts:293  return v > 127 ? v - 256 : v
  li t0, 127
  bge t0, a1, .L1
  addi t0, a1, -256
  j .L2
.L1:
  mv t0, a1
.L2:
  mv a0, t0
.return:
  ret

; engine/look.e16.ts:296 highOf(w) at -O1
;   w in a0
;   v in a1
highOf:
  ; engine/look.e16.ts:297  const v = i16(w >> 8)
  srli a1, a0, 8
  ; engine/look.e16.ts:298  return v > 127 ? v - 256 : v
  li t0, 127
  bge t0, a1, .L1
  addi t0, a1, -256
  j .L2
.L1:
  mv t0, a1
.L2:
  mv a0, t0
.return:
  ret

; engine/look.e16.ts:302 bodySprites(i) at -O1
;   i in s1
;   x in 2(fp)
;   y in 4(fp)
;   right in s3
;   st in 0(fp)
;   tile in 10(fp)
;   n in 12(fp)
;   c in s2
;   w in 6(fp)
;   dx in 8(fp)
bodySprites:
  addi sp, sp, -24
  sw ra, 14(sp)
  sw s1, 16(sp)
  sw s3, 18(sp)
  sw s2, 20(sp)
  sw s0, 22(sp)
  mv fp, sp
  mv s1, a0 ; i
  ; engine/look.e16.ts:303  if (shOn[i] !== 0) {
  slli t0, s1, 1
  lw t0, shOn(t0)
  beq t0, zero, .L1
  ; engine/look.e16.ts:304  shardSprites(i)
  mv a0, s1
  call shardSprites
  ; engine/look.e16.ts:305  return
  j .return
.L1:
  ; engine/look.e16.ts:307  let x = i16(pointX(i)) - i16(camX)
  mv a0, s1
  call pointX
  lw t0, 0x1996(zero)
  sub t0, a0, t0
  sw t0, 2(fp) ; x
  ; engine/look.e16.ts:308  let y = i16(groundY) - i16(fY[i] >> 4)
  lw t0, 0x1540(zero)
  slli t1, s1, 1
  lw t1, fY(t1)
  srli t1, t1, 4
  sub t0, t0, t1
  sw t0, 4(fp) ; y
  ; engine/look.e16.ts:309  let right = fFace[i] !== 0
  slli t0, s1, 1
  lw t0, fFace(t0)
  sub t0, t0, zero
  snez s3, t0
  ; engine/look.e16.ts:310  const st = fState[i]
  slli t0, s1, 1
  lw t0, fState(t0)
  sw t0, 0(fp) ; st
  ; engine/look.e16.ts:311  if (st === ST_THROW || st === ST_THROWN) {
  li t0, 11
  lw t1, 0(fp) ; st
  beq t1, t0, .L3
  li t0, 12
  lw t1, 0(fp) ; st
  bne t1, t0, .L2
.L3:
  ; engine/look.e16.ts:313  if ((throwWord(i, st === ST_THROW ? 0 : 1) & 256) !== 0) right = !right
  mv t0, s1
  lw t1, 0(fp)
  li t2, 11
  bne t1, t2, .L5
  li t1, 0
  j .L6
.L5:
  li t1, 1
.L6:
  mv a0, t0
  mv a1, t1
  call throwWord
  andi t0, a0, 256
  beq t0, zero, .L4
  ; engine/look.e16.ts:313  right = !right
  seqz s3, s3
.L4:
  ; engine/look.e16.ts:314  if (st === ST_THROWN) {
  li t0, 12
  lw t1, 0(fp) ; st
  bne t1, t0, .L7
  ; engine/look.e16.ts:315  x = heldX(i) - i16(camX)
  mv a0, s1
  call heldX
  lw t0, 0x1996(zero)
  sub t0, a0, t0
  sw t0, 2(fp) ; x
  ; engine/look.e16.ts:316  y = i16(groundY) - i16(throwWord(i, 3))
  lw t0, 0x1540(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 3
  call throwWord
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  sw t0, 4(fp) ; y
.L7:
.L2:
  ; engine/look.e16.ts:319  const tile = (S1_TILE + i * 128) | (i << 10) | (right ? 0 : FLIP_H)
  slli t0, s1, 7
  slli t1, s1, 10
  addi t0, t0, 257
  or t0, t0, t1
  mv t1, s3
  beqz t1, .L8
  li t1, 0
  j .L9
.L8:
  li t1, 8192
.L9:
  or t0, t0, t1
  sw t0, 10(fp) ; tile
  ; engine/look.e16.ts:320  const n = art[i * ART_W + 1]
  slli t1, s1, 5
  slli t0, s1, 1
  add t0, t0, t1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, art(t0)
  sw t0, 12(fp) ; n
  ; engine/look.e16.ts:321  let c: u16 = 0
  li s2, 0 ; c
  ; engine/look.e16.ts:322  while (c < n) {
  j .L12
.L10:
  ; engine/look.e16.ts:323  const w = art[i * ART_W + 2 + c]
  slli t1, s1, 5
  slli t0, s1, 1
  add t0, t0, t1
  addi t0, t0, 2
  add t0, t0, s2
  slli t0, t0, 1
  lw t0, art(t0)
  sw t0, 6(fp) ; w
  ; engine/look.e16.ts:324  const dx = lowOf(w)
  lw a0, 6(fp)
  call lowOf
  sw a0, 8(fp) ; dx
  ; engine/look.e16.ts:325  spr(right ? x + dx : x - dx - 16, y + highOf(w), tile + c * 4, S16)
  beqz s3, .L14
  lw t0, 8(fp) ; dx
  lw t1, 2(fp) ; x
  add t0, t1, t0
  j .L15
.L14:
  lw t0, 8(fp) ; dx
  lw t1, 2(fp) ; x
  sub t1, t1, t0
  addi t0, t1, -16
.L15:
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 6(fp)
  call highOf
  lw t0, 4(fp) ; y
  add t0, t0, a0
  slli t1, s2, 2
  lw t2, 10(fp) ; tile
  add t2, t2, t1
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a0, t1
  mv a1, t0
  mv a2, t2
  li a3, 1
  call spr
  ; engine/look.e16.ts:326  c++
  addi s2, s2, 1
.L12:
  lw t0, 12(fp) ; n
  bltu s2, t0, .L10
.return:
  mv sp, fp
  lw ra, 14(sp)
  lw s1, 16(sp)
  lw s3, 18(sp)
  lw s2, 20(sp)
  lw s0, 22(sp)
  addi sp, sp, 24
  ret

; engine/look.e16.ts:334 shadow(i) at -O1
;   i in s1
;   held in 0(fp)
;   x in s2
;   h in 2(fp)
;   y in s3
shadow:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; i
  ; engine/look.e16.ts:335  if (shOn[i] !== 0) return
  slli t0, s1, 1
  lw t0, shOn(t0)
  beq t0, zero, .L1
  ; engine/look.e16.ts:335  return
  j .return
.L1:
  ; engine/look.e16.ts:336  const held = fState[i] === ST_THROWN
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 12
  sub t0, t0, t1
  seqz t0, t0
  sw t0, 0(fp) ; held
  ; engine/look.e16.ts:337  const x = (held ? heldX(i) : i16(pointX(i))) - i16(camX)
  lw t0, 0(fp) ; held
  beqz t0, .L2
  mv a0, s1
  call heldX
  mv t0, a0
  j .L3
.L2:
  mv a0, s1
  call pointX
  mv t0, a0
.L3:
  lw t1, 0x1996(zero)
  sub s2, t0, t1
  ; engine/look.e16.ts:338  const h = held ? throwWord(i, 3) : fY[i] >> 4
  lw t0, 0(fp) ; held
  beqz t0, .L4
  mv a0, s1
  li a1, 3
  call throwWord
  mv t0, a0
  j .L5
.L4:
  slli t0, s1, 1
  lw t0, fY(t0)
  srli t0, t0, 4
.L5:
  sw t0, 2(fp) ; h
  ; engine/look.e16.ts:339  const y = i16(groundY) - 4
  lw t0, 0x1540(zero)
  addi s3, t0, -4
  ; engine/look.e16.ts:340  const t = SHADOW_TILE | FX_PAL
  ; engine/look.e16.ts:341  if (h < 20) {
  li t0, 20
  lw t1, 2(fp) ; h
  bgeu t1, t0, .L6
  ; engine/look.e16.ts:342  spr(x - 24, y, t, S16)
  addi a0, s2, -24
  mv a1, s3
  li a2, 2641
  li a3, 1
  call spr
  ; engine/look.e16.ts:343  spr(x - 8, y, t + 4, S16)
  addi a0, s2, -8
  mv a1, s3
  li a2, 2645
  li a3, 1
  call spr
  ; engine/look.e16.ts:344  spr(x + 8, y, t | FLIP_H, S16)
  addi a0, s2, 8
  mv a1, s3
  li a2, 10833
  li a3, 1
  call spr
  j .L7
.L6:
  ; engine/look.e16.ts:345  if (h < 50) {
  li t0, 50
  lw t1, 2(fp) ; h
  bgeu t1, t0, .L8
  ; engine/look.e16.ts:346  spr(x - 16, y, t + 8, S16)
  addi a0, s2, -16
  mv a1, s3
  li a2, 2649
  li a3, 1
  call spr
  ; engine/look.e16.ts:347  spr(x, y, (t + 8) | FLIP_H, S16)
  mv a0, s2
  mv a1, s3
  li a2, 10841
  li a3, 1
  call spr
  j .L9
.L8:
  ; engine/look.e16.ts:348  spr(x - 8, y, t + 12, S16)
  addi a0, s2, -8
  mv a1, s3
  li a2, 2653
  li a3, 1
  call spr
.L9:
.L7:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/look.e16.ts:374 koStep(i) at -O1
;   i in s1
;   over in s2
koStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/look.e16.ts:375  const over = phase === PH_OVER || phase === PH_END
  lw t0, 0x0c98(zero)
  li t1, 2
  sub t0, t0, t1
  seqz t0, t0
  mv t1, t0
  bnez t1, .L1
  lw t0, 0x0c98(zero)
  li t1, 3
  sub t0, t0, t1
  seqz t0, t0
.L1:
  mv s2, t0 ; over
  ; engine/look.e16.ts:376  if (!over) {
  bnez s2, .L2
  ; engine/look.e16.ts:377  shOn[i] = 0
  slli t0, s1, 1
  sw zero, shOn(t0)
  ; engine/look.e16.ts:378  return
  j .return
.L2:
  ; engine/look.e16.ts:380  if (phase === PH_OVER && roundWon === i && phaseT >= WIN_AT) fWin[i] = 1
  lw t0, 0x0c98(zero)
  li t1, 2
  bne t0, t1, .L3
  lw t0, 0x0ca0(zero)
  bne t0, s1, .L3
  lw t0, 0x0c9a(zero)
  li t1, 60
  bltu t0, t1, .L3
  ; engine/look.e16.ts:380  fWin[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, fWin(t0)
.L3:
  ; engine/look.e16.ts:381  if (fLife[i] !== 0) return
  slli t0, s1, 1
  lw t0, fLife(t0)
  beq t0, zero, .L4
  ; engine/look.e16.ts:381  return
  j .return
.L4:
  ; engine/look.e16.ts:382  if (phase === PH_OVER && phaseT === BREAK_AT && shOn[i] === 0) {
  lw t0, 0x0c98(zero)
  li t1, 2
  bne t0, t1, .L5
  lw t0, 0x0c9a(zero)
  li t1, 40
  bne t0, t1, .L5
  slli t0, s1, 1
  lw t0, shOn(t0)
  bne t0, zero, .L5
  ; engine/look.e16.ts:383  shatter(i)
  mv a0, s1
  call shatter
  ; engine/look.e16.ts:384  sfx(X_SHARDS)
  li a0, 8
  call sfx
.L5:
  ; engine/look.e16.ts:386  if (shOn[i] !== 0) shardsMove(i)
  slli t0, s1, 1
  lw t0, shOn(t0)
  beq t0, zero, .L6
  ; engine/look.e16.ts:386  shardsMove(i)
  mv a0, s1
  call shardsMove
.L6:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/look.e16.ts:394 shatter(i) at -O1
;   i in s1
;   right in 6(fp)
;   x0 in 8(fp)
;   y0 in 12(fp)
;   n in 0(fp)
;   mean in s3
;   c in s2
;   w in 10(fp)
;   dx in 2(fp)
;   e in 4(fp)
;   px in 14(fp)
;   away in 16(fp)
shatter:
  addi sp, sp, -28
  sw ra, 18(sp)
  sw s1, 20(sp)
  sw s3, 22(sp)
  sw s2, 24(sp)
  sw s0, 26(sp)
  mv fp, sp
  mv s1, a0 ; i
  ; engine/look.e16.ts:395  artHold[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, artHold(t0)
  ; engine/look.e16.ts:396  boxPose[i] = 0xffff
  slli t0, s1, 1
  li t1, 65535
  sw t1, boxPose(t0)
  ; engine/look.e16.ts:397  artCopy(i, fSlot[i], fAir[i] !== 0 ? SHARDS_AIR : SHARDS_ROW)
  slli t0, s1, 1
  lw t0, fSlot(t0)
  slli t1, s1, 1
  lw t2, fAir(t1)
  mv t1, t0
  mv t0, s1
  li t3, 0
  beq t2, t3, .L1
  li t2, 62
  j .L2
.L1:
  li t2, 61
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call artCopy
  ; engine/look.e16.ts:398  shOn[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, shOn(t0)
  ; engine/look.e16.ts:399  const right = fFace[i] !== 0
  slli t0, s1, 1
  lw t0, fFace(t0)
  sub t0, t0, zero
  snez t0, t0
  sw t0, 6(fp) ; right
  ; engine/look.e16.ts:400  const x0 = i16(pointX(i))
  mv a0, s1
  call pointX
  sw a0, 8(fp) ; x0
  ; engine/look.e16.ts:401  const y0 = i16(groundY) - i16(fY[i] >> 4)
  lw t0, 0x1540(zero)
  slli t1, s1, 1
  lw t1, fY(t1)
  srli t1, t1, 4
  sub t0, t0, t1
  sw t0, 12(fp) ; y0
  ; engine/look.e16.ts:402  const n = art[i * ART_W + 1]
  slli t1, s1, 5
  slli t0, s1, 1
  add t0, t0, t1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, art(t0)
  sw t0, 0(fp) ; n
  ; engine/look.e16.ts:403  let mean: i16 = 0
  li s3, 0 ; mean
  ; engine/look.e16.ts:404  let c: u16 = 0
  li s2, 0 ; c
  ; engine/look.e16.ts:405  while (c < n) {
  j .L5
.L3:
  ; engine/look.e16.ts:406  mean = mean + lowOf(art[i * ART_W + 2 + c])
  slli t1, s1, 5
  slli t0, s1, 1
  add t0, t0, t1
  addi t0, t0, 2
  add t0, t0, s2
  slli t0, t0, 1
  lw a0, art(t0)
  call lowOf
  add s3, s3, a0
  ; engine/look.e16.ts:407  c++
  addi s2, s2, 1
.L5:
  lw t0, 0(fp) ; n
  bltu s2, t0, .L3
  ; engine/look.e16.ts:409  if (n > 0) mean = idiv(mean, i16(n))
  lw t0, 0(fp) ; n
  bgeu zero, t0, .L7
  ; engine/look.e16.ts:409  mean = idiv(mean, i16(n))
  lw t0, 0(fp) ; n
  div s3, s3, t0
.L7:
  ; engine/look.e16.ts:410  c = 0
  li s2, 0 ; c
  ; engine/look.e16.ts:411  while (c < n) {
  j .L10
.L8:
  ; engine/look.e16.ts:412  const w = art[i * ART_W + 2 + c]
  slli t1, s1, 5
  slli t0, s1, 1
  add t0, t0, t1
  addi t0, t0, 2
  add t0, t0, s2
  slli t0, t0, 1
  lw t0, art(t0)
  sw t0, 10(fp) ; w
  ; engine/look.e16.ts:413  const dx = lowOf(w)
  lw a0, 10(fp)
  call lowOf
  sw a0, 2(fp) ; dx
  ; engine/look.e16.ts:414  const e = i * 32 + c
  slli t0, s1, 5
  add t0, t0, s2
  sw t0, 4(fp) ; e
  ; engine/look.e16.ts:415  const px = right ? x0 + dx : x0 - dx - 16
  lw t0, 6(fp) ; right
  beqz t0, .L12
  lw t0, 2(fp) ; dx
  lw t1, 8(fp) ; x0
  add t0, t1, t0
  j .L13
.L12:
  lw t0, 2(fp) ; dx
  lw t1, 8(fp) ; x0
  sub t1, t1, t0
  addi t0, t1, -16
.L13:
  sw t0, 14(fp) ; px
  ; engine/look.e16.ts:416  const away = right ? dx - mean : mean - dx
  lw t0, 6(fp) ; right
  beqz t0, .L14
  lw t0, 2(fp) ; dx
  sub t0, t0, s3
  j .L15
.L14:
  lw t0, 2(fp) ; dx
  sub t0, s3, t0
.L15:
  sw t0, 16(fp) ; away
  ; engine/look.e16.ts:417  shX[e] = u16(px * 16)
  lw t0, 4(fp) ; e
  slli t0, t0, 1
  lw t1, 14(fp) ; px
  slli t1, t1, 4
  sw t1, shX(t0)
  ; engine/look.e16.ts:420  shY[e] = u16((y0 + highOf(w) - i16((c & 1) * 16)) * 16)
  lw t0, 4(fp) ; e
  slli t0, t0, 1
  addi t0, t0, shY
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 10(fp)
  call highOf
  lw t0, 12(fp) ; y0
  add t0, t0, a0
  andi t1, s2, 1
  slli t1, t1, 4
  sub t0, t0, t1
  slli t0, t0, 4
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; engine/look.e16.ts:421  shVX[e] = u16(away * 3 + i16((c * 7) & 15) - 8)
  lw t0, 4(fp) ; e
  slli t0, t0, 1
  lw t1, 16(fp) ; away
  slli t2, t1, 1
  add t1, t2, t1
  slli t3, s2, 3
  sub t2, t3, s2
  andi t2, t2, 15
  add t1, t1, t2
  addi t1, t1, -8
  sw t1, shVX(t0)
  ; engine/look.e16.ts:422  shVY[e] = u16(-24 - i16((c * 13) & 31))
  lw t0, 4(fp) ; e
  slli t0, t0, 1
  li t1, 13
  mul t1, s2, t1
  andi t1, t1, 31
  li t2, 65512
  sub t2, t2, t1
  sw t2, shVY(t0)
  ; engine/look.e16.ts:423  c++
  addi s2, s2, 1
.L10:
  lw t0, 0(fp) ; n
  bltu s2, t0, .L8
.return:
  mv sp, fp
  lw ra, 18(sp)
  lw s1, 20(sp)
  lw s3, 22(sp)
  lw s2, 24(sp)
  lw s0, 26(sp)
  addi sp, sp, 28
  ret

; engine/look.e16.ts:427 shardsMove(i) at -O1
;   i in a0
;   n in a3
;   c in a2
;   e in a1
shardsMove:
  ; engine/look.e16.ts:428  const n = art[i * ART_W + 1]
  slli t1, a0, 5
  slli t0, a0, 1
  add t0, t0, t1
  addi t0, t0, 1
  slli t0, t0, 1
  lw a3, art(t0)
  ; engine/look.e16.ts:429  let c: u16 = 0
  li a2, 0 ; c
  ; engine/look.e16.ts:430  while (c < n) {
  j .L3
.L1:
  ; engine/look.e16.ts:431  const e = i * 32 + c
  slli t0, a0, 5
  add a1, t0, a2
  ; engine/look.e16.ts:432  shVY[e] = u16(i16(shVY[e]) + GRAVITY)
  slli t0, a1, 1
  slli t1, a1, 1
  lw t1, shVY(t1)
  addi t1, t1, 3
  sw t1, shVY(t0)
  ; engine/look.e16.ts:433  shX[e] = u16(i16(shX[e]) + i16(shVX[e]))
  slli t0, a1, 1
  slli t1, a1, 1
  lw t1, shX(t1)
  slli t2, a1, 1
  lw t2, shVX(t2)
  add t1, t1, t2
  sw t1, shX(t0)
  ; engine/look.e16.ts:434  shY[e] = u16(i16(shY[e]) + i16(shVY[e]))
  slli t0, a1, 1
  slli t1, a1, 1
  lw t1, shY(t1)
  slli t2, a1, 1
  lw t2, shVY(t2)
  add t1, t1, t2
  sw t1, shY(t0)
  ; engine/look.e16.ts:435  c++
  addi a2, a2, 1
.L3:
  bltu a2, a3, .L1
.return:
  ret

; engine/look.e16.ts:439 shardSprites(i) at -O1
;   i in s1
;   n in 2(fp)
;   tile in 4(fp)
;   c in s2
;   e in s3
;   y in 0(fp)
shardSprites:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; i
  ; engine/look.e16.ts:440  const n = art[i * ART_W + 1]
  slli t1, s1, 5
  slli t0, s1, 1
  add t0, t0, t1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, art(t0)
  sw t0, 2(fp) ; n
  ; engine/look.e16.ts:441  const tile = (S1_TILE + i * 128) | (i << 10) | (fFace[i] !== 0 ? 0 : FLIP_H)
  slli t0, s1, 7
  slli t1, s1, 10
  addi t0, t0, 257
  or t0, t0, t1
  slli t1, s1, 1
  lw t1, fFace(t1)
  li t2, 0
  beq t1, t2, .L1
  li t1, 0
  j .L2
.L1:
  li t1, 8192
.L2:
  or t0, t0, t1
  sw t0, 4(fp) ; tile
  ; engine/look.e16.ts:442  let c: u16 = 0
  li s2, 0 ; c
  ; engine/look.e16.ts:443  while (c < n) {
  j .L5
.L3:
  ; engine/look.e16.ts:444  const e = i * 32 + c
  slli t0, s1, 5
  add s3, t0, s2
  ; engine/look.e16.ts:445  const y = i16(shY[e]) >> 4
  slli t0, s3, 1
  lw t0, shY(t0)
  srai t0, t0, 4
  sw t0, 0(fp) ; y
  ; engine/look.e16.ts:446  if (y < 300) spr((i16(shX[e]) >> 4) - i16(camX), y, tile + c * 4, S16)
  li t0, 300
  lw t1, 0(fp) ; y
  bge t1, t0, .L7
  ; engine/look.e16.ts:446  spr((i16(shX[e]) >> 4) - i16(camX), y, tile + c * 4, S16)
  slli t0, s3, 1
  lw t0, shX(t0)
  srai t0, t0, 4
  lw t1, 0x1996(zero)
  sub t0, t0, t1
  slli t1, s2, 2
  lw t2, 4(fp) ; tile
  add t2, t2, t1
  mv a0, t0
  lw a1, 0(fp)
  mv a2, t2
  li a3, 1
  call spr
.L7:
  ; engine/look.e16.ts:447  c++
  addi s2, s2, 1
.L5:
  lw t0, 2(fp) ; n
  bltu s2, t0, .L3
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; engine/look.e16.ts:471 palStep(i) at -O1
;   i in s1
;   key in s2
palStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/look.e16.ts:472  const key = palWanted(i)
  mv a0, s1
  call palWanted
  mv s2, a0 ; key
  ; engine/look.e16.ts:473  if (key === palKey[i]) return
  slli t0, s1, 1
  lw t0, palKey(t0)
  bne s2, t0, .L1
  ; engine/look.e16.ts:473  return
  j .return
.L1:
  ; engine/look.e16.ts:474  palKey[i] = key
  slli t0, s1, 1
  sw s2, palKey(t0)
  ; engine/look.e16.ts:475  palShow(8 + i, key >> 8, key & 255)
  srli t0, s2, 8
  andi t1, s2, 255
  addi a0, s1, 8
  mv a1, t0
  mv a2, t1
  call palShow
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/look.e16.ts:481 introStep(t) at -O1
;   t in s2
;   k in s1
introStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; t
  ; engine/look.e16.ts:482  const k = introKey(t)
  mv a0, s2
  call introKey
  mv s1, a0 ; k
  ; engine/look.e16.ts:483  return k >> 8 === M_NORMAL ? 6 : k & 255
  srli t0, s1, 8
  bne t0, zero, .L1
  li t0, 6
  j .L2
.L1:
  andi t0, s1, 255
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; engine/look.e16.ts:490 palWanted(i) at -O1
;   i in s1
;   t in s2
palWanted:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  ; engine/look.e16.ts:491  if (shOn[i] !== 0) {
  slli t0, s1, 1
  lw t0, shOn(t0)
  beq t0, zero, .L1
  ; engine/look.e16.ts:492  const t = phaseT > FADE_AT ? phaseT - FADE_AT : 0
  lw t0, 0x0c9a(zero)
  li t1, 96
  bgeu t1, t0, .L2
  lw t0, 0x0c9a(zero)
  addi t0, t0, -96
  j .L3
.L2:
  li t0, 0
.L3:
  mv s2, t0 ; t
  ; engine/look.e16.ts:493  return (M_PIECES << 8) | (t > 16 ? 16 : t)
  li t0, 1792
  mv t1, s2
  li t2, 16
  bgeu t2, t1, .L4
  li t1, 16
  j .L5
.L4:
  mv t1, s2
.L5:
  or a0, t0, t1
  j .return
.L1:
  ; engine/look.e16.ts:495  if (phase === PH_OVER && fLife[i] === 0 && phaseT >= VOID_FROM) {
  lw t0, 0x0c98(zero)
  li t1, 2
  bne t0, t1, .L6
  slli t0, s1, 1
  lw t0, fLife(t0)
  bne t0, zero, .L6
  lw t0, 0x0c9a(zero)
  li t1, 24
  bltu t0, t1, .L6
  ; engine/look.e16.ts:496  const t = phaseT - VOID_FROM
  lw t0, 0x0c9a(zero)
  addi s2, t0, -24
  ; engine/look.e16.ts:497  return (M_KO << 8) | (t > 16 ? 16 : t)
  li t0, 1536
  mv t1, s2
  li t2, 16
  bgeu t2, t1, .L7
  li t1, 16
  j .L8
.L7:
  mv t1, s2
.L8:
  or a0, t0, t1
  j .return
.L6:
  ; engine/look.e16.ts:499  if (phase === PH_ROUND) return introKey(phaseT)
  lw t0, 0x0c98(zero)
  bne t0, zero, .L9
  ; engine/look.e16.ts:499  return introKey(phaseT)
  lw a0, 0x0c9a(zero)
  call introKey
  j .return
.L9:
  ; engine/look.e16.ts:500  if (fState[i] === ST_THROWN) return M_THROWN << 8
  slli t0, s1, 1
  lw t0, fState(t0)
  li t1, 12
  bne t0, t1, .L10
  ; engine/look.e16.ts:500  return M_THROWN << 8
  li a0, 1024
  j .return
.L10:
  ; engine/look.e16.ts:501  if (flashT[i] > 0) return M_FLASH << 8
  slli t0, s1, 1
  lw t0, flashT(t0)
  bgeu zero, t0, .L11
  ; engine/look.e16.ts:501  return M_FLASH << 8
  li a0, 512
  j .return
.L11:
  ; engine/look.e16.ts:502  if (guardT[i] > 0) return M_GUARD << 8
  slli t0, s1, 1
  lw t0, guardT(t0)
  bgeu zero, t0, .L12
  ; engine/look.e16.ts:502  return M_GUARD << 8
  li a0, 768
  j .return
.L12:
  ; engine/look.e16.ts:503  if (fLife[i] * 4 < prAt(i, P_LIFE) && (frame & 16) !== 0) return M_LOW << 8
  slli t0, s1, 1
  lw t0, fLife(t0)
  slli t0, t0, 2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  li a1, 0
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L13
  lw t0, 0x0c94(zero)
  andi t0, t0, 16
  beq t0, zero, .L13
  ; engine/look.e16.ts:503  return M_LOW << 8
  li a0, 1280
  j .return
.L13:
  ; engine/look.e16.ts:504  return M_NORMAL << 8
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/look.e16.ts:508 introKey(t) at -O1
;   t in a0
;   s in a1
introKey:
  ; engine/look.e16.ts:509  if (t < 10) return M_INTRO << 8
  li t0, 10
  bgeu a0, t0, .L1
  ; engine/look.e16.ts:509  return M_INTRO << 8
  li a0, 256
  ret
.L1:
  ; engine/look.e16.ts:510  if (t < 18) return (M_INTRO << 8) | 1
  li t0, 18
  bgeu a0, t0, .L2
  ; engine/look.e16.ts:510  return (M_INTRO << 8) | 1
  li a0, 257
  ret
.L2:
  ; engine/look.e16.ts:511  const s = 2 + ((t - 18) >> 2)
  addi t0, a0, -18
  srli t0, t0, 2
  addi a1, t0, 2
  ; engine/look.e16.ts:512  return s >= 6 ? M_NORMAL << 8 : (M_INTRO << 8) | s
  li t0, 6
  bltu a1, t0, .L3
  li t0, 0
  j .L4
.L3:
  li t0, 256
  or t0, t0, a1
.L4:
  mv a0, t0
.return:
  ret

; engine/look.e16.ts:519 palShow(sl, mode, step) at -O1
;   sl in s2
;   mode in s3
;   step in 0(fp)
;   base in 2(fp)
;   empty in 4(fp)
;   m in 6(fp)
;   k in s1
palShow:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s1, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s2, a0 ; sl
  mv s3, a1 ; mode
  sw a2, 0(fp) ; step
  ; engine/look.e16.ts:520  const base = sl * 16
  slli t0, s2, 4
  sw t0, 2(fp) ; base
  ; engine/look.e16.ts:521  const empty = palCopy[base + 13]
  lw t0, 2(fp) ; base
  addi t0, t0, 13
  slli t0, t0, 1
  lw t0, palCopy(t0)
  sw t0, 4(fp) ; empty
  ; engine/look.e16.ts:522  const m = mode === M_INTRO && step >= 6 ? M_NORMAL : mode
  li t0, 1
  bne s3, t0, .L1
  li t0, 6
  lw t1, 0(fp) ; step
  bltu t1, t0, .L1
  li t0, 0
  j .L2
.L1:
  mv t0, s3
.L2:
  sw t0, 6(fp) ; m
  ; engine/look.e16.ts:523  let k: u16 = 1
  li s1, 1 ; k
  ; engine/look.e16.ts:524  while (k < 16) {
  j .L5
.L3:
  ; engine/look.e16.ts:525  colour(sl, k, colourOf(base, k, (m << 8) | step, empty))
  lw t0, 6(fp) ; m
  slli t0, t0, 8
  lw t1, 0(fp) ; step
  or t0, t0, t1
  lw a0, 2(fp)
  mv a1, s1
  mv a2, t0
  lw a3, 4(fp)
  call colourOf
  mv a1, s1
  mv a2, a0
  mv a0, s2
  call colour
  ; engine/look.e16.ts:526  k++
  addi s1, s1, 1
.L5:
  li t0, 16
  bltu s1, t0, .L3
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s1, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; engine/look.e16.ts:530 isFill(k) at -O1
;   k in a0
isFill:
  ; engine/look.e16.ts:531  return k >= 3 && k <= 13
  li t0, 3
  sltu t0, a0, t0
  xori t0, t0, 1
  mv t1, t0
  beqz t1, .L1
  li t0, 13
  sltu t0, t0, a0
  xori t0, t0, 1
.L1:
  mv a0, t0
.return:
  ret

; engine/look.e16.ts:535 colourOf(base, k, key, empty) at -O1
;   base in 0(fp)
;   k in s1
;   key in 6(fp)
;   empty in 2(fp)
;   c in s2
;   mode in s3
;   step in 4(fp)
colourOf:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 0(fp) ; base
  mv s1, a1 ; k
  sw a2, 6(fp) ; key
  sw a3, 2(fp) ; empty
  ; engine/look.e16.ts:536  const c = palCopy[base + k]
  lw t0, 0(fp) ; base
  add t0, t0, s1
  slli t0, t0, 1
  lw s2, palCopy(t0)
  ; engine/look.e16.ts:537  const mode = key >> 8
  lw t0, 6(fp) ; key
  srli s3, t0, 8
  ; engine/look.e16.ts:538  const step = key & 255
  lw t0, 6(fp) ; key
  andi t0, t0, 255
  sw t0, 4(fp) ; step
  ; engine/look.e16.ts:539  if (mode === M_INTRO) return introColour(base, k, step, empty)
  li t0, 1
  bne s3, t0, .L1
  ; engine/look.e16.ts:539  return introColour(base, k, step, empty)
  lw a0, 0(fp)
  mv a1, s1
  lw a2, 4(fp)
  lw a3, 2(fp)
  call introColour
  j .return
.L1:
  ; engine/look.e16.ts:540  if (mode === M_KO) return isFill(k) ? mix(c, empty, step) : c
  li t0, 6
  bne s3, t0, .L2
  ; engine/look.e16.ts:540  return isFill(k) ? mix(c, empty, step) : c
  mv a0, s1
  call isFill
  beqz a0, .L3
  mv a0, s2
  lw a1, 2(fp)
  lw a2, 4(fp)
  call mix
  mv t0, a0
  j .L4
.L3:
  mv t0, s2
.L4:
  mv a0, t0
  j .return
.L2:
  ; engine/look.e16.ts:541  if (mode === M_PIECES) return mix(isFill(k) ? empty : c, 0, step)
  li t0, 7
  bne s3, t0, .L5
  ; engine/look.e16.ts:541  return mix(isFill(k) ? empty : c, 0, step)
  mv a0, s1
  call isFill
  beqz a0, .L6
  lw t0, 2(fp)
  j .L7
.L6:
  mv t0, s2
.L7:
  mv a0, t0
  li a1, 0
  lw a2, 4(fp)
  call mix
  j .return
.L5:
  ; engine/look.e16.ts:542  if (mode === M_FLASH) return flashColour(c, k)
  li t0, 2
  bne s3, t0, .L8
  ; engine/look.e16.ts:542  return flashColour(c, k)
  mv a0, s2
  mv a1, s1
  call flashColour
  j .return
.L8:
  ; engine/look.e16.ts:543  if (k > 2) return c
  li t0, 2
  bgeu t0, s1, .L9
  ; engine/look.e16.ts:543  return c
  mv a0, s2
  j .return
.L9:
  ; engine/look.e16.ts:544  return wireColour(base, k, mode)
  lw a0, 0(fp)
  mv a1, s1
  mv a2, s3
  call wireColour
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; engine/look.e16.ts:548 flashColour(c, k) at -O1
;   c in s1
;   k in s2
flashColour:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; c
  mv s2, a1 ; k
  ; engine/look.e16.ts:549  if (k <= 2) return WHITE
  li t0, 2
  bltu t0, s2, .L1
  ; engine/look.e16.ts:549  return WHITE
  li a0, 32767
  j .return
.L1:
  ; engine/look.e16.ts:550  return k <= 11 ? mix(c, WHITE, 6) : c
  li t0, 11
  bltu t0, s2, .L2
  mv a0, s1
  li a1, 32767
  li a2, 6
  call mix
  mv t0, a0
  j .L3
.L2:
  mv t0, s1
.L3:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/look.e16.ts:554 wireColour(base, k, mode) at -O1
;   base in a0
;   k in a1
;   mode in a2
;   one in a3
wireColour:
  ; engine/look.e16.ts:555  const one = k === 1
  li t0, 1
  sub t0, a1, t0
  seqz a3, t0
  ; engine/look.e16.ts:556  if (mode === M_GUARD) return one ? GUARD_1 : GUARD_2
  li t0, 3
  bne a2, t0, .L1
  ; engine/look.e16.ts:556  return one ? GUARD_1 : GUARD_2
  beqz a3, .L2
  li t0, 32696
  j .L3
.L2:
  li t0, 26287
.L3:
  mv a0, t0
  ret
.L1:
  ; engine/look.e16.ts:557  if (mode === M_THROWN) return one ? THROWN_1 : THROWN_2
  li t0, 4
  bne a2, t0, .L4
  ; engine/look.e16.ts:557  return one ? THROWN_1 : THROWN_2
  beqz a3, .L5
  li t0, 30111
  j .L6
.L5:
  li t0, 18643
.L6:
  mv a0, t0
  ret
.L4:
  ; engine/look.e16.ts:558  if (mode === M_LOW && one) return palCopy[base + 2]
  li t0, 5
  bne a2, t0, .L7
  beqz a3, .L7
  ; engine/look.e16.ts:558  return palCopy[base + 2]
  addi t0, a0, 2
  slli t0, t0, 1
  lw a0, palCopy(t0)
  ret
.L7:
  ; engine/look.e16.ts:559  return palCopy[base + k]
  add t0, a0, a1
  slli t0, t0, 1
  lw a0, palCopy(t0)
.return:
  ret

; engine/look.e16.ts:562 introColour(base, k, step, empty) at -O1
;   base in s3
;   k in s1
;   step in s2
;   empty in 0(fp)
;   c in 2(fp)
introColour:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; base
  mv s1, a1 ; k
  mv s2, a2 ; step
  sw a3, 0(fp) ; empty
  ; engine/look.e16.ts:563  const c = palCopy[base + k]
  add t0, s3, s1
  slli t0, t0, 1
  lw t0, palCopy(t0)
  sw t0, 2(fp) ; c
  ; engine/look.e16.ts:564  if (k === 1 && step === 0) return palCopy[base + 2]
  li t0, 1
  bne s1, t0, .L1
  bne s2, zero, .L1
  ; engine/look.e16.ts:564  return palCopy[base + 2]
  addi t0, s3, 2
  slli t0, t0, 1
  lw a0, palCopy(t0)
  j .return
.L1:
  ; engine/look.e16.ts:565  if (!isFill(k)) return c
  mv a0, s1
  call isFill
  bnez a0, .L2
  ; engine/look.e16.ts:565  return c
  lw a0, 2(fp)
  j .return
.L2:
  ; engine/look.e16.ts:566  if (step < 2) return empty
  li t0, 2
  bgeu s2, t0, .L3
  ; engine/look.e16.ts:566  return empty
  lw a0, 0(fp)
  j .return
.L3:
  ; engine/look.e16.ts:567  return mix(empty, c, (step - 1) * 4)
  addi t0, s2, -1
  slli t0, t0, 2
  lw a0, 0(fp)
  lw a1, 2(fp)
  mv a2, t0
  call mix
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; engine/look.e16.ts:584 soundStep() at -O1
soundStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/look.e16.ts:585  if (phase !== soundPhase) {
  lw t0, 0x0c98(zero)
  lw t1, 0x1e62(zero)
  beq t0, t1, .L1
  ; engine/look.e16.ts:586  soundPhase = phase
  lw t0, 0x0c98(zero)
  sw t0, 0x1e62(zero)
  ; engine/look.e16.ts:587  if (phase === PH_ROUND) sfx(X_ROUND)
  lw t0, 0x0c98(zero)
  bne t0, zero, .L2
  ; engine/look.e16.ts:587  sfx(X_ROUND)
  li a0, 9
  call sfx
  j .L3
.L2:
  ; engine/look.e16.ts:588  if (phase === PH_FIGHT) sfx(X_FIGHT)
  lw t0, 0x0c98(zero)
  li t1, 1
  bne t0, t1, .L4
  ; engine/look.e16.ts:588  sfx(X_FIGHT)
  li a0, 10
  call sfx
  j .L5
.L4:
  ; engine/look.e16.ts:589  if (phase === PH_OVER) sfx(fLife[0] === 0 || fLife[1] === 0 ? X_KO : X_ROUND)
  lw t0, 0x0c98(zero)
  li t1, 2
  bne t0, t1, .L6
  ; engine/look.e16.ts:589  sfx(fLife[0] === 0 || fLife[1] === 0 ? X_KO : X_ROUND)
  lw t0, fLife(zero)
  beq t0, zero, .L9
  lw t0, fLife+2(zero)
  bne t0, zero, .L7
.L9:
  li t0, 12
  j .L8
.L7:
  li t0, 9
.L8:
  mv a0, t0
  call sfx
.L6:
.L5:
.L3:
.L1:
  ; engine/look.e16.ts:591  if (phase === PH_ROUND && phaseT === MAT_AT) sfx(X_MAT)
  lw t0, 0x0c98(zero)
  bne t0, zero, .L10
  lw t0, 0x0c9a(zero)
  li t1, 18
  bne t0, t1, .L10
  ; engine/look.e16.ts:591  sfx(X_MAT)
  li a0, 13
  call sfx
.L10:
  ; engine/look.e16.ts:592  if (phase === PH_FIGHT && timeLeft !== soundTime && timeLeft <= 10 && timeLeft > 0) sfx(X_TIME)
  lw t0, 0x0c98(zero)
  li t1, 1
  bne t0, t1, .L11
  lw t0, 0x0c9c(zero)
  lw t1, 0x1e64(zero)
  beq t0, t1, .L11
  lw t0, 0x0c9c(zero)
  li t1, 10
  bltu t1, t0, .L11
  lw t0, 0x0c9c(zero)
  bgeu zero, t0, .L11
  ; engine/look.e16.ts:592  sfx(X_TIME)
  li a0, 11
  call sfx
.L11:
  ; engine/look.e16.ts:593  soundTime = timeLeft
  lw t0, 0x0c9c(zero)
  sw t0, 0x1e64(zero)
  ; engine/look.e16.ts:594  fighterSounds(0)
  li a0, 0
  call fighterSounds
  ; engine/look.e16.ts:595  fighterSounds(1)
  li a0, 1
  call fighterSounds
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/look.e16.ts:598 fighterSounds(a) at -O1
;   a in s1
;   s in s2
fighterSounds:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; a
  ; engine/look.e16.ts:599  const s = struck[a]
  slli t0, s1, 1
  lw s2, struck(t0)
  ; engine/look.e16.ts:600  if (s === 1 || s === 3) sfx((mvAt(a, fMove[a], M_KIND) & K_HEAVY) !== 0 ? X_HEAVY : X_LIGHT)
  li t0, 1
  beq s2, t0, .L2
  li t0, 3
  bne s2, t0, .L1
.L2:
  ; engine/look.e16.ts:600  sfx((mvAt(a, fMove[a], M_KIND) & K_HEAVY) !== 0 ? X_HEAVY : X_LIGHT)
  slli t0, s1, 1
  lw t0, fMove(t0)
  mv a0, s1
  mv a1, t0
  li a2, 11
  call mvAt
  andi t0, a0, 2
  beq t0, zero, .L3
  li t0, 1
  j .L4
.L3:
  li t0, 0
.L4:
  mv a0, t0
  call sfx
  j .L5
.L1:
  ; engine/look.e16.ts:601  if (s === 2) sfx(X_GUARD)
  li t0, 2
  bne s2, t0, .L6
  ; engine/look.e16.ts:601  sfx(X_GUARD)
  li a0, 2
  call sfx
  j .L7
.L6:
  ; engine/look.e16.ts:602  if (s === 4) sfx(X_DOWN)
  li t0, 4
  bne s2, t0, .L8
  ; engine/look.e16.ts:602  sfx(X_DOWN)
  li a0, 7
  call sfx
.L8:
.L7:
.L5:
  ; engine/look.e16.ts:603  if (threw[a] !== 0) sfx(X_THROW)
  slli t0, s1, 1
  lw t0, threw(t0)
  beq t0, zero, .L9
  ; engine/look.e16.ts:603  sfx(X_THROW)
  li a0, 5
  call sfx
.L9:
  ; engine/look.e16.ts:604  stateSounds(a, s)
  mv a0, s1
  mv a1, s2
  call stateSounds
  ; engine/look.e16.ts:605  swingSound(a)
  mv a0, s1
  call swingSound
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; engine/look.e16.ts:609 stateSounds(a, s) at -O1
;   a in s2
;   s in s3
;   st in s1
stateSounds:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; a
  mv s3, a1 ; s
  ; engine/look.e16.ts:610  const st = fState[a]
  slli t0, s2, 1
  lw s1, fState(t0)
  ; engine/look.e16.ts:611  if (st !== soundSt[a]) {
  slli t0, s2, 1
  lw t0, soundSt(t0)
  beq s1, t0, .L1
  ; engine/look.e16.ts:612  soundSt[a] = st
  slli t0, s2, 1
  sw s1, soundSt(t0)
  ; engine/look.e16.ts:613  if (st === ST_DASH || st === ST_BACKDASH) sfx(X_DASH)
  li t0, 13
  beq s1, t0, .L3
  li t0, 14
  bne s1, t0, .L2
.L3:
  ; engine/look.e16.ts:613  sfx(X_DASH)
  li a0, 4
  call sfx
  j .L4
.L2:
  ; engine/look.e16.ts:614  if (st === ST_LAND) sfx(X_LAND)
  li t0, 4
  bne s1, t0, .L5
  ; engine/look.e16.ts:614  sfx(X_LAND)
  li a0, 6
  call sfx
  j .L6
.L5:
  ; engine/look.e16.ts:615  if (st === ST_DOWN && s !== 4) sfx(X_DOWN)
  li t0, 8
  bne s1, t0, .L7
  li t0, 4
  beq s3, t0, .L7
  ; engine/look.e16.ts:615  sfx(X_DOWN)
  li a0, 7
  call sfx
.L7:
.L6:
.L4:
.L1:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; engine/look.e16.ts:620 swingSound(a) at -O1
;   a in s1
;   st in s3
;   f in s2
swingSound:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; a
  ; engine/look.e16.ts:621  const st = fState[a]
  slli t0, s1, 1
  lw s3, fState(t0)
  ; engine/look.e16.ts:622  const f = fMoveF[a]
  slli t0, s1, 1
  lw s2, fMoveF(t0)
  ; engine/look.e16.ts:623  if (st === ST_ATTACK && f !== soundF[a] && fMove[a] !== MV_THROW) {
  li t0, 5
  bne s3, t0, .L1
  slli t0, s1, 1
  lw t0, soundF(t0)
  beq s2, t0, .L1
  slli t0, s1, 1
  lw t0, fMove(t0)
  li t1, 12
  beq t0, t1, .L1
  ; engine/look.e16.ts:624  if (f === mvAt(a, fMove[a], M_STARTUP)) sfx(X_WHIFF)
  slli t0, s1, 1
  lw t0, fMove(t0)
  mv a0, s1
  mv a1, t0
  li a2, 0
  call mvAt
  bne s2, a0, .L2
  ; engine/look.e16.ts:624  sfx(X_WHIFF)
  li a0, 3
  call sfx
.L2:
.L1:
  ; engine/look.e16.ts:626  soundF[a] = st === ST_ATTACK ? f : 0
  slli t0, s1, 1
  addi t0, t0, soundF
  mv t1, s3
  li t2, 5
  bne t1, t2, .L3
  mv t1, s2
  j .L4
.L3:
  li t1, 0
.L4:
  sw t1, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; engine/audio.e16.ts:87 fxIs(k, b, at) at -O1
;   k in a0
;   b in a1
;   at in a2
fxIs:
  ; engine/audio.e16.ts:88  fxSong[k * 2] = b
  slli t0, a0, 1
  slli t0, t0, 1
  sw a1, fxSong(t0)
  ; engine/audio.e16.ts:89  fxSong[k * 2 + 1] = at
  slli t0, a0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  sw a2, fxSong(t0)
.return:
  ret

; engine/audio.e16.ts:92 songIs(m, b, at) at -O1
;   m in a0
;   b in a1
;   at in a2
songIs:
  ; engine/audio.e16.ts:93  songs[m * 2] = b
  slli t0, a0, 1
  slli t0, t0, 1
  sw a1, songs(t0)
  ; engine/audio.e16.ts:94  songs[m * 2 + 1] = at
  slli t0, a0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  sw a2, songs(t0)
.return:
  ret

; engine/audio.e16.ts:98 audioIn() at -O1
audioIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; engine/audio.e16.ts:99  fxIs(X_LIGHT, SONG_X_LIGHT_BANK, SONG_X_LIGHT_AT)
  li a0, 0
  li a1, 357
  li a2, 50318
  call fxIs
  ; engine/audio.e16.ts:100  fxIs(X_HEAVY, SONG_X_HEAVY_BANK, SONG_X_HEAVY_AT)
  li a0, 1
  li a1, 357
  li a2, 50356
  call fxIs
  ; engine/audio.e16.ts:101  fxIs(X_GUARD, SONG_X_GUARD_BANK, SONG_X_GUARD_AT)
  li a0, 2
  li a1, 357
  li a2, 50402
  call fxIs
  ; engine/audio.e16.ts:102  fxIs(X_WHIFF, SONG_X_WHIFF_BANK, SONG_X_WHIFF_AT)
  li a0, 3
  li a1, 357
  li a2, 50434
  call fxIs
  ; engine/audio.e16.ts:103  fxIs(X_DASH, SONG_X_DASH_BANK, SONG_X_DASH_AT)
  li a0, 4
  li a1, 357
  li a2, 50464
  call fxIs
  ; engine/audio.e16.ts:104  fxIs(X_THROW, SONG_X_THROW_BANK, SONG_X_THROW_AT)
  li a0, 5
  li a1, 357
  li a2, 50490
  call fxIs
  ; engine/audio.e16.ts:105  fxIs(X_LAND, SONG_X_LAND_BANK, SONG_X_LAND_AT)
  li a0, 6
  li a1, 357
  li a2, 50530
  call fxIs
  ; engine/audio.e16.ts:106  fxIs(X_DOWN, SONG_X_DOWN_BANK, SONG_X_DOWN_AT)
  li a0, 7
  li a1, 357
  li a2, 50556
  call fxIs
  ; engine/audio.e16.ts:107  fxIs(X_SHARDS, SONG_X_SHARDS_BANK, SONG_X_SHARDS_AT)
  li a0, 8
  li a1, 357
  li a2, 50600
  call fxIs
  ; engine/audio.e16.ts:108  fxIs(X_ROUND, SONG_X_ROUND_BANK, SONG_X_ROUND_AT)
  li a0, 9
  li a1, 357
  li a2, 50660
  call fxIs
  ; engine/audio.e16.ts:109  fxIs(X_FIGHT, SONG_X_FIGHT_BANK, SONG_X_FIGHT_AT)
  li a0, 10
  li a1, 357
  li a2, 50692
  call fxIs
  ; engine/audio.e16.ts:110  fxIs(X_TIME, SONG_X_TIME_BANK, SONG_X_TIME_AT)
  li a0, 11
  li a1, 357
  li a2, 50736
  call fxIs
  ; engine/audio.e16.ts:111  fxIs(X_KO, SONG_X_KO_BANK, SONG_X_KO_AT)
  li a0, 12
  li a1, 357
  li a2, 50764
  call fxIs
  ; engine/audio.e16.ts:112  fxIs(X_MAT, SONG_X_MAT_BANK, SONG_X_MAT_AT)
  li a0, 13
  li a1, 357
  li a2, 50830
  call fxIs
  ; engine/audio.e16.ts:113  fxIs(X_MOVE, SONG_X_MOVE_BANK, SONG_X_MOVE_AT)
  li a0, 14
  li a1, 357
  li a2, 50898
  call fxIs
  ; engine/audio.e16.ts:114  fxIs(X_OK, SONG_X_OK_BANK, SONG_X_OK_AT)
  li a0, 15
  li a1, 357
  li a2, 50926
  call fxIs
  ; engine/audio.e16.ts:115  songIs(M_TITLE, SONG_TITLE_BANK, SONG_TITLE_AT)
  li a0, 1
  li a1, 356
  li a2, 53760
  call songIs
  ; engine/audio.e16.ts:116  songIs(M_SELECT, SONG_SELECT_BANK, SONG_SELECT_AT)
  li a0, 2
  li a1, 356
  li a2, 54970
  call songIs
  ; engine/audio.e16.ts:117  songIs(M_FIGHT, SONG_FIGHT_BANK, SONG_FIGHT_AT)
  li a0, 3
  li a1, 356
  li a2, 55644
  call songIs
  ; engine/audio.e16.ts:118  songIs(M_WIN, SONG_WIN_BANK, SONG_WIN_AT)
  li a0, 4
  li a1, 356
  li a2, 57006
  call songIs
  ; engine/audio.e16.ts:119  songIs(M_LOSE, SONG_LOSE_BANK, SONG_LOSE_AT)
  li a0, 5
  li a1, 356
  li a2, 57176
  call songIs
  ; engine/audio.e16.ts:120  songIs(M_CLEAR, SONG_CLEAR_BANK, SONG_CLEAR_AT)
  li a0, 6
  li a1, 357
  li a2, 49152
  call songIs
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; engine/audio.e16.ts:124 sfx(k) at -O1
;   k in s1
sfx:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; engine/audio.e16.ts:125  sfxHeard[0] = sfxHeard[0] | (1 << k)
  lw t0, sfxHeard(zero)
  li t1, 1
  sll t1, t1, s1
  or t0, t0, t1
  sw t0, sfxHeard(zero)
  ; engine/audio.e16.ts:126  play(fxSong[k * 2], fxSong[k * 2 + 1], false)
  slli t0, s1, 1
  slli t0, t0, 1
  lw t0, fxSong(t0)
  slli t1, s1, 1
  addi t1, t1, 1
  slli t1, t1, 1
  lw t1, fxSong(t1)
  mv a0, t0
  mv a1, t1
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; engine/audio.e16.ts:130 music(m) at -O1
;   m in s1
music:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; m
  ; engine/audio.e16.ts:131  if (m === songNow) return
  lw t0, 0x1ecc(zero)
  bne s1, t0, .L1
  ; engine/audio.e16.ts:131  return
  j .return
.L1:
  ; engine/audio.e16.ts:132  songNow = m
  sw s1, 0x1ecc(zero)
  ; engine/audio.e16.ts:133  if (m === 0 || m > M_CLEAR) {
  beq s1, zero, .L3
  li t0, 6
  bgeu t0, s1, .L2
.L3:
  ; engine/audio.e16.ts:134  musicStop()
  call musicStop
  ; engine/audio.e16.ts:135  return
  j .return
.L2:
  ; engine/audio.e16.ts:137  play(songs[m * 2], songs[m * 2 + 1], true)
  slli t0, s1, 1
  slli t0, t0, 1
  lw t0, songs(t0)
  slli t1, s1, 1
  addi t1, t1, 1
  slli t1, t1, 1
  lw t1, songs(t1)
  mv a0, t0
  mv a1, t1
  li a2, 1
  call play
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

  .align 2

  .bank 5
  .org 0xc000
; scenes/title.e16.ts:98 bootLog() at -O1
;   t in s1
;   k in s2
bootLog:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; scenes/title.e16.ts:99  screenIs(SC_BOOT)
  li a0, 1
  call screenIs
  ; scenes/title.e16.ts:100  screenClear()
  call screenClear
  ; scenes/title.e16.ts:101  say(2, 3, str('ELEC-16 PLAY  ELECFIGHTER'), SL_P1)
  li a0, 2
  li a1, 3
  la a2, str_47
  li a3, 1
  call say
  ; scenes/title.e16.ts:102  say(2, 4, str('INDUSTRIAL COMBAT SIMULATOR'), SL_DIM)
  li a0, 2
  li a1, 4
  la a2, str_48
  li a3, 3
  call say
  ; scenes/title.e16.ts:103  let t: u16 = 0
  li s1, 0 ; t
  ; scenes/title.e16.ts:104  while (t < 7 * LINE_F + 40) {
  j .L3
.L1:
  ; scenes/title.e16.ts:105  frameBegin()
  call frameBegin
  ; scenes/title.e16.ts:106  if (pressed(B_START) || pressed(B_A)) return
  li a0, 1024
  call pressed
  bnez a0, .L6
  li a0, 16
  call pressed
  beqz a0, .L5
.L6:
  ; scenes/title.e16.ts:106  return
  j .return
.L5:
  ; scenes/title.e16.ts:107  const k = div(t, LINE_F)
  li t0, 9
  divu s2, s1, t0
  ; scenes/title.e16.ts:108  if (t === k * LINE_F && k < 7) bootLine(k)
  slli t1, s2, 3
  add t0, t1, s2
  bne s1, t0, .L7
  li t0, 7
  bgeu s2, t0, .L7
  ; scenes/title.e16.ts:108  bootLine(k)
  mv a0, s2
  call bootLine
.L7:
  ; scenes/title.e16.ts:109  t++
  addi s1, s1, 1
.L3:
  li t0, 103
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes/title.e16.ts:113 bootLine(k) at -O1
;   k in s1
;   y in s2
bootLine:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; scenes/title.e16.ts:114  const y = 7 + k
  addi s2, s1, 7
  ; scenes/title.e16.ts:115  if (k === 0) say(2, y, str('> LOADING FIGHTER DATA ........ OK'), SL_P1)
  bne s1, zero, .L1
  ; scenes/title.e16.ts:115  say(2, y, str('> LOADING FIGHTER DATA ........ OK'), SL_P1)
  li a0, 2
  mv a1, s2
  la a2, str_49
  li a3, 1
  call say
  j .L2
.L1:
  ; scenes/title.e16.ts:116  if (k === 1) bootCount(y, str('> MESH CELLS,   SLOTS ......... OK'), 16, SLOTS)
  li t0, 1
  bne s1, t0, .L3
  ; scenes/title.e16.ts:116  bootCount(y, str('> MESH CELLS,   SLOTS ......... OK'), 16, SLOTS)
  mv a0, s2
  la a1, str_50
  li a2, 16
  li a3, 4
  call bootCount
  j .L4
.L3:
  ; scenes/title.e16.ts:117  if (k === 2) bootCount(y, str('> OPPONENT PROGRAMS,   ........ OK'), 22, OPPONENTS)
  li t0, 2
  bne s1, t0, .L5
  ; scenes/title.e16.ts:117  bootCount(y, str('> OPPONENT PROGRAMS,   ........ OK'), 22, OPPONENTS)
  mv a0, s2
  la a1, str_51
  li a2, 22
  li a3, 5
  call bootCount
  j .L6
.L5:
  ; scenes/title.e16.ts:118  if (k === 3) say(2, y, str('> STAGE GRID .................. OK'), SL_P1)
  li t0, 3
  bne s1, t0, .L7
  ; scenes/title.e16.ts:118  say(2, y, str('> STAGE GRID .................. OK'), SL_P1)
  li a0, 2
  mv a1, s2
  la a2, str_52
  li a3, 1
  call say
  j .L8
.L7:
  ; scenes/title.e16.ts:119  if (k === 4) say(2, y, str('> SOUND ....................... OK'), SL_P1)
  li t0, 4
  bne s1, t0, .L9
  ; scenes/title.e16.ts:119  say(2, y, str('> SOUND ....................... OK'), SL_P1)
  li a0, 2
  mv a1, s2
  la a2, str_53
  li a3, 1
  call say
  j .L10
.L9:
  ; scenes/title.e16.ts:120  if (k === 5) say(2, y, str('> RECORDS ..................... OK'), SL_P1)
  li t0, 5
  bne s1, t0, .L11
  ; scenes/title.e16.ts:120  say(2, y, str('> RECORDS ..................... OK'), SL_P1)
  li a0, 2
  mv a1, s2
  la a2, str_54
  li a3, 1
  call say
  j .L12
.L11:
  ; scenes/title.e16.ts:121  say(2, y + 1, str('> SIMULATOR READY'), SL_P1)
  li a0, 2
  addi a1, s2, 1
  la a2, str_55
  li a3, 1
  call say
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

; scenes/title.e16.ts:125 bootCount(y, s, x, n) at -O1
;   y in s1
;   s in s2
;   x in s3
;   n in s0
bootCount:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; y
  mv s2, a1 ; s
  mv s3, a2 ; x
  mv s0, a3 ; n
  ; scenes/title.e16.ts:126  say(2, y, s, SL_P1)
  li a0, 2
  mv a1, s1
  mv a2, s2
  li a3, 1
  call say
  ; scenes/title.e16.ts:127  number(cellAt(1, x, y), n, 1, (FONT_TILE + 16) | (SL_P1 << 10) | FRONT)
  li a0, 1
  mv a1, s3
  mv a2, s1
  call cellAt
  mv a1, s0
  li a2, 1
  li a3, 33808
  call number
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; scenes/title.e16.ts:133 titleRun() at -O1
;   pick in s1
titleRun:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; scenes/title.e16.ts:134  for (;;) {
.L1:
  ; scenes/title.e16.ts:135  const pick = titleOnce()
  call titleOnce
  mv s1, a0 ; pick
  ; scenes/title.e16.ts:136  if (pick === 0) {
  bne s1, zero, .L5
  ; scenes/title.e16.ts:137  if (!controlsSeen()) {
  la t0, controlsSeen
  li t1, 263
  call far_call
  bnez a0, .L6
  ; scenes/title.e16.ts:138  controlsRun(false)
  li a0, 0
  call controlsRun
  ; scenes/title.e16.ts:139  controlsSeenSet()
  la t0, controlsSeenSet
  li t1, 263
  call far_call
.L6:
  ; scenes/title.e16.ts:141  return
  j .return
.L5:
  ; scenes/title.e16.ts:143  if (pick === 1) controlsRun(false)
  li t0, 1
  bne s1, t0, .L7
  ; scenes/title.e16.ts:143  controlsRun(false)
  li a0, 0
  call controlsRun
  j .L1
.L7:
  ; scenes/title.e16.ts:144  bestRun()
  la t0, bestRun
  li t1, 263
  call far_call
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/title.e16.ts:149 titleOnce() at -O1
;   t in s1
;   ft in s3
;   page in 0(fp)
;   pick in 2(fp)
;   p in s2
titleOnce:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; scenes/title.e16.ts:150  titleDraw()
  call titleDraw
  ; scenes/title.e16.ts:151  let t: u16 = 0
  li s1, 0 ; t
  ; scenes/title.e16.ts:152  let ft: u16 = 0
  li s3, 0 ; ft
  ; scenes/title.e16.ts:153  let page: u16 = 0
  sw zero, 0(fp) ; page
  ; scenes/title.e16.ts:154  menuOn = false
  sw zero, 0x1fee(zero)
  ; scenes/title.e16.ts:155  for (;;) {
.L1:
  ; scenes/title.e16.ts:156  frameBegin()
  call frameBegin
  ; scenes/title.e16.ts:157  if (pressed(B_SELECT)) {
  li a0, 2048
  call pressed
  beqz a0, .L5
  ; scenes/title.e16.ts:158  typeSwitch()
  call typeSwitch
  ; scenes/title.e16.ts:159  t = 0
  li s1, 0 ; t
.L5:
  ; scenes/title.e16.ts:161  const pick = menuKeys()
  call menuKeys
  sw a0, 2(fp) ; pick
  ; scenes/title.e16.ts:162  if (pick !== NO_PICK) return pick
  li t0, 65535
  lw t1, 2(fp) ; pick
  beq t1, t0, .L6
  ; scenes/title.e16.ts:162  return pick
  lw a0, 2(fp)
  j .return
.L6:
  ; scenes/title.e16.ts:163  if (menuOn) t = 0
  lw t0, 0x1fee(zero)
  beqz t0, .L7
  ; scenes/title.e16.ts:163  t = 0
  li s1, 0 ; t
.L7:
  ; scenes/title.e16.ts:164  const p = div(t, PAGE) & 3
  li t0, 360
  divu t0, s1, t0
  andi s2, t0, 3
  ; scenes/title.e16.ts:165  if (p !== page) {
  lw t0, 0(fp) ; page
  beq s2, t0, .L8
  ; scenes/title.e16.ts:166  page = p
  sw s2, 0(fp) ; page
  ; scenes/title.e16.ts:167  pageShow(p)
  mv a0, s2
  call pageShow
  ; scenes/title.e16.ts:168  if (menuOn) menuShow(menuAt)
  lw t0, 0x1fee(zero)
  beqz t0, .L9
  ; scenes/title.e16.ts:168  menuShow(menuAt)
  lw a0, 0x1ff0(zero)
  call menuShow
.L9:
.L8:
  ; scenes/title.e16.ts:170  figuresStep(ft, p === 0 || p === 2, menuOn)
  sub t0, s2, zero
  seqz t0, t0
  mv t2, t0
  mv t1, t0
  mv t0, s3
  bnez t2, .L10
  li t1, 2
  sub t1, s2, t1
  seqz t1, t1
.L10:
  lw t2, 0x1fee(zero)
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call figuresStep
  ; scenes/title.e16.ts:171  t++
  addi s1, s1, 1
  ; scenes/title.e16.ts:172  ft++
  addi s3, s3, 1
  j .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; scenes/title.e16.ts:182 menuKeys() at -O1
;   go in s1
menuKeys:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; scenes/title.e16.ts:183  const go = pressed(B_START) || pressed(B_A)
  li a0, 1024
  call pressed
  mv t1, a0
  mv t0, a0
  bnez t1, .L1
  li a0, 16
  call pressed
  mv t0, a0
.L1:
  mv s1, t0 ; go
  ; scenes/title.e16.ts:184  if (!menuOn) {
  lw t0, 0x1fee(zero)
  bnez t0, .L2
  ; scenes/title.e16.ts:185  if (!go) return NO_PICK
  bnez s1, .L3
  ; scenes/title.e16.ts:185  return NO_PICK
  li a0, 65535
  j .return
.L3:
  ; scenes/title.e16.ts:186  menuOn = true
  li t0, 1
  sw t0, 0x1fee(zero)
  ; scenes/title.e16.ts:187  menuAt = 0
  sw zero, 0x1ff0(zero)
  ; scenes/title.e16.ts:188  sfx(X_OK)
  li a0, 15
  la t0, sfx
  li t1, 260
  call far_call
  ; scenes/title.e16.ts:189  menuShow(0)
  li a0, 0
  call menuShow
  ; scenes/title.e16.ts:190  return NO_PICK
  li a0, 65535
  j .return
.L2:
  ; scenes/title.e16.ts:192  if (pressed(B_B)) {
  li a0, 32
  call pressed
  beqz a0, .L4
  ; scenes/title.e16.ts:193  menuOn = false
  sw zero, 0x1fee(zero)
  ; scenes/title.e16.ts:194  hudRows(TITLE_ROW, 3)
  li a0, 13
  li a1, 3
  call hudRows
  ; scenes/title.e16.ts:195  return NO_PICK
  li a0, 65535
  j .return
.L4:
  ; scenes/title.e16.ts:197  if (go) {
  beqz s1, .L5
  ; scenes/title.e16.ts:198  sfx(X_OK)
  li a0, 15
  la t0, sfx
  li t1, 260
  call far_call
  ; scenes/title.e16.ts:199  return menuAt
  lw a0, 0x1ff0(zero)
  j .return
.L5:
  ; scenes/title.e16.ts:201  menuAt = titleMenuMove(menuAt)
  lw a0, 0x1ff0(zero)
  call titleMenuMove
  sw a0, 0x1ff0(zero)
  ; scenes/title.e16.ts:202  return NO_PICK
  li a0, 65535
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/title.e16.ts:206 typeSwitch() at -O1
typeSwitch:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/title.e16.ts:207  buttonSetIs(1 - buttonSet)
  lw t0, 0x181c(zero)
  li t1, 1
  sub a0, t1, t0
  call buttonSetIs
  ; scenes/title.e16.ts:208  saveKeep()
  la t0, saveKeep
  li t1, 263
  call far_call
  ; scenes/title.e16.ts:209  typeShow()
  call typeShow
  ; scenes/title.e16.ts:210  sfx(X_MOVE)
  li a0, 14
  la t0, sfx
  li t1, 260
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/title.e16.ts:214 titleDraw() at -O1
;   y in s2
;   tile in s3
;   s in s1
titleDraw:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; scenes/title.e16.ts:215  screenIs(SC_TITLE)
  li a0, 2
  call screenIs
  ; scenes/title.e16.ts:216  screenClear()
  call screenClear
  ; scenes/title.e16.ts:217  music(M_TITLE)
  li a0, 1
  la t0, music
  li t1, 260
  call far_call
  ; scenes/title.e16.ts:218  palette(PAL_STAGE, 0)
  li a0, 0
  li a1, 0
  call palette
  ; scenes/title.e16.ts:219  palKeep(PAL_STAGE, 0)
  li a0, 0
  li a1, 0
  call palKeep
  ; scenes/title.e16.ts:220  load(TITLE_TILES_BANK, TITLE_TILES_AT, TITLE_TILE * 32, TITLE_TILES_BYTES)
  li a0, 355
  li a1, 49152
  li a2, 24672
  li a3, 5536
  call load
  ; scenes/title.e16.ts:221  let y: u16 = 0
  li s2, 0 ; y
  ; scenes/title.e16.ts:222  while (y < TITLE_H) {
  j .L3
.L1:
  ; scenes/title.e16.ts:223  mapRow(TITLE_MAP_BANK, 0xc000 + y * 128, 0, y)
  slli t0, s2, 7
  li t1, 49152
  add t1, t1, t0
  li a0, 356
  mv a1, t1
  li a2, 0
  mv a3, s2
  call mapRow
  ; scenes/title.e16.ts:224  y++
  addi s2, s2, 1
.L3:
  li t0, 36
  bltu s2, t0, .L1
  ; scenes/title.e16.ts:226  let tile = S1_TILE
  li s3, 257 ; tile
  ; scenes/title.e16.ts:227  let s: u16 = 0
  li s1, 0 ; s
  ; scenes/title.e16.ts:228  while (s < 4) {
  j .L7
.L5:
  ; scenes/title.e16.ts:229  artPut(s, 0, addr(fig) + s * 68, tile)
  slli t1, s1, 6
  slli t0, s1, 2
  add t0, t0, t1
  mv a0, s1
  li a1, 0
  addi a2, t0, fig
  mv a3, s3
  call artPut
  ; scenes/title.e16.ts:230  figTile[s] = tile
  slli t0, s1, 1
  sw s3, figTile(t0)
  ; scenes/title.e16.ts:231  tile = tile + fig[s * 34 + 1] * 4
  slli t1, s1, 5
  slli t0, s1, 1
  add t0, t0, t1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, fig(t0)
  slli t0, t0, 2
  add s3, s3, t0
  ; scenes/title.e16.ts:232  palette(PAL_P1, 11 + s)
  li a0, 3
  addi a1, s1, 11
  call palette
  ; scenes/title.e16.ts:233  palKeep(PAL_P1, 11 + s)
  li a0, 3
  addi a1, s1, 11
  call palKeep
  ; scenes/title.e16.ts:234  palShow(11 + s, M_INTRO, 0)
  addi a0, s1, 11
  li a1, 1
  li a2, 0
  la t0, palShow
  li t1, 260
  call far_call
  ; scenes/title.e16.ts:235  figStep[s] = 0
  slli t0, s1, 1
  sw zero, figStep(t0)
  ; scenes/title.e16.ts:236  s++
  addi s1, s1, 1
.L7:
  li t0, 4
  bltu s1, t0, .L5
  ; scenes/title.e16.ts:238  typeShow()
  call typeShow
  ; scenes/title.e16.ts:239  say(10, 34, str('(C) ELECXZY PROJECT'), SL_DIM)
  li a0, 10
  li a1, 34
  la a2, str_56
  li a3, 3
  call say
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; scenes/title.e16.ts:243 typeShow() at -O1
typeShow:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/title.e16.ts:244  say(
  lw t0, 0x181c(zero)
  li t1, 33
  mv t2, t0
  li t0, 8
  li t3, 0
  bne t2, t3, .L1
  la t2, str_57
  j .L2
.L1:
  la t2, str_58
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call say
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/title.e16.ts:253 pageShow(p) at -O1
;   p in s1
;   shown in s2
pageShow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; p
  ; scenes/title.e16.ts:254  hudRows(TITLE_ROW, 19)
  li a0, 13
  li a1, 19
  call hudRows
  ; scenes/title.e16.ts:255  const shown = p === 0 || p === 2
  sub t0, s1, zero
  seqz t0, t0
  mv t1, t0
  bnez t1, .L1
  li t0, 2
  sub t0, s1, t0
  seqz t0, t0
.L1:
  mv s2, t0 ; shown
  ; scenes/title.e16.ts:256  palMix(0, 0, shown ? 0 : 10)
  li t0, 0
  li t1, 0
  mv t2, s2
  beqz t2, .L2
  li t2, 0
  j .L3
.L2:
  li t2, 10
.L3:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call palMix
  ; scenes/title.e16.ts:257  if (p === 1) howTo()
  li t0, 1
  bne s1, t0, .L4
  ; scenes/title.e16.ts:257  howTo()
  call howTo
  j .L5
.L4:
  ; scenes/title.e16.ts:258  if (p === 3) bestDraw(TITLE_ROW)
  li t0, 3
  bne s1, t0, .L6
  ; scenes/title.e16.ts:258  bestDraw(TITLE_ROW)
  li a0, 13
  la t0, bestDraw
  li t1, 263
  call far_call
.L6:
.L5:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes/title.e16.ts:265 figuresStep(t, shown, menu) at -O1
;   t in s2
;   shown in 4(fp)
;   menu in 6(fp)
;   s in s1
;   from in s3
;   step in 0(fp)
;   x in 2(fp)
figuresStep:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s2, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s2, a0 ; t
  sw a1, 4(fp) ; shown
  sw a2, 6(fp) ; menu
  ; scenes/title.e16.ts:266  sprBegin()
  call sprBegin
  ; scenes/title.e16.ts:267  if (!shown) return
  lw t0, 4(fp) ; shown
  bnez t0, .L1
  ; scenes/title.e16.ts:267  return
  j .return
.L1:
  ; scenes/title.e16.ts:268  if (!menu) {
  lw t0, 6(fp) ; menu
  bnez t0, .L2
  ; scenes/title.e16.ts:269  if ((t & 32) === 0) say(14, TITLE_ROW, str('PRESS START'), SL_P1)
  andi t0, s2, 32
  bne t0, zero, .L3
  ; scenes/title.e16.ts:269  say(14, TITLE_ROW, str('PRESS START'), SL_P1)
  li a0, 14
  li a1, 13
  la a2, str_59
  li a3, 1
  call say
  j .L4
.L3:
  ; scenes/title.e16.ts:270  hudRows(TITLE_ROW, 1)
  li a0, 13
  li a1, 1
  call hudRows
.L4:
.L2:
  ; scenes/title.e16.ts:272  let s: u16 = 0
  li s1, 0 ; s
  ; scenes/title.e16.ts:273  while (s < 4) {
  j .L7
.L5:
  ; scenes/title.e16.ts:274  const from = FIG_FROM + s * FIG_EVERY
  slli t1, s1, 4
  slli t0, s1, 3
  add t0, t0, t1
  addi s3, t0, 20
  ; scenes/title.e16.ts:275  const step = t < from ? 0 : introStep(t - from)
  bgeu s2, s3, .L9
  li t0, 0
  j .L10
.L9:
  sub a0, s2, s3
  la t0, introStep
  li t1, 260
  call far_call
  mv t0, a0
.L10:
  sw t0, 0(fp) ; step
  ; scenes/title.e16.ts:276  if (t === from) sfx(X_MAT)
  bne s2, s3, .L11
  ; scenes/title.e16.ts:276  sfx(X_MAT)
  li a0, 13
  la t0, sfx
  li t1, 260
  call far_call
.L11:
  ; scenes/title.e16.ts:277  if (step !== figStep[s]) {
  slli t0, s1, 1
  lw t0, figStep(t0)
  lw t1, 0(fp) ; step
  beq t1, t0, .L12
  ; scenes/title.e16.ts:278  figStep[s] = step
  slli t0, s1, 1
  lw t1, 0(fp) ; step
  sw t1, figStep(t0)
  ; scenes/title.e16.ts:279  palShow(11 + s, M_INTRO, step)
  addi a0, s1, 11
  li a1, 1
  lw a2, 0(fp)
  la t0, palShow
  li t1, 260
  call far_call
.L12:
  ; scenes/title.e16.ts:281  const x = i16(52 + s * 72)
  slli t1, s1, 6
  slli t0, s1, 3
  add t0, t0, t1
  addi t0, t0, 52
  sw t0, 2(fp) ; x
  ; scenes/title.e16.ts:282  figure(x, FEET_Y, addr(fig) + s * 68, figWord(figTile[s], 11 + s, s < 2))
  slli t1, s1, 6
  slli t0, s1, 2
  add t0, t0, t1
  slli t1, s1, 1
  lw t1, figTile(t1)
  sltiu t2, s1, 2
  addi t0, t0, fig
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  addi a1, s1, 11
  mv a2, t2
  call figWord
  lw t0, 0(sp)
  addi sp, sp, 2
  li a1, 244
  mv a2, t0
  mv a3, a0
  lw a0, 2(fp)
  call figure
  ; scenes/title.e16.ts:283  shadowAt(x, FEET_Y)
  lw a0, 2(fp)
  li a1, 244
  call shadowAt
  ; scenes/title.e16.ts:284  s++
  addi s1, s1, 1
.L7:
  li t0, 4
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

; scenes/title.e16.ts:289 menuShow(at) at -O1
;   at in s1
menuShow:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; at
  ; scenes/title.e16.ts:290  hudRows(TITLE_ROW, 3)
  li a0, 13
  li a1, 3
  call hudRows
  ; scenes/title.e16.ts:291  say(15, TITLE_ROW, str('VERSUS CPU'), SL_P1)
  li a0, 15
  li a1, 13
  la a2, str_60
  li a3, 1
  call say
  ; scenes/title.e16.ts:292  say(15, TITLE_ROW + 1, str('CONTROLS'), SL_P1)
  li a0, 15
  li a1, 14
  la a2, str_61
  li a3, 1
  call say
  ; scenes/title.e16.ts:293  say(15, TITLE_ROW + 2, str('BEST'), SL_P1)
  li a0, 15
  li a1, 15
  la a2, str_62
  li a3, 1
  call say
  ; scenes/title.e16.ts:294  say(13, TITLE_ROW + at, str('>'), SL_P1)
  li a0, 13
  addi a1, s1, 13
  la a2, str_63
  li a3, 1
  call say
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/title.e16.ts:297 titleMenuMove(at) at -O1
;   at in s2
;   n in s1
titleMenuMove:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; at
  ; scenes/title.e16.ts:298  let n = at
  mv s1, s2 ; n
  ; scenes/title.e16.ts:299  if (pressed(B_UP)) n = n === 0 ? 2 : n - 1
  li a0, 1
  call pressed
  beqz a0, .L1
  ; scenes/title.e16.ts:299  n = n === 0 ? 2 : n - 1
  bne s1, zero, .L2
  li t0, 2
  j .L3
.L2:
  addi t0, s1, -1
.L3:
  mv s1, t0 ; n
.L1:
  ; scenes/title.e16.ts:300  if (pressed(B_DOWN)) n = n === 2 ? 0 : n + 1
  li a0, 2
  call pressed
  beqz a0, .L4
  ; scenes/title.e16.ts:300  n = n === 2 ? 0 : n + 1
  li t0, 2
  bne s1, t0, .L5
  li t0, 0
  j .L6
.L5:
  addi t0, s1, 1
.L6:
  mv s1, t0 ; n
.L4:
  ; scenes/title.e16.ts:301  if (n !== at) {
  beq s1, s2, .L7
  ; scenes/title.e16.ts:302  sfx(X_MOVE)
  li a0, 14
  la t0, sfx
  li t1, 260
  call far_call
  ; scenes/title.e16.ts:303  menuShow(n)
  mv a0, s1
  call menuShow
.L7:
  ; scenes/title.e16.ts:305  return n
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes/title.e16.ts:309 howTo() at -O1
howTo:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/title.e16.ts:310  say(14, TITLE_ROW, str('HOW TO PLAY'), SL_P1)
  li a0, 14
  li a1, 13
  la a2, str_64
  li a3, 1
  call say
  ; scenes/title.e16.ts:311  say(2, 15, str('BEAT FOUR PROGRAMS, TWO ROUNDS EACH.'), SL_P1)
  li a0, 2
  li a1, 15
  la a2, str_65
  li a3, 1
  call say
  ; scenes/title.e16.ts:312  say(2, 17, str('HOLD BACK TO GUARD: CROUCH FOR LOWS,'), SL_P1)
  li a0, 2
  li a1, 17
  la a2, str_66
  li a3, 1
  call say
  ; scenes/title.e16.ts:313  say(2, 18, str('STAND FOR JUMP-INS.'), SL_P1)
  li a0, 2
  li a1, 18
  la a2, str_67
  li a3, 1
  call say
  ; scenes/title.e16.ts:314  say(2, 20, str('LIGHT BLOWS COME OUT FAST. HEAVY ONES'), SL_P1)
  li a0, 2
  li a1, 20
  la a2, str_68
  li a3, 1
  call say
  ; scenes/title.e16.ts:315  say(2, 21, str('HURT, BUT THEY CAN BE SEEN COMING.'), SL_P1)
  li a0, 2
  li a1, 21
  la a2, str_69
  li a3, 1
  call say
  ; scenes/title.e16.ts:316  say(2, 23, str('A LIGHT THAT LANDS CHAINS INTO THE'), SL_P1)
  li a0, 2
  li a1, 23
  la a2, str_70
  li a3, 1
  call say
  ; scenes/title.e16.ts:317  say(2, 24, str('HEAVY OF ITS KIND.'), SL_P1)
  li a0, 2
  li a1, 24
  la a2, str_71
  li a3, 1
  call say
  ; scenes/title.e16.ts:318  say(2, 26, str('CLOSE IN, < OR > + HEAVY PUNCH: THROW.'), SL_P1)
  li a0, 2
  li a1, 26
  la a2, str_72
  li a3, 1
  call say
  ; scenes/title.e16.ts:319  say(2, 27, str('FORWARD TWICE: DASH.'), SL_P1)
  li a0, 2
  li a1, 27
  la a2, str_73
  li a3, 1
  call say
  ; scenes/title.e16.ts:320  say(2, 29, str('READ THEM. DO NOT LET THEM READ YOU.'), SL_DIM)
  li a0, 2
  li a1, 29
  la a2, str_74
  li a3, 3
  call say
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/title.e16.ts:340 figure(x, y, at, t) at -O1
;   x in 0(fp)
;   y in 10(fp)
;   at in 2(fp)
;   t in 4(fp)
;   n in 12(fp)
;   right in 14(fp)
;   c in s1
;   w in 6(fp)
;   dx in 8(fp)
;   placeX.w in 16(fp)
;   placeX.v in s2
;   placeY.w in 18(fp)
;   placeY.v in s3
figure:
  addi sp, sp, -30
  sw ra, 20(sp)
  sw s1, 22(sp)
  sw s2, 24(sp)
  sw s3, 26(sp)
  sw s0, 28(sp)
  mv fp, sp
  sw a0, 0(fp) ; x
  sw a1, 10(fp) ; y
  sw a2, 2(fp) ; at
  sw a3, 4(fp) ; t
  ; scenes/title.e16.ts:341  const n = peek16(at + 2)
  lw t0, 2(fp) ; at
  lw t0, 2(t0)
  sw t0, 12(fp) ; n
  ; scenes/title.e16.ts:342  const right = (t & FLIP_H) === 0
  li t0, 8192
  lw t1, 4(fp) ; t
  and t1, t1, t0
  sub t1, t1, zero
  seqz t1, t1
  sw t1, 14(fp) ; right
  ; scenes/title.e16.ts:343  let c: u16 = 0
  li s1, 0 ; c
  ; scenes/title.e16.ts:344  while (c < n) {
  j .L3
.L1:
  ; scenes/title.e16.ts:345  const w = peek16(at + 4 + c * 2)
  lw t0, 2(fp) ; at
  slli t1, s1, 1
  addi t0, t0, 4
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 6(fp) ; w
  ; scenes/title.e16.ts:346  const dx = placeX(w)
  lw t0, 6(fp) ; w
  sw t0, 16(fp) ; placeX.w
  ; scenes/title.e16.ts:327  const v = i16(w & 255)
  lw t0, 16(fp) ; placeX.w
  andi s2, t0, 255
  ; scenes/title.e16.ts:328  return v > 127 ? v - 256 : v
  li t0, 127
  bge t0, s2, .I1.L1
  addi t0, s2, -256
  j .I1_end
.I1.L1:
  mv t0, s2
.I1_end:
  sw t0, 8(fp) ; dx
  ; scenes/title.e16.ts:347  spr(right ? x + dx : x - dx - 16, y + placeY(w), t + c * 4, S16)
  lw t0, 14(fp) ; right
  beqz t0, .L5
  lw t0, 8(fp) ; dx
  lw t1, 0(fp) ; x
  add t0, t1, t0
  j .L6
.L5:
  lw t0, 8(fp) ; dx
  lw t1, 0(fp) ; x
  sub t1, t1, t0
  addi t0, t1, -16
.L6:
  lw t1, 6(fp) ; w
  sw t1, 18(fp) ; placeY.w
  ; scenes/title.e16.ts:332  const v = i16(w >> 8)
  lw t1, 18(fp) ; placeY.w
  srli s3, t1, 8
  ; scenes/title.e16.ts:333  return v > 127 ? v - 256 : v
  lw t1, 10(fp)
  mv t2, s3
  li t3, 127
  bge t3, t2, .I2.L1
  addi t2, s3, -256
  j .I2_end
.I2.L1:
  mv t2, s3
.I2_end:
  add t1, t1, t2
  slli t2, s1, 2
  lw t3, 4(fp) ; t
  add t3, t3, t2
  mv a0, t0
  mv a1, t1
  mv a2, t3
  li a3, 1
  call spr
  ; scenes/title.e16.ts:348  c++
  addi s1, s1, 1
.L3:
  lw t0, 12(fp) ; n
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 20(sp)
  lw s1, 22(sp)
  lw s2, 24(sp)
  lw s3, 26(sp)
  lw s0, 28(sp)
  addi sp, sp, 30
  ret

; scenes/title.e16.ts:355 figWord(tile, sl, right) at -O1
;   tile in a0
;   sl in a1
;   right in a2
figWord:
  ; scenes/title.e16.ts:356  return tile | ((sl - 8) << 10) | (right ? 0 : FLIP_H)
  addi t0, a1, -8
  slli t0, t0, 10
  or t0, a0, t0
  mv t1, a2
  beqz t1, .L1
  li t1, 0
  j .L2
.L1:
  li t1, 8192
.L2:
  or a0, t0, t1
.return:
  ret

; scenes/title.e16.ts:360 shadowAt(x, y) at -O1
;   x in s1
;   y in s2
shadowAt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  ; scenes/title.e16.ts:361  const t = SHADOW_TILE | ((SL_FX - 8) << 10)
  ; scenes/title.e16.ts:362  spr(x - 24, y - 4, t, S16)
  addi a0, s1, -24
  addi a1, s2, -4
  li a2, 2641
  li a3, 1
  call spr
  ; scenes/title.e16.ts:363  spr(x - 8, y - 4, t + 4, S16)
  addi a0, s1, -8
  addi a1, s2, -4
  li a2, 2645
  li a3, 1
  call spr
  ; scenes/title.e16.ts:364  spr(x + 8, y - 4, t | FLIP_H, S16)
  addi a0, s1, 8
  addi a1, s2, -4
  li a2, 10833
  li a3, 1
  call spr
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes/title.e16.ts:373 controlsRun(still) at -O1
;   still in s1
controlsRun:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; still
  ; scenes/title.e16.ts:374  screenIs(SC_CONTROLS)
  li a0, 3
  call screenIs
  ; scenes/title.e16.ts:375  if (!still) screenClear()
  bnez s1, .L1
  ; scenes/title.e16.ts:375  screenClear()
  call screenClear
.L1:
  ; scenes/title.e16.ts:376  hudClear()
  call hudClear
  ; scenes/title.e16.ts:377  if (!still) sprBegin()
  bnez s1, .L2
  ; scenes/title.e16.ts:377  sprBegin()
  call sprBegin
.L2:
  ; scenes/title.e16.ts:378  controlsDraw()
  call controlsDraw
  ; scenes/title.e16.ts:379  for (;;) {
.L3:
  ; scenes/title.e16.ts:380  if (still) pauseFrame()
  beqz s1, .L7
  ; scenes/title.e16.ts:380  pauseFrame()
  call pauseFrame
  j .L8
.L7:
  ; scenes/title.e16.ts:381  frameBegin()
  call frameBegin
.L8:
  ; scenes/title.e16.ts:382  if (pressed(B_SELECT)) {
  li a0, 2048
  call pressed
  beqz a0, .L9
  ; scenes/title.e16.ts:383  buttonSetIs(1 - buttonSet)
  lw t0, 0x181c(zero)
  li t1, 1
  sub a0, t1, t0
  call buttonSetIs
  ; scenes/title.e16.ts:384  saveKeep()
  la t0, saveKeep
  li t1, 263
  call far_call
  ; scenes/title.e16.ts:385  setShow()
  call setShow
  ; scenes/title.e16.ts:386  sfx(X_MOVE)
  li a0, 14
  la t0, sfx
  li t1, 260
  call far_call
.L9:
  ; scenes/title.e16.ts:388  if (pressed(B_A)) {
  li a0, 16
  call pressed
  beqz a0, .L10
  ; scenes/title.e16.ts:389  logOff[0] = 1 - logOff[0]
  lw t0, logOff(zero)
  li t1, 1
  sub t1, t1, t0
  sw t1, logOff(zero)
  ; scenes/title.e16.ts:390  saveKeep()
  la t0, saveKeep
  li t1, 263
  call far_call
  ; scenes/title.e16.ts:391  setShow()
  call setShow
  ; scenes/title.e16.ts:392  sfx(X_MOVE)
  li a0, 14
  la t0, sfx
  li t1, 260
  call far_call
.L10:
  ; scenes/title.e16.ts:394  if (pressed(B_START) || pressed(B_B)) {
  li a0, 1024
  call pressed
  bnez a0, .L12
  li a0, 32
  call pressed
  beqz a0, .L3
.L12:
  ; scenes/title.e16.ts:395  sfx(X_OK)
  li a0, 15
  la t0, sfx
  li t1, 260
  call far_call
  ; scenes/title.e16.ts:396  return
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/title.e16.ts:404 row3(y, pad, key, act) at -O1
;   y in s1
;   pad in s2
;   key in s3
;   act in s0
row3:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; y
  mv s2, a1 ; pad
  mv s3, a2 ; key
  mv s0, a3 ; act
  ; scenes/title.e16.ts:405  say(2, y, pad, SL_P1)
  li a0, 2
  mv a1, s1
  mv a2, s2
  li a3, 1
  call say
  ; scenes/title.e16.ts:406  say(COL_KEY, y, key, SL_P1)
  li a0, 13
  mv a1, s1
  mv a2, s3
  li a3, 1
  call say
  ; scenes/title.e16.ts:407  say(COL_ACT, y, act, SL_P1)
  li a0, 26
  mv a1, s1
  mv a2, s0
  li a3, 1
  call say
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; scenes/title.e16.ts:410 controlsDraw() at -O1
controlsDraw:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/title.e16.ts:411  say(16, 2, str('CONTROLS'), SL_P1)
  li a0, 16
  li a1, 2
  la a2, str_61
  li a3, 1
  call say
  ; scenes/title.e16.ts:412  row3(5, str('PAD'), str('PC KEY'), str('ACTION'))
  li a0, 5
  la a1, str_75
  la a2, str_76
  la a3, str_77
  call row3
  ; scenes/title.e16.ts:413  hudRule(6)
  li a0, 6
  call hudRule
  ; scenes/title.e16.ts:414  row3(7, str('D-PAD < >'), str('ARROW < >'), str('WALK'))
  li a0, 7
  la a1, str_78
  la a2, str_79
  la a3, str_80
  call row3
  ; scenes/title.e16.ts:415  row3(8, str('HOLD BACK'), str('HOLD BACK'), str('GUARD'))
  li a0, 8
  la a1, str_81
  la a2, str_81
  la a3, str_82
  call row3
  ; scenes/title.e16.ts:416  row3(9, str('D-PAD DOWN'), str('ARROW DOWN'), str('CROUCH'))
  li a0, 9
  la a1, str_83
  la a2, str_84
  la a3, str_85
  call row3
  ; scenes/title.e16.ts:417  row3(10, str('D-PAD UP'), str('ARROW UP'), str('JUMP'))
  li a0, 10
  la a1, str_86
  la a2, str_87
  la a3, str_88
  call row3
  ; scenes/title.e16.ts:418  row3(12, str('Y'), str('A'), str('LIGHT PUNCH'))
  li a0, 12
  la a1, str_89
  la a2, str_90
  la a3, str_91
  call row3
  ; scenes/title.e16.ts:419  row3(13, str('X'), str('S'), str('HEAVY PUNCH'))
  li a0, 13
  la a1, str_92
  la a2, str_93
  la a3, str_94
  call row3
  ; scenes/title.e16.ts:420  row3(14, str('B'), str('X'), str(''))
  li a0, 14
  la a1, str_95
  la a2, str_92
  la a3, str_96
  call row3
  ; scenes/title.e16.ts:421  row3(15, str('A'), str('Z'), str(''))
  li a0, 15
  la a1, str_90
  la a2, str_97
  la a3, str_96
  call row3
  ; scenes/title.e16.ts:422  row3(17, str('START'), str('ENTER'), str('PAUSE'))
  li a0, 17
  la a1, str_98
  la a2, str_99
  la a3, str_100
  call row3
  ; scenes/title.e16.ts:423  row3(18, str('SELECT'), str('RIGHT SHIFT'), str('BUTTON TYPE'))
  li a0, 18
  la a1, str_101
  la a2, str_102
  la a3, str_103
  call row3
  ; scenes/title.e16.ts:424  row3(19, str('L  R'), str('Q  W'), str('NOT USED'))
  li a0, 19
  la a1, str_104
  la a2, str_105
  la a3, str_106
  call row3
  ; scenes/title.e16.ts:425  hudRule(21)
  li a0, 21
  call hudRule
  ; scenes/title.e16.ts:426  say(2, 22, str('THROW     NEAR, < OR > + HEAVY PUNCH'), SL_P1)
  li a0, 2
  li a1, 22
  la a2, str_107
  li a3, 1
  call say
  ; scenes/title.e16.ts:427  say(2, 23, str('ANTI-AIR  DOWN + HEAVY PUNCH'), SL_P1)
  li a0, 2
  li a1, 23
  la a2, str_108
  li a3, 1
  call say
  ; scenes/title.e16.ts:428  say(2, 24, str('LOW GUARD HOLD BACK + DOWN'), SL_P1)
  li a0, 2
  li a1, 24
  la a2, str_109
  li a3, 1
  call say
  ; scenes/title.e16.ts:429  say(2, 25, str('DASH      > > OR < <'), SL_P1)
  li a0, 2
  li a1, 25
  la a2, str_110
  li a3, 1
  call say
  ; scenes/title.e16.ts:430  say(2, 26, str('CHAIN     A LIGHT THAT LANDS + HEAVY'), SL_P1)
  li a0, 2
  li a1, 26
  la a2, str_111
  li a3, 1
  call say
  ; scenes/title.e16.ts:431  say(2, 29, str('SELECT: BUTTON TYPE'), SL_DIM)
  li a0, 2
  li a1, 29
  la a2, str_112
  li a3, 3
  call say
  ; scenes/title.e16.ts:432  say(2, 30, str('A: LOG LINE'), SL_DIM)
  li a0, 2
  li a1, 30
  la a2, str_113
  li a3, 3
  call say
  ; scenes/title.e16.ts:433  say(12, 33, str('START OR B: BACK'), SL_DIM)
  li a0, 12
  li a1, 33
  la a2, str_114
  li a3, 3
  call say
  ; scenes/title.e16.ts:434  setShow()
  call setShow
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/title.e16.ts:438 hudRule(y) at -O1
;   y in s2
;   x in s1
hudRule:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; y
  ; scenes/title.e16.ts:439  let x: u16 = 2
  li s1, 2 ; x
  ; scenes/title.e16.ts:440  while (x < 38) {
  j .L3
.L1:
  ; scenes/title.e16.ts:441  hudTile(x, y, T_RULE, SL_DIM)
  mv a0, s1
  mv a1, s2
  li a2, 1
  li a3, 3
  call hudTile
  ; scenes/title.e16.ts:442  x++
  addi s1, s1, 1
.L3:
  li t0, 38
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes/title.e16.ts:449 setShow() at -O1
setShow:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/title.e16.ts:450  if (buttonSet === 0) {
  lw t0, 0x181c(zero)
  bne t0, zero, .L1
  ; scenes/title.e16.ts:451  say(22, 29, str('TYPE A  PAD    '), SL_P1)
  li a0, 22
  li a1, 29
  la a2, str_115
  li a3, 1
  call say
  ; scenes/title.e16.ts:452  say(COL_ACT, 14, str('LIGHT KICK'), SL_P1)
  li a0, 26
  li a1, 14
  la a2, str_116
  li a3, 1
  call say
  ; scenes/title.e16.ts:453  say(COL_ACT, 15, str('HEAVY KICK'), SL_P1)
  li a0, 26
  li a1, 15
  la a2, str_117
  li a3, 1
  call say
  j .L2
.L1:
  ; scenes/title.e16.ts:455  say(22, 29, str('TYPE B  PC KEYS'), SL_P1)
  li a0, 22
  li a1, 29
  la a2, str_118
  li a3, 1
  call say
  ; scenes/title.e16.ts:456  say(COL_ACT, 14, str('HEAVY KICK'), SL_P1)
  li a0, 26
  li a1, 14
  la a2, str_117
  li a3, 1
  call say
  ; scenes/title.e16.ts:457  say(COL_ACT, 15, str('LIGHT KICK'), SL_P1)
  li a0, 26
  li a1, 15
  la a2, str_116
  li a3, 1
  call say
.L2:
  ; scenes/title.e16.ts:459  say(22, 30, logOff[0] !== 0 ? str('LOG OFF') : str('LOG ON '), SL_P1)
  lw t0, logOff(zero)
  li t1, 30
  mv t2, t0
  li t0, 22
  li t3, 0
  beq t2, t3, .L3
  la t2, str_119
  j .L4
.L3:
  la t2, str_120
.L4:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call say
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

str_47:
  .byte 69, 76, 69, 67, 45, 49, 54, 32, 80, 76, 65, 89, 32, 32, 69, 76, 69, 67, 70, 73, 71, 72, 84, 69, 82, 0
str_48:
  .byte 73, 78, 68, 85, 83, 84, 82, 73, 65, 76, 32, 67, 79, 77, 66, 65, 84, 32, 83, 73, 77, 85, 76, 65, 84, 79, 82, 0
str_49:
  .byte 62, 32, 76, 79, 65, 68, 73, 78, 71, 32, 70, 73, 71, 72, 84, 69, 82, 32, 68, 65, 84, 65, 32, 46, 46, 46, 46, 46, 46, 46, 46, 32, 79, 75, 0
str_50:
  .byte 62, 32, 77, 69, 83, 72, 32, 67, 69, 76, 76, 83, 44, 32, 32, 32, 83, 76, 79, 84, 83, 32, 46, 46, 46, 46, 46, 46, 46, 46, 46, 32, 79, 75, 0
str_51:
  .byte 62, 32, 79, 80, 80, 79, 78, 69, 78, 84, 32, 80, 82, 79, 71, 82, 65, 77, 83, 44, 32, 32, 32, 46, 46, 46, 46, 46, 46, 46, 46, 32, 79, 75, 0
str_52:
  .byte 62, 32, 83, 84, 65, 71, 69, 32, 71, 82, 73, 68, 32, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 32, 79, 75, 0
str_53:
  .byte 62, 32, 83, 79, 85, 78, 68, 32, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 32, 79, 75, 0
str_54:
  .byte 62, 32, 82, 69, 67, 79, 82, 68, 83, 32, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 32, 79, 75, 0
str_55:
  .byte 62, 32, 83, 73, 77, 85, 76, 65, 84, 79, 82, 32, 82, 69, 65, 68, 89, 0
str_56:
  .byte 40, 67, 41, 32, 69, 76, 69, 67, 88, 90, 89, 32, 80, 82, 79, 74, 69, 67, 84, 0
str_57:
  .byte 83, 69, 76, 69, 67, 84, 32, 32, 84, 89, 80, 69, 32, 65, 32, 40, 80, 65, 68, 41, 32, 32, 32, 32, 0
str_58:
  .byte 83, 69, 76, 69, 67, 84, 32, 32, 84, 89, 80, 69, 32, 66, 32, 40, 80, 67, 32, 75, 69, 89, 83, 41, 0
str_59:
  .byte 80, 82, 69, 83, 83, 32, 83, 84, 65, 82, 84, 0
str_60:
  .byte 86, 69, 82, 83, 85, 83, 32, 67, 80, 85, 0
str_61:
  .byte 67, 79, 78, 84, 82, 79, 76, 83, 0
str_62:
  .byte 66, 69, 83, 84, 0
str_63:
  .byte 62, 0
str_64:
  .byte 72, 79, 87, 32, 84, 79, 32, 80, 76, 65, 89, 0
str_65:
  .byte 66, 69, 65, 84, 32, 70, 79, 85, 82, 32, 80, 82, 79, 71, 82, 65, 77, 83, 44, 32, 84, 87, 79, 32, 82, 79, 85, 78, 68, 83, 32, 69, 65, 67, 72, 46, 0
str_66:
  .byte 72, 79, 76, 68, 32, 66, 65, 67, 75, 32, 84, 79, 32, 71, 85, 65, 82, 68, 58, 32, 67, 82, 79, 85, 67, 72, 32, 70, 79, 82, 32, 76, 79, 87, 83, 44, 0
str_67:
  .byte 83, 84, 65, 78, 68, 32, 70, 79, 82, 32, 74, 85, 77, 80, 45, 73, 78, 83, 46, 0
str_68:
  .byte 76, 73, 71, 72, 84, 32, 66, 76, 79, 87, 83, 32, 67, 79, 77, 69, 32, 79, 85, 84, 32, 70, 65, 83, 84, 46, 32, 72, 69, 65, 86, 89, 32, 79, 78, 69, 83, 0
str_69:
  .byte 72, 85, 82, 84, 44, 32, 66, 85, 84, 32, 84, 72, 69, 89, 32, 67, 65, 78, 32, 66, 69, 32, 83, 69, 69, 78, 32, 67, 79, 77, 73, 78, 71, 46, 0
str_70:
  .byte 65, 32, 76, 73, 71, 72, 84, 32, 84, 72, 65, 84, 32, 76, 65, 78, 68, 83, 32, 67, 72, 65, 73, 78, 83, 32, 73, 78, 84, 79, 32, 84, 72, 69, 0
str_71:
  .byte 72, 69, 65, 86, 89, 32, 79, 70, 32, 73, 84, 83, 32, 75, 73, 78, 68, 46, 0
str_72:
  .byte 67, 76, 79, 83, 69, 32, 73, 78, 44, 32, 60, 32, 79, 82, 32, 62, 32, 43, 32, 72, 69, 65, 86, 89, 32, 80, 85, 78, 67, 72, 58, 32, 84, 72, 82, 79, 87, 46, 0
str_73:
  .byte 70, 79, 82, 87, 65, 82, 68, 32, 84, 87, 73, 67, 69, 58, 32, 68, 65, 83, 72, 46, 0
str_74:
  .byte 82, 69, 65, 68, 32, 84, 72, 69, 77, 46, 32, 68, 79, 32, 78, 79, 84, 32, 76, 69, 84, 32, 84, 72, 69, 77, 32, 82, 69, 65, 68, 32, 89, 79, 85, 46, 0
str_75:
  .byte 80, 65, 68, 0
str_76:
  .byte 80, 67, 32, 75, 69, 89, 0
str_77:
  .byte 65, 67, 84, 73, 79, 78, 0
str_78:
  .byte 68, 45, 80, 65, 68, 32, 60, 32, 62, 0
str_79:
  .byte 65, 82, 82, 79, 87, 32, 60, 32, 62, 0
str_80:
  .byte 87, 65, 76, 75, 0
str_81:
  .byte 72, 79, 76, 68, 32, 66, 65, 67, 75, 0
str_82:
  .byte 71, 85, 65, 82, 68, 0
str_83:
  .byte 68, 45, 80, 65, 68, 32, 68, 79, 87, 78, 0
str_84:
  .byte 65, 82, 82, 79, 87, 32, 68, 79, 87, 78, 0
str_85:
  .byte 67, 82, 79, 85, 67, 72, 0
str_86:
  .byte 68, 45, 80, 65, 68, 32, 85, 80, 0
str_87:
  .byte 65, 82, 82, 79, 87, 32, 85, 80, 0
str_88:
  .byte 74, 85, 77, 80, 0
str_89:
  .byte 89, 0
str_90:
  .byte 65, 0
str_91:
  .byte 76, 73, 71, 72, 84, 32, 80, 85, 78, 67, 72, 0
str_92:
  .byte 88, 0
str_93:
  .byte 83, 0
str_94:
  .byte 72, 69, 65, 86, 89, 32, 80, 85, 78, 67, 72, 0
str_95:
  .byte 66, 0
str_96:
  .byte 0
str_97:
  .byte 90, 0
str_98:
  .byte 83, 84, 65, 82, 84, 0
str_99:
  .byte 69, 78, 84, 69, 82, 0
str_100:
  .byte 80, 65, 85, 83, 69, 0
str_101:
  .byte 83, 69, 76, 69, 67, 84, 0
str_102:
  .byte 82, 73, 71, 72, 84, 32, 83, 72, 73, 70, 84, 0
str_103:
  .byte 66, 85, 84, 84, 79, 78, 32, 84, 89, 80, 69, 0
str_104:
  .byte 76, 32, 32, 82, 0
str_105:
  .byte 81, 32, 32, 87, 0
str_106:
  .byte 78, 79, 84, 32, 85, 83, 69, 68, 0
str_107:
  .byte 84, 72, 82, 79, 87, 32, 32, 32, 32, 32, 78, 69, 65, 82, 44, 32, 60, 32, 79, 82, 32, 62, 32, 43, 32, 72, 69, 65, 86, 89, 32, 80, 85, 78, 67, 72, 0
str_108:
  .byte 65, 78, 84, 73, 45, 65, 73, 82, 32, 32, 68, 79, 87, 78, 32, 43, 32, 72, 69, 65, 86, 89, 32, 80, 85, 78, 67, 72, 0
str_109:
  .byte 76, 79, 87, 32, 71, 85, 65, 82, 68, 32, 72, 79, 76, 68, 32, 66, 65, 67, 75, 32, 43, 32, 68, 79, 87, 78, 0
str_110:
  .byte 68, 65, 83, 72, 32, 32, 32, 32, 32, 32, 62, 32, 62, 32, 79, 82, 32, 60, 32, 60, 0
str_111:
  .byte 67, 72, 65, 73, 78, 32, 32, 32, 32, 32, 65, 32, 76, 73, 71, 72, 84, 32, 84, 72, 65, 84, 32, 76, 65, 78, 68, 83, 32, 43, 32, 72, 69, 65, 86, 89, 0
str_112:
  .byte 83, 69, 76, 69, 67, 84, 58, 32, 66, 85, 84, 84, 79, 78, 32, 84, 89, 80, 69, 0
str_113:
  .byte 65, 58, 32, 76, 79, 71, 32, 76, 73, 78, 69, 0
str_114:
  .byte 83, 84, 65, 82, 84, 32, 79, 82, 32, 66, 58, 32, 66, 65, 67, 75, 0
str_115:
  .byte 84, 89, 80, 69, 32, 65, 32, 32, 80, 65, 68, 32, 32, 32, 32, 0
str_116:
  .byte 76, 73, 71, 72, 84, 32, 75, 73, 67, 75, 0
str_117:
  .byte 72, 69, 65, 86, 89, 32, 75, 73, 67, 75, 0
str_118:
  .byte 84, 89, 80, 69, 32, 66, 32, 32, 80, 67, 32, 75, 69, 89, 83, 0
str_119:
  .byte 76, 79, 71, 32, 79, 70, 70, 0
str_120:
  .byte 76, 79, 71, 32, 79, 78, 32, 0
  .align 2

  .bank 6
  .org 0xc000
; scenes/select.e16.ts:113 selectRun() at -O1
;   s in s2
;   at in s1
;   t in s3
;   shown in 0(fp)
;   n in 2(fp)
selectRun:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; scenes/select.e16.ts:114  screenIs(SC_SELECT)
  li a0, 4
  call screenIs
  ; scenes/select.e16.ts:115  screenClear()
  call screenClear
  ; scenes/select.e16.ts:116  music(M_SELECT)
  li a0, 2
  la t0, music
  li t1, 260
  call far_call
  ; scenes/select.e16.ts:117  load(BUSTS_BANK, BUSTS_AT, BUSTS_TILE * 32, BUSTS_BYTES)
  li a0, 353
  li a1, 49152
  li a2, 24672
  li a3, 4096
  call load
  ; scenes/select.e16.ts:118  say(1, 1, str('SELECT FIGHTER'), SL_P1)
  li a0, 1
  li a1, 1
  la a2, str_121
  li a3, 1
  call say
  ; scenes/select.e16.ts:119  say(33, 1, str('VS CPU'), SL_DIM)
  li a0, 33
  li a1, 1
  la a2, str_122
  li a3, 3
  call say
  ; scenes/select.e16.ts:120  let s: u16 = 0
  li s2, 0 ; s
  ; scenes/select.e16.ts:121  while (s < SLOTS) {
  j .L3
.L1:
  ; scenes/select.e16.ts:122  bustDraw(s)
  mv a0, s2
  call bustDraw
  ; scenes/select.e16.ts:123  s++
  addi s2, s2, 1
.L3:
  li t0, 4
  bltu s2, t0, .L1
  ; scenes/select.e16.ts:125  say(4, 34, str('< > CHOOSE     A OK     B BACK'), SL_DIM)
  li a0, 4
  li a1, 34
  la a2, str_123
  li a3, 3
  call say
  ; scenes/select.e16.ts:126  let at = choice[0] & 3
  lw t0, choice(zero)
  andi s1, t0, 3
  ; scenes/select.e16.ts:127  hover(at)
  mv a0, s1
  call hover
  ; scenes/select.e16.ts:128  let t: u16 = 0
  li s3, 0 ; t
  ; scenes/select.e16.ts:130  let shown: u16 = 0
  sw zero, 0(fp) ; shown
  ; scenes/select.e16.ts:131  for (;;) {
.L5:
  ; scenes/select.e16.ts:132  frameBegin()
  call frameBegin
  ; scenes/select.e16.ts:133  if (pressed(B_B)) {
  li a0, 32
  call pressed
  beqz a0, .L9
  ; scenes/select.e16.ts:134  palettesIn()
  call palettesIn
  ; scenes/select.e16.ts:135  return false
  li a0, 0
  j .return
.L9:
  ; scenes/select.e16.ts:137  if (pressed(B_A) || pressed(B_START)) {
  li a0, 16
  call pressed
  bnez a0, .L11
  li a0, 1024
  call pressed
  beqz a0, .L10
.L11:
  ; scenes/select.e16.ts:138  confirm(at)
  mv a0, s1
  call confirm
  ; scenes/select.e16.ts:139  return true
  li a0, 1
  j .return
.L10:
  ; scenes/select.e16.ts:141  const n = cursorMove(at)
  mv a0, s1
  call cursorMove
  sw a0, 2(fp) ; n
  ; scenes/select.e16.ts:142  if (n !== at) {
  lw t0, 2(fp) ; n
  beq t0, s1, .L12
  ; scenes/select.e16.ts:143  at = n
  lw s1, 2(fp) ; n
  ; scenes/select.e16.ts:144  t = 0
  li s3, 0 ; t
  ; scenes/select.e16.ts:145  shown = 0
  sw zero, 0(fp) ; shown
.L12:
  ; scenes/select.e16.ts:147  shown = bodyStep(t, shown)
  mv a0, s3
  lw a1, 0(fp)
  call bodyStep
  sw a0, 0(fp) ; shown
  ; scenes/select.e16.ts:148  t++
  addi s3, s3, 1
  j .L5
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; scenes/select.e16.ts:153 cursorMove(at) at -O1
;   at in s1
;   n in s2
cursorMove:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; at
  ; scenes/select.e16.ts:154  let n = at
  mv s2, s1 ; n
  ; scenes/select.e16.ts:155  if (pressed(B_LEFT)) n = at === 0 ? SLOTS - 1 : at - 1
  li a0, 4
  call pressed
  beqz a0, .L1
  ; scenes/select.e16.ts:155  n = at === 0 ? SLOTS - 1 : at - 1
  bne s1, zero, .L2
  li t0, 3
  j .L3
.L2:
  addi t0, s1, -1
.L3:
  mv s2, t0 ; n
.L1:
  ; scenes/select.e16.ts:156  if (pressed(B_RIGHT)) n = at === SLOTS - 1 ? 0 : at + 1
  li a0, 8
  call pressed
  beqz a0, .L4
  ; scenes/select.e16.ts:156  n = at === SLOTS - 1 ? 0 : at + 1
  li t0, 3
  bne s1, t0, .L5
  li t0, 0
  j .L6
.L5:
  addi t0, s1, 1
.L6:
  mv s2, t0 ; n
.L4:
  ; scenes/select.e16.ts:157  if (n !== at) {
  beq s2, s1, .L7
  ; scenes/select.e16.ts:158  hover(n)
  mv a0, s2
  call hover
  ; scenes/select.e16.ts:159  sfx(X_MOVE)
  li a0, 14
  la t0, sfx
  li t1, 260
  call far_call
.L7:
  ; scenes/select.e16.ts:161  return n
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes/select.e16.ts:165 bustDraw(s) at -O1
;   s in s2
;   sl in s3
;   x0 in 0(fp)
;   k in s1
;   t in 2(fp)
bustDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; s
  ; scenes/select.e16.ts:166  const sl = BUST_SL + s
  addi s3, s2, 4
  ; scenes/select.e16.ts:167  palette(PAL_P1, sl)
  li a0, 3
  mv a1, s3
  call palette
  ; scenes/select.e16.ts:168  palKeep(PAL_P1, sl)
  li a0, 3
  mv a1, s3
  call palKeep
  ; scenes/select.e16.ts:169  const x0 = 1 + s * 10
  slli t1, s2, 3
  slli t0, s2, 1
  add t0, t0, t1
  addi t0, t0, 1
  sw t0, 0(fp) ; x0
  ; scenes/select.e16.ts:170  let k: u16 = 0
  li s1, 0 ; k
  ; scenes/select.e16.ts:171  while (k < BUST_CELLS) {
  j .L3
.L1:
  ; scenes/select.e16.ts:172  const t = tableWord(BUST_CELLS_BANK, BUST_CELLS_AT, s * BUST_CELLS + k)
  slli t0, s2, 6
  add t0, t0, s1
  li a0, 365
  li a1, 53720
  mv a2, t0
  call tableWord
  sw a0, 2(fp) ; t
  ; scenes/select.e16.ts:173  vpoke(cellAt(0, x0 + (k & 7), BUST_ROW + (k >> 3)), (BUSTS_TILE + t) | (sl << 10))
  andi t0, s1, 7
  lw t1, 0(fp) ; x0
  add t1, t1, t0
  srli t0, s1, 3
  li a0, 0
  mv a1, t1
  addi a2, t0, 4
  call cellAt
  lw t0, 2(fp) ; t
  slli t1, s3, 10
  addi t0, t0, 771
  or a1, t0, t1
  call vpoke
  ; scenes/select.e16.ts:174  k++
  addi s1, s1, 1
.L3:
  li t0, 64
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

; scenes/select.e16.ts:182 hover(s) at -O1
;   s in s2
;   k in s1
;   x0/x in s3
hover:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; s
  ; scenes/select.e16.ts:183  hudRows(3, 1)
  li a0, 3
  li a1, 1
  call hudRows
  ; scenes/select.e16.ts:184  hudRows(NAME_ROW, 2)
  li a0, 12
  li a1, 2
  call hudRows
  ; scenes/select.e16.ts:185  let k: u16 = 0
  li s1, 0 ; k
  ; scenes/select.e16.ts:186  while (k < SLOTS) {
  j .L3
.L1:
  ; scenes/select.e16.ts:187  const x0 = 1 + k * 10
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  addi s3, t0, 1
  ; scenes/select.e16.ts:188  palMix(BUST_SL + k, 0, k === s ? 0 : BUST_DIM)
  addi t0, s1, 4
  li t1, 0
  mv t2, s1
  mv t3, s2
  bne t2, t3, .L5
  li t2, 0
  j .L6
.L5:
  li t2, 9
.L6:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call palMix
  ; scenes/select.e16.ts:189  nameAt(x0, slName[k], k === s ? SL_P1 : SL_DIM)
  slli t0, s1, 1
  lw t1, slName(t0)
  mv t0, s3
  mv t2, s1
  mv t3, s2
  bne t2, t3, .L7
  li t2, 1
  j .L8
.L7:
  li t2, 3
.L8:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call nameAt
  ; scenes/select.e16.ts:190  k++
  addi s1, s1, 1
.L3:
  li t0, 4
  bltu s1, t0, .L1
  ; scenes/select.e16.ts:192  let x: u16 = 1 + s * 10
  slli t1, s2, 3
  slli t0, s2, 1
  add t0, t0, t1
  addi s3, t0, 1
  ; scenes/select.e16.ts:193  while (x < 9 + s * 10) {
  j .L11
.L9:
  ; scenes/select.e16.ts:194  hudTile(x, 3, T_RULE, SL_P1)
  mv a0, s3
  li a1, 3
  li a2, 1
  li a3, 1
  call hudTile
  ; scenes/select.e16.ts:195  x++
  addi s3, s3, 1
.L11:
  slli t1, s2, 3
  slli t0, s2, 1
  add t0, t0, t1
  addi t0, t0, 9
  bltu s3, t0, .L9
  ; scenes/select.e16.ts:197  say(7 + s * 10, 3, str('P1'), SL_P1)
  slli t1, s2, 3
  slli t0, s2, 1
  add t0, t0, t1
  addi a0, t0, 7
  li a1, 3
  la a2, str_124
  li a3, 1
  call say
  ; scenes/select.e16.ts:198  panel(s)
  mv a0, s2
  call panel
  ; scenes/select.e16.ts:199  artPut(s, 0, addr(fig), S1_TILE)
  mv a0, s2
  li a1, 0
  la a2, fig
  li a3, 257
  call artPut
  ; scenes/select.e16.ts:200  palShow(8, M_INTRO, 0)
  li a0, 8
  li a1, 1
  li a2, 0
  la t0, palShow
  li t1, 260
  call far_call
  ; scenes/select.e16.ts:201  sfx(X_MAT)
  li a0, 13
  la t0, sfx
  li t1, 260
  call far_call
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; scenes/select.e16.ts:205 nameAt(x, s, sl) at -O1
;   x in 2(fp)
;   s in 4(fp)
;   sl in 6(fp)
;   y in s1
;   at in s2
;   k in 0(fp)
;   c in s3
nameAt:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 2(fp) ; x
  sw a1, 4(fp) ; s
  sw a2, 6(fp) ; sl
  ; scenes/select.e16.ts:206  let y = NAME_ROW
  li s1, 12 ; y
  ; scenes/select.e16.ts:207  let at = cellAt(1, x, y)
  li a0, 1
  lw a1, 2(fp)
  mv a2, s1
  call cellAt
  mv s2, a0 ; at
  ; scenes/select.e16.ts:208  let k: u16 = 0
  sw zero, 0(fp) ; k
  ; scenes/select.e16.ts:209  let c = peek(s)
  lw t0, 4(fp) ; s
  lbu s3, 0(t0)
  ; scenes/select.e16.ts:210  while (c !== 0) {
  j .L3
.L1:
  ; scenes/select.e16.ts:211  if (c === 32) {
  li t0, 32
  bne s3, t0, .L5
  ; scenes/select.e16.ts:212  y++
  addi s1, s1, 1
  ; scenes/select.e16.ts:213  at = cellAt(1, x, y)
  li a0, 1
  lw a1, 2(fp)
  mv a2, s1
  call cellAt
  mv s2, a0 ; at
  j .L6
.L5:
  ; scenes/select.e16.ts:215  vpoke(at, (FONT_TILE + c - 32) | (sl << 10) | FRONT)
  lw t0, 6(fp) ; sl
  slli t0, t0, 10
  addi t1, s3, -32
  or t1, t1, t0
  li t0, 32768
  or t1, t1, t0
  mv a0, s2
  mv a1, t1
  call vpoke
  ; scenes/select.e16.ts:216  at = wrap16(at + 2)
  addi s2, s2, 2
.L6:
  ; scenes/select.e16.ts:218  k++
  lw t0, 0(fp) ; k
  addi t0, t0, 1
  sw t0, 0(fp) ; k
  ; scenes/select.e16.ts:219  c = peek(s + k)
  lw t0, 0(fp) ; k
  lw t1, 4(fp) ; s
  add t1, t1, t0
  lbu s3, 0(t1)
.L3:
  bne s3, zero, .L1
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; scenes/select.e16.ts:224 panel(s) at -O1
;   s in s2
;   x in s1
panel:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; s
  ; scenes/select.e16.ts:225  hudRows(16, 15)
  li a0, 16
  li a1, 15
  call hudRows
  ; scenes/select.e16.ts:226  let x: u16 = PANEL_X - 1
  li s1, 18 ; x
  ; scenes/select.e16.ts:227  while (x < 39) {
  j .L3
.L1:
  ; scenes/select.e16.ts:228  hudTile(x, 16, T_RULE, SL_DIM)
  mv a0, s1
  li a1, 16
  li a2, 1
  li a3, 3
  call hudTile
  ; scenes/select.e16.ts:229  x++
  addi s1, s1, 1
.L3:
  li t0, 39
  bltu s1, t0, .L1
  ; scenes/select.e16.ts:231  say(PANEL_X, 17, slName[s], SL_P1)
  slli t0, s2, 1
  lw t0, slName(t0)
  li a0, 19
  li a1, 17
  mv a2, t0
  li a3, 1
  call say
  ; scenes/select.e16.ts:232  say(36, 17, str('P1'), SL_DIM)
  li a0, 36
  li a1, 17
  la a2, str_124
  li a3, 3
  call say
  ; scenes/select.e16.ts:233  slotWords(s)
  mv a0, s2
  call slotWords
  ; scenes/select.e16.ts:234  barsOf(s)
  mv a0, s2
  call barsOf
  ; scenes/select.e16.ts:235  barRow(22, str('POWER'), bars[0])
  lw t0, bars(zero)
  li a0, 22
  la a1, str_125
  mv a2, t0
  call barRow
  ; scenes/select.e16.ts:236  barRow(24, str('SPEED'), bars[1])
  lw t0, bars+2(zero)
  li a0, 24
  la a1, str_126
  mv a2, t0
  call barRow
  ; scenes/select.e16.ts:237  barRow(26, str('REACH'), bars[2])
  lw t0, bars+4(zero)
  li a0, 26
  la a1, str_127
  mv a2, t0
  call barRow
  ; scenes/select.e16.ts:238  barRow(28, str('DEFENSE'), bars[3])
  lw t0, bars+6(zero)
  li a0, 28
  la a1, str_128
  mv a2, t0
  call barRow
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes/select.e16.ts:242 slotWords(s) at -O1
;   s in s1
slotWords:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; s
  ; scenes/select.e16.ts:243  lineSay(PANEL_X, 19, SLOT_LINES, s * 2)
  slli t0, s1, 1
  li a0, 19
  li a1, 19
  la a2, str_0
  mv a3, t0
  call lineSay
  ; scenes/select.e16.ts:244  lineSay(PANEL_X, 20, SLOT_LINES, s * 2 + 1)
  slli t0, s1, 1
  li a0, 19
  li a1, 20
  la a2, str_0
  addi a3, t0, 1
  call lineSay
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/select.e16.ts:261 lineSay(x, y, text, n) at -O1
;   x in 2(fp)
;   y in 4(fp)
;   text in 6(fp)
;   n in 8(fp)
;   s in s1
;   k in s3
;   at in 0(fp)
;   c in s2
lineSay:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s2, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 2(fp) ; x
  sw a1, 4(fp) ; y
  sw a2, 6(fp) ; text
  sw a3, 8(fp) ; n
  ; scenes/select.e16.ts:262  let s = text
  lw s1, 6(fp) ; text
  ; scenes/select.e16.ts:263  let k: u16 = 0
  li s3, 0 ; k
  ; scenes/select.e16.ts:264  while (k < n && peek(s) !== 0) {
  j .L3
.L1:
  ; scenes/select.e16.ts:265  if (peek(s) === BAR) k++
  lbu t0, 0(s1)
  li t1, 124
  bne t0, t1, .L5
  ; scenes/select.e16.ts:265  k++
  addi s3, s3, 1
.L5:
  ; scenes/select.e16.ts:266  s++
  addi s1, s1, 1
.L3:
  lw t0, 8(fp) ; n
  bgeu s3, t0, .L6
  lbu t0, 0(s1)
  bne t0, zero, .L1
.L6:
  ; scenes/select.e16.ts:268  let at = cellAt(1, x, y)
  li a0, 1
  lw a1, 2(fp)
  lw a2, 4(fp)
  call cellAt
  sw a0, 0(fp) ; at
  ; scenes/select.e16.ts:269  let c = peek(s)
  lbu s2, 0(s1)
  ; scenes/select.e16.ts:270  while (c !== 0 && c !== BAR) {
  j .L9
.L7:
  ; scenes/select.e16.ts:271  vpoke(at, (FONT_TILE + c - 32) | (SL_P1 << 10) | FRONT)
  addi t0, s2, -32
  ori t0, t0, 1024
  li t1, 32768
  or t0, t0, t1
  lw a0, 0(fp)
  mv a1, t0
  call vpoke
  ; scenes/select.e16.ts:272  at = wrap16(at + 2)
  lw t0, 0(fp) ; at
  addi t0, t0, 2
  sw t0, 0(fp) ; at
  ; scenes/select.e16.ts:273  s++
  addi s1, s1, 1
  ; scenes/select.e16.ts:274  c = peek(s)
  lbu s2, 0(s1)
.L9:
  beq s2, zero, .L11
  li t0, 124
  bne s2, t0, .L7
.L11:
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  lw s2, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; scenes/select.e16.ts:279 level(v, lo, step) at -O1
;   v in a0
;   lo in a1
;   step in a2
;   n in a3
level:
  ; scenes/select.e16.ts:280  if (v <= lo) return 1
  bltu a1, a0, .L1
  ; scenes/select.e16.ts:280  return 1
  li a0, 1
  ret
.L1:
  ; scenes/select.e16.ts:281  const n = 1 + div(v - lo, step)
  sub t0, a0, a1
  divu t0, t0, a2
  addi a3, t0, 1
  ; scenes/select.e16.ts:282  return n > 5 ? 5 : n
  li t0, 5
  bgeu t0, a3, .L2
  li t0, 5
  j .L3
.L2:
  mv t0, a3
.L3:
  mv a0, t0
.return:
  ret

; scenes/select.e16.ts:289 barsOf(s) at -O1
;   s in s1
;   heavy in s2
barsOf:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; s
  ; scenes/select.e16.ts:290  fighterLoad(0, s)
  li a0, 0
  mv a1, s1
  call fighterLoad
  ; scenes/select.e16.ts:291  const heavy =
  li a0, 0
  li a1, 1
  li a2, 3
  call mvAt
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  li a1, 3
  li a2, 3
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 0
  li a1, 5
  li a2, 3
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 0
  li a1, 7
  li a2, 3
  call mvAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add s2, t0, a0
  ; scenes/select.e16.ts:293  bars[0] = level(heavy, 44, 6)
  mv a0, s2
  li a1, 44
  li a2, 6
  call level
  sw a0, bars(zero)
  ; scenes/select.e16.ts:294  bars[1] = level(prAt(0, P_WALK_F), 15, 2)
  li a0, 0
  li a1, 2
  call prAt
  li a1, 15
  li a2, 2
  call level
  sw a0, bars+2(zero)
  ; scenes/select.e16.ts:295  bars[2] = level(reach[3], 40, 3)
  lw a0, reach+6(zero)
  li a1, 40
  li a2, 3
  call level
  sw a0, bars+4(zero)
  ; scenes/select.e16.ts:296  bars[3] = level(prAt(0, P_LIFE) + prAt(0, P_WEIGHT), 200, 10)
  li a0, 0
  li a1, 0
  call prAt
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  li a1, 1
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  add a0, t0, a0
  li a1, 200
  li a2, 10
  call level
  sw a0, bars+6(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes/select.e16.ts:304 barRow(y, s, n) at -O1
;   y in s2
;   s in 0(fp)
;   n in 2(fp)
;   k in s1
;   lit in s3
barRow:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; y
  sw a1, 0(fp) ; s
  sw a2, 2(fp) ; n
  ; scenes/select.e16.ts:305  say(PANEL_X, y, s, SL_DIM)
  li a0, 19
  mv a1, s2
  lw a2, 0(fp)
  li a3, 3
  call say
  ; scenes/select.e16.ts:306  let k: u16 = 0
  li s1, 0 ; k
  ; scenes/select.e16.ts:307  while (k < 5) {
  j .L3
.L1:
  ; scenes/select.e16.ts:308  const lit = k < n
  lw t0, 2(fp) ; n
  sltu s3, s1, t0
  ; scenes/select.e16.ts:309  hudTile(BAR_X + k * 2, y, lit ? T_BAR + BAR_WHOLE : T_BAR, SL_P1)
  slli t0, s1, 1
  addi t0, t0, 29
  mv t1, s2
  mv t2, s3
  beqz t2, .L5
  li t2, 88
  j .L6
.L5:
  li t2, 8
.L6:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call hudTile
  ; scenes/select.e16.ts:310  hudTile(BAR_X + k * 2 + 1, y, lit ? T_BAR + BAR_GAP : T_BAR, SL_P1)
  slli t0, s1, 1
  addi t0, t0, 30
  mv t1, s2
  mv t2, s3
  beqz t2, .L7
  li t2, 78
  j .L8
.L7:
  li t2, 8
.L8:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call hudTile
  ; scenes/select.e16.ts:311  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; scenes/select.e16.ts:319 bodyStep(t, shown) at -O1
;   t in s2
;   shown in s3
;   step in s1
bodyStep:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; t
  mv s3, a1 ; shown
  ; scenes/select.e16.ts:320  const step = introStep(t)
  mv a0, s2
  la t0, introStep
  li t1, 260
  call far_call
  mv s1, a0 ; step
  ; scenes/select.e16.ts:321  if (step !== shown) palShow(8, M_INTRO, step)
  beq s1, s3, .L1
  ; scenes/select.e16.ts:321  palShow(8, M_INTRO, step)
  li a0, 8
  li a1, 1
  mv a2, s1
  la t0, palShow
  li t1, 260
  call far_call
.L1:
  ; scenes/select.e16.ts:322  sprBegin()
  call sprBegin
  ; scenes/select.e16.ts:323  figure(BODY_X, SEL_FEET, addr(fig), figWord(S1_TILE, 8, true))
  li a0, 72
  li a1, 244
  la a2, fig
  li a3, 257
  la t0, figure
  li t1, 261
  call far_call
  ; scenes/select.e16.ts:324  shadowAt(BODY_X, SEL_FEET)
  li a0, 72
  li a1, 244
  la t0, shadowAt
  li t1, 261
  call far_call
  ; scenes/select.e16.ts:325  return step
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; scenes/select.e16.ts:329 confirm(s) at -O1
;   s in s2
;   t in s1
confirm:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; s
  ; scenes/select.e16.ts:330  sfx(X_OK)
  li a0, 15
  la t0, sfx
  li t1, 260
  call far_call
  ; scenes/select.e16.ts:331  choice[0] = s
  sw s2, choice(zero)
  ; scenes/select.e16.ts:332  seedFromClock()
  call seedFromClock
  ; scenes/select.e16.ts:333  artPut(s, WIN_ROW, addr(fig), S1_TILE)
  mv a0, s2
  li a1, 59
  la a2, fig
  li a3, 257
  call artPut
  ; scenes/select.e16.ts:334  palShow(8, M_INTRO, 6)
  li a0, 8
  li a1, 1
  li a2, 6
  la t0, palShow
  li t1, 260
  call far_call
  ; scenes/select.e16.ts:335  let t: u16 = 0
  li s1, 0 ; t
  ; scenes/select.e16.ts:336  while (t < WIN_F) {
  j .L3
.L1:
  ; scenes/select.e16.ts:337  frameBegin()
  call frameBegin
  ; scenes/select.e16.ts:338  sprBegin()
  call sprBegin
  ; scenes/select.e16.ts:339  figure(BODY_X, SEL_FEET, addr(fig), figWord(S1_TILE, 8, true))
  li a0, 72
  li a1, 244
  la a2, fig
  li a3, 257
  la t0, figure
  li t1, 261
  call far_call
  ; scenes/select.e16.ts:340  shadowAt(BODY_X, SEL_FEET)
  li a0, 72
  li a1, 244
  la t0, shadowAt
  li t1, 261
  call far_call
  ; scenes/select.e16.ts:341  t++
  addi s1, s1, 1
.L3:
  li t0, 48
  bltu s1, t0, .L1
  ; scenes/select.e16.ts:343  palettesIn()
  call palettesIn
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes/select.e16.ts:356 seedFromClock() at -O1
;   h in s2
;   k in s1
seedFromClock:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; scenes/select.e16.ts:357  let h: u16 = 0x2b1d
  li s2, 11037 ; h
  ; scenes/select.e16.ts:358  let k: u16 = 0
  li s1, 0 ; k
  ; scenes/select.e16.ts:359  while (k < 7) {
  j .L3
.L1:
  ; scenes/select.e16.ts:360  h = wrap16((h ^ peek(CLOCK + k)) * 31 + 7)
  lbu t0, -200(s1)
  xor t0, s2, t0
  slli t1, t0, 5
  sub t0, t1, t0
  addi s2, t0, 7
  ; scenes/select.e16.ts:361  k++
  addi s1, s1, 1
.L3:
  li t0, 7
  bltu s1, t0, .L1
  ; scenes/select.e16.ts:363  randSeed(h ^ csrr(CSR_CYCLE))
  csrr t0, 3072
  xor a0, s2, t0
  call randSeed
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes/select.e16.ts:385 versusRun(k) at -O1
;   k in s2
;   t in s1
;   step in s3
;   pct in s0
versusRun:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; k
  ; scenes/select.e16.ts:386  screenIs(SC_VERSUS)
  li a0, 5
  call screenIs
  ; scenes/select.e16.ts:387  artPut(fSlot[0], 0, addr(fig), S1_TILE)
  lw a0, fSlot(zero)
  li a1, 0
  la a2, fig
  li a3, 257
  call artPut
  ; scenes/select.e16.ts:388  artPut(fSlot[1], 0, addr(fig) + 68, S1_TILE + 128)
  lw a0, fSlot+2(zero)
  li a1, 0
  li a2, fig+68
  li a3, 385
  call artPut
  ; scenes/select.e16.ts:389  say(2, 2, str('P1'), SL_DIM)
  li a0, 2
  li a1, 2
  la a2, str_124
  li a3, 3
  call say
  ; scenes/select.e16.ts:390  say(5, 2, slName[fSlot[0]], SL_P1)
  lw t0, fSlot(zero)
  slli t0, t0, 1
  lw t0, slName(t0)
  li a0, 5
  li a1, 2
  mv a2, t0
  li a3, 1
  call say
  ; scenes/select.e16.ts:391  say(24, 2, str('CPU'), SL_DIM)
  li a0, 24
  li a1, 2
  la a2, str_129
  li a3, 3
  call say
  ; scenes/select.e16.ts:392  say(28, 2, slName[fSlot[1]], SL_P1)
  lw t0, fSlot+2(zero)
  slli t0, t0, 1
  lw t0, slName(t0)
  li a0, 28
  li a1, 2
  mv a2, t0
  li a3, 1
  call say
  ; scenes/select.e16.ts:393  bigSay(18, 4, str('VS'), SL_BIG)
  li a0, 18
  li a1, 4
  la a2, str_130
  li a3, 6
  call bigSay
  ; scenes/select.e16.ts:394  say(11, NAME_Y, str('PROGRAM'), SL_DIM)
  li a0, 11
  li a1, 8
  la a2, str_131
  li a3, 3
  call say
  ; scenes/select.e16.ts:395  say(19, NAME_Y, oppName[k], SL_P1)
  slli t0, s2, 1
  lw t0, oppName(t0)
  li a0, 19
  li a1, 8
  mv a2, t0
  li a3, 1
  call say
  ; scenes/select.e16.ts:396  programLines(k)
  mv a0, s2
  call programLines
  ; scenes/select.e16.ts:397  palMix(0, 0, VERSUS_DIM)
  li a0, 0
  li a1, 0
  li a2, 7
  call palMix
  ; scenes/select.e16.ts:398  say(4, RENDER_ROW, str('RENDER'), SL_DIM)
  li a0, 4
  li a1, 31
  la a2, str_132
  li a3, 3
  call say
  ; scenes/select.e16.ts:399  say(24, RENDER_ROW, str('RENDER'), SL_DIM)
  li a0, 24
  li a1, 31
  la a2, str_132
  li a3, 3
  call say
  ; scenes/select.e16.ts:400  sfx(X_MAT)
  li a0, 13
  la t0, sfx
  li t1, 260
  call far_call
  ; scenes/select.e16.ts:402  sprBegin()
  call sprBegin
  ; scenes/select.e16.ts:403  let t: u16 = 0
  li s1, 0 ; t
  ; scenes/select.e16.ts:405  let step: u16 = 0xffff
  li s3, 65535 ; step
  ; scenes/select.e16.ts:406  let pct: u16 = 0xffff
  li s0, 65535 ; pct
  ; scenes/select.e16.ts:407  while (t < VERSUS_F + 34) {
  j .L3
.L1:
  ; scenes/select.e16.ts:408  frameBegin()
  call frameBegin
  ; scenes/select.e16.ts:411  if (t < 2) cpuMeasure(t)
  li t0, 2
  bgeu s1, t0, .L5
  ; scenes/select.e16.ts:411  cpuMeasure(t)
  mv a0, s1
  la t0, cpuMeasure
  li t1, 258
  call far_call
.L5:
  ; scenes/select.e16.ts:412  if (pressed(B_START) || pressed(B_A)) break
  li a0, 1024
  call pressed
  bnez a0, .L4
  li a0, 16
  call pressed
  beqz a0, .L6
  ; scenes/select.e16.ts:412  break
  j .L4
.L6:
  ; scenes/select.e16.ts:413  step = versusLook(t, step)
  mv a0, s1
  mv a1, s3
  call versusLook
  mv s3, a0 ; step
  ; scenes/select.e16.ts:414  pct = versusRender(t, pct)
  mv a0, s1
  mv a1, s0
  call versusRender
  mv s0, a0 ; pct
  ; scenes/select.e16.ts:415  sprBegin()
  call sprBegin
  ; scenes/select.e16.ts:416  figure(P1_X, SEL_FEET, addr(fig), figWord(S1_TILE, 8, true))
  li a0, 88
  li a1, 244
  la a2, fig
  li a3, 257
  la t0, figure
  li t1, 261
  call far_call
  ; scenes/select.e16.ts:417  figure(P2_X, SEL_FEET, addr(fig) + 68, figWord(S1_TILE + 128, 9, false))
  li a0, 232
  li a1, 244
  li a2, fig+68
  li a3, 9601
  la t0, figure
  li t1, 261
  call far_call
  ; scenes/select.e16.ts:418  shadowAt(P1_X, SEL_FEET)
  li a0, 88
  li a1, 244
  la t0, shadowAt
  li t1, 261
  call far_call
  ; scenes/select.e16.ts:419  shadowAt(P2_X, SEL_FEET)
  li a0, 232
  li a1, 244
  la t0, shadowAt
  li t1, 261
  call far_call
  ; scenes/select.e16.ts:420  t++
  addi s1, s1, 1
.L3:
  li t0, 94
  bltu s1, t0, .L1
.L4:
  ; scenes/select.e16.ts:423  sprBegin()
  call sprBegin
  ; scenes/select.e16.ts:426  if (t === 0) {
  bne s1, zero, .L8
  ; scenes/select.e16.ts:427  frameBegin()
  call frameBegin
  ; scenes/select.e16.ts:428  cpuMeasure(1)
  li a0, 1
  la t0, cpuMeasure
  li t1, 258
  call far_call
.L8:
  ; scenes/select.e16.ts:430  hudRows(0, 36)
  li a0, 0
  li a1, 36
  call hudRows
  ; scenes/select.e16.ts:431  palMix(0, 0, 0)
  li a0, 0
  li a1, 0
  li a2, 0
  call palMix
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; scenes/select.e16.ts:435 versusLook(t, was) at -O1
;   t in s3
;   was in s2
;   step in s1
versusLook:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; t
  mv s2, a1 ; was
  ; scenes/select.e16.ts:436  const step = introStep(t)
  mv a0, s3
  la t0, introStep
  li t1, 260
  call far_call
  mv s1, a0 ; step
  ; scenes/select.e16.ts:437  if (step === was) return was
  bne s1, s2, .L1
  ; scenes/select.e16.ts:437  return was
  mv a0, s2
  j .return
.L1:
  ; scenes/select.e16.ts:438  palShow(8, M_INTRO, step)
  li a0, 8
  li a1, 1
  mv a2, s1
  la t0, palShow
  li t1, 260
  call far_call
  ; scenes/select.e16.ts:439  palShow(9, M_INTRO, step)
  li a0, 9
  li a1, 1
  mv a2, s1
  la t0, palShow
  li t1, 260
  call far_call
  ; scenes/select.e16.ts:440  return step
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; scenes/select.e16.ts:444 versusRender(t, was) at -O1
;   t in s2
;   was in s3
;   pct in s1
versusRender:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; t
  mv s3, a1 ; was
  ; scenes/select.e16.ts:445  const pct = t * 3 > 100 ? 100 : t * 3
  slli t1, s2, 1
  add t0, t1, s2
  li t1, 100
  bgeu t1, t0, .L1
  li t0, 100
  j .L2
.L1:
  slli t1, s2, 1
  add t0, t1, s2
.L2:
  mv s1, t0 ; pct
  ; scenes/select.e16.ts:446  if (pct === was) return was
  bne s1, s3, .L3
  ; scenes/select.e16.ts:446  return was
  mv a0, s3
  j .return
.L3:
  ; scenes/select.e16.ts:447  renderShow(4, pct)
  li a0, 4
  mv a1, s1
  call renderShow
  ; scenes/select.e16.ts:448  renderShow(24, pct)
  li a0, 24
  mv a1, s1
  call renderShow
  ; scenes/select.e16.ts:449  return pct
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; scenes/select.e16.ts:453 renderShow(x, pct) at -O1
;   x in s2
;   pct in 2(fp)
;   fill in s3
;   c in s1
;   from in 0(fp)
;   part in 4(fp)
renderShow:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; x
  sw a1, 2(fp) ; pct
  ; scenes/select.e16.ts:454  number(cellAt(1, x + 7, RENDER_ROW), pct, 3, (FONT_TILE + 16) | (SL_P1 << 10) | FRONT)
  li a0, 1
  addi a1, s2, 7
  li a2, 31
  call cellAt
  lw a1, 2(fp)
  li a2, 3
  li a3, 33808
  call number
  ; scenes/select.e16.ts:455  say(x + 10, RENDER_ROW, str('%'), SL_P1)
  addi a0, s2, 10
  li a1, 31
  la a2, str_133
  li a3, 1
  call say
  ; scenes/select.e16.ts:456  const fill = div(pct * 8, 10)
  lw t0, 2(fp) ; pct
  slli t0, t0, 3
  li t1, 10
  divu s3, t0, t1
  ; scenes/select.e16.ts:457  let c: u16 = 0
  li s1, 0 ; c
  ; scenes/select.e16.ts:458  while (c < 10) {
  j .L3
.L1:
  ; scenes/select.e16.ts:459  const from = c * 8
  slli t0, s1, 3
  sw t0, 0(fp) ; from
  ; scenes/select.e16.ts:460  const part = fill <= from ? 0 : fill - from >= 8 ? 8 : fill - from
  lw t0, 0(fp) ; from
  bltu t0, s3, .L5
  li t0, 0
  j .L6
.L5:
  lw t0, 0(fp) ; from
  sub t0, s3, t0
  li t1, 8
  bltu t0, t1, .L7
  li t0, 8
  j .L8
.L7:
  lw t0, 0(fp) ; from
  sub t0, s3, t0
.L8:
.L6:
  sw t0, 4(fp) ; part
  ; scenes/select.e16.ts:461  vpoke(
  add t0, s2, s1
  li a0, 1
  mv a1, t0
  li a2, 32
  call cellAt
  lw t0, 4(fp) ; part
  slli t1, t0, 3
  add t0, t1, t0
  lw t1, 4(fp) ; part
  addi t0, t0, 176
  add t0, t0, t1
  ori t0, t0, 1024
  li t1, 32768
  or a1, t0, t1
  call vpoke
  ; scenes/select.e16.ts:465  c++
  addi s1, s1, 1
.L3:
  li t0, 10
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

; scenes/select.e16.ts:473 programLines(k) at -O1
;   k in s2
;   n in s1
programLines:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; k
  ; scenes/select.e16.ts:474  let n: u16 = 0
  li s1, 0 ; n
  ; scenes/select.e16.ts:475  while (n < 3) {
  j .L3
.L1:
  ; scenes/select.e16.ts:476  lineSay(6, PROG_ROW + n, PROGRAM_LINES, k * 3 + n)
  slli t1, s2, 1
  add t0, t1, s2
  add t0, t0, s1
  li a0, 6
  addi a1, s1, 10
  la a2, str_1
  mv a3, t0
  call lineSay
  ; scenes/select.e16.ts:477  n++
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

str_0:
  .byte 69, 86, 69, 78, 32, 73, 78, 32, 69, 86, 69, 82, 89, 84, 72, 73, 78, 71, 46, 124, 84, 72, 69, 32, 83, 84, 65, 78, 68, 65, 82, 68, 32, 66, 79, 68, 89, 46, 124, 83, 77, 65, 76, 76, 32, 65, 78, 68, 32, 81, 85, 73, 67, 75, 44, 124, 83, 72, 79, 82, 84, 32, 73, 78, 32, 82, 69, 65, 67, 72, 46, 124, 66, 82, 79, 65, 68, 32, 65, 78, 68, 32, 72, 69, 65, 86, 89, 44, 124, 72, 65, 82, 68, 32, 84, 79, 32, 77, 79, 86, 69, 46, 124, 84, 65, 76, 76, 44, 32, 76, 79, 78, 71, 32, 76, 73, 77, 66, 83, 44, 124, 65, 32, 75, 73, 67, 75, 32, 70, 82, 79, 77, 32, 65, 70, 65, 82, 46, 0
str_1:
  .byte 73, 77, 80, 65, 84, 73, 69, 78, 84, 46, 32, 73, 84, 32, 67, 79, 77, 69, 83, 32, 84, 79, 32, 89, 79, 85, 44, 124, 81, 85, 73, 67, 75, 32, 72, 65, 78, 68, 83, 32, 65, 78, 68, 32, 76, 73, 71, 72, 84, 32, 66, 76, 79, 87, 83, 44, 124, 79, 78, 69, 32, 65, 70, 84, 69, 82, 32, 65, 78, 79, 84, 72, 69, 82, 46, 124, 73, 84, 32, 87, 65, 73, 84, 83, 32, 70, 79, 82, 32, 89, 79, 85, 32, 84, 79, 32, 67, 79, 77, 69, 46, 124, 83, 76, 79, 87, 32, 84, 79, 32, 77, 79, 86, 69, 44, 32, 72, 65, 82, 68, 32, 84, 79, 32, 66, 82, 69, 65, 75, 44, 124, 65, 78, 68, 32, 79, 78, 69, 32, 66, 76, 79, 87, 32, 73, 83, 32, 69, 78, 79, 85, 71, 72, 46, 124, 65, 32, 84, 82, 65, 80, 32, 65, 84, 32, 84, 72, 69, 32, 69, 68, 71, 69, 32, 79, 70, 32, 82, 69, 65, 67, 72, 46, 124, 76, 79, 78, 71, 32, 76, 73, 77, 66, 83, 32, 71, 79, 73, 78, 71, 32, 73, 78, 32, 65, 78, 68, 32, 79, 85, 84, 44, 124, 80, 85, 78, 73, 83, 72, 73, 78, 71, 32, 87, 72, 65, 84, 32, 77, 73, 83, 83, 69, 83, 46, 124, 84, 72, 69, 32, 84, 69, 88, 84, 66, 79, 79, 75, 46, 124, 84, 72, 69, 32, 82, 73, 71, 72, 84, 32, 71, 85, 65, 82, 68, 44, 32, 84, 72, 69, 32, 82, 73, 71, 72, 84, 124, 65, 78, 83, 87, 69, 82, 32, 84, 79, 32, 69, 86, 69, 82, 89, 32, 77, 73, 83, 84, 65, 75, 69, 46, 124, 89, 79, 85, 82, 32, 79, 87, 78, 32, 66, 79, 68, 89, 44, 32, 65, 78, 79, 84, 72, 69, 82, 32, 77, 73, 78, 68, 46, 124, 73, 84, 32, 72, 65, 83, 32, 87, 65, 84, 67, 72, 69, 68, 32, 89, 79, 85, 32, 70, 73, 71, 72, 84, 124, 65, 76, 76, 32, 84, 72, 69, 32, 87, 65, 89, 32, 72, 69, 82, 69, 46, 0
str_121:
  .byte 83, 69, 76, 69, 67, 84, 32, 70, 73, 71, 72, 84, 69, 82, 0
str_122:
  .byte 86, 83, 32, 67, 80, 85, 0
str_123:
  .byte 60, 32, 62, 32, 67, 72, 79, 79, 83, 69, 32, 32, 32, 32, 32, 65, 32, 79, 75, 32, 32, 32, 32, 32, 66, 32, 66, 65, 67, 75, 0
str_124:
  .byte 80, 49, 0
str_125:
  .byte 80, 79, 87, 69, 82, 0
str_126:
  .byte 83, 80, 69, 69, 68, 0
str_127:
  .byte 82, 69, 65, 67, 72, 0
str_128:
  .byte 68, 69, 70, 69, 78, 83, 69, 0
str_129:
  .byte 67, 80, 85, 0
str_130:
  .byte 86, 83, 0
str_131:
  .byte 80, 82, 79, 71, 82, 65, 77, 0
str_132:
  .byte 82, 69, 78, 68, 69, 82, 0
str_133:
  .byte 37, 0
  .align 2

  .bank 7
  .org 0xc000
; scenes/result.e16.ts:84 saveLoad() at -O1
saveLoad:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/result.e16.ts:85  if (saveRead(SV_MAGIC) !== MAGIC) {
  li a0, 0
  call saveRead
  li t0, 17989
  beq a0, t0, .L1
  ; scenes/result.e16.ts:86  saveWrite(SV_MAGIC, MAGIC)
  li a0, 0
  li a1, 17989
  call saveWrite
  ; scenes/result.e16.ts:87  saveWrite(SV_TYPE, 0)
  li a0, 2
  li a1, 0
  call saveWrite
  ; scenes/result.e16.ts:88  saveWrite(SV_LOG, 0)
  li a0, 4
  li a1, 0
  call saveWrite
  ; scenes/result.e16.ts:89  recordsNew()
  call recordsNew
  j .L2
.L1:
  ; scenes/result.e16.ts:90  if (saveRead(SV_VERSION) !== VERSION) recordsNew()
  li a0, 6
  call saveRead
  li t0, 1
  beq a0, t0, .L3
  ; scenes/result.e16.ts:90  recordsNew()
  call recordsNew
.L3:
.L2:
  ; scenes/result.e16.ts:91  buttonSetIs(saveRead(SV_TYPE))
  li a0, 2
  call saveRead
  call buttonSetIs
  ; scenes/result.e16.ts:92  logOff[0] = saveRead(SV_LOG) & 1
  li a0, 4
  call saveRead
  andi t0, a0, 1
  sw t0, logOff(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/result.e16.ts:96 recordsNew() at -O1
;   k in s1
recordsNew:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; scenes/result.e16.ts:97  saveWrite(SV_VERSION, VERSION)
  li a0, 6
  li a1, 1
  call saveWrite
  ; scenes/result.e16.ts:98  saveWrite(SV_FLAGS, 0)
  li a0, 8
  li a1, 0
  call saveWrite
  ; scenes/result.e16.ts:99  saveWrite(SV_STREAK, 0)
  li a0, 10
  li a1, 0
  call saveWrite
  ; scenes/result.e16.ts:100  let k: u16 = 0
  li s1, 0 ; k
  ; scenes/result.e16.ts:101  while (k < SAVED_SLOTS * SV_SLOT_W) {
  j .L3
.L1:
  ; scenes/result.e16.ts:102  saveWrite(SV_SLOTS + k, 0)
  addi a0, s1, 16
  li a1, 0
  call saveWrite
  ; scenes/result.e16.ts:103  k = k + 2
  addi s1, s1, 2
.L3:
  li t0, 64
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/result.e16.ts:108 saveKeep() at -O1
saveKeep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/result.e16.ts:109  saveWrite(SV_TYPE, buttonSet)
  lw t0, 0x181c(zero)
  li a0, 2
  mv a1, t0
  call saveWrite
  ; scenes/result.e16.ts:110  saveWrite(SV_LOG, logOff[0])
  lw t0, logOff(zero)
  li a0, 4
  mv a1, t0
  call saveWrite
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/result.e16.ts:114 controlsSeen() at -O1
controlsSeen:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/result.e16.ts:115  return (saveRead(SV_FLAGS) & F_CONTROLS) !== 0
  li a0, 8
  call saveRead
  andi t0, a0, 1
  sub t0, t0, zero
  snez a0, t0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/result.e16.ts:118 controlsSeenSet() at -O1
controlsSeenSet:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/result.e16.ts:119  saveWrite(SV_FLAGS, saveRead(SV_FLAGS) | F_CONTROLS)
  li a0, 8
  call saveRead
  ori t0, a0, 1
  li a0, 8
  mv a1, t0
  call saveWrite
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/result.e16.ts:122 slotAt(s) at -O1
;   s in a0
slotAt:
  ; scenes/result.e16.ts:123  return SV_SLOTS + s * SV_SLOT_W
  slli t0, a0, 3
  addi a0, t0, 16
.return:
  ret

; scenes/result.e16.ts:131 resultShow(k) at -O1
;   k in s2
;   won in s1
resultShow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; k
  ; scenes/result.e16.ts:132  screenIs(SC_RESULT)
  li a0, 7
  call screenIs
  ; scenes/result.e16.ts:133  const won = outcome === 1
  lw t0, 0x19c2(zero)
  li t1, 1
  sub t0, t0, t1
  seqz s1, t0
  ; scenes/result.e16.ts:134  if (won) {
  beqz s1, .L1
  ; scenes/result.e16.ts:135  streak++
  lw t0, 0x1ffa(zero)
  addi t0, t0, 1
  sw t0, 0x1ffa(zero)
  ; scenes/result.e16.ts:136  if (streak > saveRead(SV_STREAK)) saveWrite(SV_STREAK, streak)
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 10
  call saveRead
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu a0, t0, .L3
  ; scenes/result.e16.ts:136  saveWrite(SV_STREAK, streak)
  lw t0, 0x1ffa(zero)
  li a0, 10
  mv a1, t0
  call saveWrite
  j .L3
.L1:
  ; scenes/result.e16.ts:137  streak = 0
  sw zero, 0x1ffa(zero)
.L3:
  ; scenes/result.e16.ts:138  resultDim(10)
  li a0, 10
  call resultDim
  ; scenes/result.e16.ts:139  hudClear()
  call hudClear
  ; scenes/result.e16.ts:141  say(14, 1, str('MATCH RESULT'), SL_DIM)
  li a0, 14
  li a1, 1
  la a2, str_134
  li a3, 3
  call say
  ; scenes/result.e16.ts:142  bigCentred(2, won ? str('WIN') : str('LOSE'))
  li t0, 2
  mv t1, s1
  beqz t1, .L4
  la t1, str_135
  j .L5
.L4:
  la t1, str_136
.L5:
  mv a0, t0
  mv a1, t1
  call bigCentred
  ; scenes/result.e16.ts:143  say(13, 6, str('VS'), SL_DIM)
  li a0, 13
  li a1, 6
  la a2, str_137
  li a3, 3
  call say
  ; scenes/result.e16.ts:144  say(16, 6, oppName[k], SL_P1)
  slli t0, s2, 1
  lw t0, oppName(t0)
  li a0, 16
  li a1, 6
  mv a2, t0
  li a3, 1
  call say
  ; scenes/result.e16.ts:145  statRow(8, str('HITS'), hitsN[0])
  lw t0, hitsN(zero)
  li a0, 8
  la a1, str_138
  mv a2, t0
  call statRow
  ; scenes/result.e16.ts:146  statRow(9, str('MAX COMBO'), fComboMax[1])
  lw t0, fComboMax+2(zero)
  li a0, 9
  la a1, str_139
  mv a2, t0
  call statRow
  ; scenes/result.e16.ts:147  statRow(10, str('TIME LEFT'), timeLeft)
  lw t0, 0x0c9c(zero)
  li a0, 10
  la a1, str_140
  mv a2, t0
  call statRow
  ; scenes/result.e16.ts:148  say(10, 11, str('ROUNDS'), SL_DIM)
  li a0, 10
  li a1, 11
  la a2, str_141
  li a3, 3
  call say
  ; scenes/result.e16.ts:149  number(cellAt(1, 26, 11), wins[0], 1, digit())
  lw t0, wins(zero)
  li a0, 42420
  mv a1, t0
  li a2, 1
  li a3, 33808
  call number
  ; scenes/result.e16.ts:150  say(27, 11, str('-'), SL_P1)
  li a0, 27
  li a1, 11
  la a2, str_142
  li a3, 1
  call say
  ; scenes/result.e16.ts:151  number(cellAt(1, 28, 11), wins[1], 1, digit())
  lw t0, wins+2(zero)
  li a0, 42424
  mv a1, t0
  li a2, 1
  li a3, 33808
  call number
  ; scenes/result.e16.ts:152  statRow(12, str('STREAK'), streak)
  lw t0, 0x1ffa(zero)
  li a0, 12
  la a1, str_143
  mv a2, t0
  call statRow
  ; scenes/result.e16.ts:153  say(14, 30, str('PRESS START'), SL_P1)
  li a0, 14
  li a1, 30
  la a2, str_144
  li a3, 1
  call say
  ; scenes/result.e16.ts:154  waitPress(360, 20)
  li a0, 360
  li a1, 20
  call waitPress
  ; scenes/result.e16.ts:155  hudClear()
  call hudClear
  ; scenes/result.e16.ts:156  resultDim(0)
  li a0, 0
  call resultDim
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes/result.e16.ts:160 statRow(y, s, n) at -O1
;   y in s1
;   s in s2
;   n in s3
statRow:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; y
  mv s2, a1 ; s
  mv s3, a2 ; n
  ; scenes/result.e16.ts:161  say(10, y, s, SL_DIM)
  li a0, 10
  mv a1, s1
  mv a2, s2
  li a3, 3
  call say
  ; scenes/result.e16.ts:162  count3(26, y, n)
  li a0, 26
  mv a1, s1
  mv a2, s3
  call count3
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; scenes/result.e16.ts:166 count3(x, y, n) at -O1
;   x in s2
;   y in s3
;   n in s1
count3:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; x
  mv s3, a1 ; y
  mv s1, a2 ; n
  ; scenes/result.e16.ts:167  number(cellAt(1, x, y), n > 999 ? 999 : n, 3, digit())
  li a0, 1
  mv a1, s2
  mv a2, s3
  call cellAt
  mv t0, a0
  mv t1, s1
  li t2, 999
  bgeu t2, t1, .L1
  li t1, 999
  j .L2
.L1:
  mv t1, s1
.L2:
  mv a0, t0
  mv a1, t1
  li a2, 3
  li a3, 33808
  call number
  ; scenes/result.e16.ts:168  const blank = FONT_TILE | (SL_P1 << 10) | FRONT
  ; scenes/result.e16.ts:169  if (n < 100) vpoke(cellAt(1, x, y), blank)
  li t0, 100
  bgeu s1, t0, .L3
  ; scenes/result.e16.ts:169  vpoke(cellAt(1, x, y), blank)
  li a0, 1
  mv a1, s2
  mv a2, s3
  call cellAt
  li a1, 33792
  call vpoke
.L3:
  ; scenes/result.e16.ts:170  if (n < 10) vpoke(cellAt(1, x + 1, y), blank)
  li t0, 10
  bgeu s1, t0, .L4
  ; scenes/result.e16.ts:170  vpoke(cellAt(1, x + 1, y), blank)
  li a0, 1
  addi a1, s2, 1
  mv a2, s3
  call cellAt
  li a1, 33792
  call vpoke
.L4:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; scenes/result.e16.ts:178 resultDim(t) at -O1
;   t in s1
resultDim:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; t
  ; scenes/result.e16.ts:179  palMix(0, 0, t)
  li a0, 0
  li a1, 0
  mv a2, s1
  call palMix
  ; scenes/result.e16.ts:180  palMix(8, 0, t)
  li a0, 8
  li a1, 0
  mv a2, s1
  call palMix
  ; scenes/result.e16.ts:181  palMix(9, 0, t)
  li a0, 9
  li a1, 0
  mv a2, s1
  call palMix
  ; scenes/result.e16.ts:182  palMix(10, 0, t)
  li a0, 10
  li a1, 0
  mv a2, s1
  call palMix
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes/result.e16.ts:186 waitPress(most, least) at -O1
;   most in s2
;   least in s3
;   t in s1
waitPress:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; most
  mv s3, a1 ; least
  ; scenes/result.e16.ts:187  let t: u16 = 0
  li s1, 0 ; t
  ; scenes/result.e16.ts:188  while (t < most) {
  j .L3
.L1:
  ; scenes/result.e16.ts:189  frameBegin()
  call frameBegin
  ; scenes/result.e16.ts:190  if (t >= least && (pressed(B_START) || pressed(B_A))) return
  bltu s1, s3, .L5
  li a0, 1024
  call pressed
  bnez a0, .L6
  li a0, 16
  call pressed
  beqz a0, .L5
.L6:
  ; scenes/result.e16.ts:190  return
  j .return
.L5:
  ; scenes/result.e16.ts:191  t++
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; scenes/result.e16.ts:201 continueAsk() at -O1
;   n in s1
;   t in s2
continueAsk:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; scenes/result.e16.ts:202  screenIs(SC_CONTINUE)
  li a0, 8
  call screenIs
  ; scenes/result.e16.ts:203  bandShow(str('CONTINUE?'))
  la a0, str_145
  call bandShow
  ; scenes/result.e16.ts:204  let n: u16 = 9
  li s1, 9 ; n
  ; scenes/result.e16.ts:205  let t: u16 = 0
  li s2, 0 ; t
  ; scenes/result.e16.ts:206  countShow(n)
  mv a0, s1
  call countShow
  ; scenes/result.e16.ts:207  for (;;) {
.L1:
  ; scenes/result.e16.ts:208  frameBegin()
  call frameBegin
  ; scenes/result.e16.ts:209  if (pressed(B_START) || pressed(B_A)) {
  li a0, 1024
  call pressed
  bnez a0, .L6
  li a0, 16
  call pressed
  beqz a0, .L5
.L6:
  ; scenes/result.e16.ts:210  continueGone()
  call continueGone
  ; scenes/result.e16.ts:211  return true
  li a0, 1
  j .return
.L5:
  ; scenes/result.e16.ts:213  t++
  addi s2, s2, 1
  ; scenes/result.e16.ts:214  if (t < COUNT_F) continue
  li t0, 60
  bgeu s2, t0, .L7
  ; scenes/result.e16.ts:214  continue
  j .L1
.L7:
  ; scenes/result.e16.ts:215  t = 0
  li s2, 0 ; t
  ; scenes/result.e16.ts:216  if (n === 0) {
  bne s1, zero, .L8
  ; scenes/result.e16.ts:217  continueGone()
  call continueGone
  ; scenes/result.e16.ts:218  return false
  li a0, 0
  j .return
.L8:
  ; scenes/result.e16.ts:220  n--
  addi s1, s1, -1
  ; scenes/result.e16.ts:221  countShow(n)
  mv a0, s1
  call countShow
  j .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes/result.e16.ts:225 continueGone() at -O1
continueGone:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/result.e16.ts:226  hudRows(COUNT_ROW, 2)
  li a0, 20
  li a1, 2
  call hudRows
  ; scenes/result.e16.ts:227  bandClear()
  call bandClear
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/result.e16.ts:231 countShow(n) at -O1
;   n in s2
;   tile in s1
countShow:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  ; scenes/result.e16.ts:232  contN = n
  sw s2, 0x1ffe(zero)
  ; scenes/result.e16.ts:233  const tile = (DIGITS_TILE + n * 4) | (4 << 10) | FRONT
  slli t0, s2, 2
  addi t0, t0, 128
  ori t0, t0, 4096
  li t1, 32768
  or s1, t0, t1
  ; scenes/result.e16.ts:234  vpoke(cellAt(1, 19, COUNT_ROW), tile)
  li a0, 43558
  mv a1, s1
  call vpoke
  ; scenes/result.e16.ts:235  vpoke(cellAt(1, 20, COUNT_ROW), tile + 1)
  li a0, 43560
  addi a1, s1, 1
  call vpoke
  ; scenes/result.e16.ts:236  vpoke(cellAt(1, 19, COUNT_ROW + 1), tile + 2)
  li a0, 43686
  addi a1, s1, 2
  call vpoke
  ; scenes/result.e16.ts:237  vpoke(cellAt(1, 20, COUNT_ROW + 1), tile + 3)
  li a0, 43688
  addi a1, s1, 3
  call vpoke
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes/result.e16.ts:241 gameOver() at -O1
gameOver:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/result.e16.ts:242  screenIs(SC_OVER)
  li a0, 9
  call screenIs
  ; scenes/result.e16.ts:243  bandShow(str('GAME OVER'))
  la a0, str_146
  call bandShow
  ; scenes/result.e16.ts:244  waitPress(150, 20)
  li a0, 150
  li a1, 20
  call waitPress
  ; scenes/result.e16.ts:245  music(0)
  li a0, 0
  la t0, music
  li t1, 260
  call far_call
  ; scenes/result.e16.ts:246  bandClear()
  call bandClear
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/result.e16.ts:253 systemClear() at -O1
systemClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/result.e16.ts:254  screenIs(SC_CLEAR)
  li a0, 10
  call screenIs
  ; scenes/result.e16.ts:255  music(M_CLEAR)
  li a0, 6
  la t0, music
  li t1, 260
  call far_call
  ; scenes/result.e16.ts:256  recordClear(choice[0], clearSec)
  lw t0, choice(zero)
  lw t1, 0x19d8(zero)
  mv a0, t0
  mv a1, t1
  call recordClear
  ; scenes/result.e16.ts:257  resultDim(10)
  li a0, 10
  call resultDim
  ; scenes/result.e16.ts:258  hudClear()
  call hudClear
  ; scenes/result.e16.ts:259  bigCentred(3, str('SYSTEM CLEAR'))
  li a0, 3
  la a1, str_147
  call bigCentred
  ; scenes/result.e16.ts:260  say(15, 8, slName[choice[0]], SL_P1)
  lw t0, choice(zero)
  slli t0, t0, 1
  lw t0, slName(t0)
  li a0, 15
  li a1, 8
  mv a2, t0
  li a3, 1
  call say
  ; scenes/result.e16.ts:261  say(10, 10, str('CLEAR TIME'), SL_DIM)
  li a0, 10
  li a1, 10
  la a2, str_148
  li a3, 3
  call say
  ; scenes/result.e16.ts:262  timeAt(24, 10, clearSec)
  lw t0, 0x19d8(zero)
  li a0, 24
  li a1, 10
  mv a2, t0
  call timeAt
  ; scenes/result.e16.ts:263  say(10, 11, str('CONTINUES'), SL_DIM)
  li a0, 10
  li a1, 11
  la a2, str_149
  li a3, 3
  call say
  ; scenes/result.e16.ts:264  count3(26, 11, continues)
  lw t0, 0x19d6(zero)
  li a0, 26
  li a1, 11
  mv a2, t0
  call count3
  ; scenes/result.e16.ts:265  if (newRecord[0] !== 0) say(15, 13, str('NEW RECORD'), SL_P1)
  lw t0, newRecord(zero)
  beq t0, zero, .L1
  ; scenes/result.e16.ts:265  say(15, 13, str('NEW RECORD'), SL_P1)
  li a0, 15
  li a1, 13
  la a2, str_150
  li a3, 1
  call say
.L1:
  ; scenes/result.e16.ts:266  bestDraw(16)
  li a0, 16
  call bestDraw
  ; scenes/result.e16.ts:267  say(14, 32, str('PRESS START'), SL_P1)
  li a0, 14
  li a1, 32
  la a2, str_144
  li a3, 1
  call say
  ; scenes/result.e16.ts:268  waitPress(720, 60)
  li a0, 720
  li a1, 60
  call waitPress
  ; scenes/result.e16.ts:269  hudClear()
  call hudClear
  ; scenes/result.e16.ts:270  resultDim(0)
  li a0, 0
  call resultDim
  ; scenes/result.e16.ts:271  music(0)
  li a0, 0
  la t0, music
  li t1, 260
  call far_call
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes/result.e16.ts:275 recordClear(s, sec) at -O1
;   s in 2(fp)
;   sec in s2
;   at in s1
;   best in s3
;   t in 0(fp)
recordClear:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 2(fp) ; s
  mv s2, a1 ; sec
  ; scenes/result.e16.ts:276  const at = slotAt(s)
  lw a0, 2(fp)
  call slotAt
  mv s1, a0 ; at
  ; scenes/result.e16.ts:277  saveWrite(at, saveRead(at) + 1)
  mv a0, s1
  call saveRead
  addi a1, a0, 1
  mv a0, s1
  call saveWrite
  ; scenes/result.e16.ts:278  const best = saveRead(at + 2)
  addi a0, s1, 2
  call saveRead
  mv s3, a0 ; best
  ; scenes/result.e16.ts:279  const t = sec === 0 ? 1 : sec
  bne s2, zero, .L1
  li t0, 1
  j .L2
.L1:
  mv t0, s2
.L2:
  sw t0, 0(fp) ; t
  ; scenes/result.e16.ts:280  newRecord[0] = 0
  sw zero, newRecord(zero)
  ; scenes/result.e16.ts:281  if (best === 0 || t < best) {
  beq s3, zero, .L4
  lw t0, 0(fp) ; t
  bgeu t0, s3, .L3
.L4:
  ; scenes/result.e16.ts:282  saveWrite(at + 2, t)
  addi a0, s1, 2
  lw a1, 0(fp)
  call saveWrite
  ; scenes/result.e16.ts:283  newRecord[0] = 1
  li t0, 1
  sw t0, newRecord(zero)
.L3:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; scenes/result.e16.ts:288 timeAt(x, y, sec) at -O1
;   x in s1
;   y in s2
;   sec in s3
;   m in s0
timeAt:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; sec
  ; scenes/result.e16.ts:289  if (sec === 0) {
  bne s3, zero, .L1
  ; scenes/result.e16.ts:290  say(x, y, str('--:--'), SL_DIM)
  mv a0, s1
  mv a1, s2
  la a2, str_151
  li a3, 3
  call say
  ; scenes/result.e16.ts:291  return
  j .return
.L1:
  ; scenes/result.e16.ts:293  const m = div(sec, 60)
  li t0, 60
  divu s0, s3, t0
  ; scenes/result.e16.ts:294  number(cellAt(1, x, y), m > 99 ? 99 : m, 2, digit())
  li a0, 1
  mv a1, s1
  mv a2, s2
  call cellAt
  mv t0, a0
  mv t1, s0
  li t2, 99
  bgeu t2, t1, .L2
  li t1, 99
  j .L3
.L2:
  mv t1, s0
.L3:
  mv a0, t0
  mv a1, t1
  li a2, 2
  li a3, 33808
  call number
  ; scenes/result.e16.ts:295  say(x + 2, y, str(':'), SL_P1)
  addi a0, s1, 2
  mv a1, s2
  la a2, str_152
  li a3, 1
  call say
  ; scenes/result.e16.ts:296  number(cellAt(1, x + 3, y), sec - m * 60, 2, digit())
  li a0, 1
  addi a1, s1, 3
  mv a2, s2
  call cellAt
  li t0, 60
  mul t0, s0, t0
  sub a1, s3, t0
  li a2, 2
  li a3, 33808
  call number
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; scenes/result.e16.ts:302 bestDraw(y) at -O1
;   y in s1
;   s in s2
;   at in s3
bestDraw:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; y
  ; scenes/result.e16.ts:303  say(14, y, str('BEST RECORDS'), SL_P1)
  li a0, 14
  mv a1, s1
  la a2, str_153
  li a3, 1
  call say
  ; scenes/result.e16.ts:304  say(4, y + 2, str('SLOT'), SL_DIM)
  li a0, 4
  addi a1, s1, 2
  la a2, str_154
  li a3, 3
  call say
  ; scenes/result.e16.ts:305  say(18, y + 2, str('CLEARS'), SL_DIM)
  li a0, 18
  addi a1, s1, 2
  la a2, str_155
  li a3, 3
  call say
  ; scenes/result.e16.ts:306  say(27, y + 2, str('BEST TIME'), SL_DIM)
  li a0, 27
  addi a1, s1, 2
  la a2, str_156
  li a3, 3
  call say
  ; scenes/result.e16.ts:307  let s: u16 = 0
  li s2, 0 ; s
  ; scenes/result.e16.ts:308  while (s < SLOTS) {
  j .L3
.L1:
  ; scenes/result.e16.ts:309  const at = slotAt(s)
  mv a0, s2
  call slotAt
  mv s3, a0 ; at
  ; scenes/result.e16.ts:310  say(4, y + 4 + s, slName[s], SL_P1)
  addi t0, s1, 4
  add t0, t0, s2
  slli t1, s2, 1
  lw t1, slName(t1)
  li a0, 4
  mv a1, t0
  mv a2, t1
  li a3, 1
  call say
  ; scenes/result.e16.ts:311  count3(20, y + 4 + s, saveRead(at))
  addi t0, s1, 4
  add t0, t0, s2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  call saveRead
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  li a0, 20
  call count3
  ; scenes/result.e16.ts:312  timeAt(29, y + 4 + s, saveRead(at + 2))
  addi t0, s1, 4
  add t0, t0, s2
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s3, 2
  call saveRead
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  li a0, 29
  call timeAt
  ; scenes/result.e16.ts:313  s++
  addi s2, s2, 1
.L3:
  li t0, 4
  bltu s2, t0, .L1
  ; scenes/result.e16.ts:315  say(4, y + 10, str('BEST STREAK'), SL_DIM)
  li a0, 4
  addi a1, s1, 10
  la a2, str_157
  li a3, 3
  call say
  ; scenes/result.e16.ts:316  count3(20, y + 10, saveRead(SV_STREAK))
  li a0, 10
  call saveRead
  addi a1, s1, 10
  mv a2, a0
  li a0, 20
  call count3
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; scenes/result.e16.ts:320 bestRun() at -O1
bestRun:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes/result.e16.ts:321  screenIs(SC_BEST)
  li a0, 11
  call screenIs
  ; scenes/result.e16.ts:322  screenClear()
  call screenClear
  ; scenes/result.e16.ts:323  bestDraw(6)
  li a0, 6
  call bestDraw
  ; scenes/result.e16.ts:324  say(12, 30, str('START OR B: BACK'), SL_DIM)
  li a0, 12
  li a1, 30
  la a2, str_158
  li a3, 3
  call say
  ; scenes/result.e16.ts:325  for (;;) {
.L1:
  ; scenes/result.e16.ts:326  frameBegin()
  call frameBegin
  ; scenes/result.e16.ts:327  if (pressed(B_START) || pressed(B_A) || pressed(B_B)) return
  li a0, 1024
  call pressed
  bnez a0, .L6
  li a0, 16
  call pressed
  bnez a0, .L6
  li a0, 32
  call pressed
  beqz a0, .L1
.L6:
  ; scenes/result.e16.ts:327  return
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

str_134:
  .byte 77, 65, 84, 67, 72, 32, 82, 69, 83, 85, 76, 84, 0
str_135:
  .byte 87, 73, 78, 0
str_136:
  .byte 76, 79, 83, 69, 0
str_137:
  .byte 86, 83, 0
str_138:
  .byte 72, 73, 84, 83, 0
str_139:
  .byte 77, 65, 88, 32, 67, 79, 77, 66, 79, 0
str_140:
  .byte 84, 73, 77, 69, 32, 76, 69, 70, 84, 0
str_141:
  .byte 82, 79, 85, 78, 68, 83, 0
str_142:
  .byte 45, 0
str_143:
  .byte 83, 84, 82, 69, 65, 75, 0
str_144:
  .byte 80, 82, 69, 83, 83, 32, 83, 84, 65, 82, 84, 0
str_145:
  .byte 67, 79, 78, 84, 73, 78, 85, 69, 63, 0
str_146:
  .byte 71, 65, 77, 69, 32, 79, 86, 69, 82, 0
str_147:
  .byte 83, 89, 83, 84, 69, 77, 32, 67, 76, 69, 65, 82, 0
str_148:
  .byte 67, 76, 69, 65, 82, 32, 84, 73, 77, 69, 0
str_149:
  .byte 67, 79, 78, 84, 73, 78, 85, 69, 83, 0
str_150:
  .byte 78, 69, 87, 32, 82, 69, 67, 79, 82, 68, 0
str_151:
  .byte 45, 45, 58, 45, 45, 0
str_152:
  .byte 58, 0
str_153:
  .byte 66, 69, 83, 84, 32, 82, 69, 67, 79, 82, 68, 83, 0
str_154:
  .byte 83, 76, 79, 84, 0
str_155:
  .byte 67, 76, 69, 65, 82, 83, 0
str_156:
  .byte 66, 69, 83, 84, 32, 84, 73, 77, 69, 0
str_157:
  .byte 66, 69, 83, 84, 32, 83, 84, 82, 69, 65, 75, 0
str_158:
  .byte 83, 84, 65, 82, 84, 32, 79, 82, 32, 66, 58, 32, 66, 65, 67, 75, 0
  .align 2

  .bank 8
  .org 0xc000
; cpu/habit.e16.ts:59 oppAt(i, c) at -O1
;   i in a0
;   c in a1
oppAt:
  ; cpu/habit.e16.ts:60  return opp[i * OW + c]
  slli t0, a0, 5
  add t0, t0, a1
  slli t0, t0, 1
  lw a0, opp(t0)
.return:
  ret

; cpu/habit.e16.ts:119 watchReset(i) at -O1
;   i in s1
watchReset:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; i
  ; cpu/habit.e16.ts:120  watchSit[i] = NONE
  slli t0, s1, 1
  li t1, 255
  sw t1, watchSit(t0)
  ; cpu/habit.e16.ts:121  watchT[i] = 0
  slli t0, s1, 1
  sw zero, watchT(t0)
  ; cpu/habit.e16.ts:122  rest[i] = 0
  slli t0, s1, 1
  sw zero, rest(t0)
  ; cpu/habit.e16.ts:123  backT[i] = 0
  slli t0, s1, 1
  sw zero, backT(t0)
  ; cpu/habit.e16.ts:124  wasGuarded[i] = 0
  slli t0, s1, 1
  sw zero, wasGuarded(t0)
  ; cpu/habit.e16.ts:125  airStruck[i] = 0
  slli t0, s1, 1
  sw zero, airStruck(t0)
  ; cpu/habit.e16.ts:126  readOn[i] = 0
  slli t0, s1, 1
  sw zero, readOn(t0)
  ; cpu/habit.e16.ts:127  habCount[i] = 0
  slli t0, s1, 1
  sw zero, habCount(t0)
  ; cpu/habit.e16.ts:128  if (habTarget[i] === 0) drawTarget(i)
  slli t0, s1, 1
  lw t0, habTarget(t0)
  bne t0, zero, .L1
  ; cpu/habit.e16.ts:128  drawTarget(i)
  mv a0, s1
  call drawTarget
.L1:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; cpu/habit.e16.ts:132 habitMatch(i) at -O1
;   i in a0
;   k in a1
habitMatch:
  ; cpu/habit.e16.ts:133  let k: u16 = 0
  li a1, 0 ; k
  ; cpu/habit.e16.ts:134  while (k < 50) {
  j .L3
.L1:
  ; cpu/habit.e16.ts:135  hab[k] = 0
  sb zero, hab(a1)
  ; cpu/habit.e16.ts:136  k++
  addi a1, a1, 1
.L3:
  li t0, 50
  bltu a1, t0, .L1
  ; cpu/habit.e16.ts:138  k = 0
  li a1, 0 ; k
  ; cpu/habit.e16.ts:139  while (k < 10) {
  j .L7
.L5:
  ; cpu/habit.e16.ts:140  habSeen[k] = 0
  sb zero, habSeen(a1)
  ; cpu/habit.e16.ts:141  k++
  addi a1, a1, 1
.L7:
  li t0, 10
  bltu a1, t0, .L5
  ; cpu/habit.e16.ts:143  reads[i] = 0
  slli t0, a0, 1
  sw zero, reads(t0)
  ; cpu/habit.e16.ts:144  readHits[i] = 0
  slli t0, a0, 1
  sw zero, readHits(t0)
  ; cpu/habit.e16.ts:145  readMiss[i] = 0
  slli t0, a0, 1
  sw zero, readMiss(t0)
  ; cpu/habit.e16.ts:146  habDue[i] = 0
  slli t0, a0, 1
  sw zero, habDue(t0)
  ; cpu/habit.e16.ts:147  habFired[i] = 0
  slli t0, a0, 1
  sw zero, habFired(t0)
  ; cpu/habit.e16.ts:148  habDrawnN[i] = 0
  slli t0, a0, 1
  sw zero, habDrawnN(t0)
  ; cpu/habit.e16.ts:149  habTarget[i] = 0
  slli t0, a0, 1
  sw zero, habTarget(t0)
  ; cpu/habit.e16.ts:150  habLast[i] = 0
  slli t0, a0, 1
  sw zero, habLast(t0)
.return:
  ret

; cpu/habit.e16.ts:154 habitLadder() at -O1
;   k in a0
habitLadder:
  ; cpu/habit.e16.ts:155  let k: u16 = 50
  li a0, 50 ; k
  ; cpu/habit.e16.ts:156  while (k < 100) {
  j .L3
.L1:
  ; cpu/habit.e16.ts:157  hab[k] = 0
  sb zero, hab(a0)
  ; cpu/habit.e16.ts:158  k++
  addi a0, a0, 1
.L3:
  li t0, 100
  bltu a0, t0, .L1
  ; cpu/habit.e16.ts:160  k = 10
  li a0, 10 ; k
  ; cpu/habit.e16.ts:161  while (k < 20) {
  j .L7
.L5:
  ; cpu/habit.e16.ts:162  habSeen[k] = 0
  sb zero, habSeen(a0)
  ; cpu/habit.e16.ts:163  k++
  addi a0, a0, 1
.L7:
  li t0, 20
  bltu a0, t0, .L5
  ; cpu/habit.e16.ts:165  k = 0
  li a0, 0 ; k
  ; cpu/habit.e16.ts:166  while (k < 16) {
  j .L11
.L9:
  ; cpu/habit.e16.ts:167  hist[k] = 0
  slli t0, a0, 1
  sw zero, hist(t0)
  ; cpu/habit.e16.ts:168  k++
  addi a0, a0, 1
.L11:
  li t0, 16
  bltu a0, t0, .L9
.return:
  ret

; cpu/habit.e16.ts:173 histRange() at -O1
;   best in a1
;   k in a0
histRange:
  ; cpu/habit.e16.ts:174  let best: u16 = 4
  li a1, 4 ; best
  ; cpu/habit.e16.ts:175  let k: u16 = 0
  li a0, 0 ; k
  ; cpu/habit.e16.ts:176  while (k < 16) {
  j .L3
.L1:
  ; cpu/habit.e16.ts:177  if (hist[k] > hist[best]) best = k
  slli t0, a0, 1
  lw t0, hist(t0)
  slli t1, a1, 1
  lw t1, hist(t1)
  bgeu t1, t0, .L5
  ; cpu/habit.e16.ts:177  best = k
  mv a1, a0 ; best
.L5:
  ; cpu/habit.e16.ts:178  k++
  addi a0, a0, 1
.L3:
  li t0, 16
  bltu a0, t0, .L1
  ; cpu/habit.e16.ts:180  return best * 16 + 8
  slli t0, a1, 4
  addi a0, t0, 8
.return:
  ret

; cpu/habit.e16.ts:189 pastAt(j, age) at -O1
;   j in a0
;   age in a1
pastAt:
  ; cpu/habit.e16.ts:190  return j * 32 + ((seenN - age) & 31)
  slli t0, a0, 5
  lw t1, 0x0ea8(zero)
  sub t1, t1, a1
  andi t1, t1, 31
  add a0, t0, t1
.return:
  ret

; cpu/habit.e16.ts:193 stateAt(j, age) at -O1
;   j in s1
;   age in s2
stateAt:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; j
  mv s2, a1 ; age
  ; cpu/habit.e16.ts:194  return seenS[pastAt(j, age)] & 255
  mv a0, s1
  mv a1, s2
  call pastAt
  slli t0, a0, 1
  lw t0, seenS(t0)
  andi a0, t0, 255
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; cpu/habit.e16.ts:198 apartPast(age) at -O1
;   age in s3
;   a in s1
;   b in s2
apartPast:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; age
  ; cpu/habit.e16.ts:199  const a = seenX[pastAt(0, age)]
  li a0, 0
  mv a1, s3
  call pastAt
  slli t0, a0, 1
  lw s1, seenX(t0)
  ; cpu/habit.e16.ts:200  const b = seenX[pastAt(1, age)]
  li a0, 1
  mv a1, s3
  call pastAt
  slli t0, a0, 1
  lw s2, seenX(t0)
  ; cpu/habit.e16.ts:201  return a > b ? a - b : b - a
  bgeu s2, s1, .L1
  sub t0, s1, s2
  j .L2
.L1:
  sub t0, s2, s1
.L2:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; cpu/habit.e16.ts:208 observe(i, j) at -O1
;   i in s1
;   j in s2
;   e in 2(fp)
;   s1 in 0(fp)
;   s2 in 4(fp)
;   did in s3
observe:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; i
  mv s2, a1 ; j
  ; cpu/habit.e16.ts:209  const e = pastAt(j, 1)
  mv a0, s2
  li a1, 1
  call pastAt
  sw a0, 2(fp) ; e
  ; cpu/habit.e16.ts:210  const s1 = seenS[e] & 255
  lw t0, 2(fp) ; e
  slli t0, t0, 1
  lw t0, seenS(t0)
  andi t0, t0, 255
  sw t0, 0(fp) ; s1
  ; cpu/habit.e16.ts:211  const s2 = stateAt(j, 2)
  mv a0, s2
  li a1, 2
  call stateAt
  sw a0, 4(fp) ; s2
  ; cpu/habit.e16.ts:212  marks(i, e, s1)
  mv a0, s1
  lw a1, 2(fp)
  lw a2, 0(fp)
  call marks
  ; cpu/habit.e16.ts:213  where()
  call where
  ; cpu/habit.e16.ts:214  if (watchSit[i] === NONE && !watchStart(i, j, s1, s2)) return
  slli t0, s1, 1
  lw t0, watchSit(t0)
  li t1, 255
  bne t0, t1, .L1
  mv a0, s1
  mv a1, s2
  lw a2, 0(fp)
  lw a3, 4(fp)
  call watchStart
  bnez a0, .L1
  ; cpu/habit.e16.ts:214  return
  j .return
.L1:
  ; cpu/habit.e16.ts:215  watchT[i]++
  slli t0, s1, 1
  addi t0, t0, watchT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/habit.e16.ts:216  let did = didOf(i, j, s1, s2)
  mv a0, s1
  mv a1, s2
  lw a2, 0(fp)
  lw a3, 4(fp)
  call didOf
  mv s3, a0 ; did
  ; cpu/habit.e16.ts:217  if (did === NONE && watchT[i] >= WATCH_F) did = DID_WAIT
  li t0, 255
  bne s3, t0, .L2
  slli t0, s1, 1
  lw t0, watchT(t0)
  li t1, 40
  bltu t0, t1, .L2
  ; cpu/habit.e16.ts:217  did = DID_WAIT
  li s3, 4 ; did
.L2:
  ; cpu/habit.e16.ts:218  if (did === NONE) return
  li t0, 255
  bne s3, t0, .L3
  ; cpu/habit.e16.ts:218  return
  j .return
.L3:
  ; cpu/habit.e16.ts:219  tally(j, watchSit[i], did)
  slli t0, s1, 1
  lw t0, watchSit(t0)
  mv a0, s2
  mv a1, t0
  mv a2, s3
  call tally
  ; cpu/habit.e16.ts:220  readCheck(i, did)
  mv a0, s1
  mv a1, s3
  call readCheck
  ; cpu/habit.e16.ts:221  if (watchSit[i] === HS_MIDDLE || watchSit[i] === HS_LOW) rest[i] = REST_F
  slli t0, s1, 1
  lw t0, watchSit(t0)
  li t1, 2
  beq t0, t1, .L5
  slli t0, s1, 1
  lw t0, watchSit(t0)
  li t1, 4
  bne t0, t1, .L4
.L5:
  ; cpu/habit.e16.ts:221  rest[i] = REST_F
  slli t0, s1, 1
  li t1, 40
  sw t1, rest(t0)
.L4:
  ; cpu/habit.e16.ts:222  watchSit[i] = NONE
  slli t0, s1, 1
  li t1, 255
  sw t1, watchSit(t0)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; cpu/habit.e16.ts:229 marks(i, e, s1) at -O1
;   i in a0
;   e in a1
;   s1 in a2
marks:
  ; cpu/habit.e16.ts:230  if (seenF[e] >> 8 === 2) wasGuarded[i] = 1
  slli t0, a1, 1
  lw t0, seenF(t0)
  srli t0, t0, 8
  li t1, 2
  bne t0, t1, .L1
  ; cpu/habit.e16.ts:230  wasGuarded[i] = 1
  slli t0, a0, 1
  li t1, 1
  sw t1, wasGuarded(t0)
.L1:
  ; cpu/habit.e16.ts:231  if (s1 === ST_ATTACK && seenY[e] > 0) airStruck[i] = 1
  li t0, 5
  bne a2, t0, .L2
  slli t0, a1, 1
  lw t0, seenY(t0)
  bgeu zero, t0, .L2
  ; cpu/habit.e16.ts:231  airStruck[i] = 1
  slli t0, a0, 1
  li t1, 1
  sw t1, airStruck(t0)
.L2:
  ; cpu/habit.e16.ts:232  if (s1 !== ST_ATTACK && s1 !== ST_LAND && seenY[e] === 0) airStruck[i] = 0
  li t0, 5
  beq a2, t0, .L3
  li t0, 4
  beq a2, t0, .L3
  slli t0, a1, 1
  lw t0, seenY(t0)
  bne t0, zero, .L3
  ; cpu/habit.e16.ts:232  airStruck[i] = 0
  slli t0, a0, 1
  sw zero, airStruck(t0)
.L3:
  ; cpu/habit.e16.ts:233  if (s1 === ST_DOWN && watchSit[i] !== NONE && watchSit[i] !== HS_WAKE) {
  li t0, 8
  bne a2, t0, .L4
  slli t0, a0, 1
  lw t0, watchSit(t0)
  li t1, 255
  beq t0, t1, .L4
  slli t0, a0, 1
  lw t0, watchSit(t0)
  li t1, 1
  beq t0, t1, .L4
  ; cpu/habit.e16.ts:234  watchSit[i] = NONE
  slli t0, a0, 1
  li t1, 255
  sw t1, watchSit(t0)
  ; cpu/habit.e16.ts:235  readOn[i] = 0
  slli t0, a0, 1
  sw zero, readOn(t0)
.L4:
.return:
  ret

; cpu/habit.e16.ts:240 watchStart(i, j, s1, s2) at -O1
;   i in s1
;   j in s3
;   s1 in 0(fp)
;   s2 in 2(fp)
;   sit in s2
watchStart:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s3, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; i
  mv s3, a1 ; j
  sw a2, 0(fp) ; s1
  sw a3, 2(fp) ; s2
  ; cpu/habit.e16.ts:241  if (rest[i] > 0) rest[i]--
  slli t0, s1, 1
  lw t0, rest(t0)
  bgeu zero, t0, .L1
  ; cpu/habit.e16.ts:241  rest[i]--
  slli t0, s1, 1
  addi t0, t0, rest
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, -1
  sw t1, 0(t0)
.L1:
  ; cpu/habit.e16.ts:242  const sit = startOf(i, j, s1, s2)
  mv a0, s1
  mv a1, s3
  lw a2, 0(fp)
  lw a3, 2(fp)
  call startOf
  mv s2, a0 ; sit
  ; cpu/habit.e16.ts:243  if (sit === NONE) return false
  li t0, 255
  bne s2, t0, .L2
  ; cpu/habit.e16.ts:243  return false
  li a0, 0
  j .return
.L2:
  ; cpu/habit.e16.ts:244  watchSit[i] = sit
  slli t0, s1, 1
  sw s2, watchSit(t0)
  ; cpu/habit.e16.ts:245  watchT[i] = 0
  slli t0, s1, 1
  sw zero, watchT(t0)
  ; cpu/habit.e16.ts:246  backT[i] = 0
  slli t0, s1, 1
  sw zero, backT(t0)
  ; cpu/habit.e16.ts:247  readTry(i, j, sit)
  mv a0, s1
  mv a1, s3
  mv a2, s2
  call readTry
  ; cpu/habit.e16.ts:248  return true
  li a0, 1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s3, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; cpu/habit.e16.ts:252 where() at -O1
;   d in s1
where:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; cpu/habit.e16.ts:253  if ((seenN & 7) !== 0) return
  lw t0, 0x0ea8(zero)
  andi t0, t0, 7
  beq t0, zero, .L1
  ; cpu/habit.e16.ts:253  return
  j .return
.L1:
  ; cpu/habit.e16.ts:254  const d = apartPast(1) >> 4
  li a0, 1
  call apartPast
  srli s1, a0, 4
  ; cpu/habit.e16.ts:255  if (d < 16 && hist[d] < 0xfff0) hist[d]++
  li t0, 16
  bgeu s1, t0, .L2
  slli t0, s1, 1
  lw t0, hist(t0)
  li t1, 65520
  bgeu t0, t1, .L2
  ; cpu/habit.e16.ts:255  hist[d]++
  slli t0, s1, 1
  addi t0, t0, hist
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; cpu/habit.e16.ts:261 startOf(i, j, s1, s2) at -O1
;   i in s1
;   j in s3
;   s1 in s2
;   s2 in 0(fp)
;   freed in 2(fp)
;   d in 4(fp)
startOf:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; i
  mv s3, a1 ; j
  mv s2, a2 ; s1
  sw a3, 0(fp) ; s2
  ; cpu/habit.e16.ts:262  if (s1 === ST_WAKE && s2 === ST_DOWN) return HS_WAKE
  li t0, 9
  bne s2, t0, .L1
  li t0, 8
  lw t1, 0(fp) ; s2
  bne t1, t0, .L1
  ; cpu/habit.e16.ts:262  return HS_WAKE
  li a0, 1
  j .return
.L1:
  ; cpu/habit.e16.ts:263  const freed = s1 === ST_STAND || s1 === ST_CROUCH
  sub t0, s2, zero
  seqz t0, t0
  mv t1, t0
  bnez t1, .L2
  li t0, 1
  sub t0, s2, t0
  seqz t0, t0
.L2:
  sw t0, 2(fp) ; freed
  ; cpu/habit.e16.ts:264  if (wasGuarded[i] !== 0 && freed) {
  slli t0, s1, 1
  lw t0, wasGuarded(t0)
  beq t0, zero, .L3
  lw t0, 2(fp) ; freed
  beqz t0, .L3
  ; cpu/habit.e16.ts:265  wasGuarded[i] = 0
  slli t0, s1, 1
  sw zero, wasGuarded(t0)
  ; cpu/habit.e16.ts:266  return HS_GUARDED
  li a0, 0
  j .return
.L3:
  ; cpu/habit.e16.ts:268  if (s1 === ST_LAND && s2 !== ST_LAND && airStruck[i] !== 0) {
  li t0, 4
  bne s2, t0, .L4
  li t0, 4
  lw t1, 0(fp) ; s2
  beq t1, t0, .L4
  slli t0, s1, 1
  lw t0, airStruck(t0)
  beq t0, zero, .L4
  ; cpu/habit.e16.ts:269  airStruck[i] = 0
  slli t0, s1, 1
  sw zero, airStruck(t0)
  ; cpu/habit.e16.ts:270  return HS_LANDED
  li a0, 3
  j .return
.L4:
  ; cpu/habit.e16.ts:272  if (!freed || rest[i] > 0) return NONE
  lw t0, 2(fp) ; freed
  beqz t0, .L6
  slli t0, s1, 1
  lw t0, rest(t0)
  bgeu zero, t0, .L5
.L6:
  ; cpu/habit.e16.ts:272  return NONE
  li a0, 255
  j .return
.L5:
  ; cpu/habit.e16.ts:273  const d = apartPast(1)
  li a0, 1
  call apartPast
  sw a0, 4(fp) ; d
  ; cpu/habit.e16.ts:274  if (d < 50 || d > 150) return NONE
  li t0, 50
  lw t1, 4(fp) ; d
  bltu t1, t0, .L8
  li t0, 150
  lw t1, 4(fp) ; d
  bgeu t0, t1, .L7
.L8:
  ; cpu/habit.e16.ts:274  return NONE
  li a0, 255
  j .return
.L7:
  ; cpu/habit.e16.ts:275  return fLife[j] * 4 < prAt(j, P_LIFE) ? HS_LOW : HS_MIDDLE
  slli t0, s3, 1
  lw t0, fLife(t0)
  slli t0, t0, 2
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  li a1, 0
  call prAt
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu t0, a0, .L9
  li t0, 4
  j .L10
.L9:
  li t0, 2
.L10:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; cpu/habit.e16.ts:279 didOf(i, j, s1, s2) at -O1
;   i in s2
;   j in s3
;   s1 in s1
;   s2 in s0
didOf:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; i
  mv s3, a1 ; j
  mv s1, a2 ; s1
  mv s0, a3 ; s2
  ; cpu/habit.e16.ts:280  if (s1 === ST_WAKE || s1 === ST_DOWN) return NONE
  li t0, 9
  beq s1, t0, .L2
  li t0, 8
  bne s1, t0, .L1
.L2:
  ; cpu/habit.e16.ts:280  return NONE
  li a0, 255
  j .return
.L1:
  ; cpu/habit.e16.ts:281  if (s1 === ST_ATTACK && s2 !== ST_ATTACK) {
  li t0, 5
  bne s1, t0, .L3
  li t0, 5
  beq s0, t0, .L3
  ; cpu/habit.e16.ts:282  return seenS[pastAt(j, 1)] >> 8 === MV_THROW ? DID_THROW : DID_STRIKE
  mv a0, s3
  li a1, 1
  call pastAt
  slli t0, a0, 1
  lw t0, seenS(t0)
  srli t0, t0, 8
  li t1, 12
  bne t0, t1, .L4
  li t0, 1
  j .L5
.L4:
  li t0, 0
.L5:
  mv a0, t0
  j .return
.L3:
  ; cpu/habit.e16.ts:284  if (s1 === ST_PREJUMP) return DID_JUMP
  li t0, 2
  bne s1, t0, .L6
  ; cpu/habit.e16.ts:284  return DID_JUMP
  li a0, 2
  j .return
.L6:
  ; cpu/habit.e16.ts:285  if (s1 === ST_BACKDASH) return DID_BACK
  li t0, 14
  bne s1, t0, .L7
  ; cpu/habit.e16.ts:285  return DID_BACK
  li a0, 3
  j .return
.L7:
  ; cpu/habit.e16.ts:286  if (s1 === ST_STAND && apartPast(1) > apartPast(2)) backT[i]++
  bne s1, zero, .L8
  li a0, 1
  call apartPast
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 2
  call apartPast
  lw t0, 0(sp)
  addi sp, sp, 2
  bgeu a0, t0, .L8
  ; cpu/habit.e16.ts:286  backT[i]++
  slli t0, s2, 1
  addi t0, t0, backT
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  j .L9
.L8:
  ; cpu/habit.e16.ts:287  backT[i] = 0
  slli t0, s2, 1
  sw zero, backT(t0)
.L9:
  ; cpu/habit.e16.ts:288  return backT[i] >= BACK_F ? DID_BACK : NONE
  slli t0, s2, 1
  lw t0, backT(t0)
  li t1, 6
  bltu t0, t1, .L10
  li t0, 3
  j .L11
.L10:
  li t0, 255
.L11:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; cpu/habit.e16.ts:292 tally(j, sit, did) at -O1
;   j in 0(fp)
;   sit in 2(fp)
;   did in 4(fp)
;   r in s1
;   base in s2
;   v in 6(fp)
;   n in s3
tally:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  sw a0, 0(fp) ; j
  sw a1, 2(fp) ; sit
  sw a2, 4(fp) ; did
  ; cpu/habit.e16.ts:293  let r: u16 = 0
  li s1, 0 ; r
  ; cpu/habit.e16.ts:294  while (r < 2) {
  j .L3
.L1:
  ; cpu/habit.e16.ts:295  const base = r * 50 + j * 25 + sit * 5
  li t0, 50
  mul t0, s1, t0
  li t1, 25
  lw t2, 0(fp) ; j
  mul t2, t2, t1
  add t0, t0, t2
  lw t1, 2(fp) ; sit
  slli t2, t1, 2
  add t1, t2, t1
  add s2, t0, t1
  ; cpu/habit.e16.ts:296  const v = hab[base + did] + STEP
  lw t0, 4(fp) ; did
  add t0, s2, t0
  lbu t0, hab(t0)
  addi t0, t0, 16
  sw t0, 6(fp) ; v
  ; cpu/habit.e16.ts:297  hab[base + did] = v > MOST ? MOST : v
  lw t0, 4(fp) ; did
  add t0, s2, t0
  addi t0, t0, hab
  lw t1, 6(fp)
  li t2, 255
  bgeu t2, t1, .L5
  li t1, 255
  j .L6
.L5:
  lw t1, 6(fp)
.L6:
  sb t1, 0(t0)
  ; cpu/habit.e16.ts:298  const n = r * 10 + j * 5 + sit
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  lw t1, 0(fp) ; j
  slli t2, t1, 2
  add t1, t2, t1
  add t0, t0, t1
  lw t1, 2(fp) ; sit
  add s3, t0, t1
  ; cpu/habit.e16.ts:299  habSeen[n] = habSeen[n] + 1
  lbu t0, habSeen(s3)
  addi t0, t0, 1
  sb t0, habSeen(s3)
  ; cpu/habit.e16.ts:300  if ((habSeen[n] & 15) === 0) halve(base)
  lbu t0, habSeen(s3)
  andi t0, t0, 15
  bne t0, zero, .L7
  ; cpu/habit.e16.ts:300  halve(base)
  mv a0, s2
  call halve
.L7:
  ; cpu/habit.e16.ts:301  r++
  addi s1, s1, 1
.L3:
  li t0, 2
  bltu s1, t0, .L1
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; cpu/habit.e16.ts:305 halve(base) at -O1
;   base in a0
;   k in a1
halve:
  ; cpu/habit.e16.ts:306  let k: u16 = 0
  li a1, 0 ; k
  ; cpu/habit.e16.ts:307  while (k < 5) {
  j .L3
.L1:
  ; cpu/habit.e16.ts:308  hab[base + k] = hab[base + k] >> 1
  add t0, a0, a1
  add t1, a0, a1
  lbu t1, hab(t1)
  srli t1, t1, 1
  sb t1, hab(t0)
  ; cpu/habit.e16.ts:309  k++
  addi a1, a1, 1
.L3:
  li t0, 5
  bltu a1, t0, .L1
.return:
  ret

; cpu/habit.e16.ts:319 readTry(i, j, sit) at -O1
;   i in s1
;   j in 4(fp)
;   sit in 6(fp)
;   base in 0(fp)
;   best in s3
;   sum in 2(fp)
;   k in s2
readTry:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s1, a0 ; i
  sw a1, 4(fp) ; j
  sw a2, 6(fp) ; sit
  ; cpu/habit.e16.ts:320  if (randBelow(256) >= oppAt(i, O_READ)) return
  li a0, 256
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 11
  call oppAt
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu t0, a0, .L1
  ; cpu/habit.e16.ts:320  return
  j .return
.L1:
  ; cpu/habit.e16.ts:321  const base = ((oppAt(i, O_FLAGS) & OF_KEEP) !== 0 ? 50 : 0) + j * 25 + sit * 5
  mv a0, s1
  li a1, 24
  call oppAt
  andi t0, a0, 32
  beq t0, zero, .L2
  li t0, 50
  j .L3
.L2:
  li t0, 0
.L3:
  li t1, 25
  lw t2, 4(fp) ; j
  mul t2, t2, t1
  add t0, t0, t2
  lw t1, 6(fp) ; sit
  slli t2, t1, 2
  add t1, t2, t1
  add t0, t0, t1
  sw t0, 0(fp) ; base
  ; cpu/habit.e16.ts:322  let best: u16 = 0
  li s3, 0 ; best
  ; cpu/habit.e16.ts:323  let sum: u16 = 0
  sw zero, 2(fp) ; sum
  ; cpu/habit.e16.ts:324  let k: u16 = 0
  li s2, 0 ; k
  ; cpu/habit.e16.ts:325  while (k < 5) {
  j .L6
.L4:
  ; cpu/habit.e16.ts:326  sum = sum + hab[base + k]
  lw t0, 0(fp) ; base
  add t0, t0, s2
  lbu t0, hab(t0)
  lw t1, 2(fp) ; sum
  add t1, t1, t0
  sw t1, 2(fp) ; sum
  ; cpu/habit.e16.ts:327  if (hab[base + k] > hab[base + best]) best = k
  lw t0, 0(fp) ; base
  add t0, t0, s2
  lbu t0, hab(t0)
  lw t1, 0(fp) ; base
  add t1, t1, s3
  lbu t1, hab(t1)
  bgeu t1, t0, .L8
  ; cpu/habit.e16.ts:327  best = k
  mv s3, s2 ; best
.L8:
  ; cpu/habit.e16.ts:328  k++
  addi s2, s2, 1
.L6:
  li t0, 5
  bltu s2, t0, .L4
  ; cpu/habit.e16.ts:330  if (sum < KNOWN || hab[base + best] * 2 <= sum) return
  li t0, 32
  lw t1, 2(fp) ; sum
  bltu t1, t0, .L10
  lw t0, 0(fp) ; base
  add t0, t0, s3
  lbu t0, hab(t0)
  slli t0, t0, 1
  lw t1, 2(fp) ; sum
  bltu t1, t0, .L9
.L10:
  ; cpu/habit.e16.ts:330  return
  j .return
.L9:
  ; cpu/habit.e16.ts:331  reads[i]++
  slli t0, s1, 1
  addi t0, t0, reads
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/habit.e16.ts:332  readOn[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, readOn(t0)
  ; cpu/habit.e16.ts:333  readPred[i] = best
  slli t0, s1, 1
  sw s3, readPred(t0)
  ; cpu/habit.e16.ts:334  answer(i, best)
  mv a0, s1
  mv a1, s3
  call answer
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; cpu/habit.e16.ts:341 answer(i, did) at -O1
;   i in s1
;   did in s2
answer:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; did
  ; cpu/habit.e16.ts:342  patNo[i] = 0
  slli t0, s1, 1
  sw zero, patNo(t0)
  ; cpu/habit.e16.ts:343  if (did === DID_STRIKE) planSet(i, A_GUARD, 30)
  bne s2, zero, .L1
  ; cpu/habit.e16.ts:343  planSet(i, A_GUARD, 30)
  mv a0, s1
  li a1, 7
  li a2, 30
  la t0, planSet
  li t1, 258
  call far_call
  j .L2
.L1:
  ; cpu/habit.e16.ts:344  if (did === DID_THROW) planSet(i, A_LIGHT, 30)
  li t0, 1
  bne s2, t0, .L3
  ; cpu/habit.e16.ts:344  planSet(i, A_LIGHT, 30)
  mv a0, s1
  li a1, 0
  li a2, 30
  la t0, planSet
  li t1, 258
  call far_call
  j .L4
.L3:
  ; cpu/habit.e16.ts:345  if (did === DID_JUMP) planSet(i, A_AA, 40)
  li t0, 2
  bne s2, t0, .L5
  ; cpu/habit.e16.ts:345  planSet(i, A_AA, 40)
  mv a0, s1
  li a1, 10
  li a2, 40
  la t0, planSet
  li t1, 258
  call far_call
  j .L6
.L5:
  ; cpu/habit.e16.ts:346  if (did === DID_BACK) planSet(i, A_APPROACH, 30)
  li t0, 3
  bne s2, t0, .L7
  ; cpu/habit.e16.ts:346  planSet(i, A_APPROACH, 30)
  mv a0, s1
  li a1, 6
  li a2, 30
  la t0, planSet
  li t1, 258
  call far_call
  j .L8
.L7:
  ; cpu/habit.e16.ts:347  planSet(i, A_THROW, 30)
  mv a0, s1
  li a1, 5
  li a2, 30
  la t0, planSet
  li t1, 258
  call far_call
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

; cpu/habit.e16.ts:351 readCheck(i, did) at -O1
;   i in s1
;   did in s2
readCheck:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; did
  ; cpu/habit.e16.ts:352  if (readOn[i] === 0) return
  slli t0, s1, 1
  lw t0, readOn(t0)
  bne t0, zero, .L1
  ; cpu/habit.e16.ts:352  return
  j .return
.L1:
  ; cpu/habit.e16.ts:353  readOn[i] = 0
  slli t0, s1, 1
  sw zero, readOn(t0)
  ; cpu/habit.e16.ts:354  if (did === readPred[i]) {
  slli t0, s1, 1
  lw t0, readPred(t0)
  bne s2, t0, .L2
  ; cpu/habit.e16.ts:355  readHits[i]++
  slli t0, s1, 1
  addi t0, t0, readHits
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/habit.e16.ts:356  logPost(LOG_READ, i, 0)
  li a0, 5
  mv a1, s1
  li a2, 0
  call logPost
  j .L3
.L2:
  ; cpu/habit.e16.ts:357  readMiss[i]++
  slli t0, s1, 1
  addi t0, t0, readMiss
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; cpu/habit.e16.ts:366 habitStep(i, j) at -O1
;   i in s1
;   j in s2
habitStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; i
  mv s2, a1 ; j
  ; cpu/habit.e16.ts:367  if (oppAt(i, O_PATTERN) === 0) return
  mv a0, s1
  li a1, 18
  call oppAt
  bne a0, zero, .L1
  ; cpu/habit.e16.ts:367  return
  j .return
.L1:
  ; cpu/habit.e16.ts:368  if (!triggered(i, j, oppAt(i, O_EVENT))) return
  mv a0, s1
  li a1, 22
  call oppAt
  mv a1, s2
  mv a2, a0
  mv a0, s1
  call triggered
  bnez a0, .L2
  ; cpu/habit.e16.ts:368  return
  j .return
.L2:
  ; cpu/habit.e16.ts:369  habCount[i]++
  slli t0, s1, 1
  addi t0, t0, habCount
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/habit.e16.ts:370  if (habCount[i] < habTarget[i]) return
  slli t0, s1, 1
  lw t0, habCount(t0)
  slli t1, s1, 1
  lw t1, habTarget(t1)
  bgeu t0, t1, .L3
  ; cpu/habit.e16.ts:370  return
  j .return
.L3:
  ; cpu/habit.e16.ts:371  habCount[i] = 0
  slli t0, s1, 1
  sw zero, habCount(t0)
  ; cpu/habit.e16.ts:372  habDue[i]++
  slli t0, s1, 1
  addi t0, t0, habDue
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/habit.e16.ts:373  patGap[i] = habTarget[i]
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, habTarget(t1)
  sw t1, patGap(t0)
  ; cpu/habit.e16.ts:374  drawTarget(i)
  mv a0, s1
  call drawTarget
  ; cpu/habit.e16.ts:375  if (randBelow(256) >= oppAt(i, O_HABIT)) return
  li a0, 256
  call randBelow
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  li a1, 19
  call oppAt
  lw t0, 0(sp)
  addi sp, sp, 2
  bltu t0, a0, .L4
  ; cpu/habit.e16.ts:375  return
  j .return
.L4:
  ; cpu/habit.e16.ts:376  habFired[i]++
  slli t0, s1, 1
  addi t0, t0, habFired
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
  ; cpu/habit.e16.ts:377  habitDue[i] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, habitDue(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; cpu/habit.e16.ts:384 triggered(i, j, ev) at -O1
;   i in s2
;   j in 0(fp)
;   ev in s1
;   e in s3
;   heavy in 2(fp)
triggered:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; i
  sw a1, 0(fp) ; j
  mv s1, a2 ; ev
  ; cpu/habit.e16.ts:385  if (ev === 4) return true
  li t0, 4
  bne s1, t0, .L1
  ; cpu/habit.e16.ts:385  return true
  li a0, 1
  j .return
.L1:
  ; cpu/habit.e16.ts:386  if (ev === 3) return stateAt(j, 1) === ST_STAND && apartPast(1) > apartPast(2)
  li t0, 3
  bne s1, t0, .L2
  ; cpu/habit.e16.ts:386  return stateAt(j, 1) === ST_STAND && apartPast(1) > apartPast(2)
  lw a0, 0(fp)
  li a1, 1
  call stateAt
  sub t0, a0, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L3
  li a0, 1
  call apartPast
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 2
  call apartPast
  lw t0, 0(sp)
  addi sp, sp, 2
  sltu t0, a0, t0
.L3:
  mv a0, t0
  j .return
.L2:
  ; cpu/habit.e16.ts:387  if (ev !== 1 && ev !== 2) return false
  li t0, 1
  beq s1, t0, .L4
  li t0, 2
  beq s1, t0, .L4
  ; cpu/habit.e16.ts:387  return false
  li a0, 0
  j .return
.L4:
  ; cpu/habit.e16.ts:388  const e = pastAt(i, 1)
  mv a0, s2
  li a1, 1
  call pastAt
  mv s3, a0 ; e
  ; cpu/habit.e16.ts:389  if (seenF[e] >> 8 !== 2) return false
  slli t0, s3, 1
  lw t0, seenF(t0)
  srli t0, t0, 8
  li t1, 2
  beq t0, t1, .L5
  ; cpu/habit.e16.ts:389  return false
  li a0, 0
  j .return
.L5:
  ; cpu/habit.e16.ts:390  const heavy = (mvAt(i, seenS[e] >> 8, M_KIND) & K_HEAVY) !== 0
  slli t0, s3, 1
  lw t0, seenS(t0)
  srli t0, t0, 8
  mv a0, s2
  mv a1, t0
  li a2, 11
  call mvAt
  andi t0, a0, 2
  sub t0, t0, zero
  snez t0, t0
  sw t0, 2(fp) ; heavy
  ; cpu/habit.e16.ts:391  return heavy === (ev === 2)
  li t0, 2
  sub t0, s1, t0
  seqz t0, t0
  lw t1, 2(fp) ; heavy
  sub t1, t1, t0
  seqz a0, t1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; cpu/habit.e16.ts:395 drawTarget(i) at -O1
;   i in s1
;   lo in s3
;   hi in s0
;   n in s2
drawTarget:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s2, 8(sp)
  mv s1, a0 ; i
  ; cpu/habit.e16.ts:396  const lo = oppAt(i, O_TRIG_MIN)
  mv a0, s1
  li a1, 20
  call oppAt
  mv s3, a0 ; lo
  ; cpu/habit.e16.ts:397  const hi = oppAt(i, O_TRIG_MAX)
  mv a0, s1
  li a1, 21
  call oppAt
  mv s0, a0 ; hi
  ; cpu/habit.e16.ts:398  let n = lo + randBelow(hi - lo + 1)
  sub t0, s0, s3
  addi a0, t0, 1
  call randBelow
  add s2, s3, a0
  ; cpu/habit.e16.ts:399  if (n === habLast[i] && hi > lo) n = n === hi ? lo : n + 1
  slli t0, s1, 1
  lw t0, habLast(t0)
  bne s2, t0, .L1
  bgeu s3, s0, .L1
  ; cpu/habit.e16.ts:399  n = n === hi ? lo : n + 1
  bne s2, s0, .L2
  mv t0, s3
  j .L3
.L2:
  addi t0, s2, 1
.L3:
  mv s2, t0 ; n
.L1:
  ; cpu/habit.e16.ts:400  habLast[i] = n
  slli t0, s1, 1
  sw s2, habLast(t0)
  ; cpu/habit.e16.ts:401  habTarget[i] = n
  slli t0, s1, 1
  sw s2, habTarget(t0)
  ; cpu/habit.e16.ts:402  habDrawn[i * 16 + (habDrawnN[i] & 15)] = n
  slli t0, s1, 4
  slli t1, s1, 1
  lw t1, habDrawnN(t1)
  andi t1, t1, 15
  add t0, t0, t1
  slli t0, t0, 1
  sw s2, habDrawn(t0)
  ; cpu/habit.e16.ts:403  habDrawnN[i]++
  slli t0, s1, 1
  addi t0, t0, habDrawnN
  mv t1, t0
  lw t1, 0(t1)
  addi t1, t1, 1
  sw t1, 0(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

  .align 2
