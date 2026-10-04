; Made by e16c from lib/kit.e16.ts, lib/sound.e16.ts, math.e16.ts, sky.e16.ts, flight.e16.ts, bandit.e16.ts, arms.e16.ts, fx.e16.ts, hud.e16.ts, audio.e16.ts, game.e16.ts, ai.e16.ts, scenes.e16.ts, best.e16.ts, assets.e16.ts: do not edit.

; sprN at 0x0880
; sprShown at 0x0882
; padIs at 0x0884
; padWas at 0x0886
; seed at 0x0aca
; muted at 0x0c8c
; opTook at 0x0c8e
; sinA at 0x0cfa
; cosA at 0x0cfc
; cockpitOn at 0x0cfe
; shakeLeft at 0x0d00
; shakeX at 0x0d02
; shakeY at 0x0d04
; flashLeft at 0x0d06
; flashRgb at 0x0d08
; hNX at 0x159e
; hNY at 0x15a0
; hC at 0x15a2
; hL at 0x15a4
; bodyX at 0x15a6
; bodyY at 0x15a8
; bodyZ at 0x15aa
; scrX at 0x15ac
; scrY at 0x15ae
; pSpeed at 0x15b0
; pAlt at 0x15b2
; pAltFrac at 0x15b4
; rollRate at 0x15b6
; pitchRate at 0x15b8
; throttle at 0x15ba
; stickReversed at 0x15bc
; ace at 0x15f2
; eHP at 0x15f4
; eHPMax at 0x15f6
; eSpeed at 0x15f8
; eCruise at 0x15fa
; eRollMax at 0x15fc
; ePullMax at 0x15fe
; eAlive at 0x1600
; eFlash at 0x1602
; eRollRate at 0x1604
; ePitchRate at 0x1606
; eWantRoll at 0x1608
; eWantPitch at 0x160a
; eWantSpeed at 0x160c
; eBX at 0x160e
; eBY at 0x1610
; eBZ at 0x1612
; eSX at 0x1614
; eSY at 0x1616
; eOn at 0x1618
; eSize at 0x161a
; eDist at 0x161c
; frameShown at 0x16a6
; viewMirror at 0x16a8
; frameFlips at 0x16aa
; viewTick at 0x16ac
; classWas at 0x16ae
; frameNow at 0x16b0
; flipsNow at 0x16b2
; eClass at 0x16b4
; bNext at 0x1836
; gunCool at 0x1838
; muzzle at 0x183a
; hitsOnEnemy at 0x183c
; hitsOnPlayer at 0x183e
; roundsFired at 0x1840
; roundsHit at 0x1842
; gunFiring at 0x1844
; missilesLeft at 0x18ca
; flaresLeft at 0x18cc
; missileCool at 0x18ce
; warned at 0x18d0
; warnDist at 0x18d2
; missileStruck at 0x18d4
; missileFired at 0x18d6
; threatDist at 0x18d8
; missileDodged at 0x18da
; headOn at 0x18dc
; missileOnPlayer at 0x18de
; fNext at 0x1920
; flareCool at 0x1922
; lockT at 0x1924
; locked at 0x1926
; xNext at 0x1a68
; cloudLayer at 0x1aaa
; sunX at 0x1aec
; sunY at 0x1aee
; sunZ at 0x1af0
; sunOn at 0x1af2
; numTick at 0x1af4
; heading at 0x1b0e
; stepX at 0x1b24
; stepY at 0x1b26
; segWord at 0x1b28
; seen at 0x1b3c
; frame at 0x1b3e
; skyOn at 0x1b40
; sortie at 0x1b4a
; damage at 0x1b4c
; flown at 0x1b4e
; clock at 0x1b50
; outcome at 0x1b52
; endT at 0x1b54
; hitsTaken at 0x1b56
; aiState at 0x1b58
; aiStateT at 0x1b5a
; aiSide at 0x1b5c
; aiThinkT at 0x1b5e
; aiGunT at 0x1b60
; aiLockT at 0x1b62
; aiMslCool at 0x1b64
; aiMissiles at 0x1b66
; aiFlareCool at 0x1b68
; aiEvading at 0x1b6a
; aiDodge at 0x1b6c
; aiTX at 0x1b6e
; aiTY at 0x1b70
; aiTZ at 0x1b72
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
mOut = 0x0c90 ; 4 bytes
vec = 0x0c94 ; 96 bytes
bodyV = 0x0cf4 ; 6 bytes
hBand = 0x0d0a ; 1602 bytes
hPart = 0x134c ; 442 bytes
hRow = 0x1506 ; 80 bytes
hRowWas = 0x1556 ; 72 bytes
relFrac = 0x15be ; 6 bytes
pv = 0x15c4 ; 6 bytes
aceHP = 0x15ca ; 10 bytes
aceCruise = 0x15d4 ; 10 bytes
aceRoll = 0x15de ; 10 bytes
acePull = 0x15e8 ; 10 bytes
viewDir = 0x161e ; 102 bytes
viewNear = 0x1684 ; 34 bytes
bX = 0x16b6 ; 48 bytes
bY = 0x16e6 ; 48 bytes
bZ = 0x1716 ; 48 bytes
bVX = 0x1746 ; 48 bytes
bVY = 0x1776 ; 48 bytes
bVZ = 0x17a6 ; 48 bytes
bLife = 0x17d6 ; 48 bytes
bOwner = 0x1806 ; 48 bytes
mX = 0x1846 ; 12 bytes
mY = 0x1852 ; 12 bytes
mZ = 0x185e ; 12 bytes
mDX = 0x186a ; 12 bytes
mDY = 0x1876 ; 12 bytes
mDZ = 0x1882 ; 12 bytes
mSpeed = 0x188e ; 12 bytes
mLife = 0x189a ; 12 bytes
mOwner = 0x18a6 ; 12 bytes
mChase = 0x18b2 ; 12 bytes
mFlare = 0x18be ; 12 bytes
fX = 0x18e0 ; 16 bytes
fY = 0x18f0 ; 16 bytes
fZ = 0x1900 ; 16 bytes
fLife = 0x1910 ; 16 bytes
xKind = 0x1928 ; 40 bytes
xX = 0x1950 ; 40 bytes
xY = 0x1978 ; 40 bytes
xZ = 0x19a0 ; 40 bytes
xVX = 0x19c8 ; 40 bytes
xVY = 0x19f0 ; 40 bytes
xVZ = 0x1a18 ; 40 bytes
xT = 0x1a40 ; 40 bytes
cX = 0x1a6a ; 16 bytes
cY = 0x1a7a ; 16 bytes
cZ = 0x1a8a ; 16 bytes
cKind = 0x1a9a ; 16 bytes
cloudShown = 0x1aac ; 16 bytes
cloudSX = 0x1abc ; 16 bytes
cloudSY = 0x1acc ; 16 bytes
cloudZ = 0x1adc ; 16 bytes
shown = 0x1af6 ; 24 bytes
rungSin = 0x1b10 ; 20 bytes
stepMinor = 0x1b2a ; 18 bytes
score = 0x1b42 ; 4 bytes
best = 0x1b46 ; 4 bytes
letters = 0x1b74 ; 6 bytes
bestScore = 0x1b7a ; 20 bytes
bestName = 0x1b8e ; 30 bytes
bestTime = 0x1bac ; 10 bytes

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
  ; sinA = 0
  sw zero, 0x0cfa(zero)
  ; cosA = 16384
  li t0, 16384
  sw t0, 0x0cfc(zero)
  ; cockpitOn = 0
  sw zero, 0x0cfe(zero)
  ; shakeLeft = 0
  sw zero, 0x0d00(zero)
  ; shakeX = 0
  sw zero, 0x0d02(zero)
  ; shakeY = 0
  sw zero, 0x0d04(zero)
  ; flashLeft = 0
  sw zero, 0x0d06(zero)
  ; flashRgb = 32767
  li t0, 32767
  sw t0, 0x0d08(zero)
  ; hNX = 0
  sw zero, 0x159e(zero)
  ; hNY = -256
  li t0, 65280
  sw t0, 0x15a0(zero)
  ; hC = 0
  sw zero, 0x15a2(zero)
  ; hL = 16384
  li t0, 16384
  sw t0, 0x15a4(zero)
  ; bodyX = 0
  sw zero, 0x15a6(zero)
  ; bodyY = 0
  sw zero, 0x15a8(zero)
  ; bodyZ = 0
  sw zero, 0x15aa(zero)
  ; scrX = 0
  sw zero, 0x15ac(zero)
  ; scrY = 0
  sw zero, 0x15ae(zero)
  ; pSpeed = 320
  li t0, 320
  sw t0, 0x15b0(zero)
  ; pAlt = 6000
  li t0, 6000
  sw t0, 0x15b2(zero)
  ; pAltFrac = 0
  sw zero, 0x15b4(zero)
  ; rollRate = 0
  sw zero, 0x15b6(zero)
  ; pitchRate = 0
  sw zero, 0x15b8(zero)
  ; throttle = 0
  sw zero, 0x15ba(zero)
  ; stickReversed = 0
  sw zero, 0x15bc(zero)
  ; ace = 0
  sw zero, 0x15f2(zero)
  ; eHP = 60
  li t0, 60
  sw t0, 0x15f4(zero)
  ; eHPMax = 60
  li t0, 60
  sw t0, 0x15f6(zero)
  ; eSpeed = 300
  li t0, 300
  sw t0, 0x15f8(zero)
  ; eCruise = 300
  li t0, 300
  sw t0, 0x15fa(zero)
  ; eRollMax = 640
  li t0, 640
  sw t0, 0x15fc(zero)
  ; ePullMax = 300
  li t0, 300
  sw t0, 0x15fe(zero)
  ; eAlive = 1
  li t0, 1
  sw t0, 0x1600(zero)
  ; eFlash = 0
  sw zero, 0x1602(zero)
  ; eRollRate = 0
  sw zero, 0x1604(zero)
  ; ePitchRate = 0
  sw zero, 0x1606(zero)
  ; eWantRoll = 0
  sw zero, 0x1608(zero)
  ; eWantPitch = 0
  sw zero, 0x160a(zero)
  ; eWantSpeed = 300
  li t0, 300
  sw t0, 0x160c(zero)
  ; eBX = 0
  sw zero, 0x160e(zero)
  ; eBY = 0
  sw zero, 0x1610(zero)
  ; eBZ = 0
  sw zero, 0x1612(zero)
  ; eSX = 0
  sw zero, 0x1614(zero)
  ; eSY = 0
  sw zero, 0x1616(zero)
  ; eOn = 0
  sw zero, 0x1618(zero)
  ; eSize = 0
  sw zero, 0x161a(zero)
  ; eDist = 0
  sw zero, 0x161c(zero)
  ; frameShown = 65535
  li t0, 65535
  sw t0, 0x16a6(zero)
  ; viewMirror = 0
  sw zero, 0x16a8(zero)
  ; frameFlips = 0
  sw zero, 0x16aa(zero)
  ; viewTick = 0
  sw zero, 0x16ac(zero)
  ; classWas = 65535
  li t0, 65535
  sw t0, 0x16ae(zero)
  ; frameNow = 0
  sw zero, 0x16b0(zero)
  ; flipsNow = 0
  sw zero, 0x16b2(zero)
  ; eClass = 6
  li t0, 6
  sw t0, 0x16b4(zero)
  ; bNext = 0
  sw zero, 0x1836(zero)
  ; gunCool = 0
  sw zero, 0x1838(zero)
  ; muzzle = 0
  sw zero, 0x183a(zero)
  ; hitsOnEnemy = 0
  sw zero, 0x183c(zero)
  ; hitsOnPlayer = 0
  sw zero, 0x183e(zero)
  ; roundsFired = 0
  sw zero, 0x1840(zero)
  ; roundsHit = 0
  sw zero, 0x1842(zero)
  ; gunFiring = 0
  sw zero, 0x1844(zero)
  ; missilesLeft = 32
  li t0, 32
  sw t0, 0x18ca(zero)
  ; flaresLeft = 24
  li t0, 24
  sw t0, 0x18cc(zero)
  ; missileCool = 0
  sw zero, 0x18ce(zero)
  ; warned = 0
  sw zero, 0x18d0(zero)
  ; warnDist = 0
  sw zero, 0x18d2(zero)
  ; missileStruck = 0
  sw zero, 0x18d4(zero)
  ; missileFired = 0
  sw zero, 0x18d6(zero)
  ; threatDist = 65535
  li t0, 65535
  sw t0, 0x18d8(zero)
  ; missileDodged = 0
  sw zero, 0x18da(zero)
  ; headOn = 0
  sw zero, 0x18dc(zero)
  ; missileOnPlayer = 0
  sw zero, 0x18de(zero)
  ; fNext = 0
  sw zero, 0x1920(zero)
  ; flareCool = 0
  sw zero, 0x1922(zero)
  ; lockT = 0
  sw zero, 0x1924(zero)
  ; locked = 0
  sw zero, 0x1926(zero)
  ; xNext = 0
  sw zero, 0x1a68(zero)
  ; cloudLayer = 4200
  li t0, 4200
  sw t0, 0x1aaa(zero)
  ; sunX = 0
  sw zero, 0x1aec(zero)
  ; sunY = 0
  sw zero, 0x1aee(zero)
  ; sunZ = 0
  sw zero, 0x1af0(zero)
  ; sunOn = 1
  li t0, 1
  sw t0, 0x1af2(zero)
  ; numTick = 0
  sw zero, 0x1af4(zero)
  ; heading = 0
  sw zero, 0x1b0e(zero)
  ; stepX = 8
  li t0, 8
  sw t0, 0x1b24(zero)
  ; stepY = 0
  sw zero, 0x1b26(zero)
  ; segWord = 0
  sw zero, 0x1b28(zero)
  ; seen = 0
  sw zero, 0x1b3c(zero)
  ; frame = 0
  sw zero, 0x1b3e(zero)
  ; skyOn = 0
  sw zero, 0x1b40(zero)
  ; sortie = 0
  sw zero, 0x1b4a(zero)
  ; damage = 0
  sw zero, 0x1b4c(zero)
  ; flown = 0
  sw zero, 0x1b4e(zero)
  ; clock = 0
  sw zero, 0x1b50(zero)
  ; outcome = 0
  sw zero, 0x1b52(zero)
  ; endT = 0
  sw zero, 0x1b54(zero)
  ; hitsTaken = 0
  sw zero, 0x1b56(zero)
  ; aiState = 0
  sw zero, 0x1b58(zero)
  ; aiStateT = 0
  sw zero, 0x1b5a(zero)
  ; aiSide = 1
  li t0, 1
  sw t0, 0x1b5c(zero)
  ; aiThinkT = 0
  sw zero, 0x1b5e(zero)
  ; aiGunT = 0
  sw zero, 0x1b60(zero)
  ; aiLockT = 0
  sw zero, 0x1b62(zero)
  ; aiMslCool = 0
  sw zero, 0x1b64(zero)
  ; aiMissiles = 0
  sw zero, 0x1b66(zero)
  ; aiFlareCool = 0
  sw zero, 0x1b68(zero)
  ; aiEvading = 0
  sw zero, 0x1b6a(zero)
  ; aiDodge = 25
  li t0, 25
  sw t0, 0x1b6c(zero)
  ; aiTX = 0
  sw zero, 0x1b6e(zero)
  ; aiTY = 0
  sw zero, 0x1b70(zero)
  ; aiTZ = 0
  sw zero, 0x1b72(zero)
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
  ; mOut: 4 bytes of 0
  li t0, 0x0c90
  li t1, 4
  mset t0, zero, t1
  ; vec: 96 bytes of 0
  li t0, 0x0c94
  li t1, 96
  mset t0, zero, t1
  ; bodyV: 6 bytes of 0
  li t0, 0x0cf4
  li t1, 6
  mset t0, zero, t1
  ; hBand: 1602 bytes of 0
  li t0, 0x0d0a
  li t1, 1602
  mset t0, zero, t1
  ; hPart: 442 bytes of 0
  li t0, 0x134c
  li t1, 442
  mset t0, zero, t1
  ; hRow: 80 bytes of 0
  li t0, 0x1506
  li t1, 80
  mset t0, zero, t1
  ; hRowWas: 72 bytes of 0
  li t0, 0x1556
  li t1, 72
  mset t0, zero, t1
  ; relFrac: 6 bytes of 0
  li t0, 0x15be
  li t1, 6
  mset t0, zero, t1
  ; pv: 6 bytes of 0
  li t0, 0x15c4
  li t1, 6
  mset t0, zero, t1
  ; aceHP: 10 bytes of 0
  li t0, 0x15ca
  li t1, 10
  mset t0, zero, t1
  ; aceCruise: 10 bytes of 0
  li t0, 0x15d4
  li t1, 10
  mset t0, zero, t1
  ; aceRoll: 10 bytes of 0
  li t0, 0x15de
  li t1, 10
  mset t0, zero, t1
  ; acePull: 10 bytes of 0
  li t0, 0x15e8
  li t1, 10
  mset t0, zero, t1
  ; viewDir: 102 bytes of 0
  li t0, 0x161e
  li t1, 102
  mset t0, zero, t1
  ; viewNear: 34 bytes of 0
  li t0, 0x1684
  li t1, 34
  mset t0, zero, t1
  ; bX: 48 bytes of 0
  li t0, 0x16b6
  li t1, 48
  mset t0, zero, t1
  ; bY: 48 bytes of 0
  li t0, 0x16e6
  li t1, 48
  mset t0, zero, t1
  ; bZ: 48 bytes of 0
  li t0, 0x1716
  li t1, 48
  mset t0, zero, t1
  ; bVX: 48 bytes of 0
  li t0, 0x1746
  li t1, 48
  mset t0, zero, t1
  ; bVY: 48 bytes of 0
  li t0, 0x1776
  li t1, 48
  mset t0, zero, t1
  ; bVZ: 48 bytes of 0
  li t0, 0x17a6
  li t1, 48
  mset t0, zero, t1
  ; bLife: 48 bytes of 0
  li t0, 0x17d6
  li t1, 48
  mset t0, zero, t1
  ; bOwner: 48 bytes of 0
  li t0, 0x1806
  li t1, 48
  mset t0, zero, t1
  ; mX: 12 bytes of 0
  li t0, 0x1846
  li t1, 12
  mset t0, zero, t1
  ; mY: 12 bytes of 0
  li t0, 0x1852
  li t1, 12
  mset t0, zero, t1
  ; mZ: 12 bytes of 0
  li t0, 0x185e
  li t1, 12
  mset t0, zero, t1
  ; mDX: 12 bytes of 0
  li t0, 0x186a
  li t1, 12
  mset t0, zero, t1
  ; mDY: 12 bytes of 0
  li t0, 0x1876
  li t1, 12
  mset t0, zero, t1
  ; mDZ: 12 bytes of 0
  li t0, 0x1882
  li t1, 12
  mset t0, zero, t1
  ; mSpeed: 12 bytes of 0
  li t0, 0x188e
  li t1, 12
  mset t0, zero, t1
  ; mLife: 12 bytes of 0
  li t0, 0x189a
  li t1, 12
  mset t0, zero, t1
  ; mOwner: 12 bytes of 0
  li t0, 0x18a6
  li t1, 12
  mset t0, zero, t1
  ; mChase: 12 bytes of 0
  li t0, 0x18b2
  li t1, 12
  mset t0, zero, t1
  ; mFlare: 12 bytes of 0
  li t0, 0x18be
  li t1, 12
  mset t0, zero, t1
  ; fX: 16 bytes of 0
  li t0, 0x18e0
  li t1, 16
  mset t0, zero, t1
  ; fY: 16 bytes of 0
  li t0, 0x18f0
  li t1, 16
  mset t0, zero, t1
  ; fZ: 16 bytes of 0
  li t0, 0x1900
  li t1, 16
  mset t0, zero, t1
  ; fLife: 16 bytes of 0
  li t0, 0x1910
  li t1, 16
  mset t0, zero, t1
  ; xKind: 40 bytes of 0
  li t0, 0x1928
  li t1, 40
  mset t0, zero, t1
  ; xX: 40 bytes of 0
  li t0, 0x1950
  li t1, 40
  mset t0, zero, t1
  ; xY: 40 bytes of 0
  li t0, 0x1978
  li t1, 40
  mset t0, zero, t1
  ; xZ: 40 bytes of 0
  li t0, 0x19a0
  li t1, 40
  mset t0, zero, t1
  ; xVX: 40 bytes of 0
  li t0, 0x19c8
  li t1, 40
  mset t0, zero, t1
  ; xVY: 40 bytes of 0
  li t0, 0x19f0
  li t1, 40
  mset t0, zero, t1
  ; xVZ: 40 bytes of 0
  li t0, 0x1a18
  li t1, 40
  mset t0, zero, t1
  ; xT: 40 bytes of 0
  li t0, 0x1a40
  li t1, 40
  mset t0, zero, t1
  ; cX: 16 bytes of 0
  li t0, 0x1a6a
  li t1, 16
  mset t0, zero, t1
  ; cY: 16 bytes of 0
  li t0, 0x1a7a
  li t1, 16
  mset t0, zero, t1
  ; cZ: 16 bytes of 0
  li t0, 0x1a8a
  li t1, 16
  mset t0, zero, t1
  ; cKind: 16 bytes of 0
  li t0, 0x1a9a
  li t1, 16
  mset t0, zero, t1
  ; cloudShown: 16 bytes of 0
  li t0, 0x1aac
  li t1, 16
  mset t0, zero, t1
  ; cloudSX: 16 bytes of 0
  li t0, 0x1abc
  li t1, 16
  mset t0, zero, t1
  ; cloudSY: 16 bytes of 0
  li t0, 0x1acc
  li t1, 16
  mset t0, zero, t1
  ; cloudZ: 16 bytes of 0
  li t0, 0x1adc
  li t1, 16
  mset t0, zero, t1
  ; shown: 24 bytes of 0
  li t0, 0x1af6
  li t1, 24
  mset t0, zero, t1
  ; rungSin: 20 bytes of 0
  li t0, 0x1b10
  li t1, 20
  mset t0, zero, t1
  ; stepMinor: 18 bytes of 0
  li t0, 0x1b2a
  li t1, 18
  mset t0, zero, t1
  ; score: 4 bytes of 0
  li t0, 0x1b42
  li t1, 4
  mset t0, zero, t1
  ; best: 4 bytes of 0
  li t0, 0x1b46
  li t1, 4
  mset t0, zero, t1
  ; letters: 6 bytes of 0
  li t0, 0x1b74
  li t1, 6
  mset t0, zero, t1
  ; bestScore: 20 bytes of 0
  li t0, 0x1b7a
  li t1, 20
  mset t0, zero, t1
  ; bestName: 30 bytes of 0
  li t0, 0x1b8e
  li t1, 30
  mset t0, zero, t1
  ; bestTime: 10 bytes of 0
  li t0, 0x1bac
  li t1, 10
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
  li a0, 262
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
  li a0, 262
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
  li a0, 262
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

; math.e16.ts:30 va(k) at -O1
;   k in a0
va:
  ; math.e16.ts:31  return addr(vec) + k * 2
  slli t0, a0, 1
  addi a0, t0, vec
.return:
  ret

; math.e16.ts:38 mulq(_a, _b) at -O1
;   _a in s1
;   _b in s2
mulq:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; _a
  mv s2, a1 ; _b
  ; math.e16.ts:39  asm`
  mul t0, a0, a1
  mulh t1, a0, a1
  srli t0, t0, 14
  slli t1, t1, 2
  or t0, t0, t1
  li t2, mOut
  sw t0, 0(t2)
  ; math.e16.ts:48  return i16(mOut[0])
  lw a0, mOut(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; math.e16.ts:55 dotq(_pa, _pb) at -O1
;   _pa in s1
;   _pb in s2
dotq:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; _pa
  mv s2, a1 ; _pb
  ; math.e16.ts:56  asm`
  lw t0, 0(a0)
  lw t1, 0(a1)
  mul t2, t0, t1
  mulh t3, t0, t1
  lw t0, 2(a0)
  lw t1, 2(a1)
  mul a2, t0, t1
  mulh a3, t0, t1
  add t2, t2, a2
  sltu a2, t2, a2
  add t3, t3, a3
  add t3, t3, a2
  lw t0, 4(a0)
  lw t1, 4(a1)
  mul a2, t0, t1
  mulh a3, t0, t1
  add t2, t2, a2
  sltu a2, t2, a2
  add t3, t3, a3
  add t3, t3, a2
  srli t2, t2, 14
  slli t0, t3, 2
  or t0, t0, t2
  srai t1, t3, 13
  beqz t1, .dq_ok
  addi t1, t1, 1
  beqz t1, .dq_ok
  li t0, 32767
  bge t3, zero, .dq_ok
  li t0, -32768
  .dq_ok:
  li t2, mOut
  sw t0, 0(t2)
  ; math.e16.ts:91  return i16(mOut[0])
  lw a0, mOut(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; math.e16.ts:98 rotq(_pa, _pb, _c, _s) at -O1
;   _pa in s1
;   _pb in s2
;   _c in s3
;   _s in s0
rotq:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; _pa
  mv s2, a1 ; _pb
  mv s3, a2 ; _c
  mv s0, a3 ; _s
  ; math.e16.ts:99  asm`
  li t3, 3
  li t2, mOut
  sw t3, 2(t2)
  .rq_next:
  lw t0, 0(a0)
  lw t1, 0(a1)
  mul t2, t0, a2
  mulh t3, t0, a2
  srli t2, t2, 14
  slli t3, t3, 2
  or t2, t2, t3
  li t3, mOut
  sw t2, 0(t3)
  mul t2, t1, a3
  mulh t3, t1, a3
  srli t2, t2, 14
  slli t3, t3, 2
  or t2, t2, t3
  li t3, mOut
  lw t3, 0(t3)
  add t2, t2, t3
  sw t2, 0(a0)
  mul t2, t1, a2
  mulh t3, t1, a2
  srli t2, t2, 14
  slli t3, t3, 2
  or t2, t2, t3
  li t3, mOut
  sw t2, 0(t3)
  mul t2, t0, a3
  mulh t3, t0, a3
  srli t2, t2, 14
  slli t3, t3, 2
  or t2, t2, t3
  li t3, mOut
  lw t3, 0(t3)
  sub t2, t3, t2
  sw t2, 0(a1)
  addi a0, a0, 2
  addi a1, a1, 2
  li t2, mOut
  lw t3, 2(t2)
  addi t3, t3, -1
  sw t3, 2(t2)
  bnez t3, .rq_next
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; math.e16.ts:149 axpyq(_pd, _ps, _k) at -O1
;   _pd in s1
;   _ps in s2
;   _k in s3
axpyq:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; _pd
  mv s2, a1 ; _ps
  mv s3, a2 ; _k
  ; math.e16.ts:150  asm`
  li t3, 3
  .ax_next:
  lw t0, 0(a1)
  mul t1, t0, a2
  mulh t2, t0, a2
  srli t1, t1, 14
  slli t2, t2, 2
  or t1, t1, t2
  lw t0, 0(a0)
  add t0, t0, t1
  sw t0, 0(a0)
  addi a0, a0, 2
  addi a1, a1, 2
  addi t3, t3, -1
  bnez t3, .ax_next
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; math.e16.ts:170 scaleq(_pv, _k) at -O1
;   _pv in s1
;   _k in s2
scaleq:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; _pv
  mv s2, a1 ; _k
  ; math.e16.ts:171  asm`
  li t3, 3
  .sc_next:
  lw t0, 0(a0)
  mul t1, t0, a1
  mulh t2, t0, a1
  srli t1, t1, 14
  slli t2, t2, 2
  or t1, t1, t2
  sw t1, 0(a0)
  addi a0, a0, 2
  addi t3, t3, -1
  bnez t3, .sc_next
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; math.e16.ts:191 muldiv(_a, _b, _d) at -O1
;   _a in s1
;   _b in s2
;   _d in s3
muldiv:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; _a
  mv s2, a1 ; _b
  mv s3, a2 ; _d
  ; math.e16.ts:192  asm`
  mulhu t1, a0, a1
  mul t2, a0, a1
  li t0, 0
  li t3, 16
  .md_next:
  slli t1, t1, 1
  srli a3, t2, 15
  or t1, t1, a3
  slli t2, t2, 1
  slli t0, t0, 1
  bltu t1, a2, .md_skip
  sub t1, t1, a2
  ori t0, t0, 1
  .md_skip:
  addi t3, t3, -1
  bnez t3, .md_next
  li t2, mOut
  sw t0, 0(t2)
  ; math.e16.ts:212  return mOut[0]
  lw a0, mOut(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; math.e16.ts:219 toBodyOf(_p) at -O1
;   _p in s1
toBodyOf:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; _p
  ; math.e16.ts:220  asm`
  li a1, vec + 6
  lw t0, 0(a0)
  lw t1, 0(a1)
  mul t2, t0, t1
  mulh t3, t0, t1
  lw t0, 2(a0)
  lw t1, 2(a1)
  mul a2, t0, t1
  mulh a3, t0, t1
  add t2, t2, a2
  sltu a2, t2, a2
  add t3, t3, a3
  add t3, t3, a2
  lw t0, 4(a0)
  lw t1, 4(a1)
  mul a2, t0, t1
  mulh a3, t0, t1
  add t2, t2, a2
  sltu a2, t2, a2
  add t3, t3, a3
  add t3, t3, a2
  srli t2, t2, 14
  slli t0, t3, 2
  or t0, t0, t2
  srai t1, t3, 13
  beqz t1, .tb_x
  addi t1, t1, 1
  beqz t1, .tb_x
  li t0, 32767
  bge t3, zero, .tb_x
  li t0, -32768
  .tb_x:
  li t2, bodyV
  sw t0, 0(t2)
  li a1, vec + 12
  lw t0, 0(a0)
  lw t1, 0(a1)
  mul t2, t0, t1
  mulh t3, t0, t1
  lw t0, 2(a0)
  lw t1, 2(a1)
  mul a2, t0, t1
  mulh a3, t0, t1
  add t2, t2, a2
  sltu a2, t2, a2
  add t3, t3, a3
  add t3, t3, a2
  lw t0, 4(a0)
  lw t1, 4(a1)
  mul a2, t0, t1
  mulh a3, t0, t1
  add t2, t2, a2
  sltu a2, t2, a2
  add t3, t3, a3
  add t3, t3, a2
  srli t2, t2, 14
  slli t0, t3, 2
  or t0, t0, t2
  srai t1, t3, 13
  beqz t1, .tb_y
  addi t1, t1, 1
  beqz t1, .tb_y
  li t0, 32767
  bge t3, zero, .tb_y
  li t0, -32768
  .tb_y:
  li t2, bodyV
  sw t0, 2(t2)
  li a1, vec
  lw t0, 0(a0)
  lw t1, 0(a1)
  mul t2, t0, t1
  mulh t3, t0, t1
  lw t0, 2(a0)
  lw t1, 2(a1)
  mul a2, t0, t1
  mulh a3, t0, t1
  add t2, t2, a2
  sltu a2, t2, a2
  add t3, t3, a3
  add t3, t3, a2
  lw t0, 4(a0)
  lw t1, 4(a1)
  mul a2, t0, t1
  mulh a3, t0, t1
  add t2, t2, a2
  sltu a2, t2, a2
  add t3, t3, a3
  add t3, t3, a2
  srli t2, t2, 14
  slli t0, t3, 2
  or t0, t0, t2
  srai t1, t3, 13
  beqz t1, .tb_z
  addi t1, t1, 1
  beqz t1, .tb_z
  li t0, 32767
  bge t3, zero, .tb_z
  li t0, -32768
  .tb_z:
  li t2, bodyV
  sw t0, 4(t2)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; math.e16.ts:330 persp(_x, _z) at -O1
;   _x in s1
;   _z in s2
persp:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; _x
  mv s2, a1 ; _z
  ; math.e16.ts:331  asm`
  srai t3, a0, 15
  xor a0, a0, t3
  sub a0, a0, t3
  clz t0, a1
  sll a1, a1, t0
  sll a0, a0, t0
  srli a1, a1, 7
  srli a0, a0, 7
  slli a0, a0, 7
  divu t1, a0, a1
  remu t2, a0, a1
  slli t2, t2, 7
  divu t2, t2, a1
  slli t1, t1, 7
  add t1, t1, t2
  slli t0, t1, 1
  add t1, t1, t0
  srli t1, t1, 8
  xor t1, t1, t3
  sub t1, t1, t3
  li t2, mOut
  sw t1, 0(t2)
  ; math.e16.ts:355  return i16(mOut[0])
  lw a0, mOut(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; math.e16.ts:361 vcopy(to, from) at -O1
;   to in a0
;   from in a1
vcopy:
  ; math.e16.ts:362  vec[to] = vec[from]
  slli t0, a0, 1
  slli t1, a1, 1
  lw t1, vec(t1)
  sw t1, vec(t0)
  ; math.e16.ts:363  vec[to + 1] = vec[from + 1]
  addi t0, a0, 1
  slli t0, t0, 1
  addi t1, a1, 1
  slli t1, t1, 1
  lw t1, vec(t1)
  sw t1, vec(t0)
  ; math.e16.ts:364  vec[to + 2] = vec[from + 2]
  addi t0, a0, 2
  slli t0, t0, 1
  addi t1, a1, 2
  slli t1, t1, 1
  lw t1, vec(t1)
  sw t1, vec(t0)
.return:
  ret

; math.e16.ts:367 vset(k, x, y, z) at -O1
;   k in a0
;   x in a1
;   y in a2
;   z in a3
vset:
  ; math.e16.ts:368  vec[k] = u16(x)
  slli t0, a0, 1
  sw a1, vec(t0)
  ; math.e16.ts:369  vec[k + 1] = u16(y)
  addi t0, a0, 1
  slli t0, t0, 1
  sw a2, vec(t0)
  ; math.e16.ts:370  vec[k + 2] = u16(z)
  addi t0, a0, 2
  slli t0, t0, 1
  sw a3, vec(t0)
.return:
  ret

; math.e16.ts:374 vget(k) at -O1
;   k in a0
vget:
  ; math.e16.ts:375  return i16(vec[k])
  slli t0, a0, 1
  lw a0, vec(t0)
.return:
  ret

; math.e16.ts:379 vcross(d, a, b) at -O1
;   d in s1
;   a in s2
;   b in s3
;   ax in 0(fp)
;   ay in 2(fp)
;   az in 4(fp)
;   bx in 6(fp)
;   by in 8(fp)
;   bz in 10(fp)
vcross:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s1, a0 ; d
  mv s2, a1 ; a
  mv s3, a2 ; b
  ; math.e16.ts:380  const ax = vget(a)
  mv a0, s2
  call vget
  sw a0, 0(fp) ; ax
  ; math.e16.ts:381  const ay = vget(a + 1)
  addi a0, s2, 1
  call vget
  sw a0, 2(fp) ; ay
  ; math.e16.ts:382  const az = vget(a + 2)
  addi a0, s2, 2
  call vget
  sw a0, 4(fp) ; az
  ; math.e16.ts:383  const bx = vget(b)
  mv a0, s3
  call vget
  sw a0, 6(fp) ; bx
  ; math.e16.ts:384  const by = vget(b + 1)
  addi a0, s3, 1
  call vget
  sw a0, 8(fp) ; by
  ; math.e16.ts:385  const bz = vget(b + 2)
  addi a0, s3, 2
  call vget
  sw a0, 10(fp) ; bz
  ; math.e16.ts:386  vec[d] = u16(mulq(ay, bz) - mulq(az, by))
  slli t0, s1, 1
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 2(fp)
  lw a1, 10(fp)
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  lw a0, 4(fp)
  lw a1, 8(fp)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; math.e16.ts:387  vec[d + 1] = u16(mulq(az, bx) - mulq(ax, bz))
  addi t0, s1, 1
  slli t0, t0, 1
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 4(fp)
  lw a1, 6(fp)
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  lw a0, 0(fp)
  lw a1, 10(fp)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; math.e16.ts:388  vec[d + 2] = u16(mulq(ax, by) - mulq(ay, bx))
  addi t0, s1, 2
  slli t0, t0, 1
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 0(fp)
  lw a1, 8(fp)
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  lw a0, 2(fp)
  lw a1, 6(fp)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; math.e16.ts:392 vunit(k) at -O1
;   k in s1
;   len2 in s2
vunit:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; math.e16.ts:393  const len2 = dotq(va(k), va(k))
  mv a0, s1
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  mv s2, a0 ; len2
  ; math.e16.ts:394  scaleq(va(k), ONE + ((ONE - len2) >> 1))
  mv a0, s1
  call va
  li t0, 16384
  sub t0, t0, s2
  srai t0, t0, 1
  li t1, 16384
  add a1, t1, t0
  call scaleq
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; math.e16.ts:401 orthonormal(f, r, u) at -O1
;   f in s1
;   r in s2
;   u in s3
orthonormal:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; f
  mv s2, a1 ; r
  mv s3, a2 ; u
  ; math.e16.ts:402  vunit(f)
  mv a0, s1
  call vunit
  ; math.e16.ts:403  axpyq(va(r), va(f), -dotq(va(r), va(f)))
  mv a0, s2
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  neg t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a0, t2
  mv a1, t1
  mv a2, t0
  call axpyq
  ; math.e16.ts:404  vunit(r)
  mv a0, s2
  call vunit
  ; math.e16.ts:405  vcross(u, r, f)
  mv a0, s3
  mv a1, s2
  mv a2, s1
  call vcross
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; math.e16.ts:412 smallAngle(a) at -O1
;   a in s1
smallAngle:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; a
  ; math.e16.ts:413  sinA = a
  sw s1, 0x0cfa(zero)
  ; math.e16.ts:414  cosA = ONE - (mulq(a, a) >> 1)
  mv a0, s1
  mv a1, s1
  call mulq
  srai t0, a0, 1
  li t1, 16384
  sub t1, t1, t0
  sw t1, 0x0cfc(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; math.e16.ts:418 pitchBy(f, u, a) at -O1
;   f in s1
;   u in s2
;   a in s3
pitchBy:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; f
  mv s2, a1 ; u
  mv s3, a2 ; a
  ; math.e16.ts:419  smallAngle(a)
  mv a0, s3
  call smallAngle
  ; math.e16.ts:420  rotq(va(f), va(u), cosA, sinA)
  mv a0, s1
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call va
  lw t0, 0x0cfc(zero)
  lw t1, 0x0cfa(zero)
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t2
  mv a2, t0
  mv a3, t1
  call rotq
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; math.e16.ts:424 rollBy(r, u, a) at -O1
;   r in s1
;   u in s2
;   a in s3
rollBy:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; r
  mv s2, a1 ; u
  mv s3, a2 ; a
  ; math.e16.ts:425  smallAngle(a)
  mv a0, s3
  call smallAngle
  ; math.e16.ts:426  rotq(va(r), va(u), cosA, -sinA)
  mv a0, s1
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call va
  lw t0, 0x0cfc(zero)
  lw t1, 0x0cfa(zero)
  neg t1, t1
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t2
  mv a2, t0
  mv a3, t1
  call rotq
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; math.e16.ts:430 yawBy(f, r, a) at -O1
;   f in s1
;   r in s2
;   a in s3
yawBy:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; f
  mv s2, a1 ; r
  mv s3, a2 ; a
  ; math.e16.ts:431  smallAngle(a)
  mv a0, s3
  call smallAngle
  ; math.e16.ts:432  rotq(va(f), va(r), cosA, sinA)
  mv a0, s1
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  call va
  lw t0, 0x0cfc(zero)
  lw t1, 0x0cfa(zero)
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t2
  mv a2, t0
  mv a3, t1
  call rotq
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; math.e16.ts:436 turnWorld(k, a) at -O1
;   k in s1
;   a in s0
;   x in s2
;   y in s3
turnWorld:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s0, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; k
  mv s0, a1 ; a
  ; math.e16.ts:437  smallAngle(a)
  mv a0, s0
  call smallAngle
  ; math.e16.ts:438  const x = vget(k)
  mv a0, s1
  call vget
  mv s2, a0 ; x
  ; math.e16.ts:439  const y = vget(k + 1)
  addi a0, s1, 1
  call vget
  mv s3, a0 ; y
  ; math.e16.ts:440  vec[k] = u16(mulq(x, cosA) + mulq(y, sinA))
  slli t0, s1, 1
  lw t1, 0x0cfc(zero)
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  mv a1, t1
  call mulq
  lw t0, 0x0cfa(zero)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  mv a1, t0
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; math.e16.ts:441  vec[k + 1] = u16(mulq(y, cosA) - mulq(x, sinA))
  addi t0, s1, 1
  slli t0, t0, 1
  lw t1, 0x0cfc(zero)
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  mv a1, t1
  call mulq
  lw t0, 0x0cfa(zero)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  mv a1, t0
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s0, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; math.e16.ts:446 abs16(v) at -O1
;   v in a0
abs16:
  ; math.e16.ts:447  return v < 0 ? -v : v
  bge a0, zero, .L1
  neg t0, a0
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a0, t0
.return:
  ret

; math.e16.ts:450 clamp16(v, lo, hi) at -O1
;   v in a0
;   lo in a1
;   hi in a2
clamp16:
  ; math.e16.ts:451  if (v < lo) return lo
  bge a0, a1, .L1
  ; math.e16.ts:451  return lo
  mv a0, a1
  ret
.L1:
  ; math.e16.ts:452  if (v > hi) return hi
  bge a2, a0, .L2
  ; math.e16.ts:452  return hi
  mv a0, a2
.L2:
  ; math.e16.ts:453  return v
.return:
  ret

; math.e16.ts:457 approach(v, to, step) at -O1
;   v in a0
;   to in a1
;   step in a2
approach:
  ; math.e16.ts:458  if (v < to) return v + step > to ? to : v + step
  bge a0, a1, .L1
  ; math.e16.ts:458  return v + step > to ? to : v + step
  add t0, a0, a2
  bge a1, t0, .L2
  mv t0, a1
  j .L3
.L2:
  add t0, a0, a2
.L3:
  mv a0, t0
  ret
.L1:
  ; math.e16.ts:459  if (v > to) return v - step < to ? to : v - step
  bge a1, a0, .L4
  ; math.e16.ts:459  return v - step < to ? to : v - step
  sub t0, a0, a2
  bge t0, a1, .L5
  mv t0, a1
  j .L6
.L5:
  sub t0, a0, a2
.L6:
  mv a0, t0
.L4:
  ; math.e16.ts:460  return v
.return:
  ret

; math.e16.ts:464 vmax(x, y, z) at -O1
;   x in 0(fp)
;   y in 2(fp)
;   z in 4(fp)
;   m in s1
;   b in s2
;   c in s3
vmax:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 0(fp) ; x
  sw a1, 2(fp) ; y
  sw a2, 4(fp) ; z
  ; math.e16.ts:465  let m = abs16(x)
  lw a0, 0(fp)
  call abs16
  mv s1, a0 ; m
  ; math.e16.ts:466  const b = abs16(y)
  lw a0, 2(fp)
  call abs16
  mv s2, a0 ; b
  ; math.e16.ts:467  const c = abs16(z)
  lw a0, 4(fp)
  call abs16
  mv s3, a0 ; c
  ; math.e16.ts:468  if (b > m) m = b
  bge s1, s2, .L1
  ; math.e16.ts:468  m = b
  mv s1, s2 ; m
.L1:
  ; math.e16.ts:469  if (c > m) m = c
  bge s1, s3, .L2
  ; math.e16.ts:469  m = c
  mv s1, s3 ; m
.L2:
  ; math.e16.ts:470  return m
  mv a0, s1
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; math.e16.ts:474 vlen(x, y, z) at -O1
;   x in 4(fp)
;   y in 6(fp)
;   z in 8(fp)
;   a in s2
;   b in s3
;   c in s1
;   m in 0(fp)
;   div3.v in 2(fp)
vlen:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 4(fp) ; x
  sw a1, 6(fp) ; y
  sw a2, 8(fp) ; z
  ; math.e16.ts:475  const a = u16(abs16(x))
  lw a0, 4(fp)
  call abs16
  mv s2, a0 ; a
  ; math.e16.ts:476  const b = u16(abs16(y))
  lw a0, 6(fp)
  call abs16
  mv s3, a0 ; b
  ; math.e16.ts:477  const c = u16(abs16(z))
  lw a0, 8(fp)
  call abs16
  mv s1, a0 ; c
  ; math.e16.ts:478  const m = a > b ? (a > c ? a : c) : b > c ? b : c
  bgeu s3, s2, .L1
  bgeu s1, s2, .L3
  mv t0, s2
  j .L2
.L3:
  mv t0, s1
  j .L2
.L1:
  bgeu s1, s3, .L5
  mv t0, s3
  j .L6
.L5:
  mv t0, s1
.L6:
.L2:
  sw t0, 0(fp) ; m
  ; math.e16.ts:479  return m + div3(a + b + c - m)
  add t0, s2, s3
  add t0, t0, s1
  lw t1, 0(fp) ; m
  sub t0, t0, t1
  sw t0, 2(fp) ; div3.v
  ; math.e16.ts:484  return (v >> 2) + (v >> 4)
  lw t0, 2(fp) ; div3.v
  srli t0, t0, 2
  lw t1, 2(fp) ; div3.v
  srli t1, t1, 4
  add t0, t0, t1
  lw t1, 0(fp) ; m
  add a0, t1, t0
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; math.e16.ts:488 ratio(x, z) at -O1
;   x in s3
;   z in 6(fp)
;   xx in s2
;   zz in s1
;   n in 0(fp)
;   q in 2(fp)
;   r in 8(fp)
;   f in 10(fp)
;   v in 4(fp)
ratio:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s3, 14(sp)
  sw s2, 16(sp)
  sw s1, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s3, a0 ; x
  sw a1, 6(fp) ; z
  ; math.e16.ts:489  let xx = abs16(x)
  mv a0, s3
  call abs16
  mv s2, a0 ; xx
  ; math.e16.ts:490  let zz = z
  lw s1, 6(fp) ; z
  ; math.e16.ts:491  while (zz >= 512) {
  j .L3
.L1:
  ; math.e16.ts:492  zz = zz >> 1
  srai s1, s1, 1
  ; math.e16.ts:493  xx = xx >> 1
  srai s2, s2, 1
.L3:
  li t0, 512
  bge s1, t0, .L1
  ; math.e16.ts:495  while (zz < 256) {
  j .L7
.L5:
  ; math.e16.ts:496  zz = zz << 1
  slli s1, s1, 1
  ; math.e16.ts:497  xx = xx << 1
  slli s2, s2, 1
.L7:
  li t0, 256
  blt s1, t0, .L5
  ; math.e16.ts:499  const n = u16(xx) * 128
  slli t0, s2, 7
  sw t0, 0(fp) ; n
  ; math.e16.ts:500  const q = div(n, u16(zz))
  lw t0, 0(fp) ; n
  divu t0, t0, s1
  sw t0, 2(fp) ; q
  ; math.e16.ts:501  const r = n - q * u16(zz)
  lw t0, 2(fp) ; q
  mul t0, t0, s1
  lw t1, 0(fp) ; n
  sub t1, t1, t0
  sw t1, 8(fp) ; r
  ; math.e16.ts:502  const f = div(r * 128, u16(zz))
  lw t0, 8(fp) ; r
  slli t0, t0, 7
  divu t0, t0, s1
  sw t0, 10(fp) ; f
  ; math.e16.ts:503  const v = i16(q * 128 + f)
  lw t0, 2(fp) ; q
  slli t0, t0, 7
  lw t1, 10(fp) ; f
  add t0, t0, t1
  sw t0, 4(fp) ; v
  ; math.e16.ts:504  return x < 0 ? -v : v
  bge s3, zero, .L9
  lw t0, 4(fp) ; v
  neg t0, t0
  j .L10
.L9:
  lw t0, 4(fp)
.L10:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s3, 14(sp)
  lw s2, 16(sp)
  lw s1, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; sky.e16.ts:121 palettesIn(skyRow) at -O1
;   skyRow in s1
palettesIn:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; skyRow
  ; sky.e16.ts:122  slot(PAL_SKY_DAY + skyRow, SL_SKY)
  addi a0, s1, 0
  li a1, 0
  call slot
  ; sky.e16.ts:123  slot(PAL_FRAME, SL_FRAME)
  li a0, 5
  li a1, 1
  call slot
  ; sky.e16.ts:124  slot(PAL_SCREEN, SL_SCREEN)
  li a0, 6
  li a1, 2
  call slot
  ; sky.e16.ts:125  slot(PAL_HUD_TEXT, SL_HUD_TEXT)
  li a0, 7
  li a1, 3
  call slot
  ; sky.e16.ts:126  slot(PAL_AMBER_TEXT, SL_AMBER)
  li a0, 8
  li a1, 4
  call slot
  ; sky.e16.ts:127  slot(PAL_RED_TEXT, SL_RED)
  li a0, 9
  li a1, 5
  call slot
  ; sky.e16.ts:128  slot(PAL_WHITE_TEXT, SL_WHITE)
  li a0, 10
  li a1, 7
  call slot
  ; sky.e16.ts:129  slot(PAL_LOGO, SL_LOGO)
  li a0, 11
  li a1, 6
  call slot
  ; sky.e16.ts:130  slot(PAL_HUD, SL_HUD)
  li a0, 12
  li a1, 8
  call slot
  ; sky.e16.ts:131  slot(PAL_FIRE, SL_FIRE)
  li a0, 14
  li a1, 10
  call slot
  ; sky.e16.ts:132  slot(PAL_CLOUD, SL_CLOUD)
  li a0, 15
  li a1, 11
  call slot
  ; sky.e16.ts:133  slot(PAL_SHOT, SL_SHOT)
  li a0, 16
  li a1, 12
  call slot
  ; sky.e16.ts:134  slot(PAL_HUD_RED, SL_HUD_RED)
  li a0, 13
  li a1, 13
  call slot
  ; sky.e16.ts:135  slot(PAL_FLASH, SL_FLASH)
  li a0, 17
  li a1, 14
  call slot
  ; sky.e16.ts:136  slot(PAL_SUN, SL_SUN)
  li a0, 18
  li a1, 15
  call slot
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sky.e16.ts:143 tintSlot(s, rgb, t) at -O1
;   s in s2
;   rgb in s3
;   t in s0
;   k in s1
tintSlot:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; s
  mv s3, a1 ; rgb
  mv s0, a2 ; t
  ; sky.e16.ts:144  let k: u16 = 1
  li s1, 1 ; k
  ; sky.e16.ts:145  while (k < 16) {
  j .L3
.L1:
  ; sky.e16.ts:146  palCopy[s * 16 + k] = mix(palCopy[s * 16 + k], rgb, t)
  slli t0, s2, 4
  add t0, t0, s1
  slli t0, t0, 1
  slli t1, s2, 4
  add t1, t1, s1
  slli t1, t1, 1
  lw t1, palCopy(t1)
  addi t0, t0, palCopy
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  mv a1, s3
  mv a2, s0
  call mix
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; sky.e16.ts:147  k++
  addi s1, s1, 1
.L3:
  li t0, 16
  bltu s1, t0, .L1
  ; sky.e16.ts:149  palMix(s, 0, 0)
  mv a0, s2
  li a1, 0
  li a2, 0
  call palMix
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; sky.e16.ts:152 slot(row, s) at -O1
;   row in s1
;   s in s2
slot:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; row
  mv s2, a1 ; s
  ; sky.e16.ts:153  palette(row, s)
  mv a0, s1
  mv a1, s2
  call palette
  ; sky.e16.ts:154  palKeep(row, s)
  mv a0, s1
  mv a1, s2
  call palKeep
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sky.e16.ts:158 screenOn() at -O1
screenOn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sky.e16.ts:159  poke16(VCTRL, 3)
  li t0, 3
  li t1, 63488
  sw t0, 0(t1)
  ; sky.e16.ts:160  poke16(LAYERS, 7)
  li t0, 7
  li t1, 63528
  sw t0, 0(t1)
  ; sky.e16.ts:161  scrollAll(0, 0)
  li a0, 0
  li a1, 0
  call scrollAll
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sky.e16.ts:164 scrollAll(x, y) at -O1
;   x in a0
;   y in a1
scrollAll:
  ; sky.e16.ts:165  poke16(BG0X, u16(x) & 511)
  andi t0, a0, 511
  li t1, 63520
  sw t0, 0(t1)
  ; sky.e16.ts:166  poke16(BG0Y, u16(y) & 511)
  andi t0, a1, 511
  li t1, 63522
  sw t0, 0(t1)
  ; sky.e16.ts:167  poke16(BG1X, u16(x) & 511)
  andi t0, a0, 511
  li t1, 63524
  sw t0, 0(t1)
  ; sky.e16.ts:168  poke16(BG1Y, u16(y) & 511)
  andi t0, a1, 511
  li t1, 63526
  sw t0, 0(t1)
.return:
  ret

; sky.e16.ts:172 cockpitTilesIn() at -O1
cockpitTilesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sky.e16.ts:173  load(SCREENS_TILES_BANK, SCREENS_TILES_AT, SCREENS_TILE * 32, SCREENS_TILES_BYTES)
  li a0, 318
  li a1, 54528
  li a2, 22816
  li a3, 1600
  call load
  ; sky.e16.ts:174  load(COCKPIT_TILES_BANK, COCKPIT_TILES_AT, COCKPIT_TILE * 32, COCKPIT_TILES_BYTES)
  li a0, 319
  li a1, 50304
  li a2, 24416
  li a3, 4608
  call load
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sky.e16.ts:178 mapsClear() at -O1
mapsClear:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sky.e16.ts:179  vfill(cellAt(1, 0, 0), COCKPIT_TILE, 4096)
  li a0, 40960
  li a1, 763
  li a2, 4096
  call vfill
  ; sky.e16.ts:180  vfill(cellAt(0, 0, 0), hBand[2 * RANGE], 4096)
  lw t0, hBand+1600(zero)
  li a0, 32768
  mv a1, t0
  li a2, 4096
  call vfill
  ; sky.e16.ts:181  cockpitOn = false
  sw zero, 0x0cfe(zero)
  ; sky.e16.ts:182  skyForget()
  call skyForget
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sky.e16.ts:186 cockpitIn() at -O1
;   y in s1
cockpitIn:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; sky.e16.ts:187  cockpitOn = true
  li t0, 1
  sw t0, 0x0cfe(zero)
  ; sky.e16.ts:188  let y: u16 = 0
  li s1, 0 ; y
  ; sky.e16.ts:189  while (y < COCKPIT_H) {
  j .L3
.L1:
  ; sky.e16.ts:190  mapRow(COCKPIT_MAP_BANK, 0xc000 + y * 128, 1, y)
  slli t0, s1, 7
  li t1, 49152
  add t1, t1, t0
  li a0, 320
  mv a1, t1
  li a2, 1
  mv a3, s1
  call mapRow
  ; sky.e16.ts:191  y++
  addi s1, s1, 1
.L3:
  li t0, 36
  bltu s1, t0, .L1
  ; sky.e16.ts:193  y = 0
  li s1, 0 ; y
  ; sky.e16.ts:194  while (y < SCREENS_H) {
  j .L7
.L5:
  ; sky.e16.ts:195  mapRow(SCREENS_MAP_BANK, 0xc000 + y * 128, 0, SKY_ROWS + y)
  slli t0, s1, 7
  li t1, 49152
  add t1, t1, t0
  li a0, 319
  mv a1, t1
  li a2, 0
  addi a3, s1, 27
  call mapRow
  ; sky.e16.ts:196  y++
  addi s1, s1, 1
.L7:
  li t0, 9
  bltu s1, t0, .L5
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sky.e16.ts:203 say(x, y, s, sl) at -O1
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
  ; sky.e16.ts:204  text(cellAt(1, x, y), s, FONT_TILE | (sl << 10) | 0x8000)
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

; sky.e16.ts:211 unsay(x, y, n) at -O1
;   x in s2
;   y in s3
;   n in 0(fp)
;   old in 2(fp)
;   k in s1
;   w in 4(fp)
unsay:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; x
  mv s3, a1 ; y
  sw a2, 0(fp) ; n
  ; sky.e16.ts:212  if (!cockpitOn) {
  lw t0, 0x0cfe(zero)
  bnez t0, .L1
  ; sky.e16.ts:213  vfill(cellAt(1, x, y), COCKPIT_TILE, n)
  li a0, 1
  mv a1, s2
  mv a2, s3
  call cellAt
  li a1, 763
  lw a2, 0(fp)
  call vfill
  ; sky.e16.ts:214  return
  j .return
.L1:
  ; sky.e16.ts:216  const old = bank(COCKPIT_MAP_BANK)
  li a0, 320
  call bank
  sw a0, 2(fp) ; old
  ; sky.e16.ts:217  let k: u16 = 0
  li s1, 0 ; k
  ; sky.e16.ts:218  while (k < n) {
  j .L4
.L2:
  ; sky.e16.ts:219  const w = peek16(0xc000 + ((y & 63) << 7) + ((x + k) << 1))
  andi t0, s3, 63
  slli t0, t0, 7
  li t1, 49152
  add t1, t1, t0
  add t0, s2, s1
  slli t0, t0, 1
  add t1, t1, t0
  lw t1, 0(t1)
  sw t1, 4(fp) ; w
  ; sky.e16.ts:220  vpoke(cellAt(1, x + k, y), w)
  add t0, s2, s1
  li a0, 1
  mv a1, t0
  mv a2, s3
  call cellAt
  lw a1, 4(fp)
  call vpoke
  ; sky.e16.ts:221  k++
  addi s1, s1, 1
.L4:
  lw t0, 0(fp) ; n
  bltu s1, t0, .L2
  ; sky.e16.ts:223  poke16(IO_BANK, old)
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

; sky.e16.ts:227 sayChar(x, y, c, sl) at -O1
;   x in s1
;   y in s2
;   c in s3
;   sl in s0
sayChar:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; c
  mv s0, a3 ; sl
  ; sky.e16.ts:228  vpoke(cellAt(1, x, y), (FONT_TILE + c - 32) | (sl << 10) | 0x8000)
  li a0, 1
  mv a1, s1
  mv a2, s2
  call cellAt
  slli t0, s0, 10
  addi t1, s3, -32
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

; sky.e16.ts:233 cellXY(x, y) at -O1
;   x in a0
;   y in a1
cellXY:
  ; sky.e16.ts:234  return (y << 6) | x
  slli t0, a1, 6
  or a0, t0, a0
.return:
  ret

; sky.e16.ts:237 sayNumber(cell, n, digits, sl) at -O1
;   cell in s3
;   n in 2(fp)
;   digits in 0(fp)
;   sl in 4(fp)
;   x in 6(fp)
;   y in 8(fp)
;   k in s1
;   v in s2
;   blank in 10(fp)
sayNumber:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s3, 14(sp)
  sw s1, 16(sp)
  sw s2, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s3, a0 ; cell
  sw a1, 2(fp) ; n
  sw a2, 0(fp) ; digits
  sw a3, 4(fp) ; sl
  ; sky.e16.ts:238  const x = cell & 63
  andi t0, s3, 63
  sw t0, 6(fp) ; x
  ; sky.e16.ts:239  const y = cell >> 6
  srli t0, s3, 6
  sw t0, 8(fp) ; y
  ; sky.e16.ts:240  let k = digits
  lw s1, 0(fp) ; digits
  ; sky.e16.ts:241  let v = n
  lw s2, 2(fp) ; n
  ; sky.e16.ts:242  while (k > 0) {
  j .L3
.L1:
  ; sky.e16.ts:243  k--
  addi s1, s1, -1
  ; sky.e16.ts:244  const blank = v === 0 && k < digits - 1
  sub t0, s2, zero
  seqz t0, t0
  mv t1, t0
  beqz t1, .L5
  lw t0, 0(fp) ; digits
  addi t0, t0, -1
  sltu t0, s1, t0
.L5:
  sw t0, 10(fp) ; blank
  ; sky.e16.ts:245  sayChar(x + k, y, blank ? 32 : 48 + (v % 10), sl)
  lw t0, 6(fp) ; x
  add t0, t0, s1
  lw t1, 8(fp)
  lw t2, 10(fp)
  beqz t2, .L6
  li t2, 32
  j .L7
.L6:
  li t2, 10
  remu t2, s2, t2
  addi t2, t2, 48
.L7:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  lw a3, 4(fp)
  call sayChar
  ; sky.e16.ts:246  v = divTen(v)
  mv a0, s2
  call divTen
  mv s2, a0 ; v
.L3:
  bltu zero, s1, .L1
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s3, 14(sp)
  lw s1, 16(sp)
  lw s2, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; sky.e16.ts:250 divTen(n) at -O1
;   n in a0
divTen:
  ; sky.e16.ts:251  return div(n, 10)
  li t0, 10
  divu a0, a0, t0
.return:
  ret

; sky.e16.ts:255 rowsClear(y0, y1) at -O1
;   y0 in s2
;   y1 in s3
;   y in s1
rowsClear:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; y0
  mv s3, a1 ; y1
  ; sky.e16.ts:256  let y = y0
  mv s1, s2 ; y
  ; sky.e16.ts:257  while (y <= y1) {
  j .L3
.L1:
  ; sky.e16.ts:258  vfill(cellAt(1, 0, y), COCKPIT_TILE, 40)
  li a0, 1
  li a1, 0
  mv a2, s1
  call cellAt
  li a1, 763
  li a2, 40
  call vfill
  ; sky.e16.ts:259  y++
  addi s1, s1, 1
.L3:
  bgeu s3, s1, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; sky.e16.ts:269 shake(frames) at -O1
;   frames in a0
shake:
  ; sky.e16.ts:270  if (frames > shakeLeft) shakeLeft = frames
  lw t0, 0x0d00(zero)
  bgeu t0, a0, .L1
  ; sky.e16.ts:270  shakeLeft = frames
  sw a0, 0x0d00(zero)
.L1:
.return:
  ret

; sky.e16.ts:274 shakeStep() at -O1
;   r in s2
;   size in s1
shakeStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; sky.e16.ts:275  shakeX = 0
  sw zero, 0x0d02(zero)
  ; sky.e16.ts:276  shakeY = 0
  sw zero, 0x0d04(zero)
  ; sky.e16.ts:277  if (shakeLeft > 0) {
  lw t0, 0x0d00(zero)
  bgeu zero, t0, .L1
  ; sky.e16.ts:278  shakeLeft--
  lw t0, 0x0d00(zero)
  addi t0, t0, -1
  sw t0, 0x0d00(zero)
  ; sky.e16.ts:279  const r = shakeLeft & 3
  andi s2, t0, 3
  ; sky.e16.ts:280  const size = shakeSize()
  ; sky.e16.ts:290  if (shakeLeft > 10) return 3
  lw t0, 0x0d00(zero)
  li t1, 10
  bgeu t1, t0, .I1.L1
  ; sky.e16.ts:290  return 3
  li t0, 3
  j .I1_end
.I1.L1:
  ; sky.e16.ts:291  return shakeLeft > 4 ? 2 : 1
  lw t0, 0x0d00(zero)
  li t1, 4
  bgeu t1, t0, .I1.L2
  li t0, 2
  j .I1_end
.I1.L2:
  li t0, 1
.I1_end:
  mv s1, t0 ; size
  ; sky.e16.ts:281  if (r === 0) shakeX = size
  bne s2, zero, .L2
  ; sky.e16.ts:281  shakeX = size
  sw s1, 0x0d02(zero)
  j .L3
.L2:
  ; sky.e16.ts:282  if (r === 2) shakeX = -size
  li t0, 2
  bne s2, t0, .L4
  ; sky.e16.ts:282  shakeX = -size
  neg t0, s1
  sw t0, 0x0d02(zero)
  j .L5
.L4:
  ; sky.e16.ts:283  if (r === 1) shakeY = size
  li t0, 1
  bne s2, t0, .L6
  ; sky.e16.ts:283  shakeY = size
  sw s1, 0x0d04(zero)
  j .L7
.L6:
  ; sky.e16.ts:284  shakeY = -size
  neg t0, s1
  sw t0, 0x0d04(zero)
.L7:
.L5:
.L3:
.L1:
  ; sky.e16.ts:286  scrollAll(shakeX, shakeY)
  lw t0, 0x0d02(zero)
  lw t1, 0x0d04(zero)
  mv a0, t0
  mv a1, t1
  call scrollAll
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; sky.e16.ts:298 flashScreen(frames, rgb) at -O1
;   frames in a0
;   rgb in a1
flashScreen:
  ; sky.e16.ts:299  flashLeft = frames > 16 ? 16 : frames
  li t0, 16
  bgeu t0, a0, .L1
  li t0, 16
  j .L2
.L1:
  mv t0, a0
.L2:
  sw t0, 0x0d06(zero)
  ; sky.e16.ts:300  flashRgb = rgb
  sw a1, 0x0d08(zero)
.return:
  ret

; sky.e16.ts:303 flashStep() at -O1
flashStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sky.e16.ts:304  if (flashLeft === 0) return
  lw t0, 0x0d06(zero)
  bne t0, zero, .L1
  ; sky.e16.ts:304  return
  j .return
.L1:
  ; sky.e16.ts:305  flashLeft--
  lw t0, 0x0d06(zero)
  addi t0, t0, -1
  sw t0, 0x0d06(zero)
  ; sky.e16.ts:306  palMix(SL_SKY, flashRgb, flashLeft)
  lw t0, 0x0d08(zero)
  lw t1, 0x0d06(zero)
  li a0, 0
  mv a1, t0
  mv a2, t1
  call palMix
  ; sky.e16.ts:307  palMix(SL_CLOUD, flashRgb, flashLeft)
  lw t0, 0x0d08(zero)
  lw t1, 0x0d06(zero)
  li a0, 11
  mv a1, t0
  mv a2, t1
  call palMix
  ; sky.e16.ts:308  palMix(SL_ENEMY, flashRgb, flashLeft)
  lw t0, 0x0d08(zero)
  lw t1, 0x0d06(zero)
  li a0, 9
  mv a1, t0
  mv a2, t1
  call palMix
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sky.e16.ts:322 skyInit() at -O1
;   old in s2
;   k in s1
;   t in s3
skyInit:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  ; sky.e16.ts:323  const old = bank(HORIZON_TABLE_BANK)
  li a0, 323
  call bank
  mv s2, a0 ; old
  ; sky.e16.ts:326  let k: u16 = 0
  li s1, 0 ; k
  ; sky.e16.ts:327  while (k < 801) {
  j .L3
.L1:
  ; sky.e16.ts:328  const t = k < 240 ? 0 : k > 560 ? 320 : k - 240
  li t0, 240
  bgeu s1, t0, .L5
  li t0, 0
  j .L6
.L5:
  li t0, 560
  bgeu t0, s1, .L7
  li t0, 320
  j .L8
.L7:
  addi t0, s1, -240
.L8:
.L6:
  mv s3, t0 ; t
  ; sky.e16.ts:329  hBand[k] = HORIZON_TILE + peek16(HORIZON_TABLE_AT + t * 2)
  slli t0, s1, 1
  slli t1, s3, 1
  li t2, 52140
  add t2, t2, t1
  lw t2, 0(t2)
  addi t2, t2, 64
  sw t2, hBand(t0)
  ; sky.e16.ts:330  k++
  addi s1, s1, 1
.L3:
  li t0, 801
  bltu s1, t0, .L1
  ; sky.e16.ts:332  k = 0
  li s1, 0 ; k
  ; sky.e16.ts:333  while (k < 221) {
  j .L11
.L9:
  ; sky.e16.ts:334  hPart[k] = peek16(HORIZON_TABLE_AT + 642 + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  li t2, 52782
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, hPart(t0)
  ; sky.e16.ts:335  k++
  addi s1, s1, 1
.L11:
  li t0, 221
  bltu s1, t0, .L9
  ; sky.e16.ts:337  poke16(IO_BANK, old)
  li t0, 65284
  sw s2, 0(t0)
  ; sky.e16.ts:338  skyForget()
  call skyForget
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; sky.e16.ts:342 skyForget() at -O1
;   r in a0
skyForget:
  ; sky.e16.ts:343  let r: u16 = 0
  li a0, 0 ; r
  ; sky.e16.ts:344  while (r < 36) {
  j .L3
.L1:
  ; sky.e16.ts:345  hRowWas[r] = 0xffff
  slli t0, a0, 1
  li t1, 65535
  sw t1, hRowWas(t0)
  ; sky.e16.ts:346  r++
  addi a0, a0, 1
.L3:
  li t0, 36
  bltu a0, t0, .L1
.return:
  ret

; sky.e16.ts:362 horizonFind() at -O1
;   rz in s3
;   uz in 0(fp)
;   fz in s1
;   a in s2
;   c in 2(fp)
horizonFind:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; sky.e16.ts:363  const rz = vget(V_PR + 2)
  li a0, 5
  call vget
  mv s3, a0 ; rz
  ; sky.e16.ts:364  const uz = vget(V_PU + 2)
  li a0, 8
  call vget
  sw a0, 0(fp) ; uz
  ; sky.e16.ts:365  const fz = vget(V_PF + 2)
  li a0, 2
  call vget
  mv s1, a0 ; fz
  ; sky.e16.ts:366  const a = aim(rz >> 6, -uz >> 6)
  srai t0, s3, 6
  lw t1, 0(fp) ; uz
  neg t1, t1
  srai t1, t1, 6
  mv a0, t0
  mv a1, t1
  call aim
  mv s2, a0 ; a
  ; sky.e16.ts:367  hNX = cos(a)
  mv a0, s2
  call cos
  sw a0, 0x159e(zero)
  ; sky.e16.ts:368  hNY = sin(a)
  mv a0, s2
  call sin
  sw a0, 0x15a0(zero)
  ; sky.e16.ts:369  hL = mulq(rz, hNX * 64) + mulq(-uz, hNY * 64)
  lw t0, 0x159e(zero)
  slli t0, t0, 6
  mv a0, s3
  mv a1, t0
  call mulq
  lw t0, 0(fp) ; uz
  neg t0, t0
  lw t1, 0x15a0(zero)
  slli t1, t1, 6
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  mv a1, t1
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 0x15a4(zero)
  ; sky.e16.ts:370  const far: i16 = 19200
  ; sky.e16.ts:371  if (hL < 64 || u16(abs16(fz)) > u16(hL) * 3) hC = fz > 0 ? far : -far
  li t1, 64
  blt t0, t1, .L2
  mv a0, s1
  call abs16
  lw t0, 0x15a4(zero)
  slli t1, t0, 1
  add t0, t1, t0
  bgeu t0, a0, .L1
.L2:
  ; sky.e16.ts:371  hC = fz > 0 ? far : -far
  bge zero, s1, .L3
  li t0, 19200
  j .L4
.L3:
  li t0, 46336
.L4:
  sw t0, 0x15a2(zero)
  j .L5
.L1:
  ; sky.e16.ts:373  const c = i16(muldiv(u16(abs16(fz)), 6144, u16(hL)))
  mv a0, s1
  call abs16
  lw t0, 0x15a4(zero)
  li a1, 6144
  mv a2, t0
  call muldiv
  sw a0, 2(fp) ; c
  ; sky.e16.ts:374  hC = fz < 0 ? -c : c
  bge s1, zero, .L6
  lw t0, 2(fp) ; c
  neg t0, t0
  j .L7
.L6:
  lw t0, 2(fp)
.L7:
  sw t0, 0x15a2(zero)
.L5:
  ; sky.e16.ts:376  partialIn((a + 64) & 255)
  addi t0, s2, 64
  andi a0, t0, 255
  call partialIn
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; sky.e16.ts:380 partialIn(b) at -O1
;   b in a0
;   flips in a2
;   bc in a3
;   row in s1
;   o in a1
partialIn:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; sky.e16.ts:381  let flips: u16 = 0
  li a2, 0 ; flips
  ; sky.e16.ts:382  let bc = b
  mv a3, a0 ; bc
  ; sky.e16.ts:383  if (b > 192) {
  li t0, 192
  bgeu t0, a0, .L1
  ; sky.e16.ts:384  bc = 256 - b
  li t0, 256
  sub a3, t0, a0
  ; sky.e16.ts:385  flips = 0x2000
  li a2, 8192 ; flips
  j .L2
.L1:
  ; sky.e16.ts:386  if (b > 128) {
  li t0, 128
  bgeu t0, a0, .L3
  ; sky.e16.ts:387  bc = b - 128
  addi a3, a0, -128
  ; sky.e16.ts:388  flips = 0x6000
  li a2, 24576 ; flips
  j .L4
.L3:
  ; sky.e16.ts:389  if (b > 64) {
  li t0, 64
  bgeu t0, a0, .L5
  ; sky.e16.ts:390  bc = 128 - b
  li t0, 128
  sub a3, t0, a0
  ; sky.e16.ts:391  flips = 0x4000
  li a2, 16384 ; flips
.L5:
.L4:
.L2:
  ; sky.e16.ts:393  const row = ((bc + 2) >> 2) * 13
  addi t0, a3, 2
  srli t0, t0, 2
  li t1, 13
  mul s1, t0, t1
  ; sky.e16.ts:394  let o: u16 = 0
  li a1, 0 ; o
  ; sky.e16.ts:395  while (o < 13) {
  j .L8
.L6:
  ; sky.e16.ts:396  hBand[RANGE - 6 + o] = (HORIZON_TILE + hPart[row + o]) | flips
  addi t0, a1, 394
  slli t0, t0, 1
  add t1, s1, a1
  slli t1, t1, 1
  lw t1, hPart(t1)
  addi t1, t1, 64
  or t1, t1, a2
  sw t1, hBand(t0)
  ; sky.e16.ts:397  o++
  addi a1, a1, 1
.L8:
  li t0, 13
  bltu a1, t0, .L6
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; sky.e16.ts:402 skyDraw() at -O1
;   nx in s2
;   ny in s3
;   r in s1
;   rows in 0(fp)
;   s0 in 2(fp)
skyDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; sky.e16.ts:403  horizonFind()
  call horizonFind
  ; sky.e16.ts:404  const nx = hNX
  lw s2, 0x159e(zero)
  ; sky.e16.ts:405  const ny = hNY
  lw s3, 0x15a0(zero)
  ; sky.e16.ts:407  let r: u16 = cockpitOn ? 1 : 0
  lw t0, 0x0cfe(zero)
  beqz t0, .L1
  li t0, 1
  j .L2
.L1:
  li t0, 0
.L2:
  mv s1, t0 ; r
  ; sky.e16.ts:408  const rows: u16 = cockpitOn ? SKY_ROWS : 36
  lw t0, 0x0cfe(zero)
  beqz t0, .L3
  li t0, 27
  j .L4
.L3:
  li t0, 36
.L4:
  sw t0, 0(fp) ; rows
  ; sky.e16.ts:409  while (r < rows) {
  j .L7
.L5:
  ; sky.e16.ts:410  const s0 = (((i16(r * 2) - 27) * ny - 39 * nx) >> 1) + hC
  slli t0, s1, 1
  addi t0, t0, -27
  mul t0, t0, s3
  li t1, 39
  mul t1, t1, s2
  sub t0, t0, t1
  srai t0, t0, 1
  lw t1, 0x15a2(zero)
  add t0, t0, t1
  sw t0, 2(fp) ; s0
  ; sky.e16.ts:411  skyRow(r, s0, nx)
  mv a0, s1
  lw a1, 2(fp)
  mv a2, s2
  call skyRow
  ; sky.e16.ts:412  r++
  addi s1, s1, 1
.L7:
  lw t0, 0(fp) ; rows
  bltu s1, t0, .L5
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; sky.e16.ts:417 skyRow(r, s0, ds) at -O1
;   r in s2
;   s0 in s1
;   ds in s3
;   w0 in 0(fp)
;   w1 in 4(fp)
;   s1 in 2(fp)
skyRow:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; r
  mv s1, a1 ; s0
  mv s3, a2 ; ds
  ; sky.e16.ts:418  const w0 = hBand[bandAt(s0)]
  mv a0, s1
  call bandAt
  slli t0, a0, 1
  lw t0, hBand(t0)
  sw t0, 0(fp) ; w0
  ; sky.e16.ts:419  const w1 = hBand[bandAt(s0 + 39 * ds)]
  li t0, 39
  mul t0, t0, s3
  add a0, s1, t0
  call bandAt
  slli t0, a0, 1
  lw t0, hBand(t0)
  sw t0, 4(fp) ; w1
  ; sky.e16.ts:420  if (w0 === w1) {
  lw t0, 4(fp) ; w1
  lw t1, 0(fp) ; w0
  bne t1, t0, .L1
  ; sky.e16.ts:421  if (hRowWas[r] === w0) return
  slli t0, s2, 1
  lw t0, hRowWas(t0)
  lw t1, 0(fp) ; w0
  bne t0, t1, .L2
  ; sky.e16.ts:421  return
  j .return
.L2:
  ; sky.e16.ts:422  hRowWas[r] = w0
  slli t0, s2, 1
  lw t1, 0(fp) ; w0
  sw t1, hRowWas(t0)
  ; sky.e16.ts:423  rowFill(w0)
  lw a0, 0(fp)
  call rowFill
  j .L3
.L1:
  ; sky.e16.ts:425  hRowWas[r] = 0xffff
  slli t0, s2, 1
  li t1, 65535
  sw t1, hRowWas(t0)
  ; sky.e16.ts:426  const s1 = s0 + 39 * ds
  li t0, 39
  mul t0, t0, s3
  add t0, s1, t0
  sw t0, 2(fp) ; s1
  ; sky.e16.ts:427  const lim: i16 = 12760
  ; sky.e16.ts:428  if (s0 < lim && s0 > -lim && s1 < lim && s1 > -lim) rowCellsNear(s0, ds)
  li t0, 12760
  bge s1, t0, .L4
  li t0, 52776
  bge t0, s1, .L4
  li t0, 12760
  lw t1, 2(fp) ; s1
  bge t1, t0, .L4
  li t0, 52776
  lw t1, 2(fp) ; s1
  bge t0, t1, .L4
  ; sky.e16.ts:428  rowCellsNear(s0, ds)
  mv a0, s1
  mv a1, s3
  call rowCellsNear
  j .L5
.L4:
  ; sky.e16.ts:429  rowCells(s0, ds)
  mv a0, s1
  mv a1, s3
  call rowCells
.L5:
.L3:
  ; sky.e16.ts:431  dma(addr(hRow), cellAt(0, 0, r), 80)
  li a0, 0
  li a1, 0
  mv a2, s2
  call cellAt
  mv a1, a0
  la a0, hRow
  li a2, 80
  call dma
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; sky.e16.ts:434 bandAt(s) at -O1
;   s in a0
;   p in a1
bandAt:
  ; sky.e16.ts:435  let p = s >> 5
  srai a1, a0, 5
  ; sky.e16.ts:436  if (p > RANGE) p = RANGE
  li t0, 400
  bge t0, a1, .L1
  ; sky.e16.ts:436  p = RANGE
  li a1, 400 ; p
.L1:
  ; sky.e16.ts:437  if (p < -RANGE) p = -RANGE
  li t0, 65136
  bge a1, t0, .L2
  ; sky.e16.ts:437  p = -RANGE
  li a1, 65136 ; p
.L2:
  ; sky.e16.ts:438  return u16(p + RANGE)
  addi a0, a1, 400
.return:
  ret

; sky.e16.ts:442 rowFill(_w) at -O1
;   _w in s1
rowFill:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; _w
  ; sky.e16.ts:443  asm`
  li t0, hRow
  li t1, 40
  .rf_next:
  sw a0, 0(t0)
  addi t0, t0, 2
  addi t1, t1, -1
  bnez t1, .rf_next
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sky.e16.ts:459 rowCellsNear(_s, _ds) at -O1
;   _s in s1
;   _ds in s2
rowCellsNear:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; _s
  mv s2, a1 ; _ds
  ; sky.e16.ts:460  asm`
  li a2, hRow
  li a3, 5
  li t1, hBand + 800
  .rn_seg:
  srai t0, a0, 5
  slli t0, t0, 1
  add t0, t0, t1
  lw t2, 0(t0)
  slli t3, a1, 3
  sub t3, t3, a1
  add t3, t3, a0
  srai t3, t3, 5
  slli t3, t3, 1
  add t3, t3, t1
  lw t3, 0(t3)
  bne t2, t3, .rn_cells
  sw t2, 0(a2)
  sw t2, 2(a2)
  sw t2, 4(a2)
  sw t2, 6(a2)
  sw t2, 8(a2)
  sw t2, 10(a2)
  sw t2, 12(a2)
  sw t2, 14(a2)
  slli t0, a1, 3
  add a0, a0, t0
  beq t2, t2, .rn_next
  .rn_cells:
  srai t0, a0, 5
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 0(a2)
  add a0, a0, a1
  srai t0, a0, 5
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 2(a2)
  add a0, a0, a1
  srai t0, a0, 5
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 4(a2)
  add a0, a0, a1
  srai t0, a0, 5
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 6(a2)
  add a0, a0, a1
  srai t0, a0, 5
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 8(a2)
  add a0, a0, a1
  srai t0, a0, 5
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 10(a2)
  add a0, a0, a1
  srai t0, a0, 5
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 12(a2)
  add a0, a0, a1
  srai t0, a0, 5
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 14(a2)
  add a0, a0, a1
  .rn_next:
  addi a2, a2, 16
  addi a3, a3, -1
  bnez a3, .rn_seg
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sky.e16.ts:545 rowCells(_s, _ds) at -O1
;   _s in s1
;   _ds in s2
rowCells:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; _s
  mv s2, a1 ; _ds
  ; sky.e16.ts:546  asm`
  li a2, hRow
  li a3, 5
  li t1, hBand + 800
  .rc_seg:
  srai t0, a0, 5
  li t2, 400
  min t0, t0, t2
  li t2, -400
  max t0, t0, t2
  slli t0, t0, 1
  add t0, t0, t1
  lw t2, 0(t0)
  slli t3, a1, 3
  sub t3, t3, a1
  add t3, t3, a0
  srai t3, t3, 5
  li t0, 400
  min t3, t3, t0
  li t0, -400
  max t3, t3, t0
  slli t3, t3, 1
  add t3, t3, t1
  lw t3, 0(t3)
  bne t2, t3, .rc_cells
  sw t2, 0(a2)
  sw t2, 2(a2)
  sw t2, 4(a2)
  sw t2, 6(a2)
  sw t2, 8(a2)
  sw t2, 10(a2)
  sw t2, 12(a2)
  sw t2, 14(a2)
  slli t0, a1, 3
  add a0, a0, t0
  beq t2, t2, .rc_next
  .rc_cells:
  srai t0, a0, 5
  li t2, 400
  min t0, t0, t2
  li t2, -400
  max t0, t0, t2
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 0(a2)
  add a0, a0, a1
  srai t0, a0, 5
  li t2, 400
  min t0, t0, t2
  li t2, -400
  max t0, t0, t2
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 2(a2)
  add a0, a0, a1
  srai t0, a0, 5
  li t2, 400
  min t0, t0, t2
  li t2, -400
  max t0, t0, t2
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 4(a2)
  add a0, a0, a1
  srai t0, a0, 5
  li t2, 400
  min t0, t0, t2
  li t2, -400
  max t0, t0, t2
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 6(a2)
  add a0, a0, a1
  srai t0, a0, 5
  li t2, 400
  min t0, t0, t2
  li t2, -400
  max t0, t0, t2
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 8(a2)
  add a0, a0, a1
  srai t0, a0, 5
  li t2, 400
  min t0, t0, t2
  li t2, -400
  max t0, t0, t2
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 10(a2)
  add a0, a0, a1
  srai t0, a0, 5
  li t2, 400
  min t0, t0, t2
  li t2, -400
  max t0, t0, t2
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 12(a2)
  add a0, a0, a1
  srai t0, a0, 5
  li t2, 400
  min t0, t0, t2
  li t2, -400
  max t0, t0, t2
  slli t0, t0, 1
  add t0, t0, t1
  lw t0, 0(t0)
  sw t0, 14(a2)
  add a0, a0, a1
  .rc_next:
  addi a2, a2, 16
  addi a3, a3, -1
  bnez a3, .rc_seg
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; sky.e16.ts:681 toBody(p) at -O1
;   p in s1
toBody:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; p
  ; sky.e16.ts:682  toBodyOf(addr(vec) + p * 2)
  slli t0, s1, 1
  addi a0, t0, vec
  call toBodyOf
  ; sky.e16.ts:683  bodyX = i16(bodyV[0])
  lw t0, bodyV(zero)
  sw t0, 0x15a6(zero)
  ; sky.e16.ts:684  bodyY = i16(bodyV[1])
  lw t0, bodyV+2(zero)
  sw t0, 0x15a8(zero)
  ; sky.e16.ts:685  bodyZ = i16(bodyV[2])
  lw t0, bodyV+4(zero)
  sw t0, 0x15aa(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; sky.e16.ts:689 project() at -O1
project:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; sky.e16.ts:690  if (bodyZ < 8) return false
  lw t0, 0x15aa(zero)
  li t1, 8
  bge t0, t1, .L1
  ; sky.e16.ts:690  return false
  li a0, 0
  j .return
.L1:
  ; sky.e16.ts:691  if (abs16(bodyX) > bodyZ || abs16(bodyY) > bodyZ) return false
  lw a0, 0x15a6(zero)
  call abs16
  lw t0, 0x15aa(zero)
  blt t0, a0, .L3
  lw a0, 0x15a8(zero)
  call abs16
  lw t0, 0x15aa(zero)
  bge t0, a0, .L2
.L3:
  ; sky.e16.ts:691  return false
  li a0, 0
  j .return
.L2:
  ; sky.e16.ts:692  scrX = CX + persp(bodyX, bodyZ) + shakeX
  lw t0, 0x15a6(zero)
  lw t1, 0x15aa(zero)
  mv a0, t0
  mv a1, t1
  call persp
  lw t0, 0x0d02(zero)
  addi t1, a0, 160
  add t1, t1, t0
  sw t1, 0x15ac(zero)
  ; sky.e16.ts:693  scrY = CY - persp(bodyY, bodyZ) + shakeY
  lw t0, 0x15a8(zero)
  lw t1, 0x15aa(zero)
  mv a0, t0
  mv a1, t1
  call persp
  li t0, 112
  sub t0, t0, a0
  lw t1, 0x0d04(zero)
  add t0, t0, t1
  sw t0, 0x15ae(zero)
  ; sky.e16.ts:694  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; sky.e16.ts:701 abovePanel(y, h) at -O1
;   y in a0
;   h in a1
abovePanel:
  ; sky.e16.ts:702  return !cockpitOn || y + h < PANEL_TOP
  lw t0, 0x0cfe(zero)
  seqz t0, t0
  mv t1, t0
  bnez t1, .L1
  add t0, a0, a1
  slti t0, t0, 224
.L1:
  mv a0, t0
.return:
  ret

; sky.e16.ts:710 logoIn(y) at -O1
;   y in s2
;   r in s1
logoIn:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; y
  ; sky.e16.ts:711  load(LOGO_TILES_BANK, LOGO_TILES_AT, LOGO_TILE * 32, LOGO_TILES_BYTES)
  li a0, 321
  li a1, 49152
  li a2, 24416
  li a3, 3936
  call load
  ; sky.e16.ts:712  let r: u16 = 0
  li s1, 0 ; r
  ; sky.e16.ts:713  while (r < LOGO_H) {
  j .L3
.L1:
  ; sky.e16.ts:714  mapRow(LOGO_MAP_BANK, 0xc000 + r * 128, 1, y + r)
  slli t0, s1, 7
  li t1, 49152
  add t1, t1, t0
  add t0, s2, s1
  li a0, 322
  mv a1, t1
  li a2, 1
  mv a3, t0
  call mapRow
  ; sky.e16.ts:715  r++
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

; flight.e16.ts:43 stickIs(r) at -O1
;   r in a0
stickIs:
  ; flight.e16.ts:44  stickReversed = r
  sw a0, 0x15bc(zero)
.return:
  ret

; flight.e16.ts:48 playerNew(alt) at -O1
;   alt in s1
playerNew:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; alt
  ; flight.e16.ts:49  vset(V_PF, 0, ONE, 0)
  li a0, 0
  li a1, 0
  li a2, 16384
  li a3, 0
  call vset
  ; flight.e16.ts:50  vset(V_PR, ONE, 0, 0)
  li a0, 3
  li a1, 16384
  li a2, 0
  li a3, 0
  call vset
  ; flight.e16.ts:51  vset(V_PU, 0, 0, ONE)
  li a0, 6
  li a1, 0
  li a2, 0
  li a3, 16384
  call vset
  ; flight.e16.ts:52  pSpeed = SPEED_CRUISE
  li t0, 320
  sw t0, 0x15b0(zero)
  ; flight.e16.ts:53  pAlt = alt
  sw s1, 0x15b2(zero)
  ; flight.e16.ts:54  pAltFrac = 0
  sw zero, 0x15b4(zero)
  ; flight.e16.ts:55  rollRate = 0
  sw zero, 0x15b6(zero)
  ; flight.e16.ts:56  pitchRate = 0
  sw zero, 0x15b8(zero)
  ; flight.e16.ts:57  throttle = 0
  sw zero, 0x15ba(zero)
  ; flight.e16.ts:58  relFrac[0] = 0
  sw zero, relFrac(zero)
  ; flight.e16.ts:59  relFrac[1] = 0
  sw zero, relFrac+2(zero)
  ; flight.e16.ts:60  relFrac[2] = 0
  sw zero, relFrac+4(zero)
  ; flight.e16.ts:61  velocityKept()
  call velocityKept
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; flight.e16.ts:65 wantedRoll() at -O1
wantedRoll:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; flight.e16.ts:66  if (held(B_LEFT)) return -1060
  li a0, 4
  call held
  beqz a0, .L1
  ; flight.e16.ts:66  return -1060
  li a0, 64476
  j .return
.L1:
  ; flight.e16.ts:67  if (held(B_RIGHT)) return 1060
  li a0, 8
  call held
  beqz a0, .L2
  ; flight.e16.ts:67  return 1060
  li a0, 1060
  j .return
.L2:
  ; flight.e16.ts:68  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; flight.e16.ts:71 wantedPitch() at -O1
;   pull in s2
;   push in s3
;   t/p in s1
wantedPitch:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; flight.e16.ts:72  let pull = held(B_DOWN)
  li a0, 2
  call held
  mv s2, a0 ; pull
  ; flight.e16.ts:73  let push = held(B_UP)
  li a0, 1
  call held
  mv s3, a0 ; push
  ; flight.e16.ts:74  if (stickReversed) {
  lw t0, 0x15bc(zero)
  beqz t0, .L1
  ; flight.e16.ts:75  const t = pull
  mv s1, s2 ; t/p
  ; flight.e16.ts:76  pull = push
  mv s2, s3 ; pull
  ; flight.e16.ts:77  push = t
  mv s3, s1 ; push
.L1:
  ; flight.e16.ts:79  let p: i16 = 0
  li s1, 0 ; t/p
  ; flight.e16.ts:80  if (pull) p = 500
  beqz s2, .L2
  ; flight.e16.ts:80  p = 500
  li s1, 500 ; t/p
.L2:
  ; flight.e16.ts:81  if (push) p = -300
  beqz s3, .L3
  ; flight.e16.ts:81  p = -300
  li s1, 65236 ; t/p
.L3:
  ; flight.e16.ts:83  if (throttle === 2) p = p + (p >> 2)
  lw t0, 0x15ba(zero)
  li t1, 2
  bne t0, t1, .L4
  ; flight.e16.ts:83  p = p + (p >> 2)
  srai t0, s1, 2
  add s1, s1, t0
.L4:
  ; flight.e16.ts:84  if (throttle === 1) p = p - (p >> 3)
  lw t0, 0x15ba(zero)
  li t1, 1
  bne t0, t1, .L5
  ; flight.e16.ts:84  p = p - (p >> 3)
  srai t0, s1, 3
  sub s1, s1, t0
.L5:
  ; flight.e16.ts:85  return p
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; flight.e16.ts:89 playerStep(alive) at -O1
;   alive in s2
;   wr in 0(fp)
;   wp in 2(fp)
;   bankTurn in s3
;   target in s1
playerStep:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; alive
  ; flight.e16.ts:90  throttle = alive && held(B_R) ? 1 : alive && held(B_L) ? 2 : 0
  beqz s2, .L1
  li a0, 512
  call held
  beqz a0, .L1
  li t0, 1
  j .L2
.L1:
  beqz s2, .L3
  li a0, 256
  call held
  beqz a0, .L3
  li t0, 2
  j .L4
.L3:
  li t0, 0
.L4:
.L2:
  sw t0, 0x15ba(zero)
  ; flight.e16.ts:91  const wr = alive ? wantedRoll() : 400
  beqz s2, .L5
  call wantedRoll
  mv t0, a0
  j .L6
.L5:
  li t0, 400
.L6:
  sw t0, 0(fp) ; wr
  ; flight.e16.ts:92  const wp = alive ? wantedPitch() : -120
  beqz s2, .L7
  call wantedPitch
  mv t0, a0
  j .L8
.L7:
  li t0, 65416
.L8:
  sw t0, 2(fp) ; wp
  ; flight.e16.ts:93  rollRate = approach(rollRate, wr, 160)
  lw a0, 0x15b6(zero)
  lw a1, 0(fp)
  li a2, 160
  call approach
  sw a0, 0x15b6(zero)
  ; flight.e16.ts:94  pitchRate = approach(pitchRate, wp, 60)
  lw a0, 0x15b8(zero)
  lw a1, 2(fp)
  li a2, 60
  call approach
  sw a0, 0x15b8(zero)
  ; flight.e16.ts:95  if (rollRate !== 0) rollBy(V_PR, V_PU, rollRate)
  lw t0, 0x15b6(zero)
  beq t0, zero, .L9
  ; flight.e16.ts:95  rollBy(V_PR, V_PU, rollRate)
  lw t0, 0x15b6(zero)
  li a0, 3
  li a1, 6
  mv a2, t0
  call rollBy
.L9:
  ; flight.e16.ts:96  if (pitchRate !== 0) pitchBy(V_PF, V_PU, pitchRate)
  lw t0, 0x15b8(zero)
  beq t0, zero, .L10
  ; flight.e16.ts:96  pitchBy(V_PF, V_PU, pitchRate)
  lw t0, 0x15b8(zero)
  li a0, 0
  li a1, 6
  mv a2, t0
  call pitchBy
.L10:
  ; flight.e16.ts:98  const bankTurn = mulq(-vget(V_PR + 2), 330)
  li a0, 5
  call vget
  neg a0, a0
  li a1, 330
  call mulq
  mv s3, a0 ; bankTurn
  ; flight.e16.ts:99  if (bankTurn !== 0) {
  beq s3, zero, .L11
  ; flight.e16.ts:100  turnWorld(V_PF, bankTurn)
  li a0, 0
  mv a1, s3
  call turnWorld
  ; flight.e16.ts:101  turnWorld(V_PR, bankTurn)
  li a0, 3
  mv a1, s3
  call turnWorld
  ; flight.e16.ts:102  turnWorld(V_PU, bankTurn)
  li a0, 6
  mv a1, s3
  call turnWorld
.L11:
  ; flight.e16.ts:104  orthonormal(V_PF, V_PR, V_PU)
  li a0, 0
  li a1, 3
  li a2, 6
  call orthonormal
  ; flight.e16.ts:105  let target = SPEED_CRUISE
  li s1, 320 ; target
  ; flight.e16.ts:106  if (throttle === 1) target = SPEED_BURNER
  lw t0, 0x15ba(zero)
  li t1, 1
  bne t0, t1, .L12
  ; flight.e16.ts:106  target = SPEED_BURNER
  li s1, 464 ; target
.L12:
  ; flight.e16.ts:107  if (throttle === 2) target = SPEED_BRAKE
  lw t0, 0x15ba(zero)
  li t1, 2
  bne t0, t1, .L13
  ; flight.e16.ts:107  target = SPEED_BRAKE
  li s1, 200 ; target
.L13:
  ; flight.e16.ts:109  target = target - (vget(V_PF + 2) >> 7)
  li a0, 2
  call vget
  srai t0, a0, 7
  sub s1, s1, t0
  ; flight.e16.ts:110  pSpeed = approach(pSpeed, target, 3)
  lw a0, 0x15b0(zero)
  mv a1, s1
  li a2, 3
  call approach
  sw a0, 0x15b0(zero)
  ; flight.e16.ts:111  velocityKept()
  call velocityKept
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; flight.e16.ts:115 pVel(k) at -O1
;   k in a0
pVel:
  ; flight.e16.ts:116  return i16(pv[k])
  slli t0, a0, 1
  lw a0, pv(t0)
.return:
  ret

; flight.e16.ts:122 velocityKept() at -O1
velocityKept:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; flight.e16.ts:123  pv[0] = u16(mulq(vget(V_PF), pSpeed))
  li a0, 0
  call vget
  lw a1, 0x15b0(zero)
  call mulq
  sw a0, pv(zero)
  ; flight.e16.ts:124  pv[1] = u16(mulq(vget(V_PF + 1), pSpeed))
  li a0, 1
  call vget
  lw a1, 0x15b0(zero)
  call mulq
  sw a0, pv+2(zero)
  ; flight.e16.ts:125  pv[2] = u16(mulq(vget(V_PF + 2), pSpeed))
  li a0, 2
  call vget
  lw a1, 0x15b0(zero)
  call mulq
  sw a0, pv+4(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; flight.e16.ts:132 worldStep(ex, ey, ez) at -O1
;   ex in s2
;   ey in s3
;   ez in s0
;   h in s1
worldStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; ex
  mv s3, a1 ; ey
  mv s0, a2 ; ez
  ; flight.e16.ts:133  relMove(0, ex - pVel(0))
  li a0, 0
  call pVel
  sub t0, s2, a0
  li a0, 0
  mv a1, t0
  call relMove
  ; flight.e16.ts:134  relMove(1, ey - pVel(1))
  li a0, 1
  call pVel
  sub t0, s3, a0
  li a0, 1
  mv a1, t0
  call relMove
  ; flight.e16.ts:135  relMove(2, ez - pVel(2))
  li a0, 2
  call pVel
  sub t0, s0, a0
  li a0, 2
  mv a1, t0
  call relMove
  ; flight.e16.ts:136  const h = pAltFrac + pVel(2)
  lw t0, 0x15b4(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 2
  call pVel
  lw t0, 0(sp)
  addi sp, sp, 2
  add s1, t0, a0
  ; flight.e16.ts:137  pAlt = clamp16(pAlt + (h >> 4), -100, 30000)
  lw t0, 0x15b2(zero)
  srai t1, s1, 4
  add a0, t0, t1
  li a1, 65436
  li a2, 30000
  call clamp16
  sw a0, 0x15b2(zero)
  ; flight.e16.ts:138  pAltFrac = h & 15
  andi t0, s1, 15
  sw t0, 0x15b4(zero)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; flight.e16.ts:141 relMove(k, d) at -O1
;   k in s1
;   d in s3
;   t in s2
relMove:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; k
  mv s3, a1 ; d
  ; flight.e16.ts:142  const t = i16(relFrac[k]) + d
  slli t0, s1, 1
  lw t0, relFrac(t0)
  add s2, t0, s3
  ; flight.e16.ts:143  vec[V_REL + k] = u16(clamp16(vget(V_REL + k) + (t >> 4), -24000, 24000))
  addi t0, s1, 18
  slli t0, t0, 1
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s1, 18
  call vget
  srai t0, s2, 4
  add a0, a0, t0
  li a1, 41536
  li a2, 24000
  call clamp16
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; flight.e16.ts:144  relFrac[k] = u16(t & 15)
  slli t0, s1, 1
  andi t1, s2, 15
  sw t1, relFrac(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; flight.e16.ts:148 headingDegrees() at -O1
;   fx in s1
;   fy in s2
;   a in s3
;   h in s0
headingDegrees:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; flight.e16.ts:149  const fx = vget(V_PF)
  li a0, 0
  call vget
  mv s1, a0 ; fx
  ; flight.e16.ts:150  const fy = vget(V_PF + 1)
  li a0, 1
  call vget
  mv s2, a0 ; fy
  ; flight.e16.ts:151  const a = aim(fx >> 6, fy >> 6)
  srai t0, s1, 6
  srai t1, s2, 6
  mv a0, t0
  mv a1, t1
  call aim
  mv s3, a0 ; a
  ; flight.e16.ts:152  const h = (64 - a) & 255
  li t0, 64
  sub t0, t0, s3
  andi s0, t0, 255
  ; flight.e16.ts:153  return (h * 45) >> 5
  li t0, 45
  mul t0, s0, t0
  srli a0, t0, 5
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; flight.e16.ts:157 pitchDegrees() at -O1
;   fz in s2
;   flat in s3
;   a in s1
;   s in s0
pitchDegrees:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  sw s0, 8(sp)
  ; flight.e16.ts:158  const fz = vget(V_PF + 2)
  li a0, 2
  call vget
  mv s2, a0 ; fz
  ; flight.e16.ts:160  const flat = mulq(vget(V_PF), vget(V_PF)) + mulq(vget(V_PF + 1), vget(V_PF + 1))
  li a0, 0
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 1
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 1
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add s3, t0, a0
  ; flight.e16.ts:161  const a = aim(isqrt(u16(flat)) >> 6, fz >> 6)
  mv a0, s3
  call isqrt
  srai t0, a0, 6
  srai t1, s2, 6
  mv a0, t0
  mv a1, t1
  call aim
  mv s1, a0 ; a
  ; flight.e16.ts:162  const s = i16(a > 128 ? a - 256 : a)
  li t0, 128
  bgeu t0, s1, .L1
  addi t0, s1, -256
  j .L2
.L1:
  mv t0, s1
.L2:
  mv s0, t0 ; s
  ; flight.e16.ts:163  return (s * 45) >> 5
  li t0, 45
  mul t0, s0, t0
  srai a0, t0, 5
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; flight.e16.ts:167 isqrt(v) at -O1
;   v in s3
;   x in s1
;   k in s2
isqrt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; v
  ; flight.e16.ts:168  if (v === 0) return 0
  bne s3, zero, .L1
  ; flight.e16.ts:168  return 0
  li a0, 0
  j .return
.L1:
  ; flight.e16.ts:169  let x: u16 = 16384
  li s1, 16384 ; x
  ; flight.e16.ts:170  let k: u16 = 0
  li s2, 0 ; k
  ; flight.e16.ts:171  while (k < 6) {
  j .L4
.L2:
  ; flight.e16.ts:172  x = (x + muldiv(v, 16384, x)) >> 1
  mv a0, s3
  li a1, 16384
  mv a2, s1
  call muldiv
  add t0, s1, a0
  srli s1, t0, 1
  ; flight.e16.ts:173  k++
  addi s2, s2, 1
.L4:
  li t0, 6
  bltu s2, t0, .L2
  ; flight.e16.ts:175  return i16(x)
  mv a0, s1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; bandit.e16.ts:77 acesInit() at -O1
acesInit:
  ; bandit.e16.ts:78  aceHP[0] = 90
  li t0, 90
  sw t0, aceHP(zero)
  ; bandit.e16.ts:79  aceHP[1] = 100
  li t0, 100
  sw t0, aceHP+2(zero)
  ; bandit.e16.ts:80  aceHP[2] = 120
  li t0, 120
  sw t0, aceHP+4(zero)
  ; bandit.e16.ts:81  aceHP[3] = 140
  li t0, 140
  sw t0, aceHP+6(zero)
  ; bandit.e16.ts:82  aceHP[4] = 200
  li t0, 200
  sw t0, aceHP+8(zero)
  ; bandit.e16.ts:83  aceCruise[0] = 300
  li t0, 300
  sw t0, aceCruise(zero)
  ; bandit.e16.ts:84  aceCruise[1] = 320
  li t0, 320
  sw t0, aceCruise+2(zero)
  ; bandit.e16.ts:85  aceCruise[2] = 336
  li t0, 336
  sw t0, aceCruise+4(zero)
  ; bandit.e16.ts:86  aceCruise[3] = 352
  li t0, 352
  sw t0, aceCruise+6(zero)
  ; bandit.e16.ts:87  aceCruise[4] = 372
  li t0, 372
  sw t0, aceCruise+8(zero)
  ; bandit.e16.ts:88  aceRoll[0] = 640
  li t0, 640
  sw t0, aceRoll(zero)
  ; bandit.e16.ts:89  aceRoll[1] = 760
  li t0, 760
  sw t0, aceRoll+2(zero)
  ; bandit.e16.ts:90  aceRoll[2] = 860
  li t0, 860
  sw t0, aceRoll+4(zero)
  ; bandit.e16.ts:91  aceRoll[3] = 940
  li t0, 940
  sw t0, aceRoll+6(zero)
  ; bandit.e16.ts:92  aceRoll[4] = 1040
  li t0, 1040
  sw t0, aceRoll+8(zero)
  ; bandit.e16.ts:93  acePull[0] = 300
  li t0, 300
  sw t0, acePull(zero)
  ; bandit.e16.ts:94  acePull[1] = 340
  li t0, 340
  sw t0, acePull+2(zero)
  ; bandit.e16.ts:95  acePull[2] = 380
  li t0, 380
  sw t0, acePull+4(zero)
  ; bandit.e16.ts:96  acePull[3] = 420
  li t0, 420
  sw t0, acePull+6(zero)
  ; bandit.e16.ts:97  acePull[4] = 470
  li t0, 470
  sw t0, acePull+8(zero)
.return:
  ret

; bandit.e16.ts:101 aceName(k) at -O1
;   k in a0
aceName:
  ; bandit.e16.ts:102  if (k === 0) return str('GANNET')
  bne a0, zero, .L1
  ; bandit.e16.ts:102  return str('GANNET')
  la a0, str_0
  ret
.L1:
  ; bandit.e16.ts:103  if (k === 1) return str('MISTRAL')
  li t0, 1
  bne a0, t0, .L2
  ; bandit.e16.ts:103  return str('MISTRAL')
  la a0, str_1
  ret
.L2:
  ; bandit.e16.ts:104  if (k === 2) return str('CINDER')
  li t0, 2
  bne a0, t0, .L3
  ; bandit.e16.ts:104  return str('CINDER')
  la a0, str_2
  ret
.L3:
  ; bandit.e16.ts:105  if (k === 3) return str('ORACLE')
  li t0, 3
  bne a0, t0, .L4
  ; bandit.e16.ts:105  return str('ORACLE')
  la a0, str_3
  ret
.L4:
  ; bandit.e16.ts:106  return str('NOCTURNE')
  la a0, str_4
.return:
  ret

; bandit.e16.ts:130 banditNew(k, dist) at -O1
;   k in s1
;   dist in s2
banditNew:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; dist
  ; bandit.e16.ts:131  ace = k
  sw s1, 0x15f2(zero)
  ; bandit.e16.ts:132  eHPMax = i16(aceHP[k])
  slli t0, s1, 1
  lw t0, aceHP(t0)
  sw t0, 0x15f6(zero)
  ; bandit.e16.ts:133  eHP = eHPMax
  sw t0, 0x15f4(zero)
  ; bandit.e16.ts:134  eCruise = i16(aceCruise[k])
  slli t0, s1, 1
  lw t0, aceCruise(t0)
  sw t0, 0x15fa(zero)
  ; bandit.e16.ts:135  eSpeed = eCruise
  sw t0, 0x15f8(zero)
  ; bandit.e16.ts:136  eWantSpeed = eCruise
  lw t0, 0x15fa(zero)
  sw t0, 0x160c(zero)
  ; bandit.e16.ts:137  eRollMax = i16(aceRoll[k])
  slli t0, s1, 1
  lw t0, aceRoll(t0)
  sw t0, 0x15fc(zero)
  ; bandit.e16.ts:138  ePullMax = i16(acePull[k])
  slli t0, s1, 1
  lw t0, acePull(t0)
  sw t0, 0x15fe(zero)
  ; bandit.e16.ts:139  eAlive = true
  li t0, 1
  sw t0, 0x1600(zero)
  ; bandit.e16.ts:140  eFlash = 0
  sw zero, 0x1602(zero)
  ; bandit.e16.ts:141  eRollRate = 0
  sw zero, 0x1604(zero)
  ; bandit.e16.ts:142  ePitchRate = 0
  sw zero, 0x1606(zero)
  ; bandit.e16.ts:143  eWantRoll = 0
  sw zero, 0x1608(zero)
  ; bandit.e16.ts:144  eWantPitch = 0
  sw zero, 0x160a(zero)
  ; bandit.e16.ts:146  vset(V_EF, 0, -ONE, 0)
  li a0, 9
  li a1, 0
  li a2, 49152
  li a3, 0
  call vset
  ; bandit.e16.ts:147  vset(V_ER, -ONE, 0, 0)
  li a0, 12
  li a1, 49152
  li a2, 0
  li a3, 0
  call vset
  ; bandit.e16.ts:148  vset(V_EU, 0, 0, ONE)
  li a0, 15
  li a1, 0
  li a2, 0
  li a3, 16384
  call vset
  ; bandit.e16.ts:149  vset(V_REL, 260, dist, 180)
  li a0, 18
  li a1, 260
  mv a2, s2
  li a3, 180
  call vset
  ; bandit.e16.ts:150  frameShown = 0xffff
  li t0, 65535
  sw t0, 0x16a6(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; bandit.e16.ts:153 aiWants(roll, pitch, speed) at -O1
;   roll in a0
;   pitch in a1
;   speed in a2
aiWants:
  ; bandit.e16.ts:154  eWantRoll = roll
  sw a0, 0x1608(zero)
  ; bandit.e16.ts:155  eWantPitch = pitch
  sw a1, 0x160a(zero)
  ; bandit.e16.ts:156  eWantSpeed = speed
  sw a2, 0x160c(zero)
.return:
  ret

; bandit.e16.ts:160 banditStep() at -O1
;   wr in s1
;   wp in s2
banditStep:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; bandit.e16.ts:161  if (eFlash > 0) eFlash--
  lw t0, 0x1602(zero)
  bgeu zero, t0, .L1
  ; bandit.e16.ts:161  eFlash--
  lw t0, 0x1602(zero)
  addi t0, t0, -1
  sw t0, 0x1602(zero)
.L1:
  ; bandit.e16.ts:162  if (!eAlive) return
  lw t0, 0x1600(zero)
  bnez t0, .L2
  ; bandit.e16.ts:162  return
  j .return
.L2:
  ; bandit.e16.ts:163  const wr = eWantRoll > eRollMax ? eRollMax : eWantRoll < -eRollMax ? -eRollMax : eWantRoll
  lw t0, 0x1608(zero)
  lw t1, 0x15fc(zero)
  bge t1, t0, .L3
  lw t0, 0x15fc(zero)
  j .L4
.L3:
  lw t0, 0x1608(zero)
  lw t1, 0x15fc(zero)
  neg t1, t1
  bge t0, t1, .L5
  lw t0, 0x15fc(zero)
  neg t0, t0
  j .L6
.L5:
  lw t0, 0x1608(zero)
.L6:
.L4:
  mv s1, t0 ; wr
  ; bandit.e16.ts:164  const wp = eWantPitch > ePullMax ? ePullMax : eWantPitch < -ePullMax ? -ePullMax : eWantPitch
  lw t0, 0x160a(zero)
  lw t1, 0x15fe(zero)
  bge t1, t0, .L7
  lw t0, 0x15fe(zero)
  j .L8
.L7:
  lw t0, 0x160a(zero)
  lw t1, 0x15fe(zero)
  neg t1, t1
  bge t0, t1, .L9
  lw t0, 0x15fe(zero)
  neg t0, t0
  j .L10
.L9:
  lw t0, 0x160a(zero)
.L10:
.L8:
  mv s2, t0 ; wp
  ; bandit.e16.ts:165  eRollRate = approach(eRollRate, wr, 140)
  lw a0, 0x1604(zero)
  mv a1, s1
  li a2, 140
  call approach
  sw a0, 0x1604(zero)
  ; bandit.e16.ts:166  ePitchRate = approach(ePitchRate, wp, 50)
  lw a0, 0x1606(zero)
  mv a1, s2
  li a2, 50
  call approach
  sw a0, 0x1606(zero)
  ; bandit.e16.ts:167  if (eRollRate !== 0) rollBy(V_ER, V_EU, eRollRate)
  lw t0, 0x1604(zero)
  beq t0, zero, .L11
  ; bandit.e16.ts:167  rollBy(V_ER, V_EU, eRollRate)
  lw t0, 0x1604(zero)
  li a0, 12
  li a1, 15
  mv a2, t0
  call rollBy
.L11:
  ; bandit.e16.ts:168  if (ePitchRate !== 0) pitchBy(V_EF, V_EU, ePitchRate)
  lw t0, 0x1606(zero)
  beq t0, zero, .L12
  ; bandit.e16.ts:168  pitchBy(V_EF, V_EU, ePitchRate)
  lw t0, 0x1606(zero)
  li a0, 9
  li a1, 15
  mv a2, t0
  call pitchBy
.L12:
  ; bandit.e16.ts:169  orthonormal(V_EF, V_ER, V_EU)
  li a0, 9
  li a1, 12
  li a2, 15
  call orthonormal
  ; bandit.e16.ts:170  eSpeed = approach(eSpeed, eWantSpeed - (vget(V_EF + 2) >> 7), 3)
  lw t0, 0x15f8(zero)
  lw t1, 0x160c(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 11
  call vget
  srai t0, a0, 7
  lw t1, 0(sp)
  addi sp, sp, 2
  sub t1, t1, t0
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a0, t0
  mv a1, t1
  li a2, 3
  call approach
  sw a0, 0x15f8(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; bandit.e16.ts:174 eVel(k) at -O1
;   k in s1
eVel:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; bandit.e16.ts:175  return mulq(vget(V_EF + k), eSpeed)
  addi a0, s1, 9
  call vget
  lw a1, 0x15f8(zero)
  call mulq
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; bandit.e16.ts:179 banditHit(n) at -O1
;   n in a0
banditHit:
  ; bandit.e16.ts:180  if (!eAlive) return false
  lw t0, 0x1600(zero)
  bnez t0, .L1
  ; bandit.e16.ts:180  return false
  li a0, 0
  ret
.L1:
  ; bandit.e16.ts:181  eHP = eHP - n
  lw t0, 0x15f4(zero)
  sub t0, t0, a0
  sw t0, 0x15f4(zero)
  ; bandit.e16.ts:182  eFlash = 3
  li t0, 3
  sw t0, 0x1602(zero)
  ; bandit.e16.ts:183  if (eHP > 0) return false
  lw t0, 0x15f4(zero)
  bge zero, t0, .L2
  ; bandit.e16.ts:183  return false
  li a0, 0
  ret
.L2:
  ; bandit.e16.ts:184  eHP = 0
  sw zero, 0x15f4(zero)
  ; bandit.e16.ts:185  eAlive = false
  sw zero, 0x1600(zero)
  ; bandit.e16.ts:186  return true
  li a0, 1
.return:
  ret

; bandit.e16.ts:203 banditView() at -O1
banditView:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; bandit.e16.ts:204  toBody(V_REL)
  li a0, 18
  call toBody
  ; bandit.e16.ts:205  eBX = bodyX
  lw t0, 0x15a6(zero)
  sw t0, 0x160e(zero)
  ; bandit.e16.ts:206  eBY = bodyY
  lw t0, 0x15a8(zero)
  sw t0, 0x1610(zero)
  ; bandit.e16.ts:207  eBZ = bodyZ
  lw t0, 0x15aa(zero)
  sw t0, 0x1612(zero)
  ; bandit.e16.ts:208  eOn = project()
  call project
  sw a0, 0x1618(zero)
  ; bandit.e16.ts:209  eSX = scrX
  lw t0, 0x15ac(zero)
  sw t0, 0x1614(zero)
  ; bandit.e16.ts:210  eSY = scrY
  lw t0, 0x15ae(zero)
  sw t0, 0x1616(zero)
  ; bandit.e16.ts:211  eDist = vlenRel()
  call vlenRel
  sw a0, 0x161c(zero)
  ; bandit.e16.ts:212  eSize = eBZ > 0 ? (eBZ < 260 ? 62 : div(16000, u16(eBZ))) : 0
  lw t0, 0x1612(zero)
  bge zero, t0, .L1
  lw t0, 0x1612(zero)
  li t1, 260
  bge t0, t1, .L3
  li t0, 62
  j .L2
.L3:
  lw t0, 0x1612(zero)
  li t1, 16000
  divu t0, t1, t0
  j .L2
.L1:
  li t0, 0
.L2:
  sw t0, 0x161a(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; bandit.e16.ts:215 vlenRel() at -O1
;   x in s2
;   y in s3
;   z in s0
;   m in s1
vlenRel:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  ; bandit.e16.ts:216  const x = abs16(vget(V_REL))
  li a0, 18
  call vget
  call abs16
  mv s2, a0 ; x
  ; bandit.e16.ts:217  const y = abs16(vget(V_REL + 1))
  li a0, 19
  call vget
  call abs16
  mv s3, a0 ; y
  ; bandit.e16.ts:218  const z = abs16(vget(V_REL + 2))
  li a0, 20
  call vget
  call abs16
  mv s0, a0 ; z
  ; bandit.e16.ts:219  let m = x > y ? x : y
  bge s3, s2, .L1
  mv t0, s2
  j .L2
.L1:
  mv t0, s3
.L2:
  mv s1, t0 ; m
  ; bandit.e16.ts:220  if (z > m) m = z
  bge s1, s0, .L3
  ; bandit.e16.ts:220  m = z
  mv s1, s0 ; m
.L3:
  ; bandit.e16.ts:221  return u16(m) + u16((x + y + z - m) >> 2) + u16((x + y + z - m) >> 4)
  add t0, s2, s3
  add t0, t0, s0
  sub t0, t0, s1
  srai t0, t0, 2
  add t0, s1, t0
  add t1, s2, s3
  add t1, t1, s0
  sub t1, t1, s1
  srai t1, t1, 4
  add a0, t0, t1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; bandit.e16.ts:228 viewsInit() at -O1
;   old in s2
;   k in s1
viewsInit:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; bandit.e16.ts:229  const old = bank(VIEW_TABLE_BANK)
  li a0, 323
  call bank
  mv s2, a0 ; old
  ; bandit.e16.ts:230  let k: u16 = 0
  li s1, 0 ; k
  ; bandit.e16.ts:231  while (k < 51) {
  j .L3
.L1:
  ; bandit.e16.ts:232  viewDir[k] = peek16(VIEW_TABLE_AT + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  li t2, 53224
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, viewDir(t0)
  ; bandit.e16.ts:233  k++
  addi s1, s1, 1
.L3:
  li t0, 51
  bltu s1, t0, .L1
  ; bandit.e16.ts:235  k = 0
  li s1, 0 ; k
  ; bandit.e16.ts:236  while (k < 17) {
  j .L7
.L5:
  ; bandit.e16.ts:237  viewNear[k] = peek16(VIEW_TABLE_AT + 102 + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  li t2, 53326
  add t2, t2, t1
  lw t2, 0(t2)
  sw t2, viewNear(t0)
  ; bandit.e16.ts:238  k++
  addi s1, s1, 1
.L7:
  li t0, 17
  bltu s1, t0, .L5
  ; bandit.e16.ts:240  poke16(IO_BANK, old)
  li t0, 65284
  sw s2, 0(t0)
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; bandit.e16.ts:246 sizeClass(px) at -O1
;   px in a0
sizeClass:
  ; bandit.e16.ts:247  if (px >= 54) return 0
  li t0, 54
  bltu a0, t0, .L1
  ; bandit.e16.ts:247  return 0
  li a0, 0
  ret
.L1:
  ; bandit.e16.ts:248  if (px >= 38) return 1
  li t0, 38
  bltu a0, t0, .L2
  ; bandit.e16.ts:248  return 1
  li a0, 1
  ret
.L2:
  ; bandit.e16.ts:249  if (px >= 26) return 2
  li t0, 26
  bltu a0, t0, .L3
  ; bandit.e16.ts:249  return 2
  li a0, 2
  ret
.L3:
  ; bandit.e16.ts:250  if (px >= 18) return 3
  li t0, 18
  bltu a0, t0, .L4
  ; bandit.e16.ts:250  return 3
  li a0, 3
  ret
.L4:
  ; bandit.e16.ts:251  if (px >= 13) return 4
  li t0, 13
  bltu a0, t0, .L5
  ; bandit.e16.ts:251  return 4
  li a0, 4
  ret
.L5:
  ; bandit.e16.ts:252  if (px >= 9) return 5
  li t0, 9
  bltu a0, t0, .L6
  ; bandit.e16.ts:252  return 5
  li a0, 5
  ret
.L6:
  ; bandit.e16.ts:253  return 6
  li a0, 6
.return:
  ret

; bandit.e16.ts:259 viewOf(big) at -O1
;   big in 8(fp)
;   cx in s1
;   cy in s3
;   cz in 0(fp)
;   best in 2(fp)
;   most in 4(fp)
;   k in s2
;   d in 6(fp)
viewOf:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s1, 12(sp)
  sw s3, 14(sp)
  sw s2, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 8(fp) ; big
  ; bandit.e16.ts:260  let cx = -dotq(va(V_REL), va(V_ER))
  li a0, 18
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 12
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  neg s1, a0
  ; bandit.e16.ts:261  let cy = -dotq(va(V_REL), va(V_EU))
  li a0, 18
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 15
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  neg s3, a0
  ; bandit.e16.ts:262  let cz = -dotq(va(V_REL), va(V_EF))
  li a0, 18
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 9
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  neg t0, a0
  sw t0, 0(fp) ; cz
  ; bandit.e16.ts:263  viewMirror = cx < 0
  slti t0, s1, 0
  sw t0, 0x16a8(zero)
  ; bandit.e16.ts:264  if (viewMirror) cx = -cx
  beqz t0, .L4
  ; bandit.e16.ts:264  cx = -cx
  neg s1, s1
  ; bandit.e16.ts:265  while (vmax(cx, cy, cz) >= 128) {
  j .L4
.L2:
  ; bandit.e16.ts:266  cx = cx >> 1
  srai s1, s1, 1
  ; bandit.e16.ts:267  cy = cy >> 1
  srai s3, s3, 1
  ; bandit.e16.ts:268  cz = cz >> 1
  lw t0, 0(fp) ; cz
  srai t0, t0, 1
  sw t0, 0(fp) ; cz
.L4:
  mv a0, s1
  mv a1, s3
  lw a2, 0(fp)
  call vmax
  li t0, 128
  bge a0, t0, .L2
  ; bandit.e16.ts:270  let best: u16 = 0
  sw zero, 2(fp) ; best
  ; bandit.e16.ts:271  let most: i16 = -32000
  li t0, 33536
  sw t0, 4(fp) ; most
  ; bandit.e16.ts:272  let k: u16 = 0
  li s2, 0 ; k
  ; bandit.e16.ts:273  while (k < 17) {
  j .L8
.L6:
  ; bandit.e16.ts:274  const d = cx * i16(viewDir[k * 3]) + cy * i16(viewDir[k * 3 + 1]) + cz * i16(viewDir[k * 3 + 2])
  slli t1, s2, 1
  add t0, t1, s2
  slli t0, t0, 1
  lw t0, viewDir(t0)
  mul t0, s1, t0
  slli t2, s2, 1
  add t1, t2, s2
  addi t1, t1, 1
  slli t1, t1, 1
  lw t1, viewDir(t1)
  mul t1, s3, t1
  add t0, t0, t1
  slli t2, s2, 1
  add t1, t2, s2
  addi t1, t1, 2
  slli t1, t1, 1
  lw t1, viewDir(t1)
  lw t2, 0(fp) ; cz
  mul t2, t2, t1
  add t0, t0, t2
  sw t0, 6(fp) ; d
  ; bandit.e16.ts:275  if (d > most) {
  lw t0, 4(fp) ; most
  lw t1, 6(fp) ; d
  bge t0, t1, .L10
  ; bandit.e16.ts:276  most = d
  lw t0, 6(fp) ; d
  sw t0, 4(fp) ; most
  ; bandit.e16.ts:277  best = k
  sw s2, 2(fp) ; best
.L10:
  ; bandit.e16.ts:279  k++
  addi s2, s2, 1
.L8:
  li t0, 17
  bltu s2, t0, .L6
  ; bandit.e16.ts:281  return big ? viewNear[best] : best
  lw t0, 8(fp) ; big
  beqz t0, .L11
  lw t0, 2(fp) ; best
  slli t0, t0, 1
  lw t0, viewNear(t0)
  j .L12
.L11:
  lw t0, 2(fp)
.L12:
  mv a0, t0
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s1, 12(sp)
  lw s3, 14(sp)
  lw s2, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; bandit.e16.ts:287 turnOf(view) at -O1
;   view in s2
;   ref in s3
;   rx in 0(fp)
;   ry in 2(fp)
;   gamma in 4(fp)
;   g in s1
turnOf:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; view
  ; bandit.e16.ts:288  const ref = view === 7 || view === 8 ? V_EF : V_EU
  li t0, 7
  beq s2, t0, .L3
  li t0, 8
  bne s2, t0, .L1
.L3:
  li t0, 9
  j .L2
.L1:
  li t0, 15
.L2:
  mv s3, t0 ; ref
  ; bandit.e16.ts:289  const rx = dotq(va(ref), va(V_PR))
  mv a0, s3
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 3
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  sw a0, 0(fp) ; rx
  ; bandit.e16.ts:290  const ry = -dotq(va(ref), va(V_PU))
  mv a0, s3
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 6
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  neg t0, a0
  sw t0, 2(fp) ; ry
  ; bandit.e16.ts:291  const gamma = (aim(rx >> 6, ry >> 6) - 192) & 255
  lw t0, 0(fp) ; rx
  srai t0, t0, 6
  lw t1, 2(fp) ; ry
  srai t1, t1, 6
  mv a0, t0
  mv a1, t1
  call aim
  addi t0, a0, -192
  andi t0, t0, 255
  sw t0, 4(fp) ; gamma
  ; bandit.e16.ts:292  let g = ((gamma + 8) >> 4) & 15
  lw t0, 4(fp) ; gamma
  addi t0, t0, 8
  srli t0, t0, 4
  andi s1, t0, 15
  ; bandit.e16.ts:293  frameFlips = 0
  sw zero, 0x16aa(zero)
  ; bandit.e16.ts:294  if (viewMirror) {
  lw t0, 0x16a8(zero)
  beqz t0, .L4
  ; bandit.e16.ts:295  g = (16 - g) & 15
  li t0, 16
  sub t0, t0, s1
  andi s1, t0, 15
  ; bandit.e16.ts:296  frameFlips = FLIP_H
  li t0, 8192
  sw t0, 0x16aa(zero)
.L4:
  ; bandit.e16.ts:298  if (g >= 8) {
  li t0, 8
  bltu s1, t0, .L5
  ; bandit.e16.ts:299  g = g - 8
  addi s1, s1, -8
  ; bandit.e16.ts:300  frameFlips = frameFlips ^ (FLIP_H | FLIP_V)
  lw t0, 0x16aa(zero)
  li t1, 24576
  xor t0, t0, t1
  sw t0, 0x16aa(zero)
.L5:
  ; bandit.e16.ts:302  return g
  mv a0, s1
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; bandit.e16.ts:306 frameLoad(c, k) at -O1
;   c in s1
;   k in s2
;   key in s3
;   t in 0(fp)
;   base in 4(fp)
;   off in 2(fp)
frameLoad:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; c
  mv s2, a1 ; k
  ; bandit.e16.ts:307  const key = (c << 12) | k
  slli t0, s1, 12
  or s3, t0, s2
  ; bandit.e16.ts:308  if (key === frameShown) return
  lw t0, 0x16a6(zero)
  bne s3, t0, .L1
  ; bandit.e16.ts:308  return
  j .return
.L1:
  ; bandit.e16.ts:309  frameShown = key
  sw s3, 0x16a6(zero)
  ; bandit.e16.ts:310  const t = tilesOf(c)
  mv a0, s1
  call tilesOf
  sw a0, 0(fp) ; t
  ; bandit.e16.ts:311  const base = sheetAt(c)
  mv a0, s1
  call sheetAt
  sw a0, 4(fp) ; base
  ; bandit.e16.ts:312  const off = ((base - 0xc000) >> 5) + k * t
  lw t0, 4(fp) ; base
  li t0, 49152
  lw t1, 4(fp) ; base
  sub t1, t1, t0
  srli t1, t1, 5
  lw t0, 0(fp) ; t
  mul t0, s2, t0
  add t1, t1, t0
  sw t1, 2(fp) ; off
  ; bandit.e16.ts:313  load(sheetBank(c) + (off >> 8), 0xc000 + ((off & 255) << 5), BANDIT64_TILE * 32, t * 32)
  mv a0, s1
  call sheetBank
  lw t0, 2(fp) ; off
  srli t0, t0, 8
  add t0, a0, t0
  lw t1, 2(fp) ; off
  andi t1, t1, 255
  slli t1, t1, 5
  li t2, 49152
  add t2, t2, t1
  lw t1, 0(fp) ; t
  slli t1, t1, 5
  mv a0, t0
  mv a1, t2
  li a2, 20768
  mv a3, t1
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

; bandit.e16.ts:316 tilesOf(c) at -O1
;   c in a0
tilesOf:
  ; bandit.e16.ts:317  if (c === 0) return 64
  bne a0, zero, .L1
  ; bandit.e16.ts:317  return 64
  li a0, 64
  ret
.L1:
  ; bandit.e16.ts:318  if (c === 1) return 36
  li t0, 1
  bne a0, t0, .L2
  ; bandit.e16.ts:318  return 36
  li a0, 36
  ret
.L2:
  ; bandit.e16.ts:319  if (c <= 3) return 16
  li t0, 3
  bltu t0, a0, .L3
  ; bandit.e16.ts:319  return 16
  li a0, 16
  ret
.L3:
  ; bandit.e16.ts:320  if (c <= 5) return 4
  li t0, 5
  bltu t0, a0, .L4
  ; bandit.e16.ts:320  return 4
  li a0, 4
  ret
.L4:
  ; bandit.e16.ts:321  return 1
  li a0, 1
.return:
  ret

; bandit.e16.ts:324 sheetBank(c) at -O1
;   c in a0
sheetBank:
  ; bandit.e16.ts:325  if (c === 0) return BANDIT64_BANK
  bne a0, zero, .L1
  ; bandit.e16.ts:325  return BANDIT64_BANK
  li a0, 266
  ret
.L1:
  ; bandit.e16.ts:326  if (c === 1) return BANDIT48_BANK
  li t0, 1
  bne a0, t0, .L2
  ; bandit.e16.ts:326  return BANDIT48_BANK
  li a0, 284
  ret
.L2:
  ; bandit.e16.ts:327  if (c === 2) return BANDIT32_BANK
  li t0, 2
  bne a0, t0, .L3
  ; bandit.e16.ts:327  return BANDIT32_BANK
  li a0, 295
  ret
.L3:
  ; bandit.e16.ts:328  if (c === 3) return BANDIT24_BANK
  li t0, 3
  bne a0, t0, .L4
  ; bandit.e16.ts:328  return BANDIT24_BANK
  li a0, 304
  ret
.L4:
  ; bandit.e16.ts:329  if (c === 4) return BANDIT16_BANK
  li t0, 4
  bne a0, t0, .L5
  ; bandit.e16.ts:329  return BANDIT16_BANK
  li a0, 313
  ret
.L5:
  ; bandit.e16.ts:330  if (c === 5) return BANDIT12_BANK
  li t0, 5
  bne a0, t0, .L6
  ; bandit.e16.ts:330  return BANDIT12_BANK
  li a0, 316
  ret
.L6:
  ; bandit.e16.ts:331  return BANDIT8_BANK
  li a0, 318
.return:
  ret

; bandit.e16.ts:334 sheetAt(c) at -O1
;   c in a0
sheetAt:
  ; bandit.e16.ts:335  if (c === 0) return BANDIT64_AT
  bne a0, zero, .L1
  ; bandit.e16.ts:335  return BANDIT64_AT
  li a0, 49152
  ret
.L1:
  ; bandit.e16.ts:336  if (c === 1) return BANDIT48_AT
  li t0, 1
  bne a0, t0, .L2
  ; bandit.e16.ts:336  return BANDIT48_AT
  li a0, 49152
  ret
.L2:
  ; bandit.e16.ts:337  if (c === 2) return BANDIT32_AT
  li t0, 2
  bne a0, t0, .L3
  ; bandit.e16.ts:337  return BANDIT32_AT
  li a0, 49152
  ret
.L3:
  ; bandit.e16.ts:338  if (c === 3) return BANDIT24_AT
  li t0, 3
  bne a0, t0, .L4
  ; bandit.e16.ts:338  return BANDIT24_AT
  li a0, 49152
  ret
.L4:
  ; bandit.e16.ts:339  if (c === 4) return BANDIT16_AT
  li t0, 4
  bne a0, t0, .L5
  ; bandit.e16.ts:339  return BANDIT16_AT
  li a0, 49152
  ret
.L5:
  ; bandit.e16.ts:340  if (c === 5) return BANDIT12_AT
  li t0, 5
  bne a0, t0, .L6
  ; bandit.e16.ts:340  return BANDIT12_AT
  li a0, 49152
  ret
.L6:
  ; bandit.e16.ts:341  return BANDIT8_AT
  li a0, 50176
.return:
  ret

; bandit.e16.ts:353 banditDraw() at -O1
;   view/pal in s1
banditDraw:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; bandit.e16.ts:354  if (!eAlive || !eOn) return
  lw t0, 0x1600(zero)
  beqz t0, .L2
  lw t0, 0x1618(zero)
  bnez t0, .L1
.L2:
  ; bandit.e16.ts:354  return
  j .return
.L1:
  ; bandit.e16.ts:355  eClass = sizeClass(eSize)
  lw a0, 0x161a(zero)
  call sizeClass
  sw a0, 0x16b4(zero)
  ; bandit.e16.ts:356  if (!abovePanel(eSY, eClass === 0 ? 32 : eClass === 1 ? 24 : 16)) return
  lw t0, 0x1616(zero)
  lw t1, 0x16b4(zero)
  li t2, 0
  bne t1, t2, .L4
  li t1, 32
  j .L5
.L4:
  lw t1, 0x16b4(zero)
  li t2, 1
  bne t1, t2, .L6
  li t1, 24
  j .L7
.L6:
  li t1, 16
.L7:
.L5:
  mv a0, t0
  mv a1, t1
  call abovePanel
  bnez a0, .L3
  ; bandit.e16.ts:356  return
  j .return
.L3:
  ; bandit.e16.ts:359  viewTick = viewTick ^ 1
  lw t0, 0x16ac(zero)
  xori t0, t0, 1
  sw t0, 0x16ac(zero)
  ; bandit.e16.ts:360  if (viewTick === 0 || eClass !== classWas) {
  beq t0, zero, .L9
  lw t0, 0x16b4(zero)
  lw t1, 0x16ae(zero)
  beq t0, t1, .L8
.L9:
  ; bandit.e16.ts:361  const view = viewOf(eClass <= 1)
  lw t0, 0x16b4(zero)
  li t1, 1
  sltu t0, t1, t0
  xori a0, t0, 1
  call viewOf
  mv s1, a0 ; view/pal
  ; bandit.e16.ts:362  frameNow = view * 8 + turnOf(view)
  slli t0, s1, 3
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s1
  call turnOf
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 0x16b0(zero)
  ; bandit.e16.ts:363  flipsNow = frameFlips
  lw t0, 0x16aa(zero)
  sw t0, 0x16b2(zero)
  ; bandit.e16.ts:364  classWas = eClass
  lw t0, 0x16b4(zero)
  sw t0, 0x16ae(zero)
.L8:
  ; bandit.e16.ts:366  frameLoad(eClass, frameNow)
  lw t0, 0x16b4(zero)
  lw t1, 0x16b0(zero)
  mv a0, t0
  mv a1, t1
  call frameLoad
  ; bandit.e16.ts:367  const pal = (eFlash > 0 ? SL_FLASH - 8 : SL_ENEMY - 8) << 10
  lw t0, 0x1602(zero)
  bgeu zero, t0, .L10
  li t0, 6
  j .L11
.L10:
  li t0, 1
.L11:
  slli s1, t0, 10
  ; bandit.e16.ts:368  drawFrame(eSX, eSY, BANDIT64_TILE | pal | flipsNow, eClass)
  lw t0, 0x1614(zero)
  lw t1, 0x1616(zero)
  li t2, 649
  or t2, t2, s1
  lw t3, 0x16b2(zero)
  or t2, t2, t3
  lw t3, 0x16b4(zero)
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call drawFrame
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; bandit.e16.ts:375 drawFrame(x, y, word, c) at -O1
;   x in s1
;   y in s2
;   word in s3
;   c in s0
drawFrame:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; word
  mv s0, a3 ; c
  ; bandit.e16.ts:376  if (c === 0) cells(x - 32, y - 32, word, 2)
  bne s0, zero, .L1
  ; bandit.e16.ts:376  cells(x - 32, y - 32, word, 2)
  addi a0, s1, -32
  addi a1, s2, -32
  mv a2, s3
  li a3, 2
  call cells
  j .L2
.L1:
  ; bandit.e16.ts:377  if (c === 1) cells(x - 24, y - 24, word, 3)
  li t0, 1
  bne s0, t0, .L3
  ; bandit.e16.ts:377  cells(x - 24, y - 24, word, 3)
  addi a0, s1, -24
  addi a1, s2, -24
  mv a2, s3
  li a3, 3
  call cells
  j .L4
.L3:
  ; bandit.e16.ts:378  if (c <= 3) spr(x - 16, y - 16, word, S32)
  li t0, 3
  bltu t0, s0, .L5
  ; bandit.e16.ts:378  spr(x - 16, y - 16, word, S32)
  addi a0, s1, -16
  addi a1, s2, -16
  mv a2, s3
  li a3, 2
  call spr
  j .L6
.L5:
  ; bandit.e16.ts:379  if (c <= 5) spr(x - 8, y - 8, word, S16)
  li t0, 5
  bltu t0, s0, .L7
  ; bandit.e16.ts:379  spr(x - 8, y - 8, word, S16)
  addi a0, s1, -8
  addi a1, s2, -8
  mv a2, s3
  li a3, 1
  call spr
  j .L8
.L7:
  ; bandit.e16.ts:380  spr(x - 4, y - 4, word, S8)
  addi a0, s1, -4
  addi a1, s2, -4
  mv a2, s3
  li a3, 0
  call spr
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; bandit.e16.ts:383 cells(x0, y0, word, n) at -O1
;   x0 in 6(fp)
;   y0 in 8(fp)
;   word in s3
;   n in s1
;   size in 0(fp)
;   step in 10(fp)
;   fh in 12(fp)
;   fv in 14(fp)
;   j in s2
;   cx in 2(fp)
;   cy in 4(fp)
;   px in 16(fp)
;   py in 18(fp)
cells:
  addi sp, sp, -30
  sw ra, 20(sp)
  sw s3, 22(sp)
  sw s1, 24(sp)
  sw s2, 26(sp)
  sw s0, 28(sp)
  mv fp, sp
  sw a0, 6(fp) ; x0
  sw a1, 8(fp) ; y0
  mv s3, a2 ; word
  mv s1, a3 ; n
  ; bandit.e16.ts:384  const size: i16 = n === 2 ? 32 : 16
  li t0, 2
  bne s1, t0, .L1
  li t0, 32
  j .L2
.L1:
  li t0, 16
.L2:
  sw t0, 0(fp) ; size
  ; bandit.e16.ts:385  const step: u16 = n === 2 ? 16 : 4
  li t0, 2
  bne s1, t0, .L3
  li t0, 16
  j .L4
.L3:
  li t0, 4
.L4:
  sw t0, 10(fp) ; step
  ; bandit.e16.ts:386  const fh = (word & FLIP_H) !== 0
  li t0, 8192
  and t0, s3, t0
  sub t0, t0, zero
  snez t0, t0
  sw t0, 12(fp) ; fh
  ; bandit.e16.ts:387  const fv = (word & FLIP_V) !== 0
  li t0, 16384
  and t0, s3, t0
  sub t0, t0, zero
  snez t0, t0
  sw t0, 14(fp) ; fv
  ; bandit.e16.ts:388  let j: u16 = 0
  li s2, 0 ; j
  ; bandit.e16.ts:389  while (j < n * n) {
  j .L7
.L5:
  ; bandit.e16.ts:390  const cx = j % n
  remu t0, s2, s1
  sw t0, 2(fp) ; cx
  ; bandit.e16.ts:391  const cy = div(j, n)
  divu t0, s2, s1
  sw t0, 4(fp) ; cy
  ; bandit.e16.ts:392  const px = fh ? n - 1 - cx : cx
  lw t0, 12(fp) ; fh
  beqz t0, .L9
  lw t0, 2(fp) ; cx
  addi t1, s1, -1
  sub t0, t1, t0
  j .L10
.L9:
  lw t0, 2(fp)
.L10:
  sw t0, 16(fp) ; px
  ; bandit.e16.ts:393  const py = fv ? n - 1 - cy : cy
  lw t0, 14(fp) ; fv
  beqz t0, .L11
  lw t0, 4(fp) ; cy
  addi t1, s1, -1
  sub t0, t1, t0
  j .L12
.L11:
  lw t0, 4(fp)
.L12:
  sw t0, 18(fp) ; py
  ; bandit.e16.ts:394  spr(x0 + i16(px) * size, y0 + i16(py) * size, word + j * step, n === 2 ? S32 : S16)
  lw t0, 0(fp) ; size
  lw t1, 16(fp) ; px
  mul t1, t1, t0
  lw t0, 6(fp) ; x0
  add t0, t0, t1
  lw t1, 0(fp) ; size
  lw t2, 18(fp) ; py
  mul t2, t2, t1
  lw t1, 8(fp) ; y0
  add t1, t1, t2
  lw t2, 10(fp) ; step
  mul t2, s2, t2
  add t2, s3, t2
  mv t3, s1
  li a1, 2
  bne t3, a1, .L13
  li t3, 2
  j .L14
.L13:
  li t3, 1
.L14:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call spr
  ; bandit.e16.ts:395  j++
  addi s2, s2, 1
.L7:
  mul t0, s1, s1
  bltu s2, t0, .L5
.return:
  mv sp, fp
  lw ra, 20(sp)
  lw s3, 22(sp)
  lw s1, 24(sp)
  lw s2, 26(sp)
  lw s0, 28(sp)
  addi sp, sp, 30
  ret

; bandit.e16.ts:400 banditShow(x, y, view, mirror) at -O1
;   x in s1
;   y in s2
;   view in s3
;   mirror in s0
banditShow:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; view
  mv s0, a3 ; mirror
  ; bandit.e16.ts:401  frameLoad(0, view * 8)
  slli t0, s3, 3
  li a0, 0
  mv a1, t0
  call frameLoad
  ; bandit.e16.ts:402  drawFrame(x, y, BANDIT64_TILE | ((SL_ENEMY - 8) << 10) | (mirror ? FLIP_H : 0), 0)
  mv t0, s1
  mv t1, s2
  li t2, 1673
  mv t3, s0
  beqz t3, .L1
  li t3, 8192
  j .L2
.L1:
  li t3, 0
.L2:
  or t2, t2, t3
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 0
  call drawFrame
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; audio.e16.ts:52 music(m) at -O1
;   m in s1
music:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; m
  ; audio.e16.ts:53  if (m === M_TITLE) play(SONG_TITLE_BANK, SONG_TITLE_AT, true)
  li t0, 1
  bne s1, t0, .L1
  ; audio.e16.ts:53  play(SONG_TITLE_BANK, SONG_TITLE_AT, true)
  li a0, 322
  li a1, 50176
  li a2, 1
  call play
  j .L2
.L1:
  ; audio.e16.ts:54  if (m === M_BRIEF) play(SONG_BRIEF_BANK, SONG_BRIEF_AT, true)
  li t0, 2
  bne s1, t0, .L3
  ; audio.e16.ts:54  play(SONG_BRIEF_BANK, SONG_BRIEF_AT, true)
  li a0, 322
  li a1, 52296
  li a2, 1
  call play
  j .L4
.L3:
  ; audio.e16.ts:55  if (m === M_FIGHT) play(SONG_FIGHT_BANK, SONG_FIGHT_AT, true)
  li t0, 3
  bne s1, t0, .L5
  ; audio.e16.ts:55  play(SONG_FIGHT_BANK, SONG_FIGHT_AT, true)
  li a0, 322
  li a1, 52918
  li a2, 1
  call play
  j .L6
.L5:
  ; audio.e16.ts:56  if (m === M_FINAL) play(SONG_FINAL_BANK, SONG_FINAL_AT, true)
  li t0, 4
  bne s1, t0, .L7
  ; audio.e16.ts:56  play(SONG_FINAL_BANK, SONG_FINAL_AT, true)
  li a0, 323
  li a1, 49152
  li a2, 1
  call play
  j .L8
.L7:
  ; audio.e16.ts:57  if (m === M_WIN) play(SONG_WIN_BANK, SONG_WIN_AT, true)
  li t0, 5
  bne s1, t0, .L9
  ; audio.e16.ts:57  play(SONG_WIN_BANK, SONG_WIN_AT, true)
  li a0, 323
  li a1, 50792
  li a2, 1
  call play
  j .L10
.L9:
  ; audio.e16.ts:58  if (m === M_OVER) play(SONG_OVER_BANK, SONG_OVER_AT, true)
  li t0, 6
  bne s1, t0, .L11
  ; audio.e16.ts:58  play(SONG_OVER_BANK, SONG_OVER_AT, true)
  li a0, 323
  li a1, 51086
  li a2, 1
  call play
  j .L12
.L11:
  ; audio.e16.ts:59  if (m === M_ENDING) play(SONG_ENDING_BANK, SONG_ENDING_AT, true)
  li t0, 7
  bne s1, t0, .L13
  ; audio.e16.ts:59  play(SONG_ENDING_BANK, SONG_ENDING_AT, true)
  li a0, 323
  li a1, 51174
  li a2, 1
  call play
  j .L14
.L13:
  ; audio.e16.ts:60  musicStop()
  call musicStop
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

; audio.e16.ts:63 sfxGun() at -O1
sfxGun:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:64  play(SONG_X_GUN_BANK, SONG_X_GUN_AT, false)
  li a0, 323
  li a1, 51764
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:67 sfxMissile() at -O1
sfxMissile:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:68  play(SONG_X_MISSILE_BANK, SONG_X_MISSILE_AT, false)
  li a0, 323
  li a1, 51788
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:71 sfxSeek() at -O1
sfxSeek:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:72  play(SONG_X_SEEK_BANK, SONG_X_SEEK_AT, false)
  li a0, 323
  li a1, 51834
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:75 sfxLock() at -O1
sfxLock:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:76  play(SONG_X_LOCK_BANK, SONG_X_LOCK_AT, false)
  li a0, 323
  li a1, 51858
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:79 sfxAlert() at -O1
sfxAlert:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:80  play(SONG_X_ALERT_BANK, SONG_X_ALERT_AT, false)
  li a0, 323
  li a1, 51882
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:83 sfxHit() at -O1
sfxHit:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:84  play(SONG_X_HIT_BANK, SONG_X_HIT_AT, false)
  li a0, 323
  li a1, 51910
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:87 sfxOuch() at -O1
sfxOuch:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:88  play(SONG_X_OUCH_BANK, SONG_X_OUCH_AT, false)
  li a0, 323
  li a1, 51934
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:91 sfxBoom() at -O1
sfxBoom:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:92  play(SONG_X_BOOM_BANK, SONG_X_BOOM_AT, false)
  li a0, 323
  li a1, 51980
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:95 sfxFlare() at -O1
sfxFlare:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:96  play(SONG_X_FLARE_BANK, SONG_X_FLARE_AT, false)
  li a0, 323
  li a1, 52026
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:99 sfxSelect() at -O1
sfxSelect:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:100  play(SONG_X_SELECT_BANK, SONG_X_SELECT_AT, false)
  li a0, 323
  li a1, 52072
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; audio.e16.ts:103 sfxSplash() at -O1
sfxSplash:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; audio.e16.ts:104  play(SONG_X_SPLASH_BANK, SONG_X_SPLASH_AT, false)
  li a0, 323
  li a1, 52104
  li a2, 0
  call play
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; game.e16.ts:187 seenIs(v) at -O1
;   v in a0
seenIs:
  ; game.e16.ts:188  seen = v
  sw a0, 0x1b3c(zero)
.return:
  ret

; game.e16.ts:191 skyIs(on) at -O1
;   on in a0
skyIs:
  ; game.e16.ts:192  skyOn = on
  sw a0, 0x1b40(zero)
.return:
  ret

; game.e16.ts:195 main() at -O1
main:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; game.e16.ts:196  kitInit()
  call kitInit
  ; game.e16.ts:197  soundInit()
  call soundInit
  ; game.e16.ts:198  screenOn()
  call screenOn
  ; game.e16.ts:199  palettesIn(0)
  li a0, 0
  call palettesIn
  ; game.e16.ts:200  spritesIn()
  call spritesIn
  ; game.e16.ts:201  skyInit()
  call skyInit
  ; game.e16.ts:202  viewsInit()
  call viewsInit
  ; game.e16.ts:203  acesInit()
  call acesInit
  ; game.e16.ts:204  hudInit()
  la t0, hudInit
  li t1, 259
  call far_call
  ; game.e16.ts:205  tableLoad()
  la t0, tableLoad
  li t1, 258
  call far_call
  ; game.e16.ts:206  for (;;) {
.L1:
  ; game.e16.ts:207  title()
  la t0, title
  li t1, 258
  call far_call
  ; game.e16.ts:208  campaign()
  call campaign
  j .L1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; game.e16.ts:213 spritesIn() at -O1
spritesIn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; game.e16.ts:214  load(FONT_BANK, FONT_AT, FONT_TILE * 32, FONT_BYTES)
  li a0, 262
  li a1, 50498
  li a2, 0
  li a3, 2048
  call load
  ; game.e16.ts:215  load(HORIZON_BANK, HORIZON_AT, HORIZON_TILE * 32, HORIZON_BYTES)
  li a0, 263
  li a1, 49152
  li a2, 2048
  li a3, 6304
  call load
  ; game.e16.ts:216  load(HUD8_BANK, HUD8_AT, HUD8_TILE * 32, HUD8_BYTES)
  li a0, 263
  li a1, 55456
  li a2, 8352
  li a3, 768
  call load
  ; game.e16.ts:217  load(HUD16_BANK, HUD16_AT, HUD16_TILE * 32, HUD16_BYTES)
  li a0, 263
  li a1, 56224
  li a2, 9120
  li a3, 1024
  call load
  ; game.e16.ts:218  load(SEEKER_BANK, SEEKER_AT, SEEKER_TILE * 32, SEEKER_BYTES)
  li a0, 264
  li a1, 49152
  li a2, 10144
  li a3, 512
  call load
  ; game.e16.ts:219  load(SHOTS_BANK, SHOTS_AT, SHOTS_TILE * 32, SHOTS_BYTES)
  li a0, 264
  li a1, 49664
  li a2, 10656
  li a3, 256
  call load
  ; game.e16.ts:220  load(BLAST32_BANK, BLAST32_AT, BLAST32_TILE * 32, BLAST32_BYTES)
  li a0, 264
  li a1, 49920
  li a2, 10912
  li a3, 4096
  call load
  ; game.e16.ts:221  load(BLAST16_BANK, BLAST16_AT, BLAST16_TILE * 32, BLAST16_BYTES)
  li a0, 264
  li a1, 54016
  li a2, 15008
  li a3, 768
  call load
  ; game.e16.ts:222  load(BITS_BANK, BITS_AT, BITS_TILE * 32, BITS_BYTES)
  li a0, 264
  li a1, 54784
  li a2, 15776
  li a3, 192
  call load
  ; game.e16.ts:223  load(SMOKE_BANK, SMOKE_AT, SMOKE_TILE * 32, SMOKE_BYTES)
  li a0, 264
  li a1, 54976
  li a2, 15968
  li a3, 512
  call load
  ; game.e16.ts:224  load(CLOUD64_BANK, CLOUD64_AT, CLOUD64_TILE * 32, CLOUD64_BYTES)
  li a0, 265
  li a1, 49152
  li a2, 16480
  li a3, 2048
  call load
  ; game.e16.ts:225  load(CLOUD32_BANK, CLOUD32_AT, CLOUD32_TILE * 32, CLOUD32_BYTES)
  li a0, 265
  li a1, 51200
  li a2, 18528
  li a3, 1024
  call load
  ; game.e16.ts:226  load(CLOUD16_BANK, CLOUD16_AT, CLOUD16_TILE * 32, CLOUD16_BYTES)
  li a0, 265
  li a1, 52224
  li a2, 19552
  li a3, 256
  call load
  ; game.e16.ts:227  load(CLOUD8_BANK, CLOUD8_AT, CLOUD8_TILE * 32, CLOUD8_BYTES)
  li a0, 265
  li a1, 52480
  li a2, 19808
  li a3, 64
  call load
  ; game.e16.ts:228  load(SUN_BANK, SUN_AT, SUN_TILE * 32, SUN_BYTES)
  li a0, 265
  li a1, 52544
  li a2, 19872
  li a3, 512
  call load
  ; game.e16.ts:229  load(FLARE_BANK, FLARE_AT, FLARE_TILE * 32, FLARE_BYTES)
  li a0, 265
  li a1, 53056
  li a2, 20384
  li a3, 384
  call load
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; game.e16.ts:233 frameBegin() at -O1
frameBegin:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; game.e16.ts:234  seen = frame_wait(seen)
  lw a0, 0x1b3c(zero)
  call frame_wait
  sw a0, 0x1b3c(zero)
  ; game.e16.ts:235  sprShow()
  call sprShow
  ; game.e16.ts:236  shakeStep()
  call shakeStep
  ; game.e16.ts:237  if (skyOn) skyDraw()
  lw t0, 0x1b40(zero)
  beqz t0, .L1
  ; game.e16.ts:237  skyDraw()
  call skyDraw
.L1:
  ; game.e16.ts:238  flashStep()
  call flashStep
  ; game.e16.ts:239  padRead()
  call padRead
  ; game.e16.ts:240  soundTick()
  call soundTick
  ; game.e16.ts:241  sprBegin()
  ; lib/kit.e16.ts:233  sprN = 0
  sw zero, 0x0880(zero)
  ; game.e16.ts:242  frame++
  lw t0, 0x1b3e(zero)
  addi t0, t0, 1
  sw t0, 0x1b3e(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; game.e16.ts:252 points(tens) at -O1
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
  ; game.e16.ts:253  let left = tens
  mv s1, s3 ; left
  ; game.e16.ts:254  while (left > 0) {
  j .L3
.L1:
  ; game.e16.ts:255  const n = left > 9000 ? 9000 : left
  li t0, 9000
  bgeu t0, s1, .L5
  li t0, 9000
  j .L6
.L5:
  mv t0, s1
.L6:
  mv s2, t0 ; n
  ; game.e16.ts:256  scoreAdd(addr(score), n)
  la a0, score
  mv a1, s2
  call scoreAdd
  ; game.e16.ts:257  left = left - n
  sub s1, s1, s2
.L3:
  bltu zero, s1, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; game.e16.ts:277 sortieSetup(k) at -O1
;   k in s1
;   skyIs.on in s2
sortieSetup:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; game.e16.ts:278  mapsClear()
  call mapsClear
  ; game.e16.ts:279  palettesIn(k)
  mv a0, s1
  call palettesIn
  ; game.e16.ts:280  cloudTint(k)
  mv a0, s1
  call cloudTint
  ; game.e16.ts:281  slot(PAL_ACE_GANNET + k, SL_ENEMY)
  addi a0, s1, 19
  li a1, 9
  call slot
  ; game.e16.ts:282  cockpitTilesIn()
  call cockpitTilesIn
  ; game.e16.ts:283  cockpitIn()
  call cockpitIn
  ; game.e16.ts:284  playerNew(5200)
  li a0, 5200
  call playerNew
  ; game.e16.ts:285  banditNew(k, 5200)
  mv a0, s1
  li a1, 5200
  call banditNew
  ; game.e16.ts:286  hudLabels()
  la t0, hudLabels
  li t1, 259
  call far_call
  ; game.e16.ts:287  aiNew()
  la t0, aiNew
  li t1, 257
  call far_call
  ; game.e16.ts:288  armsNew()
  la t0, armsNew
  li t1, 261
  call far_call
  ; game.e16.ts:289  fxClear()
  la t0, fxClear
  li t1, 260
  call far_call
  ; game.e16.ts:290  cloudsNew(i16(k === 2 ? 5600 : 4200))
  li t0, 2
  bne s1, t0, .L1
  li t0, 5600
  j .L2
.L1:
  li t0, 4200
.L2:
  mv a0, t0
  la t0, cloudsNew
  li t1, 260
  call far_call
  ; game.e16.ts:291  if (k === 4) sunIs(-1400, 3000, 600, false)
  li t0, 4
  bne s1, t0, .L3
  ; game.e16.ts:291  sunIs(-1400, 3000, 600, false)
  li a0, 64136
  li a1, 3000
  li a2, 600
  li a3, 0
  la t0, sunIs
  li t1, 260
  call far_call
  j .L4
.L3:
  ; game.e16.ts:292  if (k === 3 || k === 1) sunIs(-3600, 1800, 420, true)
  li t0, 3
  beq s1, t0, .L6
  li t0, 1
  bne s1, t0, .L5
.L6:
  ; game.e16.ts:292  sunIs(-3600, 1800, 420, true)
  li a0, 61936
  li a1, 1800
  li a2, 420
  li a3, 1
  la t0, sunIs
  li t1, 260
  call far_call
  j .L7
.L5:
  ; game.e16.ts:293  sunIs(1600, 3000, 2400, true)
  li a0, 1600
  li a1, 3000
  li a2, 2400
  li a3, 1
  la t0, sunIs
  li t1, 260
  call far_call
.L7:
.L4:
  ; game.e16.ts:294  skyIs(true)
  li s2, 1 ; skyIs.on
  ; game.e16.ts:192  skyOn = on
  sw s2, 0x1b40(zero)
  ; game.e16.ts:295  damage = 0
  sw zero, 0x1b4c(zero)
  ; game.e16.ts:296  flown = 0
  sw zero, 0x1b4e(zero)
  ; game.e16.ts:297  clock = SORTIE_FRAMES
  li t0, 10800
  sw t0, 0x1b50(zero)
  ; game.e16.ts:298  outcome = 0
  sw zero, 0x1b52(zero)
  ; game.e16.ts:299  endT = 0
  sw zero, 0x1b54(zero)
  ; game.e16.ts:300  hitsTaken = 0
  sw zero, 0x1b56(zero)
  ; game.e16.ts:301  music(k === 4 ? M_FINAL : M_FIGHT)
  li t0, 4
  bne s1, t0, .L8
  li t0, 4
  j .L9
.L8:
  li t0, 3
.L9:
  mv a0, t0
  call music
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; game.e16.ts:305 cloudTint(k) at -O1
;   k in s1
cloudTint:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; game.e16.ts:306  if (k === 1) tintSlot(SL_CLOUD, 0x433f, 5)
  li t0, 1
  bne s1, t0, .L1
  ; game.e16.ts:306  tintSlot(SL_CLOUD, 0x433f, 5)
  li a0, 11
  li a1, 17215
  li a2, 5
  call tintSlot
  j .L2
.L1:
  ; game.e16.ts:307  if (k === 2) tintSlot(SL_CLOUD, 0x3dcd, 6)
  li t0, 2
  bne s1, t0, .L3
  ; game.e16.ts:307  tintSlot(SL_CLOUD, 0x3dcd, 6)
  li a0, 11
  li a1, 15821
  li a2, 6
  call tintSlot
  j .L4
.L3:
  ; game.e16.ts:308  if (k === 3) tintSlot(SL_CLOUD, 0x29bc, 6)
  li t0, 3
  bne s1, t0, .L5
  ; game.e16.ts:308  tintSlot(SL_CLOUD, 0x29bc, 6)
  li a0, 11
  li a1, 10684
  li a2, 6
  call tintSlot
  j .L6
.L5:
  ; game.e16.ts:309  if (k === 4) tintSlot(SL_CLOUD, 0x1441, 11)
  li t0, 4
  bne s1, t0, .L7
  ; game.e16.ts:309  tintSlot(SL_CLOUD, 0x1441, 11)
  li a0, 11
  li a1, 5185
  li a2, 11
  call tintSlot
.L7:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; game.e16.ts:313 fly(k) at -O1
;   k in s1
;   skyIs.on in s2
fly:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; game.e16.ts:314  sortie = k
  sw s1, 0x1b4a(zero)
  ; game.e16.ts:315  sortieSetup(k)
  mv a0, s1
  call sortieSetup
  ; game.e16.ts:316  say(13, 8, str('ENGAGE'), SL_WHITE)
  li a0, 13
  li a1, 8
  la a2, str_19
  li a3, 7
  call say
  ; game.e16.ts:317  for (;;) {
.L1:
  ; game.e16.ts:318  frameBegin()
  call frameBegin
  ; game.e16.ts:319  if (pressed(B_START) && outcome === 0) pause()
  li a0, 1024
  call pressed
  beqz a0, .L5
  lw t0, 0x1b52(zero)
  bne t0, zero, .L5
  ; game.e16.ts:319  pause()
  la t0, pause
  li t1, 258
  call far_call
.L5:
  ; game.e16.ts:320  if (flown === 120) unsay(13, 8, 7)
  lw t0, 0x1b4e(zero)
  li t1, 120
  bne t0, t1, .L6
  ; game.e16.ts:320  unsay(13, 8, 7)
  li a0, 13
  li a1, 8
  li a2, 7
  call unsay
.L6:
  ; game.e16.ts:321  flyFrame()
  call flyFrame
  ; game.e16.ts:322  if (outcome !== 0) {
  lw t0, 0x1b52(zero)
  beq t0, zero, .L1
  ; game.e16.ts:323  endT++
  lw t0, 0x1b54(zero)
  addi t0, t0, 1
  sw t0, 0x1b54(zero)
  ; game.e16.ts:324  if (endT > 200) break
  li t1, 200
  bgeu t1, t0, .L1
  ; game.e16.ts:324  break
  ; game.e16.ts:327  skyIs(false)
  li s2, 0 ; skyIs.on
  ; game.e16.ts:192  skyOn = on
  sw s2, 0x1b40(zero)
  ; game.e16.ts:328  return outcome
  lw a0, 0x1b52(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; game.e16.ts:332 flyFrame() at -O1
;   alive in s1
flyFrame:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; game.e16.ts:333  const alive = outcome === 0 || outcome === 1
  lw t0, 0x1b52(zero)
  sub t0, t0, zero
  seqz t0, t0
  mv t1, t0
  bnez t1, .L1
  lw t0, 0x1b52(zero)
  li t1, 1
  sub t0, t0, t1
  seqz t0, t0
.L1:
  mv s1, t0 ; alive
  ; game.e16.ts:334  flown++
  lw t0, 0x1b4e(zero)
  addi t0, t0, 1
  sw t0, 0x1b4e(zero)
  ; game.e16.ts:335  if (clock > 0 && outcome === 0) clock--
  lw t0, 0x1b50(zero)
  bgeu zero, t0, .L2
  lw t0, 0x1b52(zero)
  bne t0, zero, .L2
  ; game.e16.ts:335  clock--
  lw t0, 0x1b50(zero)
  addi t0, t0, -1
  sw t0, 0x1b50(zero)
.L2:
  ; game.e16.ts:336  playerStep(alive)
  mv a0, s1
  call playerStep
  ; game.e16.ts:337  aiStep()
  la t0, aiStep
  li t1, 257
  call far_call
  ; game.e16.ts:338  banditStep()
  call banditStep
  ; game.e16.ts:339  worldStep(eVel(0), eVel(1), eVel(2))
  li a0, 0
  call eVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 1
  call eVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 2
  call eVel
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  call worldStep
  ; game.e16.ts:340  banditView()
  call banditView
  ; game.e16.ts:341  if (alive) shoot()
  beqz s1, .L3
  ; game.e16.ts:341  shoot()
  call shoot
.L3:
  ; game.e16.ts:342  roundsStep()
  la t0, roundsStep
  li t1, 261
  call far_call
  ; game.e16.ts:343  missilesStep()
  la t0, missilesStep
  li t1, 261
  call far_call
  ; game.e16.ts:344  flaresStep()
  la t0, flaresStep
  li t1, 261
  call far_call
  ; game.e16.ts:345  cloudsStep()
  la t0, cloudsStep
  li t1, 260
  call far_call
  ; game.e16.ts:346  struck()
  call struck
  ; game.e16.ts:347  ending()
  call ending
  ; game.e16.ts:348  sounds()
  call sounds
  ; game.e16.ts:349  draw()
  call draw
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; game.e16.ts:352 shoot() at -O1
shoot:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; game.e16.ts:353  playerGun()
  la t0, playerGun
  li t1, 261
  call far_call
  ; game.e16.ts:354  playerMissile()
  la t0, playerMissile
  li t1, 261
  call far_call
  ; game.e16.ts:355  if (playerFlares()) sfxFlare()
  la t0, playerFlares
  li t1, 261
  call far_call
  beqz a0, .L1
  ; game.e16.ts:355  sfxFlare()
  call sfxFlare
.L1:
  ; game.e16.ts:356  if (gunFiring && (frame & 3) < 3) sfxGun()
  lw t0, 0x1844(zero)
  beqz t0, .L2
  lw t0, 0x1b3e(zero)
  andi t0, t0, 3
  li t1, 3
  bgeu t0, t1, .L2
  ; game.e16.ts:356  sfxGun()
  call sfxGun
.L2:
  ; game.e16.ts:357  if (missileFired) sfxMissile()
  lw t0, 0x18d6(zero)
  beqz t0, .L3
  ; game.e16.ts:357  sfxMissile()
  call sfxMissile
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; game.e16.ts:361 struck() at -O1
struck:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; game.e16.ts:362  if (hitsOnEnemy > 0) {
  lw t0, 0x183c(zero)
  bgeu zero, t0, .L1
  ; game.e16.ts:363  points(3 * hitsOnEnemy)
  lw t0, 0x183c(zero)
  li t1, 3
  mul a0, t1, t0
  call points
  ; game.e16.ts:364  sfxHit()
  call sfxHit
.L1:
  ; game.e16.ts:366  if (missileStruck > 0) {
  lw t0, 0x18d4(zero)
  bgeu zero, t0, .L2
  ; game.e16.ts:367  points(30)
  li a0, 30
  call points
  ; game.e16.ts:368  shake(6)
  li a0, 6
  call shake
.L2:
  ; game.e16.ts:370  if (hitsOnPlayer > 0 && outcome === 0) hurt(hitsOnPlayer * 3)
  lw t0, 0x183e(zero)
  bgeu zero, t0, .L3
  lw t0, 0x1b52(zero)
  bne t0, zero, .L3
  ; game.e16.ts:370  hurt(hitsOnPlayer * 3)
  lw t0, 0x183e(zero)
  slli t1, t0, 1
  add a0, t1, t0
  call hurt
.L3:
  ; game.e16.ts:371  if (missileOnPlayer && outcome === 0) hurt(34)
  lw t0, 0x18de(zero)
  beqz t0, .L4
  lw t0, 0x1b52(zero)
  bne t0, zero, .L4
  ; game.e16.ts:371  hurt(34)
  li a0, 34
  call hurt
.L4:
  ; game.e16.ts:372  missileOnClear()
  la t0, missileOnClear
  li t1, 261
  call far_call
  ; game.e16.ts:373  if (!eAlive && outcome === 0) aceDown()
  lw t0, 0x1600(zero)
  bnez t0, .L5
  lw t0, 0x1b52(zero)
  bne t0, zero, .L5
  ; game.e16.ts:373  aceDown()
  call aceDown
.L5:
  ; game.e16.ts:374  wounds()
  call wounds
  ; game.e16.ts:375  ownSmoke()
  call ownSmoke
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; game.e16.ts:382 ownSmoke() at -O1
;   every in s0
;   x in s1
;   y in s2
;   z in s3
ownSmoke:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s0, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  ; game.e16.ts:383  const every: u16 = outcome === 2 ? 1 : damage >= 75 ? 3 : 7
  lw t0, 0x1b52(zero)
  li t1, 2
  bne t0, t1, .L1
  li t0, 1
  j .L2
.L1:
  lw t0, 0x1b4c(zero)
  li t1, 75
  bltu t0, t1, .L3
  li t0, 3
  j .L4
.L3:
  li t0, 7
.L4:
.L2:
  mv s0, t0 ; every
  ; game.e16.ts:384  if (damage < 50 || (frame & every) !== 0) return
  lw t0, 0x1b4c(zero)
  li t1, 50
  bltu t0, t1, .L6
  lw t0, 0x1b3e(zero)
  and t0, t0, s0
  beq t0, zero, .L5
.L6:
  ; game.e16.ts:384  return
  j .return
.L5:
  ; game.e16.ts:385  const x = mulq(vget(V_PF), 70) - mulq(vget(V_PU), 18)
  li a0, 0
  call vget
  li a1, 70
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 6
  call vget
  li a1, 18
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub s1, t0, a0
  ; game.e16.ts:386  const y = mulq(vget(V_PF + 1), 70) - mulq(vget(V_PU + 1), 18)
  li a0, 1
  call vget
  li a1, 70
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 7
  call vget
  li a1, 18
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub s2, t0, a0
  ; game.e16.ts:387  const z = mulq(vget(V_PF + 2), 70) - mulq(vget(V_PU + 2), 18)
  li a0, 2
  call vget
  li a1, 70
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call vget
  li a1, 18
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub s3, t0, a0
  ; game.e16.ts:388  puffAt(x, y, z, 1)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  li a3, 1
  la t0, puffAt
  li t1, 260
  call far_call
  ; game.e16.ts:389  if (outcome === 2 && (frame & 3) === 0) boomAt(x, y, z)
  lw t0, 0x1b52(zero)
  li t1, 2
  bne t0, t1, .L7
  lw t0, 0x1b3e(zero)
  andi t0, t0, 3
  bne t0, zero, .L7
  ; game.e16.ts:389  boomAt(x, y, z)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  la t0, boomAt
  li t1, 260
  call far_call
.L7:
.return:
  lw ra, 0(sp)
  lw s0, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; game.e16.ts:393 wounds() at -O1
wounds:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; game.e16.ts:394  if (!eAlive || eHP * 2 > eHPMax || (frame & 7) !== 0) return
  lw t0, 0x1600(zero)
  beqz t0, .L2
  lw t0, 0x15f4(zero)
  slli t0, t0, 1
  lw t1, 0x15f6(zero)
  blt t1, t0, .L2
  lw t0, 0x1b3e(zero)
  andi t0, t0, 7
  beq t0, zero, .L1
.L2:
  ; game.e16.ts:394  return
  j .return
.L1:
  ; game.e16.ts:395  puffAt(vget(V_REL), vget(V_REL + 1), vget(V_REL + 2), 1)
  li a0, 18
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 19
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 20
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  li a3, 1
  la t0, puffAt
  li t1, 260
  call far_call
  ; game.e16.ts:396  if (eHP * 4 < eHPMax) sparkAt(vget(V_REL), vget(V_REL + 1), vget(V_REL + 2))
  lw t0, 0x15f4(zero)
  slli t0, t0, 2
  lw t1, 0x15f6(zero)
  bge t0, t1, .L3
  ; game.e16.ts:396  sparkAt(vget(V_REL), vget(V_REL + 1), vget(V_REL + 2))
  li a0, 18
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 19
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 20
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  la t0, sparkAt
  li t1, 260
  call far_call
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; game.e16.ts:399 hurt(n) at -O1
;   n in s1
hurt:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; n
  ; game.e16.ts:400  damage = damage + n > 100 ? 100 : damage + n
  lw t0, 0x1b4c(zero)
  add t0, t0, s1
  li t1, 100
  bgeu t1, t0, .L1
  li t0, 100
  j .L2
.L1:
  lw t0, 0x1b4c(zero)
  add t0, t0, s1
.L2:
  sw t0, 0x1b4c(zero)
  ; game.e16.ts:401  hitsTaken++
  lw t0, 0x1b56(zero)
  addi t0, t0, 1
  sw t0, 0x1b56(zero)
  ; game.e16.ts:402  sfxOuch()
  call sfxOuch
  ; game.e16.ts:403  shake(n > 10 ? 24 : 8)
  li t0, 10
  bgeu t0, s1, .L3
  li t0, 24
  j .L4
.L3:
  li t0, 8
.L4:
  mv a0, t0
  call shake
  ; game.e16.ts:404  flashScreen(n > 10 ? 12 : 5, 0x001f)
  li t0, 10
  bgeu t0, s1, .L5
  li t0, 12
  j .L6
.L5:
  li t0, 5
.L6:
  mv a0, t0
  li a1, 31
  call flashScreen
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; game.e16.ts:407 aceDown() at -O1
aceDown:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; game.e16.ts:408  outcome = 1
  li t0, 1
  sw t0, 0x1b52(zero)
  ; game.e16.ts:409  shotDown(eVel(0), eVel(1))
  li a0, 0
  call eVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 1
  call eVel
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  la t0, shotDown
  li t1, 260
  call far_call
  ; game.e16.ts:410  sfxBoom()
  call sfxBoom
  ; game.e16.ts:411  sfxSplash()
  call sfxSplash
  ; game.e16.ts:412  shake(28)
  li a0, 28
  call shake
  ; game.e16.ts:413  flashScreen(10, 0x7fff)
  li a0, 10
  li a1, 32767
  call flashScreen
  ; game.e16.ts:414  points(500 * (sortie + 1))
  lw t0, 0x1b4a(zero)
  addi t0, t0, 1
  li t1, 500
  mul a0, t1, t0
  call points
  ; game.e16.ts:415  unsay(13, 8, 7)
  li a0, 13
  li a1, 8
  li a2, 7
  call unsay
  ; game.e16.ts:416  say(12, 8, str('TARGET DESTROYED'), SL_WHITE)
  li a0, 12
  li a1, 8
  la a2, str_20
  li a3, 7
  call say
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; game.e16.ts:420 ending() at -O1
ending:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; game.e16.ts:421  if (outcome !== 0) return
  lw t0, 0x1b52(zero)
  beq t0, zero, .L1
  ; game.e16.ts:421  return
  j .return
.L1:
  ; game.e16.ts:422  if (damage >= 100) lost(2, str('YOU ARE HIT'))
  lw t0, 0x1b4c(zero)
  li t1, 100
  bltu t0, t1, .L2
  ; game.e16.ts:422  lost(2, str('YOU ARE HIT'))
  li a0, 2
  la a1, str_21
  call lost
  j .L3
.L2:
  ; game.e16.ts:423  if (pAlt <= 0) lost(3, str('CRASHED'))
  lw t0, 0x15b2(zero)
  blt zero, t0, .L4
  ; game.e16.ts:423  lost(3, str('CRASHED'))
  li a0, 3
  la a1, str_22
  call lost
  j .L5
.L4:
  ; game.e16.ts:424  if (clock === 0) lost(4, str('TIME OVER'))
  lw t0, 0x1b50(zero)
  bne t0, zero, .L6
  ; game.e16.ts:424  lost(4, str('TIME OVER'))
  li a0, 4
  la a1, str_23
  call lost
.L6:
.L5:
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; game.e16.ts:427 lost(how, words_) at -O1
;   how in s1
;   words_ in s2
lost:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; how
  mv s2, a1 ; words_
  ; game.e16.ts:428  unsay(13, 8, 7)
  li a0, 13
  li a1, 8
  li a2, 7
  call unsay
  ; game.e16.ts:429  outcome = how
  sw s1, 0x1b52(zero)
  ; game.e16.ts:430  shake(40)
  li a0, 40
  call shake
  ; game.e16.ts:431  flashScreen(16, how === 4 ? 0x7fff : 0x001f)
  li t0, 16
  mv t1, s1
  li t2, 4
  bne t1, t2, .L1
  li t1, 32767
  j .L2
.L1:
  li t1, 31
.L2:
  mv a0, t0
  mv a1, t1
  call flashScreen
  ; game.e16.ts:432  sfxBoom()
  call sfxBoom
  ; game.e16.ts:433  say(15, 8, words_, SL_RED)
  li a0, 15
  li a1, 8
  mv a2, s2
  li a3, 5
  call say
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; game.e16.ts:437 sounds() at -O1
;   s in s1
;   every in s2
sounds:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; game.e16.ts:438  const s = seekerStep()
  la t0, seekerStep
  li t1, 261
  call far_call
  mv s1, a0 ; s
  ; game.e16.ts:439  if (s === 1) sfxLock()
  li t0, 1
  bne s1, t0, .L1
  ; game.e16.ts:439  sfxLock()
  call sfxLock
  j .L2
.L1:
  ; game.e16.ts:440  if (s === 2 && (frame & 7) === 0) sfxSeek()
  li t0, 2
  bne s1, t0, .L3
  lw t0, 0x1b3e(zero)
  andi t0, t0, 7
  bne t0, zero, .L3
  ; game.e16.ts:440  sfxSeek()
  call sfxSeek
  j .L4
.L3:
  ; game.e16.ts:441  if (s === 3 && (frame & 15) === 0) sfxLock()
  li t0, 3
  bne s1, t0, .L5
  lw t0, 0x1b3e(zero)
  andi t0, t0, 15
  bne t0, zero, .L5
  ; game.e16.ts:441  sfxLock()
  call sfxLock
.L5:
.L4:
.L2:
  ; game.e16.ts:442  if (!warned) return
  lw t0, 0x18d0(zero)
  bnez t0, .L6
  ; game.e16.ts:442  return
  j .return
.L6:
  ; game.e16.ts:443  const every: u16 = warnDist < 1500 ? 7 : warnDist < 4000 ? 15 : 31
  lw t0, 0x18d2(zero)
  li t1, 1500
  bgeu t0, t1, .L7
  li t0, 7
  j .L8
.L7:
  lw t0, 0x18d2(zero)
  li t1, 4000
  bgeu t0, t1, .L9
  li t0, 15
  j .L10
.L9:
  li t0, 31
.L10:
.L8:
  mv s2, t0 ; every
  ; game.e16.ts:444  if ((frame & every) === 0) sfxAlert()
  lw t0, 0x1b3e(zero)
  and t0, t0, s2
  bne t0, zero, .L11
  ; game.e16.ts:444  sfxAlert()
  call sfxAlert
.L11:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; game.e16.ts:448 draw() at -O1
;   low in s1
draw:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; game.e16.ts:449  const low = pAlt < 1200 && outcome !== 3
  lw t0, 0x15b2(zero)
  slti t0, t0, 1200
  mv t1, t0
  beqz t1, .L1
  lw t0, 0x1b52(zero)
  li t1, 3
  sub t0, t0, t1
  snez t0, t0
.L1:
  mv s1, t0 ; low
  ; game.e16.ts:450  if (outcome === 0 || outcome === 1) hudDraw(frame, low)
  lw t0, 0x1b52(zero)
  beq t0, zero, .L3
  lw t0, 0x1b52(zero)
  li t1, 1
  bne t0, t1, .L2
.L3:
  ; game.e16.ts:450  hudDraw(frame, low)
  lw a0, 0x1b3e(zero)
  mv a1, s1
  la t0, hudDraw
  li t1, 259
  call far_call
.L2:
  ; game.e16.ts:451  cloudsDraw(eBZ, true)
  lw a0, 0x1612(zero)
  li a1, 1
  la t0, cloudsDraw
  li t1, 260
  call far_call
  ; game.e16.ts:452  banditDraw()
  call banditDraw
  ; game.e16.ts:453  fxStep()
  la t0, fxStep
  li t1, 260
  call far_call
  ; game.e16.ts:454  cloudsDraw(eBZ, false)
  lw a0, 0x1612(zero)
  li a1, 0
  la t0, cloudsDraw
  li t1, 260
  call far_call
  ; game.e16.ts:455  sunDraw()
  la t0, sunDraw
  li t1, 260
  call far_call
  ; game.e16.ts:456  hudNumbers(damage, missilesLeft, flaresLeft, div(clock, 60))
  lw t0, 0x1b4c(zero)
  lw t1, 0x18ca(zero)
  lw t2, 0x18cc(zero)
  lw t3, 0x1b50(zero)
  li a1, 60
  divu t3, t3, a1
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  la t0, hudNumbers
  li t1, 259
  call far_call
  ; game.e16.ts:457  hudScore(score[1], score[0])
  lw t0, score+2(zero)
  lw t1, score(zero)
  mv a0, t0
  mv a1, t1
  la t0, hudScore
  li t1, 259
  call far_call
  ; game.e16.ts:458  lamps(frame, low)
  lw a0, 0x1b3e(zero)
  mv a1, s1
  la t0, lamps
  li t1, 259
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; game.e16.ts:461 hitsAgainst() at -O1
hitsAgainst:
  ; game.e16.ts:462  return hitsTaken
  lw a0, 0x1b56(zero)
.return:
  ret

; game.e16.ts:468 campaign() at -O1
;   k in s1
;   credits in s2
;   before0 in s3
;   before1 in 0(fp)
;   how in 2(fp)
campaign:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  ; game.e16.ts:469  score[0] = 0
  sw zero, score(zero)
  ; game.e16.ts:470  score[1] = 0
  sw zero, score+2(zero)
  ; game.e16.ts:471  let k: u16 = 0
  li s1, 0 ; k
  ; game.e16.ts:472  let credits: u16 = 3
  li s2, 3 ; credits
  ; game.e16.ts:473  while (k < 5) {
  j .L3
.L1:
  ; game.e16.ts:474  const before0 = score[0]
  lw s3, score(zero)
  ; game.e16.ts:475  const before1 = score[1]
  lw t0, score+2(zero)
  sw t0, 0(fp) ; before1
  ; game.e16.ts:476  briefing(k)
  mv a0, s1
  la t0, briefing
  li t1, 258
  call far_call
  ; game.e16.ts:477  const how = fly(k)
  mv a0, s1
  call fly
  sw a0, 2(fp) ; how
  ; game.e16.ts:478  if (how === 1) {
  li t0, 1
  lw t1, 2(fp) ; how
  bne t1, t0, .L5
  ; game.e16.ts:479  results(k)
  mv a0, s1
  la t0, results
  li t1, 258
  call far_call
  ; game.e16.ts:480  k++
  addi s1, s1, 1
  j .L6
.L5:
  ; game.e16.ts:482  if (credits === 0 || !continueAsk(credits)) break
  beq s2, zero, .L4
  mv a0, s2
  la t0, continueAsk
  li t1, 258
  call far_call
  bnez a0, .L7
  ; game.e16.ts:482  break
  j .L4
.L7:
  ; game.e16.ts:483  credits--
  addi s2, s2, -1
  ; game.e16.ts:484  score[0] = before0
  sw s3, score(zero)
  ; game.e16.ts:485  score[1] = before1
  lw t0, 0(fp) ; before1
  sw t0, score+2(zero)
.L6:
.L3:
  li t0, 5
  bltu s1, t0, .L1
.L4:
  ; game.e16.ts:488  if (k === 5) ending_()
  li t0, 5
  bne s1, t0, .L9
  ; game.e16.ts:488  ending_()
  la t0, ending_
  li t1, 258
  call far_call
.L9:
  ; game.e16.ts:489  gameOver()
  la t0, gameOver
  li t1, 258
  call far_call
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

str_0:
  .byte 71, 65, 78, 78, 69, 84, 0
str_1:
  .byte 77, 73, 83, 84, 82, 65, 76, 0
str_2:
  .byte 67, 73, 78, 68, 69, 82, 0
str_3:
  .byte 79, 82, 65, 67, 76, 69, 0
str_4:
  .byte 78, 79, 67, 84, 85, 82, 78, 69, 0
str_19:
  .byte 69, 78, 71, 65, 71, 69, 0
str_20:
  .byte 84, 65, 82, 71, 69, 84, 32, 68, 69, 83, 84, 82, 79, 89, 69, 68, 0
str_21:
  .byte 89, 79, 85, 32, 65, 82, 69, 32, 72, 73, 84, 0
str_22:
  .byte 67, 82, 65, 83, 72, 69, 68, 0
str_23:
  .byte 84, 73, 77, 69, 32, 79, 86, 69, 82, 0
  .align 2
e16c_fixed_end:

  .bank 1
  .org 0xc000
; ai.e16.ts:47 aiNew() at -O1
aiNew:
  ; ai.e16.ts:48  aiState = PURSUE
  sw zero, 0x1b58(zero)
  ; ai.e16.ts:49  aiStateT = 0
  sw zero, 0x1b5a(zero)
  ; ai.e16.ts:50  aiThinkT = 30
  li t0, 30
  sw t0, 0x1b5e(zero)
  ; ai.e16.ts:51  aiGunT = 0
  sw zero, 0x1b60(zero)
  ; ai.e16.ts:52  aiLockT = 0
  sw zero, 0x1b62(zero)
  ; ai.e16.ts:53  aiMslCool = 400
  li t0, 400
  sw t0, 0x1b64(zero)
  ; ai.e16.ts:54  aiMissiles = 2 + ace
  lw t0, 0x15f2(zero)
  addi t0, t0, 2
  sw t0, 0x1b66(zero)
  ; ai.e16.ts:55  aiFlareCool = 0
  sw zero, 0x1b68(zero)
  ; ai.e16.ts:56  aiEvading = false
  sw zero, 0x1b6a(zero)
  ; ai.e16.ts:57  aiDodge = 25 + ace * 10
  lw t0, 0x15f2(zero)
  slli t1, t0, 3
  slli t0, t0, 1
  add t0, t0, t1
  addi t0, t0, 25
  sw t0, 0x1b6c(zero)
.return:
  ret

; ai.e16.ts:61 aiStep() at -O1
aiStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ai.e16.ts:62  if (!eAlive) return
  lw t0, 0x1600(zero)
  bnez t0, .L1
  ; ai.e16.ts:62  return
  j .return
.L1:
  ; ai.e16.ts:63  if (aiStateT > 0) aiStateT--
  lw t0, 0x1b5a(zero)
  bgeu zero, t0, .L2
  ; ai.e16.ts:63  aiStateT--
  lw t0, 0x1b5a(zero)
  addi t0, t0, -1
  sw t0, 0x1b5a(zero)
.L2:
  ; ai.e16.ts:64  lookAtPlayer()
  call lookAtPlayer
  ; ai.e16.ts:65  if (aiThinkT > 0) aiThinkT--
  lw t0, 0x1b5e(zero)
  bgeu zero, t0, .L3
  ; ai.e16.ts:65  aiThinkT--
  lw t0, 0x1b5e(zero)
  addi t0, t0, -1
  sw t0, 0x1b5e(zero)
  j .L4
.L3:
  ; ai.e16.ts:66  think()
  call think
.L4:
  ; ai.e16.ts:67  aiEvading = aiState === BREAK
  lw t0, 0x1b58(zero)
  li t1, 1
  sub t0, t0, t1
  seqz t0, t0
  sw t0, 0x1b6a(zero)
  ; ai.e16.ts:68  goalOf()
  call goalOf
  ; ai.e16.ts:69  steer()
  call steer
  ; ai.e16.ts:70  weapons()
  call weapons
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ai.e16.ts:80 lookAtPlayer() at -O1
lookAtPlayer:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ai.e16.ts:81  aiTX = -dotq(va(V_REL), va(V_ER))
  li a0, 18
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 12
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  neg t0, a0
  sw t0, 0x1b6e(zero)
  ; ai.e16.ts:82  aiTY = -dotq(va(V_REL), va(V_EU))
  li a0, 18
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 15
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  neg t0, a0
  sw t0, 0x1b70(zero)
  ; ai.e16.ts:83  aiTZ = -dotq(va(V_REL), va(V_EF))
  li a0, 18
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 9
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  neg t0, a0
  sw t0, 0x1b72(zero)
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ai.e16.ts:87 onItsTail() at -O1
;   cone in s1
onItsTail:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; ai.e16.ts:88  if (aiTZ > 0 || eBZ <= 0 || eDist > 3200) return false
  lw t0, 0x1b72(zero)
  blt zero, t0, .L2
  lw t0, 0x1612(zero)
  bge zero, t0, .L2
  lw t0, 0x161c(zero)
  li t1, 3200
  bgeu t1, t0, .L1
.L2:
  ; ai.e16.ts:88  return false
  li a0, 0
  j .return
.L1:
  ; ai.e16.ts:89  const cone = eBZ >> 2
  lw t0, 0x1612(zero)
  srai s1, t0, 2
  ; ai.e16.ts:90  return abs16(eBX) < cone && abs16(eBY) < cone
  lw a0, 0x160e(zero)
  call abs16
  slt t0, a0, s1
  mv t1, t0
  beqz t1, .L3
  lw a0, 0x1610(zero)
  call abs16
  slt t0, a0, s1
.L3:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; ai.e16.ts:93 enemyAlt() at -O1
enemyAlt:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ai.e16.ts:94  return pAlt + vget(V_REL + 2)
  lw t0, 0x15b2(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 20
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  add a0, t0, a0
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ai.e16.ts:98 think() at -O1
think:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ai.e16.ts:99  aiThinkT = 34 - ace * 6 + randBelow(16)
  lw t0, 0x15f2(zero)
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  li t1, 34
  sub t1, t1, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 16
  call randBelow
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 0x1b5e(zero)
  ; ai.e16.ts:100  if (enemyAlt() < 1400 && vget(V_EF + 2) < 4000) {
  call enemyAlt
  li t0, 1400
  bge a0, t0, .L1
  li a0, 11
  call vget
  li t0, 4000
  bge a0, t0, .L1
  ; ai.e16.ts:101  to(FLOOR, 90)
  li a0, 4
  li a1, 90
  call to
  ; ai.e16.ts:102  return
  j .return
.L1:
  ; ai.e16.ts:104  if (threatDist < 2600 && (ace >= 1 || randBelow(2) === 0) && aiState !== BREAK) {
  lw t0, 0x18d8(zero)
  li t1, 2600
  bgeu t0, t1, .L2
  lw t0, 0x15f2(zero)
  li t1, 1
  bgeu t0, t1, .L3
  li a0, 2
  call randBelow
  bne a0, zero, .L2
.L3:
  lw t0, 0x1b58(zero)
  li t1, 1
  beq t0, t1, .L2
  ; ai.e16.ts:105  breakTurn()
  call breakTurn
  ; ai.e16.ts:106  return
  j .return
.L2:
  ; ai.e16.ts:108  if (aiStateT > 0) return
  lw t0, 0x1b5a(zero)
  bgeu zero, t0, .L4
  ; ai.e16.ts:108  return
  j .return
.L4:
  ; ai.e16.ts:109  if (onItsTail()) {
  call onItsTail
  beqz a0, .L5
  ; ai.e16.ts:110  tailChoice()
  call tailChoice
  ; ai.e16.ts:111  return
  j .return
.L5:
  ; ai.e16.ts:113  if (eDist < 700 && aiTZ < 0) to(EXTEND, 100 + randBelow(60))
  lw t0, 0x161c(zero)
  li t1, 700
  bgeu t0, t1, .L6
  lw t0, 0x1b72(zero)
  bge t0, zero, .L6
  ; ai.e16.ts:113  to(EXTEND, 100 + randBelow(60))
  li a0, 60
  call randBelow
  addi a1, a0, 100
  li a0, 3
  call to
  j .L7
.L6:
  ; ai.e16.ts:114  to(PURSUE, 60)
  li a0, 0
  li a1, 60
  call to
.L7:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ai.e16.ts:118 tailChoice() at -O1
;   r in s1
tailChoice:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; ai.e16.ts:119  const r = randBelow(8)
  li a0, 8
  call randBelow
  mv s1, a0 ; r
  ; ai.e16.ts:120  if (r < 5 || ace === 0) breakTurn()
  li t0, 5
  bltu s1, t0, .L2
  lw t0, 0x15f2(zero)
  bne t0, zero, .L1
.L2:
  ; ai.e16.ts:120  breakTurn()
  call breakTurn
  j .L3
.L1:
  ; ai.e16.ts:121  if (r < 7) to(ZOOM, 70 + randBelow(40))
  li t0, 7
  bgeu s1, t0, .L4
  ; ai.e16.ts:121  to(ZOOM, 70 + randBelow(40))
  li a0, 40
  call randBelow
  addi a1, a0, 70
  li a0, 2
  call to
  j .L5
.L4:
  ; ai.e16.ts:122  to(EXTEND, 120)
  li a0, 3
  li a1, 120
  call to
.L5:
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; ai.e16.ts:125 breakTurn() at -O1
breakTurn:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ai.e16.ts:127  aiSide = ace >= 2 && aiState === BREAK ? -aiSide : (rand() & 1) === 0 ? -1 : 1
  lw t0, 0x15f2(zero)
  li t1, 2
  bltu t0, t1, .L1
  lw t0, 0x1b58(zero)
  li t1, 1
  bne t0, t1, .L1
  lw t0, 0x1b5c(zero)
  neg t0, t0
  j .L2
.L1:
  call rand
  andi t0, a0, 1
  bne t0, zero, .L3
  li t0, 65535
  j .L4
.L3:
  li t0, 1
.L4:
.L2:
  sw t0, 0x1b5c(zero)
  ; ai.e16.ts:128  to(BREAK, 50 + randBelow(50) - ace * 4)
  li a0, 50
  call randBelow
  lw t0, 0x15f2(zero)
  slli t0, t0, 2
  addi t1, a0, 50
  sub t1, t1, t0
  li a0, 1
  mv a1, t1
  call to
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ai.e16.ts:131 to(s, frames) at -O1
;   s in a0
;   frames in a1
to:
  ; ai.e16.ts:132  aiState = s
  sw a0, 0x1b58(zero)
  ; ai.e16.ts:133  aiStateT = frames
  sw a1, 0x1b5a(zero)
.return:
  ret

; ai.e16.ts:137 goalOf() at -O1
goalOf:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ai.e16.ts:138  if (aiState === PURSUE) leadGoal()
  lw t0, 0x1b58(zero)
  bne t0, zero, .L1
  ; ai.e16.ts:138  leadGoal()
  call leadGoal
  j .L2
.L1:
  ; ai.e16.ts:139  if (aiState === BREAK) axisGoal(V_ER, aiSide, ONE >> 2)
  lw t0, 0x1b58(zero)
  li t1, 1
  bne t0, t1, .L3
  ; ai.e16.ts:139  axisGoal(V_ER, aiSide, ONE >> 2)
  lw t0, 0x1b5c(zero)
  li a0, 12
  mv a1, t0
  li a2, 4096
  call axisGoal
  j .L4
.L3:
  ; ai.e16.ts:140  if (aiState === ZOOM) vset(V_T2, vget(V_EF) >> 2, vget(V_EF + 1) >> 2, 12000)
  lw t0, 0x1b58(zero)
  li t1, 2
  bne t0, t1, .L5
  ; ai.e16.ts:140  vset(V_T2, vget(V_EF) >> 2, vget(V_EF + 1) >> 2, 12000)
  li a0, 9
  call vget
  srai t0, a0, 2
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 10
  call vget
  srai t0, a0, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  li a0, 27
  mv a1, t1
  mv a2, t0
  li a3, 12000
  call vset
  j .L6
.L5:
  ; ai.e16.ts:141  if (aiState === EXTEND) extendGoal()
  lw t0, 0x1b58(zero)
  li t1, 3
  bne t0, t1, .L7
  ; ai.e16.ts:141  extendGoal()
  call extendGoal
  j .L8
.L7:
  ; ai.e16.ts:142  vset(V_T2, vget(V_EF) >> 1, vget(V_EF + 1) >> 1, 16000)
  li a0, 9
  call vget
  srai t0, a0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 10
  call vget
  srai t0, a0, 1
  lw t1, 0(sp)
  addi sp, sp, 2
  li a0, 27
  mv a1, t1
  mv a2, t0
  li a3, 16000
  call vset
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ai.e16.ts:146 leadGoal() at -O1
;   t in s1
leadGoal:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; ai.e16.ts:147  let t = i16(eDist >> 6)
  lw t0, 0x161c(zero)
  srli s1, t0, 6
  ; ai.e16.ts:148  if (t > 30) t = 30
  li t0, 30
  bge t0, s1, .L1
  ; ai.e16.ts:148  t = 30
  li s1, 30 ; t
.L1:
  ; ai.e16.ts:149  vset(
  li a0, 18
  call vget
  neg t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 0
  call pVel
  mul t0, a0, s1
  srai t0, t0, 4
  lw t1, 0(sp)
  addi sp, sp, 2
  add t1, t1, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 19
  call vget
  neg t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 1
  call pVel
  mul t0, a0, s1
  srai t0, t0, 4
  lw t1, 0(sp)
  addi sp, sp, 2
  add t1, t1, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 20
  call vget
  neg t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 2
  call pVel
  mul t0, a0, s1
  srai t0, t0, 4
  lw t1, 0(sp)
  addi sp, sp, 2
  add t1, t1, t0
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  li a0, 27
  mv a1, t2
  mv a2, t0
  mv a3, t1
  call vset
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; ai.e16.ts:158 axisGoal(axis, sign, up) at -O1
;   axis in s1
;   sign in s2
;   up in s3
axisGoal:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; axis
  mv s2, a1 ; sign
  mv s3, a2 ; up
  ; ai.e16.ts:159  vset(
  mv a0, s1
  call vget
  srai t0, a0, 1
  mul t0, s2, t0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 9
  call vget
  srai t0, a0, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  add t1, t1, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  addi a0, s1, 1
  call vget
  srai t0, a0, 1
  mul t0, s2, t0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 10
  call vget
  srai t0, a0, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  add t1, t1, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  addi a0, s1, 2
  call vget
  srai t0, a0, 1
  mul t0, s2, t0
  add t0, t0, s3
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  li a0, 27
  mv a1, t2
  mv a2, t1
  mv a3, t0
  call vset
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; ai.e16.ts:168 extendGoal() at -O1
extendGoal:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ai.e16.ts:169  if (aiStateT < 40) {
  lw t0, 0x1b5a(zero)
  li t1, 40
  bgeu t0, t1, .L1
  ; ai.e16.ts:170  leadGoal()
  call leadGoal
  ; ai.e16.ts:171  return
  j .return
.L1:
  ; ai.e16.ts:173  vset(V_T2, vget(V_REL) >> 1, vget(V_REL + 1) >> 1, 2000)
  li a0, 18
  call vget
  srai t0, a0, 1
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 19
  call vget
  srai t0, a0, 1
  lw t1, 0(sp)
  addi sp, sp, 2
  li a0, 27
  mv a1, t1
  mv a2, t0
  li a3, 2000
  call vset
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ai.e16.ts:179 steer() at -O1
;   gx in s3
;   gy in s1
;   gz in s2
;   roll in 4(fp)
;   pull in 0(fp)
;   off in 8(fp)
;   a in 2(fp)
;   s in 6(fp)
steer:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s3, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  ; ai.e16.ts:180  let gx = dotq(va(V_T2), va(V_ER))
  li a0, 27
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 12
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  mv s3, a0 ; gx
  ; ai.e16.ts:181  let gy = dotq(va(V_T2), va(V_EU))
  li a0, 27
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 15
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  mv s1, a0 ; gy
  ; ai.e16.ts:182  let gz = dotq(va(V_T2), va(V_EF))
  li a0, 27
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 9
  call va
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call dotq
  mv s2, a0 ; gz
  ; ai.e16.ts:183  while (vmax(gx, gy, gz) >= 200) {
  j .L3
.L1:
  ; ai.e16.ts:184  gx = gx >> 1
  srai s3, s3, 1
  ; ai.e16.ts:185  gy = gy >> 1
  srai s1, s1, 1
  ; ai.e16.ts:186  gz = gz >> 1
  srai s2, s2, 1
.L3:
  mv a0, s3
  mv a1, s1
  mv a2, s2
  call vmax
  li t0, 200
  bge a0, t0, .L1
  ; ai.e16.ts:188  let roll: i16 = 0
  sw zero, 4(fp) ; roll
  ; ai.e16.ts:189  let pull: i16 = 0
  sw zero, 0(fp) ; pull
  ; ai.e16.ts:190  const off = abs16(gx) + abs16(gy)
  mv a0, s3
  call abs16
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call abs16
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, 8(fp) ; off
  ; ai.e16.ts:191  if (gz > 0 && off * 24 < gz) {
  bge zero, s2, .L5
  lw t0, 8(fp) ; off
  slli t1, t0, 4
  slli t0, t0, 3
  add t0, t0, t1
  bge t0, s2, .L5
  ; ai.e16.ts:193  pull = gy * 16
  slli t0, s1, 4
  sw t0, 0(fp) ; pull
  j .L6
.L5:
  ; ai.e16.ts:195  const a = aim(gy, gx)
  mv a0, s1
  mv a1, s3
  call aim
  sw a0, 2(fp) ; a
  ; ai.e16.ts:196  const s = i16(a > 127 ? a - 256 : a)
  li t0, 127
  lw t1, 2(fp) ; a
  bgeu t0, t1, .L7
  lw t0, 2(fp) ; a
  addi t0, t0, -256
  j .L8
.L7:
  lw t0, 2(fp)
.L8:
  sw t0, 6(fp) ; s
  ; ai.e16.ts:197  roll = s * 28
  li t0, 28
  lw t1, 6(fp) ; s
  mul t1, t1, t0
  sw t1, 4(fp) ; roll
  ; ai.e16.ts:198  pull = abs16(s) < 36 ? pullFor(gy, gz) : ePullMax >> 2
  lw a0, 6(fp)
  call abs16
  li t0, 36
  bge a0, t0, .L9
  mv a0, s1
  mv a1, s2
  call pullFor
  mv t0, a0
  j .L10
.L9:
  lw t0, 0x15fe(zero)
  srai t0, t0, 2
.L10:
  sw t0, 0(fp) ; pull
.L6:
  ; ai.e16.ts:200  aiWants(clampTo(roll, eRollMax), clampTo(pull, ePullMax), speedFor())
  lw t0, 0x15fc(zero)
  lw a0, 4(fp)
  mv a1, t0
  call clampTo
  lw t0, 0x15fe(zero)
  addi sp, sp, -2
  sw a0, 0(sp)
  lw a0, 0(fp)
  mv a1, t0
  call clampTo
  addi sp, sp, -2
  sw a0, 0(sp)
  call speedFor
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  call aiWants
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s3, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; ai.e16.ts:203 pullFor(gy, gz) at -O1
;   gy in s1
;   gz in s2
;   q in s3
pullFor:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; gy
  mv s2, a1 ; gz
  ; ai.e16.ts:204  if (gz <= gy * 2) return ePullMax
  slli t0, s1, 1
  blt t0, s2, .L1
  ; ai.e16.ts:204  return ePullMax
  lw a0, 0x15fe(zero)
  j .return
.L1:
  ; ai.e16.ts:205  const q = idiv(gy * 64, gz)
  slli t0, s1, 6
  div s3, t0, s2
  ; ai.e16.ts:206  return clampTo((ePullMax * q) >> 4, ePullMax)
  lw t0, 0x15fe(zero)
  mul t0, t0, s3
  srai t0, t0, 4
  lw t1, 0x15fe(zero)
  mv a0, t0
  mv a1, t1
  call clampTo
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; ai.e16.ts:209 clampTo(v, m) at -O1
;   v in a0
;   m in a1
clampTo:
  ; ai.e16.ts:210  if (v > m) return m
  bge a1, a0, .L1
  ; ai.e16.ts:210  return m
  mv a0, a1
  ret
.L1:
  ; ai.e16.ts:211  if (v < -m) return -m
  neg t0, a1
  bge a0, t0, .L2
  ; ai.e16.ts:211  return -m
  neg a0, a1
.L2:
  ; ai.e16.ts:212  return v
.return:
  ret

; ai.e16.ts:216 speedFor() at -O1
speedFor:
  ; ai.e16.ts:217  if (aiState === EXTEND || eDist > 4500) return eCruise + 120
  lw t0, 0x1b58(zero)
  li t1, 3
  beq t0, t1, .L2
  lw t0, 0x161c(zero)
  li t1, 4500
  bgeu t1, t0, .L1
.L2:
  ; ai.e16.ts:217  return eCruise + 120
  lw t0, 0x15fa(zero)
  addi a0, t0, 120
  ret
.L1:
  ; ai.e16.ts:218  if (aiTZ > 0 && eDist < 900) return eCruise - 80
  lw t0, 0x1b72(zero)
  bge zero, t0, .L3
  lw t0, 0x161c(zero)
  li t1, 900
  bgeu t0, t1, .L3
  ; ai.e16.ts:218  return eCruise - 80
  lw t0, 0x15fa(zero)
  addi a0, t0, -80
  ret
.L3:
  ; ai.e16.ts:219  return eCruise
  lw a0, 0x15fa(zero)
.return:
  ret

; ai.e16.ts:224 weapons() at -O1
weapons:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; ai.e16.ts:225  if (aiGunT > 0) aiGunT--
  lw t0, 0x1b60(zero)
  bgeu zero, t0, .L1
  ; ai.e16.ts:225  aiGunT--
  lw t0, 0x1b60(zero)
  addi t0, t0, -1
  sw t0, 0x1b60(zero)
.L1:
  ; ai.e16.ts:226  if (aiMslCool > 0) aiMslCool--
  lw t0, 0x1b64(zero)
  bgeu zero, t0, .L2
  ; ai.e16.ts:226  aiMslCool--
  lw t0, 0x1b64(zero)
  addi t0, t0, -1
  sw t0, 0x1b64(zero)
.L2:
  ; ai.e16.ts:227  if (aiFlareCool > 0) aiFlareCool--
  lw t0, 0x1b68(zero)
  bgeu zero, t0, .L3
  ; ai.e16.ts:227  aiFlareCool--
  lw t0, 0x1b68(zero)
  addi t0, t0, -1
  sw t0, 0x1b68(zero)
.L3:
  ; ai.e16.ts:228  if (aiTZ > 0) aimAndFire()
  lw t0, 0x1b72(zero)
  bge zero, t0, .L4
  ; ai.e16.ts:228  aimAndFire()
  call aimAndFire
  j .L5
.L4:
  ; ai.e16.ts:229  aiLockT = 0
  sw zero, 0x1b62(zero)
.L5:
  ; ai.e16.ts:230  if (threatDist < 1800 && aiFlareCool === 0 && ace >= 1) {
  lw t0, 0x18d8(zero)
  li t1, 1800
  bgeu t0, t1, .L6
  lw t0, 0x1b68(zero)
  bne t0, zero, .L6
  lw t0, 0x15f2(zero)
  li t1, 1
  bltu t0, t1, .L6
  ; ai.e16.ts:231  aiFlareCool = 150 - ace * 15
  lw t0, 0x15f2(zero)
  slli t1, t0, 4
  sub t0, t1, t0
  li t1, 150
  sub t1, t1, t0
  sw t1, 0x1b68(zero)
  ; ai.e16.ts:232  enemyFlares(40 + ace * 30)
  lw t0, 0x15f2(zero)
  li t1, 30
  mul t0, t0, t1
  addi a0, t0, 40
  la t0, enemyFlares
  li t1, 261
  call far_call
.L6:
  ; ai.e16.ts:235  if (eHP * 4 < eHPMax && aiState === PURSUE && randBelow(64) === 0) to(EXTEND, 90)
  lw t0, 0x15f4(zero)
  slli t0, t0, 2
  lw t1, 0x15f6(zero)
  bge t0, t1, .L7
  lw t0, 0x1b58(zero)
  bne t0, zero, .L7
  li a0, 64
  call randBelow
  bne a0, zero, .L7
  ; ai.e16.ts:235  to(EXTEND, 90)
  li a0, 3
  li a1, 90
  call to
.L7:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; ai.e16.ts:239 aimAndFire() at -O1
;   off in s1
aimAndFire:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; ai.e16.ts:240  const off = abs16(aiTX) + abs16(aiTY)
  lw a0, 0x1b6e(zero)
  call abs16
  lw t0, 0x1b70(zero)
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, t0
  call abs16
  lw t0, 0(sp)
  addi sp, sp, 2
  add s1, t0, a0
  ; ai.e16.ts:241  if (off * 10 < aiTZ && eDist < 1700 && aiGunT === 0) {
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  lw t1, 0x1b72(zero)
  bge t0, t1, .L1
  lw t0, 0x161c(zero)
  li t1, 1700
  bgeu t0, t1, .L1
  lw t0, 0x1b60(zero)
  bne t0, zero, .L1
  ; ai.e16.ts:242  aiGunT = 5 - (ace >> 1)
  lw t0, 0x15f2(zero)
  srli t0, t0, 1
  li t1, 5
  sub t1, t1, t0
  sw t1, 0x1b60(zero)
  ; ai.e16.ts:243  enemyRound(225 - ace * 35)
  lw t0, 0x15f2(zero)
  li t1, 35
  mul t0, t0, t1
  li t1, 225
  sub a0, t1, t0
  la t0, enemyRound
  li t1, 261
  call far_call
.L1:
  ; ai.e16.ts:245  if (off * 3 < aiTZ && eDist > 1000 && eDist < 5200) aiLockT++
  slli t1, s1, 1
  add t0, t1, s1
  lw t1, 0x1b72(zero)
  bge t0, t1, .L2
  lw t0, 0x161c(zero)
  li t1, 1000
  bgeu t1, t0, .L2
  lw t0, 0x161c(zero)
  li t1, 5200
  bgeu t0, t1, .L2
  ; ai.e16.ts:245  aiLockT++
  lw t0, 0x1b62(zero)
  addi t0, t0, 1
  sw t0, 0x1b62(zero)
  j .L3
.L2:
  ; ai.e16.ts:246  aiLockT = 0
  sw zero, 0x1b62(zero)
.L3:
  ; ai.e16.ts:247  if (aiLockT > 130 - ace * 15 && aiMslCool === 0 && aiMissiles > 0) {
  lw t0, 0x1b62(zero)
  lw t1, 0x15f2(zero)
  slli t2, t1, 4
  sub t1, t2, t1
  li t2, 130
  sub t2, t2, t1
  bgeu t2, t0, .L4
  lw t0, 0x1b64(zero)
  bne t0, zero, .L4
  lw t0, 0x1b66(zero)
  bgeu zero, t0, .L4
  ; ai.e16.ts:248  enemyMissile()
  la t0, enemyMissile
  li t1, 261
  call far_call
  ; ai.e16.ts:249  aiMissiles--
  lw t0, 0x1b66(zero)
  addi t0, t0, -1
  sw t0, 0x1b66(zero)
  ; ai.e16.ts:250  aiMslCool = 420 - ace * 40
  lw t0, 0x15f2(zero)
  slli t1, t0, 5
  slli t0, t0, 3
  add t0, t0, t1
  li t1, 420
  sub t1, t1, t0
  sw t1, 0x1b64(zero)
  ; ai.e16.ts:251  aiLockT = 0
  sw zero, 0x1b62(zero)
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

  .align 2

  .bank 2
  .org 0xc000
; scenes.e16.ts:89 cruise(t, turn) at -O1
;   t in s3
;   turn in s1
;   a in s2
cruise:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; t
  mv s1, a1 ; turn
  ; scenes.e16.ts:90  turnWorld(V_PF, turn)
  li a0, 0
  mv a1, s1
  call turnWorld
  ; scenes.e16.ts:91  turnWorld(V_PR, turn)
  li a0, 3
  mv a1, s1
  call turnWorld
  ; scenes.e16.ts:92  turnWorld(V_PU, turn)
  li a0, 6
  mv a1, s1
  call turnWorld
  ; scenes.e16.ts:94  const a = sin(t) >> 2
  mv a0, s3
  call sin
  srai s2, a0, 2
  ; scenes.e16.ts:95  rotq(va(V_PR), va(V_PU), 16384 - (mulq(a, a) >> 1), -a)
  li a0, 3
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 6
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s2
  mv a1, s2
  call mulq
  srai t0, a0, 1
  li t1, 16384
  sub t1, t1, t0
  neg t0, s2
  lw t2, 0(sp)
  addi sp, sp, 2
  lw t3, 0(sp)
  addi sp, sp, 2
  mv a0, t3
  mv a1, t2
  mv a2, t1
  mv a3, t0
  call rotq
  ; scenes.e16.ts:96  orthonormal(V_PF, V_PR, V_PU)
  li a0, 0
  li a1, 3
  li a2, 6
  call orthonormal
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; scenes.e16.ts:99 sceneSky(k) at -O1
;   k in s1
sceneSky:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; scenes.e16.ts:100  mapsClear()
  call mapsClear
  ; scenes.e16.ts:101  palettesIn(k)
  mv a0, s1
  call palettesIn
  ; scenes.e16.ts:102  cloudTint(k)
  mv a0, s1
  call cloudTint
  ; scenes.e16.ts:103  slot(PAL_ACE_GANNET + k, SL_ENEMY)
  addi a0, s1, 19
  li a1, 9
  call slot
  ; scenes.e16.ts:104  playerNew(5200)
  li a0, 5200
  call playerNew
  ; scenes.e16.ts:105  cloudsNew(4200)
  li a0, 4200
  la t0, cloudsNew
  li t1, 260
  call far_call
  ; scenes.e16.ts:106  sunIs(-3600, 1800, 420, k !== 4)
  li t0, 4
  sub t0, s1, t0
  snez t0, t0
  li a0, 61936
  li a1, 1800
  li a2, 420
  mv a3, t0
  la t0, sunIs
  li t1, 260
  call far_call
  ; scenes.e16.ts:107  skyIs(true)
  li a0, 1
  call skyIs
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes.e16.ts:112 title() at -O1
;   t in s1
title:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; scenes.e16.ts:113  sceneSky(3)
  li a0, 3
  call sceneSky
  ; scenes.e16.ts:114  slot(PAL_ACE_GANNET + 3, SL_ENEMY)
  li a0, 22
  li a1, 9
  call slot
  ; scenes.e16.ts:115  banditNew(3, 700)
  li a0, 3
  li a1, 700
  call banditNew
  ; scenes.e16.ts:116  logoIn(3)
  li a0, 3
  call logoIn
  ; scenes.e16.ts:117  music(M_TITLE)
  li a0, 1
  call music
  ; scenes.e16.ts:118  say(14, 17, str('PRESS START'), SL_AMBER)
  li a0, 14
  li a1, 17
  la a2, str_24
  li a3, 4
  call say
  ; scenes.e16.ts:119  say(11, 19, str('BEST ACES'), SL_WHITE)
  li a0, 11
  li a1, 19
  la a2, str_25
  li a3, 7
  call say
  ; scenes.e16.ts:120  tableShow(21)
  li a0, 21
  call tableShow
  ; scenes.e16.ts:121  stickSay()
  call stickSay
  ; scenes.e16.ts:122  say(10, 34, str('(C) ELECXZY PROJECT'), SL_WHITE)
  li a0, 10
  li a1, 34
  la a2, str_26
  li a3, 7
  call say
  ; scenes.e16.ts:123  let t: u16 = 0
  li s1, 0 ; t
  ; scenes.e16.ts:124  for (;;) {
.L1:
  ; scenes.e16.ts:125  frameBegin()
  call frameBegin
  ; scenes.e16.ts:126  cruise(t, 6)
  mv a0, s1
  li a1, 6
  call cruise
  ; scenes.e16.ts:127  wingman(t)
  mv a0, s1
  call wingman
  ; scenes.e16.ts:128  cloudsStep()
  la t0, cloudsStep
  li t1, 260
  call far_call
  ; scenes.e16.ts:129  cloudsDraw(32767, true)
  li a0, 32767
  li a1, 1
  la t0, cloudsDraw
  li t1, 260
  call far_call
  ; scenes.e16.ts:130  sunDraw()
  la t0, sunDraw
  li t1, 260
  call far_call
  ; scenes.e16.ts:131  if ((t & 32) === 0) say(14, 17, str('PRESS START'), SL_AMBER)
  andi t0, s1, 32
  bne t0, zero, .L5
  ; scenes.e16.ts:131  say(14, 17, str('PRESS START'), SL_AMBER)
  li a0, 14
  li a1, 17
  la a2, str_24
  li a3, 4
  call say
  j .L6
.L5:
  ; scenes.e16.ts:132  unsay(14, 17, 11)
  li a0, 14
  li a1, 17
  li a2, 11
  call unsay
.L6:
  ; scenes.e16.ts:133  if (pressed(B_SELECT)) {
  li a0, 2048
  call pressed
  beqz a0, .L7
  ; scenes.e16.ts:134  stickToggle()
  call stickToggle
  ; scenes.e16.ts:135  stickSay()
  call stickSay
  ; scenes.e16.ts:136  sfxSelect()
  call sfxSelect
.L7:
  ; scenes.e16.ts:138  if (t > 40 && pressed(B_START | B_A)) break
  li t0, 40
  bgeu t0, s1, .L8
  li a0, 1040
  call pressed
  beqz a0, .L8
  ; scenes.e16.ts:138  break
  j .L4
.L8:
  ; scenes.e16.ts:139  t++
  addi s1, s1, 1
  j .L1
.L4:
  ; scenes.e16.ts:141  randSeed(frame ^ peek16(0x0202))
  lw t0, 0x1b3e(zero)
  lw t1, 514(zero)
  xor a0, t0, t1
  call randSeed
  ; scenes.e16.ts:142  sfxSelect()
  call sfxSelect
  ; scenes.e16.ts:143  cockpitTilesIn()
  call cockpitTilesIn
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes.e16.ts:146 stickSay() at -O1
stickSay:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes.e16.ts:147  say(
  lw t0, 0x15bc(zero)
  li t1, 32
  mv t2, t0
  li t0, 9
  beqz t2, .L1
  la t2, str_27
  j .L2
.L1:
  la t2, str_28
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 3
  call say
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes.e16.ts:159 wingman(t) at -O1
;   t in s2
;   s in 0(fp)
;   k in s1
;   roll in 2(fp)
;   bank in s3
wingman:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s1, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; t
  ; scenes.e16.ts:160  const s = sin(t << 1)
  slli a0, s2, 1
  call sin
  sw a0, 0(fp) ; s
  ; scenes.e16.ts:161  let k: u16 = 0
  li s1, 0 ; k
  ; scenes.e16.ts:162  while (k < 3) {
  j .L3
.L1:
  ; scenes.e16.ts:163  vec[V_REL + k] = u16(
  addi t0, s1, 18
  slli t0, t0, 1
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s1, 0
  call vget
  li a1, 430
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  addi a0, s1, 3
  call vget
  lw t0, 0(fp) ; s
  srai t0, t0, 2
  addi a1, t0, 130
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, s1, 6
  call vget
  li a1, 30
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; scenes.e16.ts:166  k++
  addi s1, s1, 1
.L3:
  li t0, 3
  bltu s1, t0, .L1
  ; scenes.e16.ts:168  vcopy(V_EF, V_PF)
  li a0, 9
  li a1, 0
  call vcopy
  ; scenes.e16.ts:169  vcopy(V_ER, V_PR)
  li a0, 12
  li a1, 3
  call vcopy
  ; scenes.e16.ts:170  vcopy(V_EU, V_PU)
  li a0, 15
  li a1, 6
  call vcopy
  ; scenes.e16.ts:172  const roll = (t & 511) < 96 ? div((t & 511) * 8, 3) : 0
  andi t0, s2, 511
  li t1, 96
  bgeu t0, t1, .L5
  andi t0, s2, 511
  slli t0, t0, 3
  li t1, 3
  divu t0, t0, t1
  j .L6
.L5:
  li t0, 0
.L6:
  sw t0, 2(fp) ; roll
  ; scenes.e16.ts:173  const bank = u16(roll) + 12
  lw t0, 2(fp) ; roll
  addi s3, t0, 12
  ; scenes.e16.ts:174  rotq(va(V_ER), va(V_EU), cos(bank) * 64, -sin(bank) * 64)
  li a0, 12
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 15
  call va
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  call cos
  slli t0, a0, 6
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  call sin
  neg t0, a0
  slli t0, t0, 6
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  lw t3, 0(sp)
  addi sp, sp, 2
  mv a0, t3
  mv a1, t2
  mv a2, t1
  mv a3, t0
  call rotq
  ; scenes.e16.ts:175  banditView()
  call banditView
  ; scenes.e16.ts:176  banditDraw()
  call banditDraw
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s1, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; scenes.e16.ts:181 briefing(k) at -O1
;   k in s1
;   t in s2
briefing:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  ; scenes.e16.ts:182  sceneSky(k)
  mv a0, s1
  call sceneSky
  ; scenes.e16.ts:183  music(M_BRIEF)
  li a0, 2
  call music
  ; scenes.e16.ts:184  say(2, 2, str('SORTIE'), SL_AMBER)
  li a0, 2
  li a1, 2
  la a2, str_29
  li a3, 4
  call say
  ; scenes.e16.ts:185  sayChar(9, 2, 49 + k, SL_AMBER)
  li a0, 9
  li a1, 2
  addi a2, s1, 49
  li a3, 4
  call sayChar
  ; scenes.e16.ts:186  say(12, 2, operation(k), SL_WHITE)
  mv a0, s1
  call operation
  li a1, 2
  mv a2, a0
  li a0, 12
  li a3, 7
  call say
  ; scenes.e16.ts:187  say(2, 4, str('TARGET  ACE'), SL_AMBER)
  li a0, 2
  li a1, 4
  la a2, str_30
  li a3, 4
  call say
  ; scenes.e16.ts:188  say(14, 4, aceName(k), SL_RED)
  mv a0, s1
  call aceName
  li a1, 4
  mv a2, a0
  li a0, 14
  li a3, 5
  call say
  ; scenes.e16.ts:189  say(2, 5, str('TYPE    ARCWING'), SL_AMBER)
  li a0, 2
  li a1, 5
  la a2, str_31
  li a3, 4
  call say
  ; scenes.e16.ts:190  brief(k)
  mv a0, s1
  call brief
  ; scenes.e16.ts:191  bestSay(k)
  mv a0, s1
  call bestSay
  ; scenes.e16.ts:192  let t: u16 = 0
  li s2, 0 ; t
  ; scenes.e16.ts:193  for (;;) {
.L1:
  ; scenes.e16.ts:194  frameBegin()
  call frameBegin
  ; scenes.e16.ts:195  cruise(t, 4)
  mv a0, s2
  li a1, 4
  call cruise
  ; scenes.e16.ts:196  cloudsStep()
  la t0, cloudsStep
  li t1, 260
  call far_call
  ; scenes.e16.ts:197  cloudsDraw(32767, true)
  li a0, 32767
  li a1, 1
  la t0, cloudsDraw
  li t1, 260
  call far_call
  ; scenes.e16.ts:198  turntable(t)
  mv a0, s2
  call turntable
  ; scenes.e16.ts:199  sunDraw()
  la t0, sunDraw
  li t1, 260
  call far_call
  ; scenes.e16.ts:200  if ((t & 32) === 0) say(10, 33, str('PRESS A TO TAKE OFF'), SL_AMBER)
  andi t0, s2, 32
  bne t0, zero, .L5
  ; scenes.e16.ts:200  say(10, 33, str('PRESS A TO TAKE OFF'), SL_AMBER)
  li a0, 10
  li a1, 33
  la a2, str_32
  li a3, 4
  call say
  j .L6
.L5:
  ; scenes.e16.ts:201  unsay(10, 33, 19)
  li a0, 10
  li a1, 33
  li a2, 19
  call unsay
.L6:
  ; scenes.e16.ts:202  if (t > 30 && pressed(B_A | B_START)) break
  li t0, 30
  bgeu t0, s2, .L7
  li a0, 1040
  call pressed
  beqz a0, .L7
  ; scenes.e16.ts:202  break
  j .L4
.L7:
  ; scenes.e16.ts:203  t++
  addi s2, s2, 1
  j .L1
.L4:
  ; scenes.e16.ts:205  sfxSelect()
  call sfxSelect
  ; scenes.e16.ts:206  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:209 operation(k) at -O1
;   k in a0
operation:
  ; scenes.e16.ts:210  if (k === 0) return str('OPERATION FIRST LIGHT')
  bne a0, zero, .L1
  ; scenes.e16.ts:210  return str('OPERATION FIRST LIGHT')
  la a0, str_33
  ret
.L1:
  ; scenes.e16.ts:211  if (k === 1) return str('OPERATION DUNE WIND')
  li t0, 1
  bne a0, t0, .L2
  ; scenes.e16.ts:211  return str('OPERATION DUNE WIND')
  la a0, str_34
  ret
.L2:
  ; scenes.e16.ts:212  if (k === 2) return str('OPERATION IRON RAIN')
  li t0, 2
  bne a0, t0, .L3
  ; scenes.e16.ts:212  return str('OPERATION IRON RAIN')
  la a0, str_35
  ret
.L3:
  ; scenes.e16.ts:213  if (k === 3) return str('OPERATION LONG SHADOW')
  li t0, 3
  bne a0, t0, .L4
  ; scenes.e16.ts:213  return str('OPERATION LONG SHADOW')
  la a0, str_36
  ret
.L4:
  ; scenes.e16.ts:214  return str('OPERATION NIGHTFALL')
  la a0, str_37
.return:
  ret

; scenes.e16.ts:218 brief(k) at -O1
;   k in s1
brief:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; scenes.e16.ts:219  if (k === 0)
  bne s1, zero, .L1
  ; scenes.e16.ts:220  lines(
  la a0, str_38
  la a1, str_39
  la a2, str_40
  la a3, str_41
  call lines
  j .L2
.L1:
  ; scenes.e16.ts:226  if (k === 1)
  li t0, 1
  bne s1, t0, .L3
  ; scenes.e16.ts:227  lines(
  la a0, str_42
  la a1, str_43
  la a2, str_44
  la a3, str_45
  call lines
  j .L4
.L3:
  ; scenes.e16.ts:233  if (k === 2)
  li t0, 2
  bne s1, t0, .L5
  ; scenes.e16.ts:234  lines(
  la a0, str_46
  la a1, str_47
  la a2, str_48
  la a3, str_49
  call lines
  j .L6
.L5:
  ; scenes.e16.ts:240  if (k === 3)
  li t0, 3
  bne s1, t0, .L7
  ; scenes.e16.ts:241  lines(
  la a0, str_50
  la a1, str_51
  la a2, str_52
  la a3, str_53
  call lines
  j .L8
.L7:
  ; scenes.e16.ts:248  lines(
  la a0, str_54
  la a1, str_55
  la a2, str_56
  la a3, str_57
  call lines
.L8:
.L6:
.L4:
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes.e16.ts:256 lines(a, b, c, d) at -O1
;   a in s1
;   b in s2
;   c in s3
;   d in s0
lines:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; a
  mv s2, a1 ; b
  mv s3, a2 ; c
  mv s0, a3 ; d
  ; scenes.e16.ts:257  say(4, 25, a, SL_WHITE)
  li a0, 4
  li a1, 25
  mv a2, s1
  li a3, 7
  call say
  ; scenes.e16.ts:258  say(4, 26, b, SL_WHITE)
  li a0, 4
  li a1, 26
  mv a2, s2
  li a3, 7
  call say
  ; scenes.e16.ts:259  say(4, 27, c, SL_WHITE)
  li a0, 4
  li a1, 27
  mv a2, s3
  li a3, 7
  call say
  ; scenes.e16.ts:260  say(4, 28, d, SL_WHITE)
  li a0, 4
  li a1, 28
  mv a2, s0
  li a3, 7
  call say
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; scenes.e16.ts:263 bestSay(k) at -O1
;   k in s1
bestSay:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; scenes.e16.ts:264  say(4, 30, str('BEST TIME'), SL_AMBER)
  li a0, 4
  li a1, 30
  la a2, str_58
  li a3, 4
  call say
  ; scenes.e16.ts:265  if (bestTime[k] === 0xffff) say(15, 30, str('-:--'), SL_AMBER)
  slli t0, s1, 1
  lw t0, bestTime(t0)
  li t1, 65535
  bne t0, t1, .L1
  ; scenes.e16.ts:265  say(15, 30, str('-:--'), SL_AMBER)
  li a0, 15
  li a1, 30
  la a2, str_59
  li a3, 4
  call say
  j .L2
.L1:
  ; scenes.e16.ts:266  timeSay(15, 30, bestTime[k])
  slli t0, s1, 1
  lw t0, bestTime(t0)
  li a0, 15
  li a1, 30
  mv a2, t0
  call timeSay
.L2:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes.e16.ts:270 timeSay(x, y, frames) at -O1
;   x in s1
;   y in s2
;   frames in s0
;   sec in s3
timeSay:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s0, a2 ; frames
  ; scenes.e16.ts:271  const sec = div(frames, 60)
  li t0, 60
  divu s3, s0, t0
  ; scenes.e16.ts:272  sayNumber(cellXY(x, y), div(sec, 60), 1, SL_AMBER)
  mv a0, s1
  mv a1, s2
  call cellXY
  li t0, 60
  divu a1, s3, t0
  li a2, 1
  li a3, 4
  call sayNumber
  ; scenes.e16.ts:273  sayChar(x + 1, y, 58, SL_AMBER)
  addi a0, s1, 1
  mv a1, s2
  li a2, 58
  li a3, 4
  call sayChar
  ; scenes.e16.ts:274  sayChar(x + 2, y, 48 + div(sec % 60, 10), SL_AMBER)
  li t0, 60
  remu t0, s3, t0
  li t1, 10
  divu t0, t0, t1
  addi a0, s1, 2
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
  ; scenes.e16.ts:275  sayChar(x + 3, y, 48 + (sec % 10), SL_AMBER)
  li t0, 10
  remu t0, s3, t0
  addi a0, s1, 3
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; scenes.e16.ts:279 turntable(t) at -O1
;   t in s2
;   s in s1
;   view in s3
turntable:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; t
  ; scenes.e16.ts:280  const s = (t >> 4) & 7
  srli t0, s2, 4
  andi s1, t0, 7
  ; scenes.e16.ts:281  const view: u16 = s === 0 ? 0 : s === 4 ? 6 : s === 2 || s === 6 ? 4 : s === 1 || s === 7 ? 3 : 5
  bne s1, zero, .L1
  li t0, 0
  j .L2
.L1:
  li t0, 4
  bne s1, t0, .L3
  li t0, 6
  j .L4
.L3:
  li t0, 2
  beq s1, t0, .L7
  li t0, 6
  bne s1, t0, .L5
.L7:
  li t0, 4
  j .L6
.L5:
  li t0, 1
  beq s1, t0, .L10
  li t0, 7
  bne s1, t0, .L8
.L10:
  li t0, 3
  j .L9
.L8:
  li t0, 5
.L9:
.L6:
.L4:
.L2:
  mv s3, t0 ; view
  ; scenes.e16.ts:282  banditShow(160, 120, view, s > 4)
  li t0, 4
  sltu t0, t0, s1
  li a0, 160
  li a1, 120
  mv a2, s3
  mv a3, t0
  call banditShow
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; scenes.e16.ts:287 pause() at -O1
pause:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes.e16.ts:288  say(17, 16, str('PAUSE'), SL_AMBER)
  li a0, 17
  li a1, 16
  la a2, str_60
  li a3, 4
  call say
  ; scenes.e16.ts:289  soundMaster(4)
  li a0, 4
  call soundMaster
  ; scenes.e16.ts:290  for (;;) {
.L1:
  ; scenes.e16.ts:291  seenIs(frame_wait(seen))
  lw a0, 0x1b3c(zero)
  call frame_wait
  call seenIs
  ; scenes.e16.ts:292  padRead()
  call padRead
  ; scenes.e16.ts:293  if (pressed(B_START)) break
  li a0, 1024
  call pressed
  beqz a0, .L1
  ; scenes.e16.ts:293  break
  ; scenes.e16.ts:295  soundMaster(15)
  li a0, 15
  call soundMaster
  ; scenes.e16.ts:296  unsay(17, 16, 5)
  li a0, 17
  li a1, 16
  li a2, 5
  call unsay
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes.e16.ts:302 results(k) at -O1
;   k in s1
;   timeBonus in s2
;   dmgBonus in s3
results:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; k
  ; scenes.e16.ts:303  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
  ; scenes.e16.ts:304  sceneSky(k)
  mv a0, s1
  call sceneSky
  ; scenes.e16.ts:305  music(M_WIN)
  li a0, 5
  call music
  ; scenes.e16.ts:306  say(10, 4, str('MISSION ACCOMPLISHED'), SL_AMBER)
  li a0, 10
  li a1, 4
  la a2, str_61
  li a3, 4
  call say
  ; scenes.e16.ts:307  say(12, 6, aceName(k), SL_RED)
  mv a0, s1
  call aceName
  li a1, 6
  mv a2, a0
  li a0, 12
  li a3, 5
  call say
  ; scenes.e16.ts:308  say(12 + nameLen(k), 6, str(' DOWN'), SL_WHITE)
  mv a0, s1
  call nameLen
  addi a0, a0, 12
  li a1, 6
  la a2, str_62
  li a3, 7
  call say
  ; scenes.e16.ts:309  wait(40)
  li a0, 40
  call wait
  ; scenes.e16.ts:310  say(6, 10, str('TIME'), SL_WHITE)
  li a0, 6
  li a1, 10
  la a2, str_63
  li a3, 7
  call say
  ; scenes.e16.ts:311  timeSay(24, 10, flown)
  lw t0, 0x1b4e(zero)
  li a0, 24
  li a1, 10
  mv a2, t0
  call timeSay
  ; scenes.e16.ts:312  if (timeEnter(k, flown)) say(29, 10, str('RECORD'), SL_RED)
  lw t0, 0x1b4e(zero)
  mv a0, s1
  mv a1, t0
  call timeEnter
  beqz a0, .L1
  ; scenes.e16.ts:312  say(29, 10, str('RECORD'), SL_RED)
  li a0, 29
  li a1, 10
  la a2, str_64
  li a3, 5
  call say
.L1:
  ; scenes.e16.ts:313  wait(20)
  li a0, 20
  call wait
  ; scenes.e16.ts:314  say(6, 12, str('ROUNDS ON TARGET'), SL_WHITE)
  li a0, 6
  li a1, 12
  la a2, str_65
  li a3, 7
  call say
  ; scenes.e16.ts:315  sayNumber(cellXY(24, 12), roundsHit, 4, SL_AMBER)
  lw t0, 0x1842(zero)
  li a0, 792
  mv a1, t0
  li a2, 4
  li a3, 4
  call sayNumber
  ; scenes.e16.ts:316  wait(20)
  li a0, 20
  call wait
  ; scenes.e16.ts:317  say(6, 14, str('DAMAGE TAKEN'), SL_WHITE)
  li a0, 6
  li a1, 14
  la a2, str_66
  li a3, 7
  call say
  ; scenes.e16.ts:318  sayNumber(cellXY(24, 14), damage, 3, SL_AMBER)
  lw t0, 0x1b4c(zero)
  li a0, 920
  mv a1, t0
  li a2, 3
  li a3, 4
  call sayNumber
  ; scenes.e16.ts:319  sayChar(27, 14, 37, SL_AMBER)
  li a0, 27
  li a1, 14
  li a2, 37
  li a3, 4
  call sayChar
  ; scenes.e16.ts:320  wait(30)
  li a0, 30
  call wait
  ; scenes.e16.ts:321  const timeBonus = div(clock, 60) * 10
  lw t0, 0x1b50(zero)
  li t1, 60
  divu t0, t0, t1
  slli t1, t0, 3
  slli t0, t0, 1
  add s2, t0, t1
  ; scenes.e16.ts:322  const dmgBonus = (100 - damage) * 10
  lw t0, 0x1b4c(zero)
  li t1, 100
  sub t1, t1, t0
  slli t0, t1, 3
  slli t1, t1, 1
  add s3, t1, t0
  ; scenes.e16.ts:323  say(6, 17, str('TIME BONUS'), SL_WHITE)
  li a0, 6
  li a1, 17
  la a2, str_67
  li a3, 7
  call say
  ; scenes.e16.ts:324  sayNumber(cellXY(22, 17), timeBonus, 5, SL_AMBER)
  li a0, 1110
  mv a1, s2
  li a2, 5
  li a3, 4
  call sayNumber
  ; scenes.e16.ts:325  sayChar(27, 17, 48, SL_AMBER)
  li a0, 27
  li a1, 17
  li a2, 48
  li a3, 4
  call sayChar
  ; scenes.e16.ts:326  wait(20)
  li a0, 20
  call wait
  ; scenes.e16.ts:327  say(6, 19, str('NO DAMAGE BONUS'), SL_WHITE)
  li a0, 6
  li a1, 19
  la a2, str_68
  li a3, 7
  call say
  ; scenes.e16.ts:328  sayNumber(cellXY(22, 19), dmgBonus, 5, SL_AMBER)
  li a0, 1238
  mv a1, s3
  li a2, 5
  li a3, 4
  call sayNumber
  ; scenes.e16.ts:329  sayChar(27, 19, 48, SL_AMBER)
  li a0, 27
  li a1, 19
  li a2, 48
  li a3, 4
  call sayChar
  ; scenes.e16.ts:330  points(timeBonus + dmgBonus)
  add a0, s2, s3
  call points
  ; scenes.e16.ts:331  wait(30)
  li a0, 30
  call wait
  ; scenes.e16.ts:332  say(6, 22, str('RANK'), SL_WHITE)
  li a0, 6
  li a1, 22
  la a2, str_69
  li a3, 7
  call say
  ; scenes.e16.ts:333  sayChar(24, 22, rank(), SL_RED)
  call rank
  li a1, 22
  mv a2, a0
  li a0, 24
  li a3, 5
  call sayChar
  ; scenes.e16.ts:334  say(6, 25, str('SCORE'), SL_WHITE)
  li a0, 6
  li a1, 25
  la a2, str_70
  li a3, 7
  call say
  ; scenes.e16.ts:335  scoreSay(18, 25)
  li a0, 18
  li a1, 25
  call scoreSay
  ; scenes.e16.ts:336  waitPress(360)
  li a0, 360
  call waitPress
  ; scenes.e16.ts:337  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
  ; scenes.e16.ts:338  skyIs(false)
  li a0, 0
  call skyIs
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; scenes.e16.ts:341 nameLen(k) at -O1
;   k in a0
nameLen:
  ; scenes.e16.ts:342  return k === 0 ? 6 : k === 1 ? 7 : k === 2 ? 6 : k === 3 ? 6 : 8
  bne a0, zero, .L1
  li t0, 6
  j .L2
.L1:
  li t0, 1
  bne a0, t0, .L3
  li t0, 7
  j .L4
.L3:
  li t0, 2
  bne a0, t0, .L5
  li t0, 6
  j .L6
.L5:
  li t0, 3
  bne a0, t0, .L7
  li t0, 6
  j .L8
.L7:
  li t0, 8
.L8:
.L6:
.L4:
.L2:
  mv a0, t0
.return:
  ret

; scenes.e16.ts:346 rank() at -O1
;   sec in s1
;   hits in s2
rank:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; scenes.e16.ts:347  const sec = div(clock, 60)
  lw t0, 0x1b50(zero)
  li t1, 60
  divu s1, t0, t1
  ; scenes.e16.ts:348  const hits = hitsAgainst()
  call hitsAgainst
  mv s2, a0 ; hits
  ; scenes.e16.ts:349  if (sec > 120 && damage < 10 && hits < 4) return 83
  li t0, 120
  bgeu t0, s1, .L1
  lw t0, 0x1b4c(zero)
  li t1, 10
  bgeu t0, t1, .L1
  li t0, 4
  bgeu s2, t0, .L1
  ; scenes.e16.ts:349  return 83
  li a0, 83
  j .return
.L1:
  ; scenes.e16.ts:350  if (sec > 80 && damage < 40) return 65
  li t0, 80
  bgeu t0, s1, .L2
  lw t0, 0x1b4c(zero)
  li t1, 40
  bgeu t0, t1, .L2
  ; scenes.e16.ts:350  return 65
  li a0, 65
  j .return
.L2:
  ; scenes.e16.ts:351  if (sec > 30 && damage < 75) return 66
  li t0, 30
  bgeu t0, s1, .L3
  lw t0, 0x1b4c(zero)
  li t1, 75
  bgeu t0, t1, .L3
  ; scenes.e16.ts:351  return 66
  li a0, 66
  j .return
.L3:
  ; scenes.e16.ts:352  return 67
  li a0, 67
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:356 scoreSay(x, y) at -O1
;   x in s1
;   y in s2
;   hi in s0
;   lo in s3
scoreSay:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  ; scenes.e16.ts:357  const hi = score[1]
  lw s0, score+2(zero)
  ; scenes.e16.ts:358  const lo = score[0]
  lw s3, score(zero)
  ; scenes.e16.ts:359  if (hi === 0) {
  bne s0, zero, .L1
  ; scenes.e16.ts:360  sayNumber(cellXY(x + 4, y), lo, 4, SL_AMBER)
  addi a0, s1, 4
  mv a1, s2
  call cellXY
  mv a1, s3
  li a2, 4
  li a3, 4
  call sayNumber
  ; scenes.e16.ts:361  sayChar(x + 8, y, 48, SL_AMBER)
  addi a0, s1, 8
  mv a1, s2
  li a2, 48
  li a3, 4
  call sayChar
  ; scenes.e16.ts:362  return
  j .return
.L1:
  ; scenes.e16.ts:364  sayNumber(cellXY(x, y), hi, 4, SL_AMBER)
  mv a0, s1
  mv a1, s2
  call cellXY
  mv a1, s0
  li a2, 4
  li a3, 4
  call sayNumber
  ; scenes.e16.ts:365  sayChar(x + 4, y, 48 + div(lo, 1000), SL_AMBER)
  li t0, 1000
  divu t0, s3, t0
  addi a0, s1, 4
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
  ; scenes.e16.ts:366  sayChar(x + 5, y, 48 + (div(lo, 100) % 10), SL_AMBER)
  li t0, 100
  divu t0, s3, t0
  li t1, 10
  remu t0, t0, t1
  addi a0, s1, 5
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
  ; scenes.e16.ts:367  sayChar(x + 6, y, 48 + (div(lo, 10) % 10), SL_AMBER)
  li t0, 10
  divu t0, s3, t0
  li t1, 10
  remu t0, t0, t1
  addi a0, s1, 6
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
  ; scenes.e16.ts:368  sayChar(x + 7, y, 48 + (lo % 10), SL_AMBER)
  li t0, 10
  remu t0, s3, t0
  addi a0, s1, 7
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
  ; scenes.e16.ts:369  sayChar(x + 8, y, 48, SL_AMBER)
  addi a0, s1, 8
  mv a1, s2
  li a2, 48
  li a3, 4
  call sayChar
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; scenes.e16.ts:373 wait(n) at -O1
;   n in s2
;   t in s1
wait:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  ; scenes.e16.ts:374  let t: u16 = 0
  li s1, 0 ; t
  ; scenes.e16.ts:375  while (t < n) {
  j .L3
.L1:
  ; scenes.e16.ts:376  calmFrame(t)
  mv a0, s1
  call calmFrame
  ; scenes.e16.ts:377  t++
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:382 waitPress(n) at -O1
;   n in s2
;   t in s1
waitPress:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; n
  ; scenes.e16.ts:383  let t: u16 = 0
  li s1, 0 ; t
  ; scenes.e16.ts:384  while (t < n) {
  j .L3
.L1:
  ; scenes.e16.ts:385  calmFrame(t)
  mv a0, s1
  call calmFrame
  ; scenes.e16.ts:386  if (t > 30 && pressed(B_A | B_START)) break
  li t0, 30
  bgeu t0, s1, .L5
  li a0, 1040
  call pressed
  beqz a0, .L5
  ; scenes.e16.ts:386  break
  j .L4
.L5:
  ; scenes.e16.ts:387  t++
  addi s1, s1, 1
.L3:
  bltu s1, s2, .L1
.L4:
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; scenes.e16.ts:391 calmFrame(_t) at -O1
;   _t in s1
calmFrame:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; _t
  ; scenes.e16.ts:392  frameBegin()
  call frameBegin
  ; scenes.e16.ts:393  cruise(frame, 4)
  lw a0, 0x1b3e(zero)
  li a1, 4
  call cruise
  ; scenes.e16.ts:394  cloudsStep()
  la t0, cloudsStep
  li t1, 260
  call far_call
  ; scenes.e16.ts:395  cloudsDraw(32767, true)
  li a0, 32767
  li a1, 1
  la t0, cloudsDraw
  li t1, 260
  call far_call
  ; scenes.e16.ts:396  sunDraw()
  la t0, sunDraw
  li t1, 260
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes.e16.ts:402 continueAsk(credits) at -O1
;   credits in s3
;   t in s1
;   yes in s2
continueAsk:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s1, 4(sp)
  sw s2, 6(sp)
  mv s3, a0 ; credits
  ; scenes.e16.ts:403  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
  ; scenes.e16.ts:404  sceneSky(4)
  li a0, 4
  call sceneSky
  ; scenes.e16.ts:405  music(M_OVER)
  li a0, 6
  call music
  ; scenes.e16.ts:406  say(15, 12, str('CONTINUE?'), SL_AMBER)
  li a0, 15
  li a1, 12
  la a2, str_71
  li a3, 4
  call say
  ; scenes.e16.ts:407  say(14, 20, str('CREDITS'), SL_WHITE)
  li a0, 14
  li a1, 20
  la a2, str_72
  li a3, 7
  call say
  ; scenes.e16.ts:408  sayChar(22, 20, 48 + credits, SL_WHITE)
  li a0, 22
  li a1, 20
  addi a2, s3, 48
  li a3, 7
  call sayChar
  ; scenes.e16.ts:409  let t: u16 = 0
  li s1, 0 ; t
  ; scenes.e16.ts:410  let yes = false
  li s2, 0 ; yes
  ; scenes.e16.ts:411  while (t < 600) {
  j .L3
.L1:
  ; scenes.e16.ts:412  calmFrame(t)
  mv a0, s1
  call calmFrame
  ; scenes.e16.ts:413  sayChar(19, 15, 57 - div(t, 60), SL_RED)
  li t0, 60
  divu t0, s1, t0
  li t1, 57
  sub t1, t1, t0
  li a0, 19
  li a1, 15
  mv a2, t1
  li a3, 5
  call sayChar
  ; scenes.e16.ts:414  if (t > 20 && pressed(B_START | B_A)) {
  li t0, 20
  bgeu t0, s1, .L5
  li a0, 1040
  call pressed
  beqz a0, .L5
  ; scenes.e16.ts:415  yes = true
  li s2, 1 ; yes
  ; scenes.e16.ts:416  break
  j .L4
.L5:
  ; scenes.e16.ts:418  t++
  addi s1, s1, 1
.L3:
  li t0, 600
  bltu s1, t0, .L1
.L4:
  ; scenes.e16.ts:420  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
  ; scenes.e16.ts:421  skyIs(false)
  li a0, 0
  call skyIs
  ; scenes.e16.ts:422  if (yes) sfxSelect()
  beqz s2, .L6
  ; scenes.e16.ts:422  sfxSelect()
  call sfxSelect
.L6:
  ; scenes.e16.ts:423  return yes
  mv a0, s2
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s1, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; scenes.e16.ts:427 ending_() at -O1
ending_:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; scenes.e16.ts:428  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
  ; scenes.e16.ts:429  sceneSky(0)
  li a0, 0
  call sceneSky
  ; scenes.e16.ts:430  music(M_ENDING)
  li a0, 7
  call music
  ; scenes.e16.ts:431  say(13, 6, str('ALL ACES DOWN'), SL_AMBER)
  li a0, 13
  li a1, 6
  la a2, str_73
  li a3, 4
  call say
  ; scenes.e16.ts:432  wait(60)
  li a0, 60
  call wait
  ; scenes.e16.ts:433  say(7, 10, str('THE SKY IS QUIET AGAIN.'), SL_WHITE)
  li a0, 7
  li a1, 10
  la a2, str_74
  li a3, 7
  call say
  ; scenes.e16.ts:434  wait(40)
  li a0, 40
  call wait
  ; scenes.e16.ts:435  say(7, 12, str('VOLT ONE, RETURN TO BASE.'), SL_WHITE)
  li a0, 7
  li a1, 12
  la a2, str_75
  li a3, 7
  call say
  ; scenes.e16.ts:436  wait(40)
  li a0, 40
  call wait
  ; scenes.e16.ts:437  say(7, 16, str('GANNET  MISTRAL  CINDER'), SL_HUD_TEXT)
  li a0, 7
  li a1, 16
  la a2, str_76
  li a3, 3
  call say
  ; scenes.e16.ts:438  say(11, 17, str('ORACLE  NOCTURNE'), SL_HUD_TEXT)
  li a0, 11
  li a1, 17
  la a2, str_77
  li a3, 3
  call say
  ; scenes.e16.ts:439  wait(40)
  li a0, 40
  call wait
  ; scenes.e16.ts:440  say(10, 22, str('FINAL SCORE'), SL_WHITE)
  li a0, 10
  li a1, 22
  la a2, str_78
  li a3, 7
  call say
  ; scenes.e16.ts:441  scoreSay(14, 24)
  li a0, 14
  li a1, 24
  call scoreSay
  ; scenes.e16.ts:442  say(10, 34, str('(C) ELECXZY PROJECT'), SL_WHITE)
  li a0, 10
  li a1, 34
  la a2, str_26
  li a3, 7
  call say
  ; scenes.e16.ts:443  waitPress(900)
  li a0, 900
  call waitPress
  ; scenes.e16.ts:444  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; scenes.e16.ts:448 gameOver() at -O1
;   place in s1
gameOver:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; scenes.e16.ts:449  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
  ; scenes.e16.ts:450  sceneSky(4)
  li a0, 4
  call sceneSky
  ; scenes.e16.ts:451  music(M_OVER)
  li a0, 6
  call music
  ; scenes.e16.ts:452  say(15, 14, str('GAME OVER'), SL_RED)
  li a0, 15
  li a1, 14
  la a2, str_79
  li a3, 5
  call say
  ; scenes.e16.ts:453  wait(160)
  li a0, 160
  call wait
  ; scenes.e16.ts:454  const place = tablePlace()
  call tablePlace
  mv s1, a0 ; place
  ; scenes.e16.ts:455  if (place < 5) nameEntry(place)
  li t0, 5
  bgeu s1, t0, .L1
  ; scenes.e16.ts:455  nameEntry(place)
  mv a0, s1
  call nameEntry
.L1:
  ; scenes.e16.ts:456  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
  ; scenes.e16.ts:457  skyIs(false)
  li a0, 0
  call skyIs
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; scenes.e16.ts:462 letterStep(k, t) at -O1
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
  ; scenes.e16.ts:463  let c = letters[k]
  slli t0, s3, 1
  lw s1, letters(t0)
  ; scenes.e16.ts:464  if (pressed(B_UP)) c = c === 90 ? 65 : c + 1
  li a0, 1
  call pressed
  beqz a0, .L1
  ; scenes.e16.ts:464  c = c === 90 ? 65 : c + 1
  li t0, 90
  bne s1, t0, .L2
  li t0, 65
  j .L3
.L2:
  addi t0, s1, 1
.L3:
  mv s1, t0 ; c
.L1:
  ; scenes.e16.ts:465  if (pressed(B_DOWN)) c = c === 65 ? 90 : c - 1
  li a0, 2
  call pressed
  beqz a0, .L4
  ; scenes.e16.ts:465  c = c === 65 ? 90 : c - 1
  li t0, 65
  bne s1, t0, .L5
  li t0, 90
  j .L6
.L5:
  addi t0, s1, -1
.L6:
  mv s1, t0 ; c
.L4:
  ; scenes.e16.ts:466  letters[k] = c
  slli t0, s3, 1
  sw s1, letters(t0)
  ; scenes.e16.ts:467  let j: u16 = 0
  li s2, 0 ; j
  ; scenes.e16.ts:468  while (j < 3) {
  j .L9
.L7:
  ; scenes.e16.ts:469  const blink = j === k && (t & 16) !== 0
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
  ; scenes.e16.ts:470  sayChar(18 + j, 16, letters[j], blink ? SL_WHITE : SL_AMBER)
  slli t0, s2, 1
  lw t0, letters(t0)
  li t1, 16
  mv t2, t0
  addi t0, s2, 18
  lw t3, 2(fp)
  beqz t3, .L12
  li t3, 7
  j .L13
.L12:
  li t3, 4
.L13:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call sayChar
  ; scenes.e16.ts:471  j++
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

; scenes.e16.ts:476 nameEntry(place) at -O1
;   place in s3
;   k in s2
;   t in s1
nameEntry:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s2, 4(sp)
  sw s1, 6(sp)
  mv s3, a0 ; place
  ; scenes.e16.ts:477  music(M_ENDING)
  li a0, 7
  call music
  ; scenes.e16.ts:478  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
  ; scenes.e16.ts:479  say(12, 10, str('A NEW BEST SCORE'), SL_AMBER)
  li a0, 12
  li a1, 10
  la a2, str_80
  li a3, 4
  call say
  ; scenes.e16.ts:480  say(12, 12, str('ENTER YOUR NAME'), SL_WHITE)
  li a0, 12
  li a1, 12
  la a2, str_81
  li a3, 7
  call say
  ; scenes.e16.ts:481  letters[0] = 65
  li t0, 65
  sw t0, letters(zero)
  ; scenes.e16.ts:482  letters[1] = 65
  li t0, 65
  sw t0, letters+2(zero)
  ; scenes.e16.ts:483  letters[2] = 65
  li t0, 65
  sw t0, letters+4(zero)
  ; scenes.e16.ts:484  let k: u16 = 0
  li s2, 0 ; k
  ; scenes.e16.ts:485  let t: u16 = 0
  li s1, 0 ; t
  ; scenes.e16.ts:486  while (k < 3 && t < 1800) {
  j .L3
.L1:
  ; scenes.e16.ts:487  calmFrame(t)
  mv a0, s1
  call calmFrame
  ; scenes.e16.ts:488  t++
  addi s1, s1, 1
  ; scenes.e16.ts:489  letterStep(k, t)
  mv a0, s2
  mv a1, s1
  call letterStep
  ; scenes.e16.ts:490  if (pressed(B_A)) {
  li a0, 16
  call pressed
  beqz a0, .L5
  ; scenes.e16.ts:491  sfxSelect()
  call sfxSelect
  ; scenes.e16.ts:492  k++
  addi s2, s2, 1
.L5:
.L3:
  li t0, 3
  bgeu s2, t0, .L6
  li t0, 1800
  bltu s1, t0, .L1
.L6:
  ; scenes.e16.ts:495  tableEnter(place, letters[0], letters[1], letters[2])
  lw t0, letters(zero)
  lw t1, letters+2(zero)
  lw t2, letters+4(zero)
  mv a0, s3
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call tableEnter
  ; scenes.e16.ts:496  rowsClear(0, 35)
  li a0, 0
  li a1, 35
  call rowsClear
  ; scenes.e16.ts:497  tableShow(12)
  li a0, 12
  call tableShow
  ; scenes.e16.ts:498  wait(240)
  li a0, 240
  call wait
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s2, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; best.e16.ts:22 tableLoad() at -O1
;   k in s1
;   at in s2
;   ab in s3
tableLoad:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  ; best.e16.ts:23  if (saveRead(0) !== MAGIC) tableFresh()
  li a0, 0
  call saveRead
  li t0, 17217
  beq a0, t0, .L1
  ; best.e16.ts:23  tableFresh()
  call tableFresh
.L1:
  ; best.e16.ts:24  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:25  while (k < 5) {
  j .L4
.L2:
  ; best.e16.ts:26  const at = 2 + k * ENTRY
  slli t0, s1, 3
  addi s2, t0, 2
  ; best.e16.ts:27  bestScore[k * 2] = saveRead(at)
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
  ; best.e16.ts:28  bestScore[k * 2 + 1] = saveRead(at + 2)
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
  ; best.e16.ts:29  const ab = saveRead(at + 4)
  addi a0, s2, 4
  call saveRead
  mv s3, a0 ; ab
  ; best.e16.ts:30  bestName[k * 3] = ab & 255
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  andi t1, s3, 255
  sw t1, bestName(t0)
  ; best.e16.ts:31  bestName[k * 3 + 1] = ab >> 8
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 1
  slli t0, t0, 1
  srli t1, s3, 8
  sw t1, bestName(t0)
  ; best.e16.ts:32  bestName[k * 3 + 2] = saveRead(at + 6) & 255
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
  ; best.e16.ts:33  bestTime[k] = saveRead(TIMES + k * 2)
  slli t0, s1, 1
  slli t1, s1, 1
  addi t0, t0, bestTime
  addi sp, sp, -2
  sw t0, 0(sp)
  addi a0, t1, 42
  call saveRead
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; best.e16.ts:34  k++
  addi s1, s1, 1
.L4:
  li t0, 5
  bltu s1, t0, .L2
  ; best.e16.ts:36  best[0] = bestScore[0]
  lw t0, bestScore(zero)
  sw t0, best(zero)
  ; best.e16.ts:37  best[1] = bestScore[1]
  lw t0, bestScore+2(zero)
  sw t0, best+2(zero)
  ; best.e16.ts:38  stickIs(saveRead(STICK) !== 0)
  li a0, 52
  call saveRead
  sub t0, a0, zero
  snez a0, t0
  call stickIs
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; best.e16.ts:42 tableFresh() at -O1
;   k in s1
;   at in s2
tableFresh:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  ; best.e16.ts:43  saveWrite(0, MAGIC)
  li a0, 0
  li a1, 17217
  call saveWrite
  ; best.e16.ts:44  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:45  while (k < 5) {
  j .L3
.L1:
  ; best.e16.ts:46  const at = 2 + k * ENTRY
  slli t0, s1, 3
  addi s2, t0, 2
  ; best.e16.ts:47  saveWrite(at, (5 - k) * 400)
  li t0, 5
  sub t0, t0, s1
  li t1, 400
  mul t0, t0, t1
  mv a0, s2
  mv a1, t0
  call saveWrite
  ; best.e16.ts:48  saveWrite(at + 2, 0)
  addi a0, s2, 2
  li a1, 0
  call saveWrite
  ; best.e16.ts:49  saveWrite(at + 4, 0x4c45)
  addi a0, s2, 4
  li a1, 19525
  call saveWrite
  ; best.e16.ts:50  saveWrite(at + 6, 0x43)
  addi a0, s2, 6
  li a1, 67
  call saveWrite
  ; best.e16.ts:51  saveWrite(TIMES + k * 2, 0xffff)
  slli t0, s1, 1
  addi a0, t0, 42
  li a1, 65535
  call saveWrite
  ; best.e16.ts:52  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
  ; best.e16.ts:54  saveWrite(STICK, 0)
  li a0, 52
  li a1, 0
  call saveWrite
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; best.e16.ts:58 tablePlace() at -O1
;   k in s1
tablePlace:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; best.e16.ts:59  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:60  while (k < 5) {
  j .L3
.L1:
  ; best.e16.ts:61  if (scoreMore(addr(score), addr(bestScore) + k * 4)) return k
  slli t0, s1, 2
  la a0, score
  addi a1, t0, bestScore
  call scoreMore
  beqz a0, .L5
  ; best.e16.ts:61  return k
  mv a0, s1
  j .return
.L5:
  ; best.e16.ts:62  k++
  addi s1, s1, 1
.L3:
  li t0, 5
  bltu s1, t0, .L1
  ; best.e16.ts:64  return 5
  li a0, 5
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; best.e16.ts:68 tableEnter(place, a, b, c) at -O1
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
  ; best.e16.ts:69  let k: u16 = 4
  li s1, 4 ; k
  ; best.e16.ts:70  while (k > place) {
  j .L3
.L1:
  ; best.e16.ts:71  bestScore[k * 2] = bestScore[k * 2 - 2]
  slli t0, s1, 1
  slli t0, t0, 1
  slli t1, s1, 1
  addi t1, t1, -2
  slli t1, t1, 1
  lw t1, bestScore(t1)
  sw t1, bestScore(t0)
  ; best.e16.ts:72  bestScore[k * 2 + 1] = bestScore[k * 2 - 1]
  slli t0, s1, 1
  addi t0, t0, 1
  slli t0, t0, 1
  slli t1, s1, 1
  addi t1, t1, -1
  slli t1, t1, 1
  lw t1, bestScore(t1)
  sw t1, bestScore(t0)
  ; best.e16.ts:73  bestName[k * 3] = bestName[k * 3 - 3]
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  slli t2, s1, 1
  add t1, t2, s1
  addi t1, t1, -3
  slli t1, t1, 1
  lw t1, bestName(t1)
  sw t1, bestName(t0)
  ; best.e16.ts:74  bestName[k * 3 + 1] = bestName[k * 3 - 2]
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
  ; best.e16.ts:75  bestName[k * 3 + 2] = bestName[k * 3 - 1]
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
  ; best.e16.ts:76  k--
  addi s1, s1, -1
.L3:
  bltu s2, s1, .L1
  ; best.e16.ts:78  bestScore[place * 2] = score[0]
  slli t0, s2, 1
  slli t0, t0, 1
  lw t1, score(zero)
  sw t1, bestScore(t0)
  ; best.e16.ts:79  bestScore[place * 2 + 1] = score[1]
  slli t0, s2, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, score+2(zero)
  sw t1, bestScore(t0)
  ; best.e16.ts:80  bestName[place * 3] = a
  slli t1, s2, 1
  add t0, t1, s2
  slli t0, t0, 1
  lw t1, 0(fp) ; a
  sw t1, bestName(t0)
  ; best.e16.ts:81  bestName[place * 3 + 1] = b
  slli t1, s2, 1
  add t0, t1, s2
  addi t0, t0, 1
  slli t0, t0, 1
  lw t1, 2(fp) ; b
  sw t1, bestName(t0)
  ; best.e16.ts:82  bestName[place * 3 + 2] = c
  slli t1, s2, 1
  add t0, t1, s2
  addi t0, t0, 2
  slli t0, t0, 1
  lw t1, 4(fp) ; c
  sw t1, bestName(t0)
  ; best.e16.ts:83  k = 0
  li s1, 0 ; k
  ; best.e16.ts:84  while (k < 5) {
  j .L7
.L5:
  ; best.e16.ts:85  const at = 2 + k * ENTRY
  slli t0, s1, 3
  addi s3, t0, 2
  ; best.e16.ts:86  saveWrite(at, bestScore[k * 2])
  slli t0, s1, 1
  slli t0, t0, 1
  lw t0, bestScore(t0)
  mv a0, s3
  mv a1, t0
  call saveWrite
  ; best.e16.ts:87  saveWrite(at + 2, bestScore[k * 2 + 1])
  slli t0, s1, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, bestScore(t0)
  addi a0, s3, 2
  mv a1, t0
  call saveWrite
  ; best.e16.ts:88  saveWrite(at + 4, bestName[k * 3] | (bestName[k * 3 + 1] << 8))
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
  ; best.e16.ts:89  saveWrite(at + 6, bestName[k * 3 + 2])
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 2
  slli t0, t0, 1
  lw t0, bestName(t0)
  addi a0, s3, 6
  mv a1, t0
  call saveWrite
  ; best.e16.ts:90  k++
  addi s1, s1, 1
.L7:
  li t0, 5
  bltu s1, t0, .L5
  ; best.e16.ts:92  best[0] = bestScore[0]
  lw t0, bestScore(zero)
  sw t0, best(zero)
  ; best.e16.ts:93  best[1] = bestScore[1]
  lw t0, bestScore+2(zero)
  sw t0, best+2(zero)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; best.e16.ts:97 timeEnter(k, frames) at -O1
;   k in s1
;   frames in s2
timeEnter:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; k
  mv s2, a1 ; frames
  ; best.e16.ts:98  if (frames >= bestTime[k]) return false
  slli t0, s1, 1
  lw t0, bestTime(t0)
  bltu s2, t0, .L1
  ; best.e16.ts:98  return false
  li a0, 0
  j .return
.L1:
  ; best.e16.ts:99  bestTime[k] = frames
  slli t0, s1, 1
  sw s2, bestTime(t0)
  ; best.e16.ts:100  saveWrite(TIMES + k * 2, frames)
  slli t0, s1, 1
  addi a0, t0, 42
  mv a1, s2
  call saveWrite
  ; best.e16.ts:101  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; best.e16.ts:105 stickToggle() at -O1
stickToggle:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; best.e16.ts:106  stickIs(!stickReversed)
  lw t0, 0x15bc(zero)
  seqz a0, t0
  call stickIs
  ; best.e16.ts:107  saveWrite(STICK, stickReversed ? 1 : 0)
  lw t1, 0x15bc(zero)
  li t0, 52
  beqz t1, .L1
  li t1, 1
  j .L2
.L1:
  li t1, 0
.L2:
  mv a0, t0
  mv a1, t1
  call saveWrite
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; best.e16.ts:111 tableShow(y) at -O1
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
  ; best.e16.ts:112  let k: u16 = 0
  li s1, 0 ; k
  ; best.e16.ts:113  while (k < 5) {
  j .L3
.L1:
  ; best.e16.ts:114  const row = y + k * 2
  slli t0, s1, 1
  add s2, s0, t0
  ; best.e16.ts:115  const s = k === 0 ? SL_AMBER : SL_WHITE
  bne s1, zero, .L5
  li t0, 4
  j .L6
.L5:
  li t0, 7
.L6:
  mv s3, t0 ; s
  ; best.e16.ts:116  sayChar(11, row, 49 + k, s)
  li a0, 11
  mv a1, s2
  addi a2, s1, 49
  mv a3, s3
  call sayChar
  ; best.e16.ts:117  sayChar(14, row, bestName[k * 3], s)
  slli t1, s1, 1
  add t0, t1, s1
  slli t0, t0, 1
  lw t0, bestName(t0)
  li a0, 14
  mv a1, s2
  mv a2, t0
  mv a3, s3
  call sayChar
  ; best.e16.ts:118  sayChar(15, row, bestName[k * 3 + 1], s)
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, bestName(t0)
  li a0, 15
  mv a1, s2
  mv a2, t0
  mv a3, s3
  call sayChar
  ; best.e16.ts:119  sayChar(16, row, bestName[k * 3 + 2], s)
  slli t1, s1, 1
  add t0, t1, s1
  addi t0, t0, 2
  slli t0, t0, 1
  lw t0, bestName(t0)
  li a0, 16
  mv a1, s2
  mv a2, t0
  mv a3, s3
  call sayChar
  ; best.e16.ts:120  scoreAt(19, row, k, s)
  li a0, 19
  mv a1, s2
  mv a2, s1
  mv a3, s3
  call scoreAt
  ; best.e16.ts:121  k++
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

; best.e16.ts:126 scoreAt(x, y, k, s) at -O1
;   x in s1
;   y in s2
;   k in 0(fp)
;   s in s3
;   hi in 2(fp)
;   lo in 4(fp)
scoreAt:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; x
  mv s2, a1 ; y
  sw a2, 0(fp) ; k
  mv s3, a3 ; s
  ; best.e16.ts:127  const hi = bestScore[k * 2 + 1]
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  addi t0, t0, 1
  slli t0, t0, 1
  lw t0, bestScore(t0)
  sw t0, 2(fp) ; hi
  ; best.e16.ts:128  const lo = bestScore[k * 2]
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  slli t0, t0, 1
  lw t0, bestScore(t0)
  sw t0, 4(fp) ; lo
  ; best.e16.ts:129  if (hi > 0) {
  lw t0, 2(fp) ; hi
  bgeu zero, t0, .L1
  ; best.e16.ts:130  sayNumber(cellXY(x, y), hi, 4, s)
  mv a0, s1
  mv a1, s2
  call cellXY
  lw a1, 2(fp)
  li a2, 4
  mv a3, s3
  call sayNumber
  ; best.e16.ts:131  zero4(x + 4, y, lo, s)
  addi a0, s1, 4
  mv a1, s2
  lw a2, 4(fp)
  mv a3, s3
  call zero4
  j .L2
.L1:
  ; best.e16.ts:132  sayNumber(cellXY(x + 4, y), lo, 4, s)
  addi a0, s1, 4
  mv a1, s2
  call cellXY
  lw a1, 4(fp)
  li a2, 4
  mv a3, s3
  call sayNumber
.L2:
  ; best.e16.ts:133  sayChar(x + 8, y, 48, s)
  addi a0, s1, 8
  mv a1, s2
  li a2, 48
  mv a3, s3
  call sayChar
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; best.e16.ts:136 zero4(x, y, v, s) at -O1
;   x in s1
;   y in s2
;   v in s3
;   s in s0
zero4:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; v
  mv s0, a3 ; s
  ; best.e16.ts:137  sayChar(x, y, 48 + div(v, 1000), s)
  li t0, 1000
  divu t0, s3, t0
  mv a0, s1
  mv a1, s2
  addi a2, t0, 48
  mv a3, s0
  call sayChar
  ; best.e16.ts:138  sayChar(x + 1, y, 48 + (div(v, 100) % 10), s)
  li t0, 100
  divu t0, s3, t0
  li t1, 10
  remu t0, t0, t1
  addi a0, s1, 1
  mv a1, s2
  addi a2, t0, 48
  mv a3, s0
  call sayChar
  ; best.e16.ts:139  sayChar(x + 2, y, 48 + (div(v, 10) % 10), s)
  li t0, 10
  divu t0, s3, t0
  li t1, 10
  remu t0, t0, t1
  addi a0, s1, 2
  mv a1, s2
  addi a2, t0, 48
  mv a3, s0
  call sayChar
  ; best.e16.ts:140  sayChar(x + 3, y, 48 + (v % 10), s)
  li t0, 10
  remu t0, s3, t0
  addi a0, s1, 3
  mv a1, s2
  addi a2, t0, 48
  mv a3, s0
  call sayChar
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

str_24:
  .byte 80, 82, 69, 83, 83, 32, 83, 84, 65, 82, 84, 0
str_25:
  .byte 66, 69, 83, 84, 32, 65, 67, 69, 83, 0
str_26:
  .byte 40, 67, 41, 32, 69, 76, 69, 67, 88, 90, 89, 32, 80, 82, 79, 74, 69, 67, 84, 0
str_27:
  .byte 83, 69, 76, 69, 67, 84, 32, 32, 83, 84, 73, 67, 75, 32, 82, 69, 86, 69, 82, 83, 69, 0
str_28:
  .byte 83, 69, 76, 69, 67, 84, 32, 32, 83, 84, 73, 67, 75, 32, 78, 79, 82, 77, 65, 76, 32, 0
str_29:
  .byte 83, 79, 82, 84, 73, 69, 0
str_30:
  .byte 84, 65, 82, 71, 69, 84, 32, 32, 65, 67, 69, 0
str_31:
  .byte 84, 89, 80, 69, 32, 32, 32, 32, 65, 82, 67, 87, 73, 78, 71, 0
str_32:
  .byte 80, 82, 69, 83, 83, 32, 65, 32, 84, 79, 32, 84, 65, 75, 69, 32, 79, 70, 70, 0
str_33:
  .byte 79, 80, 69, 82, 65, 84, 73, 79, 78, 32, 70, 73, 82, 83, 84, 32, 76, 73, 71, 72, 84, 0
str_34:
  .byte 79, 80, 69, 82, 65, 84, 73, 79, 78, 32, 68, 85, 78, 69, 32, 87, 73, 78, 68, 0
str_35:
  .byte 79, 80, 69, 82, 65, 84, 73, 79, 78, 32, 73, 82, 79, 78, 32, 82, 65, 73, 78, 0
str_36:
  .byte 79, 80, 69, 82, 65, 84, 73, 79, 78, 32, 76, 79, 78, 71, 32, 83, 72, 65, 68, 79, 87, 0
str_37:
  .byte 79, 80, 69, 82, 65, 84, 73, 79, 78, 32, 78, 73, 71, 72, 84, 70, 65, 76, 76, 0
str_38:
  .byte 65, 32, 67, 65, 82, 69, 70, 85, 76, 32, 80, 73, 76, 79, 84, 32, 87, 72, 79, 32, 84, 85, 82, 78, 83, 0
str_39:
  .byte 79, 78, 69, 32, 87, 65, 89, 32, 87, 72, 69, 78, 32, 80, 82, 69, 83, 83, 69, 68, 46, 0
str_40:
  .byte 83, 84, 65, 89, 32, 79, 78, 32, 73, 84, 83, 32, 84, 65, 73, 76, 32, 65, 78, 68, 32, 85, 83, 69, 0
str_41:
  .byte 84, 72, 69, 32, 71, 85, 78, 46, 32, 76, 79, 67, 75, 32, 70, 79, 82, 32, 77, 73, 83, 83, 73, 76, 69, 83, 46, 0
str_42:
  .byte 70, 65, 83, 84, 32, 73, 78, 32, 84, 72, 69, 32, 67, 76, 73, 77, 66, 46, 32, 73, 84, 32, 68, 82, 79, 80, 83, 0
str_43:
  .byte 70, 76, 65, 82, 69, 83, 32, 87, 72, 69, 78, 32, 65, 32, 77, 73, 83, 83, 73, 76, 69, 32, 67, 79, 77, 69, 83, 46, 0
str_44:
  .byte 70, 73, 82, 69, 32, 67, 76, 79, 83, 69, 44, 32, 79, 82, 32, 87, 65, 73, 84, 32, 70, 79, 82, 0
str_45:
  .byte 84, 72, 69, 32, 70, 76, 65, 82, 69, 83, 32, 84, 79, 32, 66, 85, 82, 78, 32, 79, 85, 84, 46, 0
str_46:
  .byte 65, 32, 83, 67, 73, 83, 83, 79, 82, 83, 32, 70, 73, 71, 72, 84, 69, 82, 58, 32, 73, 84, 32, 66, 82, 69, 65, 75, 83, 0
str_47:
  .byte 65, 78, 68, 32, 82, 69, 86, 69, 82, 83, 69, 83, 46, 32, 68, 79, 32, 78, 79, 84, 0
str_48:
  .byte 79, 86, 69, 82, 83, 72, 79, 79, 84, 32, 45, 32, 85, 83, 69, 32, 84, 72, 69, 32, 66, 82, 65, 75, 69, 0
str_49:
  .byte 40, 76, 41, 32, 84, 79, 32, 84, 85, 82, 78, 32, 73, 78, 83, 73, 68, 69, 32, 73, 84, 46, 0
str_50:
  .byte 83, 72, 69, 32, 82, 69, 65, 68, 83, 32, 89, 79, 85, 82, 32, 77, 79, 86, 69, 83, 32, 65, 78, 68, 0
str_51:
  .byte 70, 73, 82, 69, 83, 32, 77, 73, 83, 83, 73, 76, 69, 83, 32, 70, 82, 79, 77, 32, 65, 70, 65, 82, 46, 0
str_52:
  .byte 87, 65, 84, 67, 72, 32, 84, 72, 69, 32, 77, 83, 76, 32, 76, 65, 77, 80, 32, 65, 78, 68, 0
str_53:
  .byte 68, 82, 79, 80, 32, 70, 76, 65, 82, 69, 83, 32, 87, 73, 84, 72, 32, 88, 46, 0
str_54:
  .byte 84, 72, 69, 32, 76, 65, 83, 84, 32, 65, 67, 69, 44, 32, 73, 78, 32, 66, 76, 65, 67, 75, 46, 0
str_55:
  .byte 73, 84, 32, 84, 85, 82, 78, 83, 32, 72, 65, 82, 68, 69, 82, 32, 84, 72, 65, 78, 32, 89, 79, 85, 44, 0
str_56:
  .byte 70, 73, 82, 69, 83, 32, 83, 79, 79, 78, 69, 82, 44, 32, 70, 76, 73, 69, 83, 32, 70, 65, 83, 84, 69, 82, 46, 0
str_57:
  .byte 85, 83, 69, 32, 69, 86, 69, 82, 89, 84, 72, 73, 78, 71, 46, 32, 71, 79, 79, 68, 32, 76, 85, 67, 75, 46, 0
str_58:
  .byte 66, 69, 83, 84, 32, 84, 73, 77, 69, 0
str_59:
  .byte 45, 58, 45, 45, 0
str_60:
  .byte 80, 65, 85, 83, 69, 0
str_61:
  .byte 77, 73, 83, 83, 73, 79, 78, 32, 65, 67, 67, 79, 77, 80, 76, 73, 83, 72, 69, 68, 0
str_62:
  .byte 32, 68, 79, 87, 78, 0
str_63:
  .byte 84, 73, 77, 69, 0
str_64:
  .byte 82, 69, 67, 79, 82, 68, 0
str_65:
  .byte 82, 79, 85, 78, 68, 83, 32, 79, 78, 32, 84, 65, 82, 71, 69, 84, 0
str_66:
  .byte 68, 65, 77, 65, 71, 69, 32, 84, 65, 75, 69, 78, 0
str_67:
  .byte 84, 73, 77, 69, 32, 66, 79, 78, 85, 83, 0
str_68:
  .byte 78, 79, 32, 68, 65, 77, 65, 71, 69, 32, 66, 79, 78, 85, 83, 0
str_69:
  .byte 82, 65, 78, 75, 0
str_70:
  .byte 83, 67, 79, 82, 69, 0
str_71:
  .byte 67, 79, 78, 84, 73, 78, 85, 69, 63, 0
str_72:
  .byte 67, 82, 69, 68, 73, 84, 83, 0
str_73:
  .byte 65, 76, 76, 32, 65, 67, 69, 83, 32, 68, 79, 87, 78, 0
str_74:
  .byte 84, 72, 69, 32, 83, 75, 89, 32, 73, 83, 32, 81, 85, 73, 69, 84, 32, 65, 71, 65, 73, 78, 46, 0
str_75:
  .byte 86, 79, 76, 84, 32, 79, 78, 69, 44, 32, 82, 69, 84, 85, 82, 78, 32, 84, 79, 32, 66, 65, 83, 69, 46, 0
str_76:
  .byte 71, 65, 78, 78, 69, 84, 32, 32, 77, 73, 83, 84, 82, 65, 76, 32, 32, 67, 73, 78, 68, 69, 82, 0
str_77:
  .byte 79, 82, 65, 67, 76, 69, 32, 32, 78, 79, 67, 84, 85, 82, 78, 69, 0
str_78:
  .byte 70, 73, 78, 65, 76, 32, 83, 67, 79, 82, 69, 0
str_79:
  .byte 71, 65, 77, 69, 32, 79, 86, 69, 82, 0
str_80:
  .byte 65, 32, 78, 69, 87, 32, 66, 69, 83, 84, 32, 83, 67, 79, 82, 69, 0
str_81:
  .byte 69, 78, 84, 69, 82, 32, 89, 79, 85, 82, 32, 78, 65, 77, 69, 0
  .align 2

  .bank 3
  .org 0xc000
; hud.e16.ts:80 mark(x, y, word) at -O1
;   x in s1
;   y in s2
;   word in s3
mark:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; word
  ; hud.e16.ts:81  if (x < BOX_L || x > BOX_R || y < BOX_T || y > BOX_B) return
  li t0, 52
  blt s1, t0, .L2
  li t0, 268
  blt t0, s1, .L2
  li t0, 18
  blt s2, t0, .L2
  li t0, 200
  bge t0, s2, .L1
.L2:
  ; hud.e16.ts:81  return
  j .return
.L1:
  ; hud.e16.ts:82  spr(x - 4 + shakeX, y - 4 + shakeY, word, S8)
  lw t0, 0x0d02(zero)
  addi t1, s1, -4
  add t1, t1, t0
  lw t0, 0x0d04(zero)
  addi t2, s2, -4
  add t2, t2, t0
  mv a0, t1
  mv a1, t2
  mv a2, s3
  li a3, 0
  call spr
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; hud.e16.ts:88 hudLabels() at -O1
;   k in s1
hudLabels:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; hud.e16.ts:89  say(7, 12, str('SPD'), SL_HUD_TEXT)
  li a0, 7
  li a1, 12
  la a2, str_5
  li a3, 3
  call say
  ; hud.e16.ts:90  say(30, 12, str('ALT'), SL_HUD_TEXT)
  li a0, 30
  li a1, 12
  la a2, str_6
  li a3, 3
  call say
  ; hud.e16.ts:91  say(3, 28, str('RDR'), SL_AMBER)
  li a0, 3
  li a1, 28
  la a2, str_7
  li a3, 4
  call say
  ; hud.e16.ts:92  say(28, 28, str('DMG'), SL_AMBER)
  li a0, 28
  li a1, 28
  la a2, str_8
  li a3, 4
  call say
  ; hud.e16.ts:93  say(15, 29, str('SCORE'), SL_AMBER)
  li a0, 15
  li a1, 29
  la a2, str_9
  li a3, 4
  call say
  ; hud.e16.ts:94  say(15, 31, str('TIME'), SL_AMBER)
  li a0, 15
  li a1, 31
  la a2, str_10
  li a3, 4
  call say
  ; hud.e16.ts:95  say(15, 32, str('TGT'), SL_AMBER)
  li a0, 15
  li a1, 32
  la a2, str_11
  li a3, 4
  call say
  ; hud.e16.ts:96  say(15, 33, aceName(ace), SL_AMBER)
  lw a0, 0x15f2(zero)
  call aceName
  li a1, 33
  mv a2, a0
  li a0, 15
  li a3, 4
  call say
  ; hud.e16.ts:97  say(28, 34, str('M'), SL_AMBER)
  li a0, 28
  li a1, 34
  la a2, str_12
  li a3, 4
  call say
  ; hud.e16.ts:98  say(33, 34, str('F'), SL_AMBER)
  li a0, 33
  li a1, 34
  la a2, str_13
  li a3, 4
  call say
  ; hud.e16.ts:99  say(35, 28, str('%'), SL_AMBER)
  li a0, 35
  li a1, 28
  la a2, str_14
  li a3, 4
  call say
  ; hud.e16.ts:100  let k: u16 = 0
  li s1, 0 ; k
  ; hud.e16.ts:101  while (k < 12) {
  j .L3
.L1:
  ; hud.e16.ts:102  shown[k] = 0xffff
  slli t0, s1, 1
  li t1, 65535
  sw t1, shown(t0)
  ; hud.e16.ts:103  k++
  addi s1, s1, 1
.L3:
  li t0, 12
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; hud.e16.ts:113 showNumber(k, v, cell, form) at -O1
;   k in s2
;   v in s1
;   cell in s0
;   form in s3
showNumber:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s0, 6(sp)
  sw s3, 8(sp)
  mv s2, a0 ; k
  mv s1, a1 ; v
  mv s0, a2 ; cell
  mv s3, a3 ; form
  ; hud.e16.ts:114  if (shown[k] === v) return
  slli t0, s2, 1
  lw t0, shown(t0)
  bne t0, s1, .L1
  ; hud.e16.ts:114  return
  j .return
.L1:
  ; hud.e16.ts:115  shown[k] = v
  slli t0, s2, 1
  sw s1, shown(t0)
  ; hud.e16.ts:116  sayNumber(cell, v, form & 255, form >> 8)
  andi t0, s3, 255
  srli t1, s3, 8
  mv a0, s0
  mv a1, s1
  mv a2, t0
  mv a3, t1
  call sayNumber
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw s3, 8(sp)
  addi sp, sp, 10
  ret

; hud.e16.ts:120 hudNumbers(damage, missiles, flares, seconds) at -O1
;   damage in s1
;   missiles in s2
;   flares in s3
;   seconds in s0
hudNumbers:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; damage
  mv s2, a1 ; missiles
  mv s3, a2 ; flares
  mv s0, a3 ; seconds
  ; hud.e16.ts:122  numTick++
  lw t0, 0x1af4(zero)
  addi t0, t0, 1
  sw t0, 0x1af4(zero)
  ; hud.e16.ts:123  if ((numTick & 3) === 0) {
  andi t0, t0, 3
  bne t0, zero, .L1
  ; hud.e16.ts:124  showNumber(0, u16(pSpeed) * 2 - (u16(pSpeed) >> 2), cellXY(6, 13), 4 | (SL_HUD_TEXT << 8))
  lw t0, 0x15b0(zero)
  slli t0, t0, 1
  lw t1, 0x15b0(zero)
  srli t1, t1, 2
  sub t0, t0, t1
  li a0, 0
  mv a1, t0
  li a2, 838
  li a3, 772
  call showNumber
  ; hud.e16.ts:125  showNumber(1, pAlt < 0 ? 0 : u16(pAlt) * 2, cellXY(29, 13), 5 | (SL_HUD_TEXT << 8))
  lw t1, 0x15b2(zero)
  li t0, 1
  li t2, 0
  bge t1, t2, .L2
  li t1, 0
  j .L3
.L2:
  lw t1, 0x15b2(zero)
  slli t1, t1, 1
.L3:
  mv a0, t0
  mv a1, t1
  li a2, 861
  li a3, 773
  call showNumber
.L1:
  ; hud.e16.ts:127  headingSay()
  call headingSay
  ; hud.e16.ts:128  showNumber(3, damage, cellXY(32, 28), 3 | (SL_AMBER << 8))
  li a0, 3
  mv a1, s1
  li a2, 1824
  li a3, 1027
  call showNumber
  ; hud.e16.ts:129  showNumber(4, missiles, cellXY(29, 34), 2 | (SL_AMBER << 8))
  li a0, 4
  mv a1, s2
  li a2, 2205
  li a3, 1026
  call showNumber
  ; hud.e16.ts:130  showNumber(5, flares, cellXY(34, 34), 2 | (SL_AMBER << 8))
  li a0, 5
  mv a1, s3
  li a2, 2210
  li a3, 1026
  call showNumber
  ; hud.e16.ts:131  showNumber(6, seconds, cellXY(20, 31), 3 | (SL_AMBER << 8))
  li a0, 6
  mv a1, s0
  li a2, 2004
  li a3, 1027
  call showNumber
  ; hud.e16.ts:132  targetBar()
  call targetBar
  ; hud.e16.ts:133  throttleSay()
  call throttleSay
  ; hud.e16.ts:134  damageColour(damage)
  mv a0, s1
  call damageColour
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; hud.e16.ts:138 headingSay() at -O1
headingSay:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; hud.e16.ts:139  if (shown[2] === heading) return
  lw t0, shown+4(zero)
  lw t1, 0x1b0e(zero)
  bne t0, t1, .L1
  ; hud.e16.ts:139  return
  j .return
.L1:
  ; hud.e16.ts:140  shown[2] = heading
  lw t0, 0x1b0e(zero)
  sw t0, shown+4(zero)
  ; hud.e16.ts:141  sayChar(19, 3, 48 + div(heading, 100), SL_HUD_TEXT)
  lw t0, 0x1b0e(zero)
  li t1, 100
  divu t0, t0, t1
  li a0, 19
  li a1, 3
  addi a2, t0, 48
  li a3, 3
  call sayChar
  ; hud.e16.ts:142  sayChar(20, 3, 48 + (div(heading, 10) % 10), SL_HUD_TEXT)
  lw t0, 0x1b0e(zero)
  li t1, 10
  divu t0, t0, t1
  li t1, 10
  remu t0, t0, t1
  li a0, 20
  li a1, 3
  addi a2, t0, 48
  li a3, 3
  call sayChar
  ; hud.e16.ts:143  sayChar(21, 3, 48 + (heading % 10), SL_HUD_TEXT)
  lw t0, 0x1b0e(zero)
  li t1, 10
  remu t0, t0, t1
  li a0, 21
  li a1, 3
  addi a2, t0, 48
  li a3, 3
  call sayChar
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; hud.e16.ts:147 targetBar() at -O1
;   n in s2
;   k in s1
targetBar:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; hud.e16.ts:148  const n = eHPMax > 0 ? u16(div(u16(eHP) * 8 + u16(eHPMax) - 1, u16(eHPMax))) : 0
  lw t0, 0x15f6(zero)
  bge zero, t0, .L1
  lw t0, 0x15f4(zero)
  slli t0, t0, 3
  lw t1, 0x15f6(zero)
  add t0, t0, t1
  lw t1, 0x15f6(zero)
  addi t0, t0, -1
  divu t0, t0, t1
  j .L2
.L1:
  li t0, 0
.L2:
  mv s2, t0 ; n
  ; hud.e16.ts:149  if (shown[7] === n) return
  lw t0, shown+14(zero)
  bne t0, s2, .L3
  ; hud.e16.ts:149  return
  j .return
.L3:
  ; hud.e16.ts:150  shown[7] = n
  sw s2, shown+14(zero)
  ; hud.e16.ts:151  let k: u16 = 0
  li s1, 0 ; k
  ; hud.e16.ts:152  while (k < 8) {
  j .L6
.L4:
  ; hud.e16.ts:153  sayChar(19 + k, 32, k < n ? 35 : 45, k < n && n <= 2 ? SL_RED : SL_AMBER)
  addi t0, s1, 19
  li t1, 32
  mv t2, s1
  mv t3, s2
  bgeu t2, t3, .L8
  li t2, 35
  j .L9
.L8:
  li t2, 45
.L9:
  mv t3, s1
  mv a1, s2
  bgeu t3, a1, .L10
  mv t3, s2
  li a1, 2
  bltu a1, t3, .L10
  li t3, 5
  j .L11
.L10:
  li t3, 4
.L11:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call sayChar
  ; hud.e16.ts:154  k++
  addi s1, s1, 1
.L6:
  li t0, 8
  bltu s1, t0, .L4
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; hud.e16.ts:159 hudScore(hi, lo) at -O1
;   hi in s1
;   lo in s2
hudScore:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; hi
  mv s2, a1 ; lo
  ; hud.e16.ts:160  if (shown[8] === lo && shown[9] === hi) return
  lw t0, shown+16(zero)
  bne t0, s2, .L1
  lw t0, shown+18(zero)
  bne t0, s1, .L1
  ; hud.e16.ts:160  return
  j .return
.L1:
  ; hud.e16.ts:161  shown[8] = lo
  sw s2, shown+16(zero)
  ; hud.e16.ts:162  shown[9] = hi
  sw s1, shown+18(zero)
  ; hud.e16.ts:163  if (hi > 0) {
  bgeu zero, s1, .L2
  ; hud.e16.ts:164  sayNumber(cellXY(15, 30), hi, 4, SL_AMBER)
  li a0, 1935
  mv a1, s1
  li a2, 4
  li a3, 4
  call sayNumber
  ; hud.e16.ts:165  zeros(19, 30, lo)
  li a0, 19
  li a1, 30
  mv a2, s2
  call zeros
  j .L3
.L2:
  ; hud.e16.ts:167  sayChar(15, 30, 32, SL_AMBER)
  li a0, 15
  li a1, 30
  li a2, 32
  li a3, 4
  call sayChar
  ; hud.e16.ts:168  sayChar(16, 30, 32, SL_AMBER)
  li a0, 16
  li a1, 30
  li a2, 32
  li a3, 4
  call sayChar
  ; hud.e16.ts:169  sayChar(17, 30, 32, SL_AMBER)
  li a0, 17
  li a1, 30
  li a2, 32
  li a3, 4
  call sayChar
  ; hud.e16.ts:170  sayChar(18, 30, 32, SL_AMBER)
  li a0, 18
  li a1, 30
  li a2, 32
  li a3, 4
  call sayChar
  ; hud.e16.ts:171  sayNumber(cellXY(19, 30), lo, 4, SL_AMBER)
  li a0, 1939
  mv a1, s2
  li a2, 4
  li a3, 4
  call sayNumber
.L3:
  ; hud.e16.ts:173  sayChar(23, 30, 48, SL_AMBER)
  li a0, 23
  li a1, 30
  li a2, 48
  li a3, 4
  call sayChar
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; hud.e16.ts:177 zeros(x, y, lo) at -O1
;   x in s1
;   y in s2
;   lo in s3
zeros:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; lo
  ; hud.e16.ts:178  sayChar(x, y, 48 + div(lo, 1000), SL_AMBER)
  li t0, 1000
  divu t0, s3, t0
  mv a0, s1
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
  ; hud.e16.ts:179  sayChar(x + 1, y, 48 + (div(lo, 100) % 10), SL_AMBER)
  li t0, 100
  divu t0, s3, t0
  li t1, 10
  remu t0, t0, t1
  addi a0, s1, 1
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
  ; hud.e16.ts:180  sayChar(x + 2, y, 48 + (div(lo, 10) % 10), SL_AMBER)
  li t0, 10
  divu t0, s3, t0
  li t1, 10
  remu t0, t0, t1
  addi a0, s1, 2
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
  ; hud.e16.ts:181  sayChar(x + 3, y, 48 + (lo % 10), SL_AMBER)
  li t0, 10
  remu t0, s3, t0
  addi a0, s1, 3
  mv a1, s2
  addi a2, t0, 48
  li a3, 4
  call sayChar
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; hud.e16.ts:184 throttleSay() at -O1
throttleSay:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; hud.e16.ts:185  if (shown[10] === throttle) return
  lw t0, shown+20(zero)
  lw t1, 0x15ba(zero)
  bne t0, t1, .L1
  ; hud.e16.ts:185  return
  j .return
.L1:
  ; hud.e16.ts:186  shown[10] = throttle
  lw t0, 0x15ba(zero)
  sw t0, shown+20(zero)
  ; hud.e16.ts:187  if (throttle === 1) say(7, 14, str('AB '), SL_RED)
  lw t0, 0x15ba(zero)
  li t1, 1
  bne t0, t1, .L2
  ; hud.e16.ts:187  say(7, 14, str('AB '), SL_RED)
  li a0, 7
  li a1, 14
  la a2, str_15
  li a3, 5
  call say
  j .L3
.L2:
  ; hud.e16.ts:188  if (throttle === 2) say(7, 14, str('BRK'), SL_HUD_TEXT)
  lw t0, 0x15ba(zero)
  li t1, 2
  bne t0, t1, .L4
  ; hud.e16.ts:188  say(7, 14, str('BRK'), SL_HUD_TEXT)
  li a0, 7
  li a1, 14
  la a2, str_16
  li a3, 3
  call say
  j .L5
.L4:
  ; hud.e16.ts:189  unsay(7, 14, 3)
  li a0, 7
  li a1, 14
  li a2, 3
  call unsay
.L5:
.L3:
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; hud.e16.ts:193 damageColour(damage) at -O1
;   damage in s2
;   k in s1
damageColour:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; damage
  ; hud.e16.ts:194  const k = damage < 35 ? 0 : damage < 70 ? 1 : 2
  li t0, 35
  bgeu s2, t0, .L1
  li t0, 0
  j .L2
.L1:
  li t0, 70
  bgeu s2, t0, .L3
  li t0, 1
  j .L4
.L3:
  li t0, 2
.L4:
.L2:
  mv s1, t0 ; k
  ; hud.e16.ts:195  if (shown[11] === k) return
  lw t0, shown+22(zero)
  bne t0, s1, .L5
  ; hud.e16.ts:195  return
  j .return
.L5:
  ; hud.e16.ts:196  shown[11] = k
  sw s1, shown+22(zero)
  ; hud.e16.ts:197  colour(SL_SCREEN, 15, k === 0 ? 0x3308 : k === 1 ? 0x1b7f : 0x18df)
  li t0, 2
  li t1, 15
  mv t2, s1
  li t3, 0
  bne t2, t3, .L6
  li t2, 13064
  j .L7
.L6:
  mv t2, s1
  li t3, 1
  bne t2, t3, .L8
  li t2, 7039
  j .L9
.L8:
  li t2, 6367
.L9:
.L7:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call colour
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; hud.e16.ts:203 lamps(frame, low) at -O1
;   frame in s2
;   low in s3
;   blink in s1
lamps:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  mv s2, a0 ; frame
  mv s3, a1 ; low
  ; hud.e16.ts:204  const blink = (frame & 8) !== 0
  andi t0, s2, 8
  sub t0, t0, zero
  snez s1, t0
  ; hud.e16.ts:205  colour(SL_FRAME, 13, warned && blink ? 0x18df : 0x0848)
  lw t0, 0x18d0(zero)
  li t1, 13
  mv t2, t0
  li t0, 1
  beqz t2, .L1
  mv t2, s1
  beqz t2, .L1
  li t2, 6367
  j .L2
.L1:
  li t2, 2120
.L2:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call colour
  ; hud.e16.ts:206  colour(SL_FRAME, 14, low && blink ? 0x1adf : 0x08c8)
  li t0, 1
  li t1, 14
  mv t2, s3
  beqz t2, .L3
  mv t2, s1
  beqz t2, .L3
  li t2, 6879
  j .L4
.L3:
  li t2, 2248
.L4:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call colour
  ; hud.e16.ts:207  colour(SL_FRAME, 15, locked ? 0x3bc8 : 0x0cc2)
  lw t0, 0x1926(zero)
  li t1, 15
  mv t2, t0
  li t0, 1
  beqz t2, .L5
  li t2, 15304
  j .L6
.L5:
  li t2, 3266
.L6:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  call colour
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; hud.e16.ts:213 hudDraw(frame, low) at -O1
;   frame in s1
;   low in s2
hudDraw:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; frame
  mv s2, a1 ; low
  ; hud.e16.ts:214  heading = headingDegrees()
  call headingDegrees
  sw a0, 0x1b0e(zero)
  ; hud.e16.ts:215  spr(CX - 8 + shakeX, CY - 8 + shakeY, HUD16_TILE | GREEN, S16)
  lw t0, 0x0d02(zero)
  lw t1, 0x0d04(zero)
  addi a0, t0, 152
  addi a1, t1, 104
  li a2, 285
  li a3, 1
  call spr
  ; hud.e16.ts:216  warnings(frame, low)
  mv a0, s1
  mv a1, s2
  call warnings
  ; hud.e16.ts:217  lockDraw(frame)
  mv a0, s1
  call lockDraw
  ; hud.e16.ts:218  targetDraw()
  call targetDraw
  ; hud.e16.ts:219  headingTape()
  call headingTape
  ; hud.e16.ts:220  ladder()
  call ladder
  ; hud.e16.ts:221  radar()
  call radar
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; hud.e16.ts:228 headingTape() at -O1
;   h in s2
;   off in s3
;   k in s1
headingTape:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s1, 6(sp)
  ; hud.e16.ts:229  const h = heading
  lw s2, 0x1b0e(zero)
  ; hud.e16.ts:230  const off = i16(h % 5) * 2
  li t0, 5
  remu t0, s2, t0
  slli s3, t0, 1
  ; hud.e16.ts:231  let k: i16 = -4
  li s1, 65532 ; k
  ; hud.e16.ts:232  while (k <= 4) {
  j .L3
.L1:
  ; hud.e16.ts:233  mark(i16(CX) + k * 10 - off, 30, (HUD8_TILE + 17) | GREEN)
  slli t1, s1, 3
  slli t0, s1, 1
  add t0, t0, t1
  addi t0, t0, 160
  sub a0, t0, s3
  li a1, 30
  li a2, 278
  call mark
  ; hud.e16.ts:234  k++
  addi s1, s1, 1
.L3:
  li t0, 4
  bge t0, s1, .L1
  ; hud.e16.ts:236  mark(i16(CX), 38, (HUD8_TILE + 18) | GREEN)
  li a0, 160
  li a1, 38
  li a2, 279
  call mark
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s1, 6(sp)
  addi sp, sp, 8
  ret

; hud.e16.ts:242 hudInit() at -O1
hudInit:
  ; hud.e16.ts:243  rungSin[0] = 0
  sw zero, rungSin(zero)
  ; hud.e16.ts:244  rungSin[1] = 2845
  li t0, 2845
  sw t0, rungSin+2(zero)
  ; hud.e16.ts:245  rungSin[2] = 5604
  li t0, 5604
  sw t0, rungSin+4(zero)
  ; hud.e16.ts:246  rungSin[3] = 8192
  li t0, 8192
  sw t0, rungSin+6(zero)
  ; hud.e16.ts:247  rungSin[4] = 10531
  li t0, 10531
  sw t0, rungSin+8(zero)
  ; hud.e16.ts:248  rungSin[5] = 12551
  li t0, 12551
  sw t0, rungSin+10(zero)
  ; hud.e16.ts:249  rungSin[6] = 14189
  li t0, 14189
  sw t0, rungSin+12(zero)
  ; hud.e16.ts:250  rungSin[7] = 15396
  li t0, 15396
  sw t0, rungSin+14(zero)
  ; hud.e16.ts:251  rungSin[8] = 16135
  li t0, 16135
  sw t0, rungSin+16(zero)
  ; hud.e16.ts:252  rungSin[9] = 16384
  li t0, 16384
  sw t0, rungSin+18(zero)
  ; hud.e16.ts:253  stepMinor[0] = 0
  sw zero, stepMinor(zero)
  ; hud.e16.ts:254  stepMinor[1] = 1
  li t0, 1
  sw t0, stepMinor+2(zero)
  ; hud.e16.ts:255  stepMinor[2] = 2
  li t0, 2
  sw t0, stepMinor+4(zero)
  ; hud.e16.ts:256  stepMinor[3] = 2
  li t0, 2
  sw t0, stepMinor+6(zero)
  ; hud.e16.ts:257  stepMinor[4] = 3
  li t0, 3
  sw t0, stepMinor+8(zero)
  ; hud.e16.ts:258  stepMinor[5] = 4
  li t0, 4
  sw t0, stepMinor+10(zero)
  ; hud.e16.ts:259  stepMinor[6] = 5
  li t0, 5
  sw t0, stepMinor+12(zero)
  ; hud.e16.ts:260  stepMinor[7] = 7
  li t0, 7
  sw t0, stepMinor+14(zero)
  ; hud.e16.ts:261  stepMinor[8] = 8
  li t0, 8
  sw t0, stepMinor+16(zero)
.return:
  ret

; hud.e16.ts:270 ladder() at -O1
;   tx in 4(fp)
;   ty in 6(fp)
;   k in 8(fp)
;   fz in 0(fp)
;   near in s1
;   e in s2
;   last in 10(fp)
;   d in s3
;   c in 2(fp)
ladder:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s1, 14(sp)
  sw s2, 16(sp)
  sw s3, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  ; hud.e16.ts:271  if (hL < 1024) return
  lw t0, 0x15a4(zero)
  li t1, 1024
  bge t0, t1, .L1
  ; hud.e16.ts:271  return
  j .return
.L1:
  ; hud.e16.ts:272  const tx = -hNY
  lw t0, 0x15a0(zero)
  neg t0, t0
  sw t0, 4(fp) ; tx
  ; hud.e16.ts:273  const ty = hNX
  lw t0, 0x159e(zero)
  sw t0, 6(fp) ; ty
  ; hud.e16.ts:274  ladderStep(tx, ty)
  lw a0, 4(fp)
  lw a1, 6(fp)
  call ladderStep
  ; hud.e16.ts:275  const k = muldiv(192, 16384, u16(hL))
  lw t0, 0x15a4(zero)
  li a0, 192
  li a1, 16384
  mv a2, t0
  call muldiv
  sw a0, 8(fp) ; k
  ; hud.e16.ts:276  const fz = vget(V_PF + 2)
  li a0, 2
  call vget
  sw a0, 0(fp) ; fz
  ; hud.e16.ts:278  let near: i16 = -9
  li s1, 65527 ; near
  ; hud.e16.ts:279  while (near < 9 && fz > (rungSinOf(near) + rungSinOf(near + 1)) >> 1) near++
  j .L4
.L2:
  ; hud.e16.ts:279  near++
  addi s1, s1, 1
.L4:
  li t0, 9
  bge s1, t0, .L6
  mv a0, s1
  call rungSinOf
  addi sp, sp, -2
  sw a0, 0(sp)
  addi a0, s1, 1
  call rungSinOf
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  srai t0, t0, 1
  lw t1, 0(fp) ; fz
  blt t0, t1, .L2
.L6:
  ; hud.e16.ts:280  let e: i16 = near < -8 ? -9 : near - 1
  li t0, 65528
  bge s1, t0, .L7
  li t0, 65527
  j .L8
.L7:
  addi t0, s1, -1
.L8:
  mv s2, t0 ; e
  ; hud.e16.ts:281  const last: i16 = near > 8 ? 9 : near + 1
  li t0, 8
  bge t0, s1, .L9
  li t0, 9
  j .L10
.L9:
  addi t0, s1, 1
.L10:
  sw t0, 10(fp) ; last
  ; hud.e16.ts:282  while (e <= last) {
  j .L13
.L11:
  ; hud.e16.ts:283  let d = fz - rungSinOf(e)
  mv a0, s2
  call rungSinOf
  lw t0, 0(fp) ; fz
  sub s3, t0, a0
  ; hud.e16.ts:284  if (d > 16000) d = 16000
  li t0, 16000
  bge t0, s3, .L15
  ; hud.e16.ts:284  d = 16000
  li s3, 16000 ; d
.L15:
  ; hud.e16.ts:285  if (d < -16000) d = -16000
  li t0, 49536
  bge s3, t0, .L16
  ; hud.e16.ts:285  d = -16000
  li s3, 49536 ; d
.L16:
  ; hud.e16.ts:286  const c = mulq(d, i16(k))
  mv a0, s3
  lw a1, 8(fp)
  call mulq
  sw a0, 2(fp) ; c
  ; hud.e16.ts:287  if (abs16(c) < 100) rung(e, c)
  lw a0, 2(fp)
  call abs16
  li t0, 100
  bge a0, t0, .L17
  ; hud.e16.ts:287  rung(e, c)
  mv a0, s2
  lw a1, 2(fp)
  call rung
.L17:
  ; hud.e16.ts:288  e++
  addi s2, s2, 1
.L13:
  lw t0, 10(fp) ; last
  bge t0, s2, .L11
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s1, 14(sp)
  lw s2, 16(sp)
  lw s3, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; hud.e16.ts:292 rungSinOf(e) at -O1
;   e in a0
rungSinOf:
  ; hud.e16.ts:293  return e < 0 ? -i16(rungSin[u16(-e)]) : i16(rungSin[u16(e)])
  bge a0, zero, .L1
  neg t0, a0
  slli t0, t0, 1
  lw t0, rungSin(t0)
  neg t0, t0
  j .L2
.L1:
  slli t0, a0, 1
  lw t0, rungSin(t0)
.L2:
  mv a0, t0
.return:
  ret

; hud.e16.ts:299 ladderStep(tx, ty) at -O1
;   tx in s2
;   ty in s3
;   a in 4(fp)
;   k in s1
;   sx in 0(fp)
;   sy in 2(fp)
ladderStep:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s1, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s2, a0 ; tx
  mv s3, a1 ; ty
  ; hud.e16.ts:300  const a = (256 - aim(tx, ty)) & 127
  mv a0, s2
  mv a1, s3
  call aim
  li t0, 256
  sub t0, t0, a0
  andi t0, t0, 127
  sw t0, 4(fp) ; a
  ; hud.e16.ts:301  const k = (a + 2) >> 2
  lw t0, 4(fp) ; a
  addi t0, t0, 2
  srli s1, t0, 2
  ; hud.e16.ts:302  segWord = (k <= 16 ? HUD8_TILE + k : (HUD8_TILE + 32 - k) | FLIP_H) | GREEN
  li t0, 16
  bltu t0, s1, .L1
  addi t0, s1, 261
  j .L2
.L1:
  li t0, 293
  sub t0, t0, s1
  li t1, 8192
  or t0, t0, t1
.L2:
  sw t0, 0x1b28(zero)
  ; hud.e16.ts:304  const sx: i16 = tx < 0 ? -1 : 1
  bge s2, zero, .L3
  li t0, 65535
  j .L4
.L3:
  li t0, 1
.L4:
  sw t0, 0(fp) ; sx
  ; hud.e16.ts:305  const sy: i16 = ty < 0 ? -1 : 1
  bge s3, zero, .L5
  li t0, 65535
  j .L6
.L5:
  li t0, 1
.L6:
  sw t0, 2(fp) ; sy
  ; hud.e16.ts:306  if (k <= 8 || k >= 24) {
  li t0, 8
  bgeu t0, s1, .L8
  li t0, 24
  bltu s1, t0, .L7
.L8:
  ; hud.e16.ts:307  stepX = sx * 8
  lw t0, 0(fp) ; sx
  slli t0, t0, 3
  sw t0, 0x1b24(zero)
  ; hud.e16.ts:308  stepY = sy * i16(stepMinor[k <= 8 ? k : 32 - k])
  lw t0, 2(fp)
  la t1, stepMinor
  mv t2, s1
  li t3, 8
  bltu t3, t2, .L9
  mv t2, s1
  j .L10
.L9:
  li t2, 32
  sub t2, t2, s1
.L10:
  slli t2, t2, 1
  add t1, t1, t2
  lw t1, 0(t1)
  mul t0, t0, t1
  sw t0, 0x1b26(zero)
  j .L11
.L7:
  ; hud.e16.ts:310  stepY = sy * 8
  lw t0, 2(fp) ; sy
  slli t0, t0, 3
  sw t0, 0x1b26(zero)
  ; hud.e16.ts:311  stepX = sx * i16(stepMinor[k <= 16 ? 16 - k : k - 16])
  lw t0, 0(fp)
  la t1, stepMinor
  mv t2, s1
  li t3, 16
  bltu t3, t2, .L12
  li t2, 16
  sub t2, t2, s1
  j .L13
.L12:
  addi t2, s1, -16
.L13:
  slli t2, t2, 1
  add t1, t1, t2
  lw t1, 0(t1)
  mul t0, t0, t1
  sw t0, 0x1b24(zero)
.L11:
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s1, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; hud.e16.ts:316 rung(e, c) at -O1
;   e in s2
;   c in 2(fp)
;   x0 in s3
;   y0 in 0(fp)
;   last in 8(fp)
;   j in s1
;   n in 10(fp)
;   lx in 4(fp)
;   ly in 6(fp)
rung:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  sw s1, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s2, a0 ; e
  sw a1, 2(fp) ; c
  ; hud.e16.ts:317  const x0 = i16(CX) - ((hNX * c) >> 8)
  lw t0, 0x159e(zero)
  lw t1, 2(fp) ; c
  mul t0, t0, t1
  srai t0, t0, 8
  li t1, 160
  sub s3, t1, t0
  ; hud.e16.ts:318  const y0 = i16(CY) - ((hNY * c) >> 8)
  lw t0, 0x15a0(zero)
  lw t1, 2(fp) ; c
  mul t0, t0, t1
  srai t0, t0, 8
  li t1, 112
  sub t1, t1, t0
  sw t1, 0(fp) ; y0
  ; hud.e16.ts:319  const last: i16 = e === 0 ? 8 : 4
  bne s2, zero, .L1
  li t0, 8
  j .L2
.L1:
  li t0, 4
.L2:
  sw t0, 8(fp) ; last
  ; hud.e16.ts:320  let j: i16 = 2
  li s1, 2 ; j
  ; hud.e16.ts:321  while (j <= last) {
  j .L5
.L3:
  ; hud.e16.ts:322  if (e >= 0 || (j & 1) === 0) {
  bge s2, zero, .L8
  andi t0, s1, 1
  bne t0, zero, .L7
.L8:
  ; hud.e16.ts:323  mark(x0 + stepX * j, y0 + stepY * j, segWord)
  lw t0, 0x1b24(zero)
  mul t0, t0, s1
  add t0, s3, t0
  lw t1, 0x1b26(zero)
  mul t1, t1, s1
  lw t2, 0(fp) ; y0
  add t2, t2, t1
  lw t1, 0x1b28(zero)
  mv a0, t0
  mv a1, t2
  mv a2, t1
  call mark
  ; hud.e16.ts:324  mark(x0 - stepX * j, y0 - stepY * j, segWord)
  lw t0, 0x1b24(zero)
  mul t0, t0, s1
  sub t0, s3, t0
  lw t1, 0x1b26(zero)
  mul t1, t1, s1
  lw t2, 0(fp) ; y0
  sub t2, t2, t1
  lw t1, 0x1b28(zero)
  mv a0, t0
  mv a1, t2
  mv a2, t1
  call mark
.L7:
  ; hud.e16.ts:326  j++
  addi s1, s1, 1
.L5:
  lw t0, 8(fp) ; last
  bge t0, s1, .L3
  ; hud.e16.ts:328  if (e === 0) return
  bne s2, zero, .L9
  ; hud.e16.ts:328  return
  j .return
.L9:
  ; hud.e16.ts:330  const n = u16(abs16(e))
  mv a0, s2
  call abs16
  sw a0, 10(fp) ; n
  ; hud.e16.ts:331  const lx = x0 + stepX * 6
  lw t0, 0x1b24(zero)
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  add t0, s3, t0
  sw t0, 4(fp) ; lx
  ; hud.e16.ts:332  const ly = y0 + stepY * 6
  lw t0, 0x1b26(zero)
  slli t1, t0, 2
  slli t0, t0, 1
  add t0, t0, t1
  lw t1, 0(fp) ; y0
  add t1, t1, t0
  sw t1, 6(fp) ; ly
  ; hud.e16.ts:333  mark(lx, ly, (FONT_TILE + 16 + n) | GREEN)
  lw t0, 10(fp) ; n
  lw a0, 4(fp)
  lw a1, 6(fp)
  addi a2, t0, 16
  call mark
  ; hud.e16.ts:334  mark(lx + 8, ly, (FONT_TILE + 16) | GREEN)
  lw t0, 4(fp) ; lx
  addi a0, t0, 8
  lw a1, 6(fp)
  li a2, 16
  call mark
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  lw s1, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; hud.e16.ts:338 targetDraw() at -O1
;   half in s1
;   pal in s2
;   x in s3
;   y in s0
targetDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; hud.e16.ts:339  if (!eAlive) return
  lw t0, 0x1600(zero)
  bnez t0, .L1
  ; hud.e16.ts:339  return
  j .return
.L1:
  ; hud.e16.ts:340  if (!eOn) {
  lw t0, 0x1618(zero)
  bnez t0, .L2
  ; hud.e16.ts:341  arrowDraw()
  call arrowDraw
  ; hud.e16.ts:342  return
  j .return
.L2:
  ; hud.e16.ts:344  let half = i16(eSize >> 1) + 4
  lw t0, 0x161a(zero)
  srli t0, t0, 1
  addi s1, t0, 4
  ; hud.e16.ts:345  if (half < 10) half = 10
  li t0, 10
  bge s1, t0, .L3
  ; hud.e16.ts:345  half = 10
  li s1, 10 ; half
.L3:
  ; hud.e16.ts:346  if (half > 36) half = 36
  li t0, 36
  bge t0, s1, .L4
  ; hud.e16.ts:346  half = 36
  li s1, 36 ; half
.L4:
  ; hud.e16.ts:347  if (!abovePanel(eSY, half + 10)) return
  lw a0, 0x1616(zero)
  addi a1, s1, 10
  call abovePanel
  bnez a0, .L5
  ; hud.e16.ts:347  return
  j .return
.L5:
  ; hud.e16.ts:348  const pal = locked ? RED : GREEN
  lw t0, 0x1926(zero)
  beqz t0, .L6
  li t0, 5120
  j .L7
.L6:
  li t0, 0
.L7:
  mv s2, t0 ; pal
  ; hud.e16.ts:349  const corner = HUD8_TILE + 19
  ; hud.e16.ts:350  const x = eSX
  lw s3, 0x1614(zero)
  ; hud.e16.ts:351  const y = eSY
  lw s0, 0x1616(zero)
  ; hud.e16.ts:352  spr(x - half, y - half, corner | pal, S8)
  sub t0, s3, s1
  sub t1, s0, s1
  li t2, 280
  or t2, t2, s2
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 0
  call spr
  ; hud.e16.ts:353  spr(x + half - 8, y - half, corner | pal | FLIP_H, S8)
  add t0, s3, s1
  sub t1, s0, s1
  li t2, 280
  or t2, t2, s2
  li t3, 8192
  or t2, t2, t3
  addi a0, t0, -8
  mv a1, t1
  mv a2, t2
  li a3, 0
  call spr
  ; hud.e16.ts:354  spr(x - half, y + half - 8, corner | pal | FLIP_V, S8)
  sub t0, s3, s1
  add t1, s0, s1
  li t2, 280
  or t2, t2, s2
  li t3, 16384
  or t2, t2, t3
  mv a0, t0
  addi a1, t1, -8
  mv a2, t2
  li a3, 0
  call spr
  ; hud.e16.ts:355  spr(x + half - 8, y + half - 8, corner | pal | FLIP_H | FLIP_V, S8)
  add t0, s3, s1
  add t1, s0, s1
  li t2, 280
  or t2, t2, s2
  li t3, 8192
  or t2, t2, t3
  li t3, 16384
  or t2, t2, t3
  addi a0, t0, -8
  addi a1, t1, -8
  mv a2, t2
  li a3, 0
  call spr
  ; hud.e16.ts:356  if (eDist > 2000) return
  lw t0, 0x161c(zero)
  li t1, 2000
  bgeu t1, t0, .L8
  ; hud.e16.ts:356  return
  j .return
.L8:
  ; hud.e16.ts:357  nameDraw(x - half, y + half + 2, pal)
  sub t0, s3, s1
  add t1, s0, s1
  mv a0, t0
  addi a1, t1, 2
  mv a2, s2
  call nameDraw
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; hud.e16.ts:361 nameDraw(x, y, pal) at -O1
;   x in 0(fp)
;   y in 2(fp)
;   pal in 4(fp)
;   s in s3
;   k in s1
;   c in s2
nameDraw:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 0(fp) ; x
  sw a1, 2(fp) ; y
  sw a2, 4(fp) ; pal
  ; hud.e16.ts:362  const s = aceName(ace)
  lw a0, 0x15f2(zero)
  call aceName
  mv s3, a0 ; s
  ; hud.e16.ts:363  let k: u16 = 0
  li s1, 0 ; k
  ; hud.e16.ts:364  let c = peek(s)
  lbu s2, 0(s3)
  ; hud.e16.ts:365  while (c !== 0) {
  j .L3
.L1:
  ; hud.e16.ts:366  spr(x + i16(k) * 8, y, (FONT_TILE + c - 32) | pal, S8)
  slli t0, s1, 3
  lw t1, 0(fp) ; x
  add t1, t1, t0
  lw t0, 4(fp) ; pal
  addi t2, s2, -32
  or t2, t2, t0
  mv a0, t1
  lw a1, 2(fp)
  mv a2, t2
  li a3, 0
  call spr
  ; hud.e16.ts:367  k++
  addi s1, s1, 1
  ; hud.e16.ts:368  c = peek(s + k)
  add t0, s3, s1
  lbu s2, 0(t0)
.L3:
  bne s2, zero, .L1
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; hud.e16.ts:373 arrowDraw() at -O1
;   x in s3
;   y in s2
;   a in 4(fp)
;   px in 6(fp)
;   py in 8(fp)
;   d in s1
;   t in 0(fp)
;   flips in 2(fp)
arrowDraw:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s3, 12(sp)
  sw s2, 14(sp)
  sw s1, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  ; hud.e16.ts:374  let x = eBX
  lw s3, 0x160e(zero)
  ; hud.e16.ts:375  let y = -eBY
  lw t0, 0x1610(zero)
  neg s2, t0
  ; hud.e16.ts:376  while (abs16(x) >= 200 || abs16(y) >= 200) {
  j .L3
.L1:
  ; hud.e16.ts:377  x = x >> 1
  srai s3, s3, 1
  ; hud.e16.ts:378  y = y >> 1
  srai s2, s2, 1
.L3:
  mv a0, s3
  call abs16
  li t0, 200
  bge a0, t0, .L1
  mv a0, s2
  call abs16
  li t0, 200
  bge a0, t0, .L1
  ; hud.e16.ts:380  if (x === 0 && y === 0) y = 1
  bne s3, zero, .L5
  bne s2, zero, .L5
  ; hud.e16.ts:380  y = 1
  li s2, 1 ; y
.L5:
  ; hud.e16.ts:381  const a = aim(x, y)
  mv a0, s3
  mv a1, s2
  call aim
  sw a0, 4(fp) ; a
  ; hud.e16.ts:382  const px = i16(CX) + ((cos(a) * 70) >> 8)
  lw a0, 4(fp)
  call cos
  li t0, 70
  mul t0, a0, t0
  srai t0, t0, 8
  addi t0, t0, 160
  sw t0, 6(fp) ; px
  ; hud.e16.ts:383  const py = i16(CY) + ((sin(a) * 70) >> 8)
  lw a0, 4(fp)
  call sin
  li t0, 70
  mul t0, a0, t0
  srai t0, t0, 8
  addi t0, t0, 112
  sw t0, 8(fp) ; py
  ; hud.e16.ts:384  const d = ((a + 8) >> 4) & 15
  lw t0, 4(fp) ; a
  addi t0, t0, 8
  srli t0, t0, 4
  andi s1, t0, 15
  ; hud.e16.ts:385  let t = d
  sw s1, 0(fp) ; t
  ; hud.e16.ts:386  let flips: u16 = 0
  sw zero, 2(fp) ; flips
  ; hud.e16.ts:387  if (d > 12) {
  li t0, 12
  bgeu t0, s1, .L6
  ; hud.e16.ts:388  t = 16 - d
  li t0, 16
  sub t0, t0, s1
  sw t0, 0(fp) ; t
  ; hud.e16.ts:389  flips = FLIP_V
  li t0, 16384
  sw t0, 2(fp) ; flips
  j .L7
.L6:
  ; hud.e16.ts:390  if (d > 8) {
  li t0, 8
  bgeu t0, s1, .L8
  ; hud.e16.ts:391  t = d - 8
  addi t0, s1, -8
  sw t0, 0(fp) ; t
  ; hud.e16.ts:392  flips = FLIP_H | FLIP_V
  li t0, 24576
  sw t0, 2(fp) ; flips
  j .L9
.L8:
  ; hud.e16.ts:393  if (d > 4) {
  li t0, 4
  bgeu t0, s1, .L10
  ; hud.e16.ts:394  t = 8 - d
  li t0, 8
  sub t0, t0, s1
  sw t0, 0(fp) ; t
  ; hud.e16.ts:395  flips = FLIP_H
  li t0, 8192
  sw t0, 2(fp) ; flips
.L10:
.L9:
.L7:
  ; hud.e16.ts:397  spr(px - 8 + shakeX, py - 8 + shakeY, (HUD16_TILE + 12 + t * 4) | flips | RED, S16)
  lw t0, 6(fp) ; px
  lw t1, 0x0d02(zero)
  addi t0, t0, -8
  add t0, t0, t1
  lw t1, 8(fp) ; py
  lw t2, 0x0d04(zero)
  addi t1, t1, -8
  add t1, t1, t2
  lw t2, 0(fp) ; t
  slli t2, t2, 2
  lw t3, 2(fp) ; flips
  addi t2, t2, 297
  or t2, t2, t3
  ori t2, t2, 5120
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call spr
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s3, 12(sp)
  lw s2, 14(sp)
  lw s1, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; hud.e16.ts:401 lockDraw(frame) at -O1
;   frame in s2
;   f/t in s1
;   x in s3
;   y in s0
lockDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s2, a0 ; frame
  ; hud.e16.ts:402  if (!eAlive || !inSeeker()) return
  lw t0, 0x1600(zero)
  beqz t0, .L2
  la t0, inSeeker
  li t1, 261
  call far_call
  bnez a0, .L1
.L2:
  ; hud.e16.ts:402  return
  j .return
.L1:
  ; hud.e16.ts:403  const q = SEEKER_TILE | GREEN
  ; hud.e16.ts:404  spr(CX - 32 + shakeX, CY - 32 + shakeY, q, S32)
  lw t0, 0x0d02(zero)
  lw t1, 0x0d04(zero)
  addi a0, t0, 128
  addi a1, t1, 80
  li a2, 317
  li a3, 2
  call spr
  ; hud.e16.ts:405  spr(CX + shakeX, CY - 32 + shakeY, q | FLIP_H, S32)
  lw t0, 0x0d02(zero)
  lw t1, 0x0d04(zero)
  addi a0, t0, 160
  addi a1, t1, 80
  li a2, 8509
  li a3, 2
  call spr
  ; hud.e16.ts:406  spr(CX - 32 + shakeX, CY + shakeY, q | FLIP_V, S32)
  lw t0, 0x0d02(zero)
  lw t1, 0x0d04(zero)
  addi a0, t0, 128
  addi a1, t1, 112
  li a2, 16701
  li a3, 2
  call spr
  ; hud.e16.ts:407  spr(CX + shakeX, CY + shakeY, q | FLIP_H | FLIP_V, S32)
  lw t0, 0x0d02(zero)
  lw t1, 0x0d04(zero)
  addi a0, t0, 160
  addi a1, t1, 112
  li a2, 24893
  li a3, 2
  call spr
  ; hud.e16.ts:408  if (locked) {
  lw t0, 0x1926(zero)
  beqz t0, .L3
  ; hud.e16.ts:409  const f = (frame >> 2) & 1
  srli t0, s2, 2
  andi s1, t0, 1
  ; hud.e16.ts:410  spr(eSX - 8, eSY - 8, (HUD16_TILE + 4 + f * 4) | RED, S16)
  lw t0, 0x1614(zero)
  lw t1, 0x1616(zero)
  slli t2, s1, 2
  addi t2, t2, 289
  ori t2, t2, 5120
  addi a0, t0, -8
  addi a1, t1, -8
  mv a2, t2
  li a3, 1
  call spr
  ; hud.e16.ts:411  return
  j .return
.L3:
  ; hud.e16.ts:413  const t = i16(lockT)
  lw s1, 0x1924(zero)
  ; hud.e16.ts:414  const x = i16(CX) + idiv((eSX - i16(CX)) * t, i16(LOCK_FRAMES))
  lw t0, 0x1614(zero)
  addi t0, t0, -160
  mul t0, t0, s1
  li t1, 50
  div t0, t0, t1
  addi s3, t0, 160
  ; hud.e16.ts:415  const y = i16(CY) + idiv((eSY - i16(CY)) * t, i16(LOCK_FRAMES))
  lw t0, 0x1616(zero)
  addi t0, t0, -112
  mul t0, t0, s1
  li t1, 50
  div t0, t0, t1
  addi s0, t0, 112
  ; hud.e16.ts:416  spr(x - 8, y - 8, (HUD16_TILE + 4) | GREEN, S16)
  addi a0, s3, -8
  addi a1, s0, -8
  li a2, 289
  li a3, 1
  call spr
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; hud.e16.ts:420 warnings(frame, low) at -O1
;   frame in s1
;   low in s2
warnings:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  mv s1, a0 ; frame
  mv s2, a1 ; low
  ; hud.e16.ts:421  if ((frame & 8) === 0) return
  andi t0, s1, 8
  bne t0, zero, .L1
  ; hud.e16.ts:421  return
  j .return
.L1:
  ; hud.e16.ts:422  if (warned) words8(132, 170, str('MISSILE'))
  lw t0, 0x18d0(zero)
  beqz t0, .L2
  ; hud.e16.ts:422  words8(132, 170, str('MISSILE'))
  li a0, 132
  li a1, 170
  la a2, str_17
  call words8
.L2:
  ; hud.e16.ts:423  if (low) words8(132, 182, str('PULL UP'))
  beqz s2, .L3
  ; hud.e16.ts:423  words8(132, 182, str('PULL UP'))
  li a0, 132
  li a1, 182
  la a2, str_18
  call words8
.L3:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  addi sp, sp, 6
  ret

; hud.e16.ts:426 words8(x, y, s) at -O1
;   x in 0(fp)
;   y in 2(fp)
;   s in s3
;   k in s1
;   c in s2
words8:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  sw a0, 0(fp) ; x
  sw a1, 2(fp) ; y
  mv s3, a2 ; s
  ; hud.e16.ts:427  let k: u16 = 0
  li s1, 0 ; k
  ; hud.e16.ts:428  let c = peek(s)
  lbu s2, 0(s3)
  ; hud.e16.ts:429  while (c !== 0) {
  j .L3
.L1:
  ; hud.e16.ts:430  if (c !== 32) spr(x + i16(k) * 8 + shakeX, y + shakeY, (FONT_TILE + c - 32) | RED, S8)
  li t0, 32
  beq s2, t0, .L5
  ; hud.e16.ts:430  spr(x + i16(k) * 8 + shakeX, y + shakeY, (FONT_TILE + c - 32) | RED, S8)
  slli t0, s1, 3
  lw t1, 0(fp) ; x
  add t1, t1, t0
  lw t0, 0x0d02(zero)
  add t1, t1, t0
  lw t0, 0x0d04(zero)
  lw t2, 2(fp) ; y
  add t2, t2, t0
  addi t0, s2, -32
  ori t0, t0, 5120
  mv a0, t1
  mv a1, t2
  mv a2, t0
  li a3, 0
  call spr
.L5:
  ; hud.e16.ts:431  k++
  addi s1, s1, 1
  ; hud.e16.ts:432  c = peek(s + k)
  add t0, s3, s1
  lbu s2, 0(t0)
.L3:
  bne s2, zero, .L1
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; hud.e16.ts:437 radar() at -O1
;   k in s1
radar:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; hud.e16.ts:438  if (eAlive) blip(eBX, eBZ, HUD8_TILE + 20, RED)
  lw t0, 0x1600(zero)
  beqz t0, .L1
  ; hud.e16.ts:438  blip(eBX, eBZ, HUD8_TILE + 20, RED)
  lw t0, 0x160e(zero)
  lw t1, 0x1612(zero)
  mv a0, t0
  mv a1, t1
  li a2, 281
  li a3, 5120
  call blip
.L1:
  ; hud.e16.ts:439  let k: u16 = 0
  li s1, 0 ; k
  ; hud.e16.ts:440  while (k < MISSILES) {
  j .L4
.L2:
  ; hud.e16.ts:441  if (missileAt(k) === 2) {
  mv a0, s1
  la t0, missileAt
  li t1, 261
  call far_call
  li t0, 2
  bne a0, t0, .L6
  ; hud.e16.ts:442  vset(V_T0, missileX(k), missileY(k), 0)
  mv a0, s1
  la t0, missileX
  li t1, 261
  call far_call
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  la t0, missileY
  li t1, 261
  call far_call
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  li a0, 21
  li a3, 0
  call vset
  ; hud.e16.ts:443  toBody(V_T0)
  li a0, 21
  call toBody
  ; hud.e16.ts:444  blip(bodyX, bodyZ, HUD8_TILE + 21, RED)
  lw t0, 0x15a6(zero)
  lw t1, 0x15aa(zero)
  mv a0, t0
  mv a1, t1
  li a2, 282
  li a3, 5120
  call blip
.L6:
  ; hud.e16.ts:446  k++
  addi s1, s1, 1
.L4:
  li t0, 6
  bltu s1, t0, .L2
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; hud.e16.ts:450 blip(bx, bz, tile, pal) at -O1
;   bx in s3
;   bz in 0(fp)
;   tile in 2(fp)
;   pal in 4(fp)
;   x in s1
;   y in s2
blip:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s3, a0 ; bx
  sw a1, 0(fp) ; bz
  sw a2, 2(fp) ; tile
  sw a3, 4(fp) ; pal
  ; hud.e16.ts:451  const x = 60 + idiv(bx, 166)
  li t0, 166
  div t0, s3, t0
  addi s1, t0, 60
  ; hud.e16.ts:452  const y = 273 - idiv(bz, 166)
  li t0, 166
  lw t1, 0(fp) ; bz
  div t1, t1, t0
  li t0, 273
  sub s2, t0, t1
  ; hud.e16.ts:453  if (x < 26 || x > 92 || y < 226 || y > 278) return
  li t0, 26
  blt s1, t0, .L2
  li t0, 92
  blt t0, s1, .L2
  li t0, 226
  blt s2, t0, .L2
  li t0, 278
  bge t0, s2, .L1
.L2:
  ; hud.e16.ts:453  return
  j .return
.L1:
  ; hud.e16.ts:454  spr(x - 4, y - 4, tile | pal, S8)
  lw t0, 4(fp) ; pal
  lw t1, 2(fp) ; tile
  or t1, t1, t0
  addi a0, s1, -4
  addi a1, s2, -4
  mv a2, t1
  li a3, 0
  call spr
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

str_5:
  .byte 83, 80, 68, 0
str_6:
  .byte 65, 76, 84, 0
str_7:
  .byte 82, 68, 82, 0
str_8:
  .byte 68, 77, 71, 0
str_9:
  .byte 83, 67, 79, 82, 69, 0
str_10:
  .byte 84, 73, 77, 69, 0
str_11:
  .byte 84, 71, 84, 0
str_12:
  .byte 77, 0
str_13:
  .byte 70, 0
str_14:
  .byte 37, 0
str_15:
  .byte 65, 66, 32, 0
str_16:
  .byte 66, 82, 75, 0
str_17:
  .byte 77, 73, 83, 83, 73, 76, 69, 0
str_18:
  .byte 80, 85, 76, 76, 32, 85, 80, 0
  .align 2

  .bank 4
  .org 0xc000
; fx.e16.ts:55 fxClear() at -O1
;   k in a0
fxClear:
  ; fx.e16.ts:56  let k: u16 = 0
  li a0, 0 ; k
  ; fx.e16.ts:57  while (k < XN) {
  j .L3
.L1:
  ; fx.e16.ts:58  xKind[k] = 0
  slli t0, a0, 1
  sw zero, xKind(t0)
  ; fx.e16.ts:59  k++
  addi a0, a0, 1
.L3:
  li t0, 20
  bltu a0, t0, .L1
.return:
  ret

; fx.e16.ts:64 fxAt(kind, x, y, z) at -O1
;   kind in a0
;   x in a1
;   y in a2
;   z in a3
;   k in s1
fxAt:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; fx.e16.ts:65  const k = xNext
  lw s1, 0x1a68(zero)
  ; fx.e16.ts:66  xNext = xNext + 1 === XN ? 0 : xNext + 1
  lw t0, 0x1a68(zero)
  li t1, 20
  addi t0, t0, 1
  bne t0, t1, .L1
  li t0, 0
  j .L2
.L1:
  lw t0, 0x1a68(zero)
  addi t0, t0, 1
.L2:
  sw t0, 0x1a68(zero)
  ; fx.e16.ts:67  xKind[k] = kind
  slli t0, s1, 1
  sw a0, xKind(t0)
  ; fx.e16.ts:68  xX[k] = u16(x)
  slli t0, s1, 1
  sw a1, xX(t0)
  ; fx.e16.ts:69  xY[k] = u16(y)
  slli t0, s1, 1
  sw a2, xY(t0)
  ; fx.e16.ts:70  xZ[k] = u16(z)
  slli t0, s1, 1
  sw a3, xZ(t0)
  ; fx.e16.ts:71  xVX[k] = 0
  slli t0, s1, 1
  sw zero, xVX(t0)
  ; fx.e16.ts:72  xVY[k] = 0
  slli t0, s1, 1
  sw zero, xVY(t0)
  ; fx.e16.ts:73  xVZ[k] = 0
  slli t0, s1, 1
  sw zero, xVZ(t0)
  ; fx.e16.ts:74  xT[k] = 0
  slli t0, s1, 1
  sw zero, xT(t0)
  ; fx.e16.ts:75  return k
  mv a0, s1
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; fx.e16.ts:78 sparkAt(x, y, z) at -O1
;   x in s1
;   y in s2
;   z in s3
sparkAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; z
  ; fx.e16.ts:79  fxAt(
  li a0, 40
  call randBelow
  add t0, s1, a0
  addi t0, t0, -20
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 40
  call randBelow
  add t0, s2, a0
  addi t0, t0, -20
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 40
  call randBelow
  add t0, s3, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  li a0, 1
  mv a1, t2
  mv a2, t1
  addi a3, t0, -20
  call fxAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:87 boomAt(x, y, z) at -O1
;   x in s1
;   y in s2
;   z in s3
boomAt:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; z
  ; fx.e16.ts:88  fxAt(FX_BOOM, x, y, z)
  li a0, 2
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call fxAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:92 puffAt(x, y, z, dark) at -O1
;   x in s1
;   y in s2
;   z in s3
;   dark in s0
puffAt:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; z
  mv s0, a3 ; dark
  ; fx.e16.ts:93  fxAt(dark === 0 ? FX_TRAIL : FX_PUFF, x, y, z)
  bne s0, zero, .L1
  li t0, 4
  j .L2
.L1:
  li t0, 3
.L2:
  mv a0, t0
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call fxAt
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; fx.e16.ts:100 shotDown(vx, vy) at -O1
;   vx in 2(fp)
;   vy in 4(fp)
;   x in s1
;   y in s2
;   z in s3
;   k in 0(fp)
shotDown:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 2(fp) ; vx
  sw a1, 4(fp) ; vy
  ; fx.e16.ts:101  const x = vget(V_REL)
  li a0, 18
  call vget
  mv s1, a0 ; x
  ; fx.e16.ts:102  const y = vget(V_REL + 1)
  li a0, 19
  call vget
  mv s2, a0 ; y
  ; fx.e16.ts:103  const z = vget(V_REL + 2)
  li a0, 20
  call vget
  mv s3, a0 ; z
  ; fx.e16.ts:104  boomAt(x, y, z)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call boomAt
  ; fx.e16.ts:105  boomAt(x + 40, y - 30, z + 20)
  addi a0, s1, 40
  addi a1, s2, -30
  addi a2, s3, 20
  call boomAt
  ; fx.e16.ts:106  boomAt(x - 30, y + 40, z - 20)
  addi a0, s1, -30
  addi a1, s2, 40
  addi a2, s3, -20
  call boomAt
  ; fx.e16.ts:107  const k = fxAt(FX_WRECK, x, y, z)
  li a0, 5
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call fxAt
  sw a0, 0(fp) ; k
  ; fx.e16.ts:108  xVX[k] = u16(vx >> 4)
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw t1, 2(fp) ; vx
  srai t1, t1, 4
  sw t1, xVX(t0)
  ; fx.e16.ts:109  xVY[k] = u16(vy >> 4)
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw t1, 4(fp) ; vy
  srai t1, t1, 4
  sw t1, xVY(t0)
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; fx.e16.ts:113 fxStep() at -O1
;   px in s2
;   py in s3
;   pz in s0
;   k in s1
fxStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  ; fx.e16.ts:114  const px = pVel(0) >> 4
  li a0, 0
  call pVel
  srai s2, a0, 4
  ; fx.e16.ts:115  const py = pVel(1) >> 4
  li a0, 1
  call pVel
  srai s3, a0, 4
  ; fx.e16.ts:116  const pz = pVel(2) >> 4
  li a0, 2
  call pVel
  srai s0, a0, 4
  ; fx.e16.ts:117  let k: u16 = 0
  li s1, 0 ; k
  ; fx.e16.ts:118  while (k < XN) {
  j .L3
.L1:
  ; fx.e16.ts:119  if (xKind[k] !== 0) fxOne(k, px, py, pz)
  slli t0, s1, 1
  lw t0, xKind(t0)
  beq t0, zero, .L5
  ; fx.e16.ts:119  fxOne(k, px, py, pz)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  mv a3, s0
  call fxOne
.L5:
  ; fx.e16.ts:120  k++
  addi s1, s1, 1
.L3:
  li t0, 20
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; fx.e16.ts:124 fxOne(k, px, py, pz) at -O1
;   k in s1
;   px in 6(fp)
;   py in 8(fp)
;   pz in 10(fp)
;   t in s3
;   kind in s2
;   x in 0(fp)
;   y in 2(fp)
;   z in 4(fp)
fxOne:
  addi sp, sp, -22
  sw ra, 12(sp)
  sw s1, 14(sp)
  sw s3, 16(sp)
  sw s2, 18(sp)
  sw s0, 20(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 6(fp) ; px
  sw a2, 8(fp) ; py
  sw a3, 10(fp) ; pz
  ; fx.e16.ts:125  const t = xT[k] + 1
  slli t0, s1, 1
  lw t0, xT(t0)
  addi s3, t0, 1
  ; fx.e16.ts:126  xT[k] = t
  slli t0, s1, 1
  sw s3, xT(t0)
  ; fx.e16.ts:127  const kind = xKind[k]
  slli t0, s1, 1
  lw s2, xKind(t0)
  ; fx.e16.ts:128  if (t > lifeOf(kind)) {
  mv a0, s2
  call lifeOf
  bgeu a0, s3, .L1
  ; fx.e16.ts:129  xKind[k] = 0
  slli t0, s1, 1
  sw zero, xKind(t0)
  ; fx.e16.ts:130  return
  j .return
.L1:
  ; fx.e16.ts:132  if (kind === FX_WRECK) wreckStep(k, t)
  li t0, 5
  bne s2, t0, .L2
  ; fx.e16.ts:132  wreckStep(k, t)
  mv a0, s1
  mv a1, s3
  call wreckStep
.L2:
  ; fx.e16.ts:133  if (kind === FX_PUFF || kind === FX_TRAIL) xVZ[k] = u16(t > 8 ? 1 : 0)
  li t0, 3
  beq s2, t0, .L4
  li t0, 4
  bne s2, t0, .L3
.L4:
  ; fx.e16.ts:133  xVZ[k] = u16(t > 8 ? 1 : 0)
  slli t0, s1, 1
  addi t0, t0, xVZ
  mv t1, s3
  li t2, 8
  bgeu t2, t1, .L5
  li t1, 1
  j .L6
.L5:
  li t1, 0
.L6:
  sw t1, 0(t0)
.L3:
  ; fx.e16.ts:134  xX[k] = u16(i16(xX[k]) + i16(xVX[k]) - px)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, xX(t1)
  slli t2, s1, 1
  lw t2, xVX(t2)
  add t1, t1, t2
  lw t2, 6(fp) ; px
  sub t1, t1, t2
  sw t1, xX(t0)
  ; fx.e16.ts:135  xY[k] = u16(i16(xY[k]) + i16(xVY[k]) - py)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, xY(t1)
  slli t2, s1, 1
  lw t2, xVY(t2)
  add t1, t1, t2
  lw t2, 8(fp) ; py
  sub t1, t1, t2
  sw t1, xY(t0)
  ; fx.e16.ts:136  xZ[k] = u16(i16(xZ[k]) + i16(xVZ[k]) - pz)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, xZ(t1)
  slli t2, s1, 1
  lw t2, xVZ(t2)
  add t1, t1, t2
  lw t2, 10(fp) ; pz
  sub t1, t1, t2
  sw t1, xZ(t0)
  ; fx.e16.ts:138  const x = i16(xX[k])
  slli t0, s1, 1
  lw t0, xX(t0)
  sw t0, 0(fp) ; x
  ; fx.e16.ts:139  const y = i16(xY[k])
  slli t0, s1, 1
  lw t0, xY(t0)
  sw t0, 2(fp) ; y
  ; fx.e16.ts:140  const z = i16(xZ[k])
  slli t0, s1, 1
  lw t0, xZ(t0)
  sw t0, 4(fp) ; z
  ; fx.e16.ts:141  if (kind !== FX_WRECK && abs16(x) + abs16(y) + abs16(z) > 4800) return
  li t0, 5
  beq s2, t0, .L7
  lw a0, 0(fp)
  call abs16
  addi sp, sp, -2
  sw a0, 0(sp)
  lw a0, 2(fp)
  call abs16
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 4(fp)
  call abs16
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  li t1, 4800
  bge t1, t0, .L7
  ; fx.e16.ts:141  return
  j .return
.L7:
  ; fx.e16.ts:142  vset(V_T0, x, y, z)
  li a0, 21
  lw a1, 0(fp)
  lw a2, 2(fp)
  lw a3, 4(fp)
  call vset
  ; fx.e16.ts:143  toBody(V_T0)
  li a0, 21
  call toBody
  ; fx.e16.ts:144  if (project() && abovePanel(scrY, 16)) fxDraw(kind, t)
  call project
  beqz a0, .L8
  lw a0, 0x15ae(zero)
  li a1, 16
  call abovePanel
  beqz a0, .L8
  ; fx.e16.ts:144  fxDraw(kind, t)
  mv a0, s2
  mv a1, s3
  call fxDraw
.L8:
.return:
  mv sp, fp
  lw ra, 12(sp)
  lw s1, 14(sp)
  lw s3, 16(sp)
  lw s2, 18(sp)
  lw s0, 20(sp)
  addi sp, sp, 22
  ret

; fx.e16.ts:147 lifeOf(kind) at -O1
;   kind in a0
lifeOf:
  ; fx.e16.ts:148  if (kind === FX_SPARK) return 9
  li t0, 1
  bne a0, t0, .L1
  ; fx.e16.ts:148  return 9
  li a0, 9
  ret
.L1:
  ; fx.e16.ts:149  if (kind === FX_BOOM) return 40
  li t0, 2
  bne a0, t0, .L2
  ; fx.e16.ts:149  return 40
  li a0, 40
  ret
.L2:
  ; fx.e16.ts:150  if (kind === FX_FLAME) return 24
  li t0, 6
  bne a0, t0, .L3
  ; fx.e16.ts:150  return 24
  li a0, 24
  ret
.L3:
  ; fx.e16.ts:151  if (kind === FX_TRAIL) return 24
  li t0, 4
  bne a0, t0, .L4
  ; fx.e16.ts:151  return 24
  li a0, 24
  ret
.L4:
  ; fx.e16.ts:152  if (kind === FX_PUFF) return 44
  li t0, 3
  bne a0, t0, .L5
  ; fx.e16.ts:152  return 44
  li a0, 44
  ret
.L5:
  ; fx.e16.ts:153  return 170
  li a0, 170
.return:
  ret

; fx.e16.ts:157 wreckStep(k, t) at -O1
;   k in s1
;   t in s2
;   x in s3
;   y in 0(fp)
;   z in 2(fp)
wreckStep:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  mv s2, a1 ; t
  ; fx.e16.ts:158  if ((t & 3) === 0) {
  andi t0, s2, 3
  bne t0, zero, .L1
  ; fx.e16.ts:159  xVX[k] = u16(i16(xVX[k]) - (i16(xVX[k]) >> 3))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, xVX(t1)
  slli t2, s1, 1
  lw t2, xVX(t2)
  srai t2, t2, 3
  sub t1, t1, t2
  sw t1, xVX(t0)
  ; fx.e16.ts:160  xVY[k] = u16(i16(xVY[k]) - (i16(xVY[k]) >> 3))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, xVY(t1)
  slli t2, s1, 1
  lw t2, xVY(t2)
  srai t2, t2, 3
  sub t1, t1, t2
  sw t1, xVY(t0)
  ; fx.e16.ts:161  xVZ[k] = u16(i16(xVZ[k]) - 1)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, xVZ(t1)
  addi t1, t1, -1
  sw t1, xVZ(t0)
.L1:
  ; fx.e16.ts:163  const x = i16(xX[k])
  slli t0, s1, 1
  lw s3, xX(t0)
  ; fx.e16.ts:164  const y = i16(xY[k])
  slli t0, s1, 1
  lw t0, xY(t0)
  sw t0, 0(fp) ; y
  ; fx.e16.ts:165  const z = i16(xZ[k])
  slli t0, s1, 1
  lw t0, xZ(t0)
  sw t0, 2(fp) ; z
  ; fx.e16.ts:166  if ((t & 3) === 1) fxAt(FX_PUFF, x, y, z + 10)
  andi t0, s2, 3
  li t1, 1
  bne t0, t1, .L2
  ; fx.e16.ts:166  fxAt(FX_PUFF, x, y, z + 10)
  lw t0, 2(fp) ; z
  li a0, 3
  mv a1, s3
  lw a2, 0(fp)
  addi a3, t0, 10
  call fxAt
.L2:
  ; fx.e16.ts:167  if ((t & 7) === 2 && t < 120) fxAt(FX_FLAME, x + i16(randBelow(30)) - 15, y, z)
  andi t0, s2, 7
  li t1, 2
  bne t0, t1, .L3
  li t0, 120
  bgeu s2, t0, .L3
  ; fx.e16.ts:167  fxAt(FX_FLAME, x + i16(randBelow(30)) - 15, y, z)
  li a0, 30
  call randBelow
  add t0, s3, a0
  li a0, 6
  addi a1, t0, -15
  lw a2, 0(fp)
  lw a3, 2(fp)
  call fxAt
.L3:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fx.e16.ts:171 fxDraw(kind, t) at -O1
;   kind in s1
;   t in s2
;   z in s3
;   f in s0
fxDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; kind
  mv s2, a1 ; t
  ; fx.e16.ts:172  const fire = (SL_FIRE - 8) << 10
  ; fx.e16.ts:173  const z = bodyZ
  lw s3, 0x15aa(zero)
  ; fx.e16.ts:174  if (kind === FX_SPARK) {
  li t0, 1
  bne s1, t0, .L1
  ; fx.e16.ts:175  spr(scrX - 4, scrY - 4, (BITS_TILE + 4 + (t > 4 ? 1 : 0)) | fire, S8)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  addi t0, t0, -4
  addi t1, t1, -4
  li t2, 497
  mv t3, s2
  li a1, 4
  bgeu a1, t3, .L2
  li t3, 1
  j .L3
.L2:
  li t3, 0
.L3:
  add t2, t2, t3
  ori t2, t2, 2048
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 0
  call spr
  j .L4
.L1:
  ; fx.e16.ts:176  if (kind === FX_BOOM || kind === FX_FLAME) {
  li t0, 2
  beq s1, t0, .L6
  li t0, 6
  bne s1, t0, .L5
.L6:
  ; fx.e16.ts:177  const f = kind === FX_BOOM ? t : t + 12
  li t0, 2
  bne s1, t0, .L7
  mv t0, s2
  j .L8
.L7:
  addi t0, s2, 12
.L8:
  mv s0, t0 ; f
  ; fx.e16.ts:178  boomDraw(f, z, fire)
  mv a0, s0
  mv a1, s3
  li a2, 2048
  call boomDraw
  j .L9
.L5:
  ; fx.e16.ts:179  if (kind === FX_WRECK) {
  li t0, 5
  bne s1, t0, .L10
  ; fx.e16.ts:180  if (z < 900) spr(scrX - 8, scrY - 8, (BLAST16_TILE + 4 + ((t >> 2) & 1) * 4) | fire, S16)
  li t0, 900
  bge s3, t0, .L11
  ; fx.e16.ts:180  spr(scrX - 8, scrY - 8, (BLAST16_TILE + 4 + ((t >> 2) & 1) * 4) | fire, S16)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  srli t2, s2, 2
  andi t2, t2, 1
  slli t2, t2, 2
  addi t2, t2, 473
  ori t2, t2, 2048
  addi a0, t0, -8
  addi a1, t1, -8
  mv a2, t2
  li a3, 1
  call spr
  j .L13
.L11:
  ; fx.e16.ts:181  spr(scrX - 4, scrY - 4, (BITS_TILE + 4) | fire, S8)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  addi a0, t0, -4
  addi a1, t1, -4
  li a2, 2545
  li a3, 0
  call spr
  j .L13
.L10:
  ; fx.e16.ts:182  puffDraw(kind, t, z)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  call puffDraw
.L13:
.L9:
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; fx.e16.ts:186 boomDraw(f, z, fire) at -O1
;   f in s1
;   z in s3
;   fire in s2
boomDraw:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; f
  mv s3, a1 ; z
  mv s2, a2 ; fire
  ; fx.e16.ts:187  if (z < 700)
  li t0, 700
  bge s3, t0, .L1
  ; fx.e16.ts:188  spr(scrX - 16, scrY - 16, (BLAST32_TILE + (f >> 2 > 7 ? 7 : f >> 2) * 16) | fire, S32)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  srli t2, s1, 2
  addi t0, t0, -16
  addi t1, t1, -16
  mv t3, t2
  li t2, 341
  li a1, 7
  bgeu a1, t3, .L2
  li t3, 7
  j .L3
.L2:
  srli t3, s1, 2
.L3:
  slli t3, t3, 4
  add t2, t2, t3
  or t2, t2, s2
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 2
  call spr
  j .L4
.L1:
  ; fx.e16.ts:189  if (z < 2200)
  li t0, 2200
  bge s3, t0, .L5
  ; fx.e16.ts:190  spr(scrX - 8, scrY - 8, (BLAST16_TILE + div(f > 35 ? 35 : f, 7) * 4) | fire, S16)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  addi t0, t0, -8
  addi t1, t1, -8
  li t2, 469
  mv t3, s1
  li a1, 35
  bgeu a1, t3, .L6
  li t3, 35
  j .L7
.L6:
  mv t3, s1
.L7:
  li a1, 7
  divu t3, t3, a1
  slli t3, t3, 2
  add t2, t2, t3
  or t2, t2, s2
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  call spr
  j .L8
.L5:
  ; fx.e16.ts:191  spr(scrX - 4, scrY - 4, (BITS_TILE + 4 + ((f >> 2) & 1)) | fire, S8)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  srli t2, s1, 2
  andi t2, t2, 1
  addi t2, t2, 497
  or t2, t2, s2
  addi a0, t0, -4
  addi a1, t1, -4
  mv a2, t2
  li a3, 0
  call spr
.L8:
.L4:
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; fx.e16.ts:194 puffDraw(kind, t, z) at -O1
;   kind in s1
;   t in s2
;   z in s3
;   life in 0(fp)
;   f in 2(fp)
puffDraw:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; kind
  mv s2, a1 ; t
  mv s3, a2 ; z
  ; fx.e16.ts:195  if (z > 2400) return
  li t0, 2400
  bge t0, s3, .L1
  ; fx.e16.ts:195  return
  j .return
.L1:
  ; fx.e16.ts:196  const life = kind === FX_TRAIL ? 24 : 44
  li t0, 4
  bne s1, t0, .L2
  li t0, 24
  j .L3
.L2:
  li t0, 44
.L3:
  sw t0, 0(fp) ; life
  ; fx.e16.ts:197  const f = div(t * 4, life + 1)
  slli t0, s2, 2
  lw t1, 0(fp) ; life
  addi t1, t1, 1
  divu t0, t0, t1
  sw t0, 2(fp) ; f
  ; fx.e16.ts:198  const pal = (SL_CLOUD - 8) << 10
  ; fx.e16.ts:199  if (z < 1000 || kind === FX_PUFF) spr(scrX - 8, scrY - 8, (SMOKE_TILE + f * 4) | pal, S16)
  li t0, 1000
  blt s3, t0, .L5
  li t0, 3
  bne s1, t0, .L4
.L5:
  ; fx.e16.ts:199  spr(scrX - 8, scrY - 8, (SMOKE_TILE + f * 4) | pal, S16)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  lw t2, 2(fp) ; f
  slli t2, t2, 2
  addi t2, t2, 499
  ori t2, t2, 3072
  addi a0, t0, -8
  addi a1, t1, -8
  mv a2, t2
  li a3, 1
  call spr
  j .L6
.L4:
  ; fx.e16.ts:200  spr(scrX - 4, scrY - 4, (CLOUD8_TILE + (t & 1)) | pal, S8)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  andi t2, s2, 1
  addi t2, t2, 619
  ori t2, t2, 3072
  addi a0, t0, -4
  addi a1, t1, -4
  mv a2, t2
  li a3, 0
  call spr
.L6:
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; fx.e16.ts:214 cloudsNew(layer) at -O1
;   layer in s2
;   k in s1
cloudsNew:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; layer
  ; fx.e16.ts:215  cloudLayer = layer
  sw s2, 0x1aaa(zero)
  ; fx.e16.ts:216  let k: u16 = 0
  li s1, 0 ; k
  ; fx.e16.ts:217  while (k < CN) {
  j .L3
.L1:
  ; fx.e16.ts:218  cloudPlace(k, i16(randBelow(250)) * 24 - 3000)
  li a0, 250
  call randBelow
  slli t1, a0, 4
  slli t0, a0, 3
  add t0, t0, t1
  mv a0, s1
  addi a1, t0, -3000
  call cloudPlace
  ; fx.e16.ts:219  k++
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

; fx.e16.ts:224 cloudPlace(k, ahead) at -O1
;   k in s1
;   ahead in s2
;   fx in s3
;   fy in 0(fp)
;   side in 2(fp)
cloudPlace:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  mv s2, a1 ; ahead
  ; fx.e16.ts:225  const fx = vget(V_PF)
  li a0, 0
  call vget
  mv s3, a0 ; fx
  ; fx.e16.ts:226  const fy = vget(V_PF + 1)
  li a0, 1
  call vget
  sw a0, 0(fp) ; fy
  ; fx.e16.ts:227  const side = i16(randBelow(250)) * 24 - 3000
  li a0, 250
  call randBelow
  slli t1, a0, 4
  slli t0, a0, 3
  add t0, t0, t1
  addi t0, t0, -3000
  sw t0, 2(fp) ; side
  ; fx.e16.ts:228  cX[k] = u16(mulq(fx, ahead) + mulq(fy, side))
  slli t0, s1, 1
  addi t0, t0, cX
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  mv a1, s2
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  lw a0, 0(fp)
  lw a1, 2(fp)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; fx.e16.ts:229  cY[k] = u16(mulq(fy, ahead) - mulq(fx, side))
  slli t0, s1, 1
  addi t0, t0, cY
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 0(fp)
  mv a1, s2
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s3
  lw a1, 2(fp)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; fx.e16.ts:230  cZ[k] = u16(cloudLayer - pAlt + i16(randBelow(200)) * 3 - 300)
  slli t0, s1, 1
  lw t1, 0x1aaa(zero)
  lw t2, 0x15b2(zero)
  sub t1, t1, t2
  addi t0, t0, cZ
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 200
  call randBelow
  slli t1, a0, 1
  add t0, t1, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  add t1, t1, t0
  addi t1, t1, -300
  lw t0, 0(sp)
  addi sp, sp, 2
  sw t1, 0(t0)
  ; fx.e16.ts:231  cKind[k] = rand() & 7
  slli t0, s1, 1
  addi t0, t0, cKind
  addi sp, sp, -2
  sw t0, 0(sp)
  call rand
  andi t0, a0, 7
  lw t1, 0(sp)
  addi sp, sp, 2
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

; fx.e16.ts:235 cloudsStep() at -O1
;   px in s2
;   py in s3
;   pz in s0
;   k in s1
cloudsStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  ; fx.e16.ts:236  const px = pVel(0) >> 4
  li a0, 0
  call pVel
  srai s2, a0, 4
  ; fx.e16.ts:237  const py = pVel(1) >> 4
  li a0, 1
  call pVel
  srai s3, a0, 4
  ; fx.e16.ts:238  const pz = pVel(2) >> 4
  li a0, 2
  call pVel
  srai s0, a0, 4
  ; fx.e16.ts:239  let k: u16 = 0
  li s1, 0 ; k
  ; fx.e16.ts:240  while (k < CN) {
  j .L3
.L1:
  ; fx.e16.ts:241  cX[k] = u16(i16(cX[k]) - px)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, cX(t1)
  sub t1, t1, s2
  sw t1, cX(t0)
  ; fx.e16.ts:242  cY[k] = u16(i16(cY[k]) - py)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, cY(t1)
  sub t1, t1, s3
  sw t1, cY(t0)
  ; fx.e16.ts:243  cZ[k] = u16(i16(cZ[k]) - pz)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, cZ(t1)
  sub t1, t1, s0
  sw t1, cZ(t0)
  ; fx.e16.ts:244  vset(V_T0, i16(cX[k]), i16(cY[k]), i16(cZ[k]))
  slli t0, s1, 1
  lw t0, cX(t0)
  slli t1, s1, 1
  lw t1, cY(t1)
  slli t2, s1, 1
  lw t2, cZ(t2)
  li a0, 21
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call vset
  ; fx.e16.ts:245  toBody(V_T0)
  li a0, 21
  call toBody
  ; fx.e16.ts:246  if (bodyZ < -400 || abs16(i16(cX[k])) > 9000 || abs16(i16(cY[k])) > 9000) {
  lw t0, 0x15aa(zero)
  li t1, 65136
  blt t0, t1, .L6
  slli t0, s1, 1
  lw a0, cX(t0)
  call abs16
  li t0, 9000
  blt t0, a0, .L6
  slli t0, s1, 1
  lw a0, cY(t0)
  call abs16
  li t0, 9000
  bge t0, a0, .L5
.L6:
  ; fx.e16.ts:247  cloudPlace(k, 7000 + i16(randBelow(100)) * 10)
  li a0, 100
  call randBelow
  slli t1, a0, 3
  slli t0, a0, 1
  add t0, t0, t1
  mv a0, s1
  addi a1, t0, 7000
  call cloudPlace
.L5:
  ; fx.e16.ts:249  cloudShown[k] = project() && abovePanel(scrY, 16) ? 1 : 0
  slli t0, s1, 1
  addi t0, t0, cloudShown
  addi sp, sp, -2
  sw t0, 0(sp)
  call project
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
  beqz t1, .L7
  lw t1, 0x15ae(zero)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  li a1, 16
  call abovePanel
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
  beqz t1, .L7
  li t1, 1
  j .L8
.L7:
  li t1, 0
.L8:
  sw t1, 0(t0)
  ; fx.e16.ts:250  cloudSX[k] = u16(scrX)
  slli t0, s1, 1
  lw t1, 0x15ac(zero)
  sw t1, cloudSX(t0)
  ; fx.e16.ts:251  cloudSY[k] = u16(scrY)
  slli t0, s1, 1
  lw t1, 0x15ae(zero)
  sw t1, cloudSY(t0)
  ; fx.e16.ts:252  cloudZ[k] = u16(bodyZ)
  slli t0, s1, 1
  lw t1, 0x15aa(zero)
  sw t1, cloudZ(t0)
  ; fx.e16.ts:253  k++
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

; fx.e16.ts:263 cloudsDraw(zNear, near) at -O1
;   zNear in s3
;   near in s0
;   k in s1
;   z in s2
cloudsDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s3, 2(sp)
  sw s0, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  mv s3, a0 ; zNear
  mv s0, a1 ; near
  ; fx.e16.ts:264  let k: u16 = 0
  li s1, 0 ; k
  ; fx.e16.ts:265  while (k < CN) {
  j .L3
.L1:
  ; fx.e16.ts:266  const z = i16(cloudZ[k])
  slli t0, s1, 1
  lw s2, cloudZ(t0)
  ; fx.e16.ts:267  if (cloudShown[k] !== 0 && z < zNear === near) cloudDraw(k, z)
  slli t0, s1, 1
  lw t0, cloudShown(t0)
  beq t0, zero, .L5
  slt t0, s2, s3
  bne t0, s0, .L5
  ; fx.e16.ts:267  cloudDraw(k, z)
  mv a0, s1
  mv a1, s2
  call cloudDraw
.L5:
  ; fx.e16.ts:268  k++
  addi s1, s1, 1
.L3:
  li t0, 6
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s3, 2(sp)
  lw s0, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  addi sp, sp, 10
  ret

; fx.e16.ts:272 cloudDraw(k, z) at -O1
;   k in 0(fp)
;   z in 2(fp)
;   x in s1
;   y in s2
;   v in s3
;   t in 4(fp)
cloudDraw:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  sw a0, 0(fp) ; k
  sw a1, 2(fp) ; z
  ; fx.e16.ts:273  const x = i16(cloudSX[k])
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw s1, cloudSX(t0)
  ; fx.e16.ts:274  const y = i16(cloudSY[k])
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw s2, cloudSY(t0)
  ; fx.e16.ts:275  const pal = (SL_CLOUD - 8) << 10
  ; fx.e16.ts:276  const v = cKind[k] & 1
  lw t0, 0(fp) ; k
  slli t0, t0, 1
  lw t0, cKind(t0)
  andi s3, t0, 1
  ; fx.e16.ts:277  if (z < 900) {
  li t0, 900
  lw t1, 2(fp) ; z
  bge t1, t0, .L1
  ; fx.e16.ts:278  const t = CLOUD64_TILE + v * 32
  slli t0, s3, 5
  addi t0, t0, 515
  sw t0, 4(fp) ; t
  ; fx.e16.ts:279  spr(x - 32, y - 16, t | pal, S32)
  lw t0, 4(fp) ; t
  ori t0, t0, 3072
  addi a0, s1, -32
  addi a1, s2, -16
  mv a2, t0
  li a3, 2
  call spr
  ; fx.e16.ts:280  spr(x, y - 16, (t + 16) | pal, S32)
  lw t0, 4(fp) ; t
  addi t0, t0, 16
  ori t0, t0, 3072
  mv a0, s1
  addi a1, s2, -16
  mv a2, t0
  li a3, 2
  call spr
  j .L2
.L1:
  ; fx.e16.ts:281  if (z < 1900) spr(x - 16, y - 16, (CLOUD32_TILE + v * 16) | pal, S32)
  li t0, 1900
  lw t1, 2(fp) ; z
  bge t1, t0, .L3
  ; fx.e16.ts:281  spr(x - 16, y - 16, (CLOUD32_TILE + v * 16) | pal, S32)
  slli t0, s3, 4
  addi t0, t0, 579
  ori t0, t0, 3072
  addi a0, s1, -16
  addi a1, s2, -16
  mv a2, t0
  li a3, 2
  call spr
  j .L4
.L3:
  ; fx.e16.ts:282  if (z < 3800) spr(x - 8, y - 8, (CLOUD16_TILE + v * 4) | pal, S16)
  li t0, 3800
  lw t1, 2(fp) ; z
  bge t1, t0, .L5
  ; fx.e16.ts:282  spr(x - 8, y - 8, (CLOUD16_TILE + v * 4) | pal, S16)
  slli t0, s3, 2
  addi t0, t0, 611
  ori t0, t0, 3072
  addi a0, s1, -8
  addi a1, s2, -8
  mv a2, t0
  li a3, 1
  call spr
  j .L6
.L5:
  ; fx.e16.ts:283  spr(x - 4, y - 4, (CLOUD8_TILE + v) | pal, S8)
  addi t0, s3, 619
  ori t0, t0, 3072
  addi a0, s1, -4
  addi a1, s2, -4
  mv a2, t0
  li a3, 0
  call spr
.L6:
.L4:
.L2:
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; fx.e16.ts:294 sunIs(x, y, z, on) at -O1
;   x in a0
;   y in a1
;   z in a2
;   on in a3
sunIs:
  ; fx.e16.ts:295  sunX = x
  sw a0, 0x1aec(zero)
  ; fx.e16.ts:296  sunY = y
  sw a1, 0x1aee(zero)
  ; fx.e16.ts:297  sunZ = z
  sw a2, 0x1af0(zero)
  ; fx.e16.ts:298  sunOn = on
  sw a3, 0x1af2(zero)
.return:
  ret

; fx.e16.ts:302 sunDraw() at -O1
;   sx in s1
;   sy in s2
;   dx in s3
;   dy in s0
sunDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; fx.e16.ts:303  if (!sunOn) return
  lw t0, 0x1af2(zero)
  bnez t0, .L1
  ; fx.e16.ts:303  return
  j .return
.L1:
  ; fx.e16.ts:304  vset(V_T0, sunX, sunY, sunZ)
  lw t0, 0x1aec(zero)
  lw t1, 0x1aee(zero)
  lw t2, 0x1af0(zero)
  li a0, 21
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call vset
  ; fx.e16.ts:305  toBody(V_T0)
  li a0, 21
  call toBody
  ; fx.e16.ts:306  if (!project() || !abovePanel(scrY, 16)) return
  call project
  beqz a0, .L3
  lw a0, 0x15ae(zero)
  li a1, 16
  call abovePanel
  bnez a0, .L2
.L3:
  ; fx.e16.ts:306  return
  j .return
.L2:
  ; fx.e16.ts:307  const sx = scrX
  lw s1, 0x15ac(zero)
  ; fx.e16.ts:308  const sy = scrY
  lw s2, 0x15ae(zero)
  ; fx.e16.ts:309  spr(sx - 16, sy - 16, SUN_TILE | ((SL_SUN - 8) << 10), S32)
  addi a0, s1, -16
  addi a1, s2, -16
  li a2, 7789
  li a3, 2
  call spr
  ; fx.e16.ts:311  if (sy < 16 || sy > 196 || sx < 30 || sx > 290) return
  li t0, 16
  blt s2, t0, .L5
  li t0, 196
  blt t0, s2, .L5
  li t0, 30
  blt s1, t0, .L5
  li t0, 290
  bge t0, s1, .L4
.L5:
  ; fx.e16.ts:311  return
  j .return
.L4:
  ; fx.e16.ts:312  const dx = i16(CX) - sx
  li t0, 160
  sub s3, t0, s1
  ; fx.e16.ts:313  const dy = i16(CY) - sy
  li t0, 112
  sub s0, t0, s2
  ; fx.e16.ts:314  ghost(sx + dx - (dx >> 2), sy + dy - (dy >> 2), 0)
  add t0, s1, s3
  srai t1, s3, 2
  sub t0, t0, t1
  add t1, s2, s0
  srai t2, s0, 2
  sub t1, t1, t2
  mv a0, t0
  mv a1, t1
  li a2, 0
  call ghost
  ; fx.e16.ts:315  ghost(sx + dx + (dx >> 1), sy + dy + (dy >> 1), 1)
  add t0, s1, s3
  srai t1, s3, 1
  add t0, t0, t1
  add t1, s2, s0
  srai t2, s0, 1
  add t1, t1, t2
  mv a0, t0
  mv a1, t1
  li a2, 1
  call ghost
  ; fx.e16.ts:316  ghost(sx + (dx >> 1) + dx, sy + (dy >> 1) + dy, 2)
  srai t0, s3, 1
  add t0, s1, t0
  add t0, t0, s3
  srai t1, s0, 1
  add t1, s2, t1
  add t1, t1, s0
  mv a0, t0
  mv a1, t1
  li a2, 2
  call ghost
  ; fx.e16.ts:317  ghost(sx + dx * 2, sy + dy * 2, 1)
  slli t0, s3, 1
  add t0, s1, t0
  slli t1, s0, 1
  add t1, s2, t1
  mv a0, t0
  mv a1, t1
  li a2, 1
  call ghost
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; fx.e16.ts:320 ghost(x, y, k) at -O1
;   x in s2
;   y in s1
;   k in s3
ghost:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  sw s3, 6(sp)
  mv s2, a0 ; x
  mv s1, a1 ; y
  mv s3, a2 ; k
  ; fx.e16.ts:321  if (!abovePanel(y, 8)) return
  mv a0, s1
  li a1, 8
  call abovePanel
  bnez a0, .L1
  ; fx.e16.ts:321  return
  j .return
.L1:
  ; fx.e16.ts:322  spr(x - 8, y - 8, (FLARE_TILE + k * 4) | ((SL_SUN - 8) << 10), S16)
  slli t0, s3, 2
  addi t0, t0, 637
  ori t0, t0, 7168
  addi a0, s2, -8
  addi a1, s1, -8
  mv a2, t0
  li a3, 1
  call spr
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

  .align 2

  .bank 5
  .org 0xc000
; arms.e16.ts:57 fireRound(x, y, z, owner) at -O1
;   x in a0
;   y in a1
;   z in a2
;   owner in a3
;   k in s1
fireRound:
  addi sp, sp, -2
  sw s1, 0(sp)
  ; arms.e16.ts:58  const k = bNext
  lw s1, 0x1836(zero)
  ; arms.e16.ts:59  bNext = bNext + 1 === BN ? 0 : bNext + 1
  lw t0, 0x1836(zero)
  li t1, 24
  addi t0, t0, 1
  bne t0, t1, .L1
  li t0, 0
  j .L2
.L1:
  lw t0, 0x1836(zero)
  addi t0, t0, 1
.L2:
  sw t0, 0x1836(zero)
  ; arms.e16.ts:60  bX[k] = u16(x)
  slli t0, s1, 1
  sw a0, bX(t0)
  ; arms.e16.ts:61  bY[k] = u16(y)
  slli t0, s1, 1
  sw a1, bY(t0)
  ; arms.e16.ts:62  bZ[k] = u16(z)
  slli t0, s1, 1
  sw a2, bZ(t0)
  ; arms.e16.ts:63  bVX[k] = vec[V_T0]
  slli t0, s1, 1
  lw t1, vec+42(zero)
  sw t1, bVX(t0)
  ; arms.e16.ts:64  bVY[k] = vec[V_T0 + 1]
  slli t0, s1, 1
  lw t1, vec+44(zero)
  sw t1, bVY(t0)
  ; arms.e16.ts:65  bVZ[k] = vec[V_T0 + 2]
  slli t0, s1, 1
  lw t1, vec+46(zero)
  sw t1, bVZ(t0)
  ; arms.e16.ts:66  bLife[k] = owner === 1 ? 32 : 40
  slli t0, s1, 1
  addi t0, t0, bLife
  mv t1, a3
  li t2, 1
  bne t1, t2, .L3
  li t1, 32
  j .L4
.L3:
  li t1, 40
.L4:
  sw t1, 0(t0)
  ; arms.e16.ts:67  bOwner[k] = owner
  slli t0, s1, 1
  sw a3, bOwner(t0)
.return:
  lw s1, 0(sp)
  addi sp, sp, 2
  ret

; arms.e16.ts:71 gunVelocity(speed, vx, vy, vz) at -O1
;   speed in s1
;   vx in s2
;   vy in s3
;   vz in s0
gunVelocity:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; speed
  mv s2, a1 ; vx
  mv s3, a2 ; vy
  mv s0, a3 ; vz
  ; arms.e16.ts:72  vec[V_T0] = u16(mulq(vget(V_T0), speed) + (vx >> 4))
  li a0, 21
  call vget
  mv a1, s1
  call mulq
  srai t0, s2, 4
  add t0, a0, t0
  sw t0, vec+42(zero)
  ; arms.e16.ts:73  vec[V_T0 + 1] = u16(mulq(vget(V_T0 + 1), speed) + (vy >> 4))
  li a0, 22
  call vget
  mv a1, s1
  call mulq
  srai t0, s3, 4
  add t0, a0, t0
  sw t0, vec+44(zero)
  ; arms.e16.ts:74  vec[V_T0 + 2] = u16(mulq(vget(V_T0 + 2), speed) + (vz >> 4))
  li a0, 23
  call vget
  mv a1, s1
  call mulq
  srai t0, s0, 4
  add t0, a0, t0
  sw t0, vec+46(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; arms.e16.ts:81 playerGun() at -O1
;   side in s1
;   x in s2
;   y in s3
;   z in s0
playerGun:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  ; arms.e16.ts:82  gunFiring = false
  sw zero, 0x1844(zero)
  ; arms.e16.ts:83  if (gunCool > 0) gunCool--
  lw t0, 0x1838(zero)
  bgeu zero, t0, .L1
  ; arms.e16.ts:83  gunCool--
  lw t0, 0x1838(zero)
  addi t0, t0, -1
  sw t0, 0x1838(zero)
.L1:
  ; arms.e16.ts:84  if (!held(B_A) || gunCool > 0) return
  li a0, 16
  call held
  beqz a0, .L3
  lw t0, 0x1838(zero)
  bgeu zero, t0, .L2
.L3:
  ; arms.e16.ts:84  return
  j .return
.L2:
  ; arms.e16.ts:85  gunCool = 4
  li t0, 4
  sw t0, 0x1838(zero)
  ; arms.e16.ts:86  gunFiring = true
  li t0, 1
  sw t0, 0x1844(zero)
  ; arms.e16.ts:87  muzzle = muzzle ^ 1
  lw t0, 0x183a(zero)
  xori t0, t0, 1
  sw t0, 0x183a(zero)
  ; arms.e16.ts:88  if (!assistAim()) {
  call assistAim
  bnez a0, .L4
  ; arms.e16.ts:89  vec[V_T0] = vec[V_PF]
  lw t0, vec(zero)
  sw t0, vec+42(zero)
  ; arms.e16.ts:90  vec[V_T0 + 1] = vec[V_PF + 1]
  lw t0, vec+2(zero)
  sw t0, vec+44(zero)
  ; arms.e16.ts:91  vec[V_T0 + 2] = vec[V_PF + 2]
  lw t0, vec+4(zero)
  sw t0, vec+46(zero)
.L4:
  ; arms.e16.ts:93  gunVelocity(72, pVel(0), pVel(1), pVel(2))
  li a0, 0
  call pVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 1
  call pVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 2
  call pVel
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t1
  mv a2, t0
  mv a3, a0
  li a0, 72
  call gunVelocity
  ; arms.e16.ts:94  const side: i16 = muzzle === 0 ? 7 : -7
  lw t0, 0x183a(zero)
  bne t0, zero, .L5
  li t0, 7
  j .L6
.L5:
  li t0, 65529
.L6:
  mv s1, t0 ; side
  ; arms.e16.ts:95  const x = mulq(vget(V_PR), side) - mulq(vget(V_PU), 5)
  li a0, 3
  call vget
  mv a1, s1
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 6
  call vget
  li a1, 5
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub s2, t0, a0
  ; arms.e16.ts:96  const y = mulq(vget(V_PR + 1), side) - mulq(vget(V_PU + 1), 5)
  li a0, 4
  call vget
  mv a1, s1
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 7
  call vget
  li a1, 5
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub s3, t0, a0
  ; arms.e16.ts:97  const z = mulq(vget(V_PR + 2), side) - mulq(vget(V_PU + 2), 5)
  li a0, 5
  call vget
  mv a1, s1
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call vget
  li a1, 5
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub s0, t0, a0
  ; arms.e16.ts:98  fireRound(x, y, z, 1)
  mv a0, s2
  mv a1, s3
  mv a2, s0
  li a3, 1
  call fireRound
  ; arms.e16.ts:99  roundsFired++
  lw t0, 0x1840(zero)
  addi t0, t0, 1
  sw t0, 0x1840(zero)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; arms.e16.ts:103 assistAim() at -O1
;   cone in s2
;   t in s1
assistAim:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  ; arms.e16.ts:104  if (!eAlive || !eOn || eBZ <= 0 || eBZ > 2200) return false
  lw t0, 0x1600(zero)
  beqz t0, .L2
  lw t0, 0x1618(zero)
  beqz t0, .L2
  lw t0, 0x1612(zero)
  bge zero, t0, .L2
  lw t0, 0x1612(zero)
  li t1, 2200
  bge t1, t0, .L1
.L2:
  ; arms.e16.ts:104  return false
  li a0, 0
  j .return
.L1:
  ; arms.e16.ts:105  const cone = eBZ >> 3
  lw t0, 0x1612(zero)
  srai s2, t0, 3
  ; arms.e16.ts:106  if (abs16(eBX) > cone || abs16(eBY) > cone) return false
  lw a0, 0x160e(zero)
  call abs16
  blt s2, a0, .L4
  lw a0, 0x1610(zero)
  call abs16
  bge s2, a0, .L3
.L4:
  ; arms.e16.ts:106  return false
  li a0, 0
  j .return
.L3:
  ; arms.e16.ts:108  let t = i16(div(eDist, 70))
  lw t0, 0x161c(zero)
  li t1, 70
  divu s1, t0, t1
  ; arms.e16.ts:109  if (t > 31) t = 31
  li t0, 31
  bge t0, s1, .L5
  ; arms.e16.ts:109  t = 31
  li s1, 31 ; t
.L5:
  ; arms.e16.ts:110  vset(
  li a0, 18
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  call eVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 0
  call pVel
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  slli t1, s1, 10
  mv a0, t0
  mv a1, t1
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 19
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 1
  call eVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 1
  call pVel
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  slli t1, s1, 10
  mv a0, t0
  mv a1, t1
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 20
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 2
  call eVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 2
  call pVel
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  slli t1, s1, 10
  mv a0, t0
  mv a1, t1
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  li a0, 21
  mv a1, t2
  mv a2, t1
  mv a3, t0
  call vset
  ; arms.e16.ts:116  unitOf(V_T0)
  li a0, 21
  call unitOf
  ; arms.e16.ts:117  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  addi sp, sp, 6
  ret

; arms.e16.ts:121 unitOf(k) at -O1
;   k in s1
;   x in s2
;   y in s3
;   z in 0(fp)
;   len in 2(fp)
unitOf:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  ; arms.e16.ts:122  let x = vget(k)
  mv a0, s1
  call vget
  mv s2, a0 ; x
  ; arms.e16.ts:123  let y = vget(k + 1)
  addi a0, s1, 1
  call vget
  mv s3, a0 ; y
  ; arms.e16.ts:124  let z = vget(k + 2)
  addi a0, s1, 2
  call vget
  sw a0, 0(fp) ; z
  ; arms.e16.ts:125  while (vmax(x, y, z) >= 8192) {
  j .L3
.L1:
  ; arms.e16.ts:126  x = x >> 2
  srai s2, s2, 2
  ; arms.e16.ts:127  y = y >> 2
  srai s3, s3, 2
  ; arms.e16.ts:128  z = z >> 2
  lw t0, 0(fp) ; z
  srai t0, t0, 2
  sw t0, 0(fp) ; z
.L3:
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  call vmax
  li t0, 8192
  bge a0, t0, .L1
  ; arms.e16.ts:130  const len = vlen(x, y, z)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  call vlen
  sw a0, 2(fp) ; len
  ; arms.e16.ts:131  if (len === 0) return
  lw t0, 2(fp) ; len
  bne t0, zero, .L5
  ; arms.e16.ts:131  return
  j .return
.L5:
  ; arms.e16.ts:132  vec[k] = u16(signed(muldiv(u16(abs16(x)), 16384, len), x))
  slli t0, s1, 1
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  call abs16
  li a1, 16384
  lw a2, 2(fp)
  call muldiv
  mv a1, s2
  call signed
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; arms.e16.ts:133  vec[k + 1] = u16(signed(muldiv(u16(abs16(y)), 16384, len), y))
  addi t0, s1, 1
  slli t0, t0, 1
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s3
  call abs16
  li a1, 16384
  lw a2, 2(fp)
  call muldiv
  mv a1, s3
  call signed
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; arms.e16.ts:134  vec[k + 2] = u16(signed(muldiv(u16(abs16(z)), 16384, len), z))
  addi t0, s1, 2
  slli t0, t0, 1
  addi t0, t0, vec
  addi sp, sp, -2
  sw t0, 0(sp)
  lw a0, 0(fp)
  call abs16
  li a1, 16384
  lw a2, 2(fp)
  call muldiv
  lw a1, 0(fp)
  call signed
  lw t0, 0(sp)
  addi sp, sp, 2
  sw a0, 0(t0)
  ; arms.e16.ts:135  vunit(k)
  mv a0, s1
  call vunit
  ; arms.e16.ts:136  vunit(k)
  mv a0, s1
  call vunit
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; arms.e16.ts:139 scatter(spread) at -O1
;   spread in s1
scatter:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; spread
  ; arms.e16.ts:140  return ((i16(rand() & 255) - 128) * i16(spread)) >> 5
  call rand
  andi t0, a0, 255
  addi t0, t0, -128
  mul t0, t0, s1
  srai a0, t0, 5
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; arms.e16.ts:143 signed(v, like) at -O1
;   v in a0
;   like in a1
signed:
  ; arms.e16.ts:144  return like < 0 ? -i16(v) : i16(v)
  bge a1, zero, .L1
  neg t0, a0
  j .L2
.L1:
  mv t0, a0
.L2:
  mv a0, t0
.return:
  ret

; arms.e16.ts:151 enemyRound(spread) at -O1
;   spread in s1
enemyRound:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; spread
  ; arms.e16.ts:152  vec[V_T0] = u16(vget(V_EF) + scatter(spread))
  li a0, 9
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call scatter
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, vec+42(zero)
  ; arms.e16.ts:153  vec[V_T0 + 1] = vec[V_EF + 1]
  lw t0, vec+20(zero)
  sw t0, vec+44(zero)
  ; arms.e16.ts:154  vec[V_T0 + 2] = u16(vget(V_EF + 2) + scatter(spread))
  li a0, 11
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  mv a0, s1
  call scatter
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  sw t0, vec+46(zero)
  ; arms.e16.ts:155  gunVelocity(66, eVel(0), eVel(1), eVel(2))
  li a0, 0
  call eVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 1
  call eVel
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 2
  call eVel
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t1
  mv a2, t0
  mv a3, a0
  li a0, 66
  call gunVelocity
  ; arms.e16.ts:156  fireRound(
  li a0, 18
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 9
  call vget
  srai t0, a0, 9
  lw t1, 0(sp)
  addi sp, sp, 2
  add t1, t1, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 19
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 10
  call vget
  srai t0, a0, 9
  lw t1, 0(sp)
  addi sp, sp, 2
  add t1, t1, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 20
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  li a3, 2
  call fireRound
  ; arms.e16.ts:163  sparkAt(vget(V_REL), vget(V_REL + 1), vget(V_REL + 2))
  li a0, 18
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 19
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 20
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  la t0, sparkAt
  li t1, 260
  call far_call
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; arms.e16.ts:167 roundsStep() at -O1
;   px in s2
;   py in s3
;   pz in s0
;   k in s1
roundsStep:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  ; arms.e16.ts:168  hitsOnEnemy = 0
  sw zero, 0x183c(zero)
  ; arms.e16.ts:169  hitsOnPlayer = 0
  sw zero, 0x183e(zero)
  ; arms.e16.ts:170  const px = pVel(0) >> 4
  li a0, 0
  call pVel
  srai s2, a0, 4
  ; arms.e16.ts:171  const py = pVel(1) >> 4
  li a0, 1
  call pVel
  srai s3, a0, 4
  ; arms.e16.ts:172  const pz = pVel(2) >> 4
  li a0, 2
  call pVel
  srai s0, a0, 4
  ; arms.e16.ts:173  let k: u16 = 0
  li s1, 0 ; k
  ; arms.e16.ts:174  while (k < BN) {
  j .L3
.L1:
  ; arms.e16.ts:175  if (bLife[k] !== 0) roundStep(k, px, py, pz)
  slli t0, s1, 1
  lw t0, bLife(t0)
  beq t0, zero, .L5
  ; arms.e16.ts:175  roundStep(k, px, py, pz)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  mv a3, s0
  call roundStep
.L5:
  ; arms.e16.ts:176  k++
  addi s1, s1, 1
.L3:
  li t0, 24
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; arms.e16.ts:180 roundStep(k, px, py, pz) at -O1
;   k in s1
;   px in 2(fp)
;   py in 4(fp)
;   pz in 6(fp)
;   x in s2
;   y in s3
;   z in 0(fp)
roundStep:
  addi sp, sp, -18
  sw ra, 8(sp)
  sw s1, 10(sp)
  sw s2, 12(sp)
  sw s3, 14(sp)
  sw s0, 16(sp)
  mv fp, sp
  mv s1, a0 ; k
  sw a1, 2(fp) ; px
  sw a2, 4(fp) ; py
  sw a3, 6(fp) ; pz
  ; arms.e16.ts:181  bLife[k] = bLife[k] - 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, bLife(t1)
  addi t1, t1, -1
  sw t1, bLife(t0)
  ; arms.e16.ts:182  const x = i16(bX[k]) + i16(bVX[k]) - px
  slli t0, s1, 1
  lw t0, bX(t0)
  slli t1, s1, 1
  lw t1, bVX(t1)
  add t0, t0, t1
  lw t1, 2(fp) ; px
  sub s2, t0, t1
  ; arms.e16.ts:183  const y = i16(bY[k]) + i16(bVY[k]) - py
  slli t0, s1, 1
  lw t0, bY(t0)
  slli t1, s1, 1
  lw t1, bVY(t1)
  add t0, t0, t1
  lw t1, 4(fp) ; py
  sub s3, t0, t1
  ; arms.e16.ts:184  const z = i16(bZ[k]) + i16(bVZ[k]) - pz
  slli t0, s1, 1
  lw t0, bZ(t0)
  slli t1, s1, 1
  lw t1, bVZ(t1)
  add t0, t0, t1
  lw t1, 6(fp) ; pz
  sub t0, t0, t1
  sw t0, 0(fp) ; z
  ; arms.e16.ts:185  bX[k] = u16(x)
  slli t0, s1, 1
  sw s2, bX(t0)
  ; arms.e16.ts:186  bY[k] = u16(y)
  slli t0, s1, 1
  sw s3, bY(t0)
  ; arms.e16.ts:187  bZ[k] = u16(z)
  slli t0, s1, 1
  lw t1, 0(fp) ; z
  sw t1, bZ(t0)
  ; arms.e16.ts:188  if (bOwner[k] === 1 ? strikesEnemy(k, x, y, z) : strikesPlayer(x, y, z)) {
  slli t0, s1, 1
  lw t0, bOwner(t0)
  li t1, 1
  bne t0, t1, .L2
  mv a0, s1
  mv a1, s2
  mv a2, s3
  lw a3, 0(fp)
  call strikesEnemy
  mv t0, a0
  j .L3
.L2:
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  call strikesPlayer
  mv t0, a0
.L3:
  beqz t0, .L1
  ; arms.e16.ts:189  bLife[k] = 0
  slli t0, s1, 1
  sw zero, bLife(t0)
  ; arms.e16.ts:190  return
  j .return
.L1:
  ; arms.e16.ts:193  if ((k & 1) === 0) roundDraw(x, y, z)
  andi t0, s1, 1
  bne t0, zero, .L4
  ; arms.e16.ts:193  roundDraw(x, y, z)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  call roundDraw
.L4:
.return:
  mv sp, fp
  lw ra, 8(sp)
  lw s1, 10(sp)
  lw s2, 12(sp)
  lw s3, 14(sp)
  lw s0, 16(sp)
  addi sp, sp, 18
  ret

; arms.e16.ts:197 strikesEnemy(k, x, y, z) at -O1
;   k in 0(fp)
;   x in s1
;   y in s2
;   z in s3
;   ex in 2(fp)
;   ey in 4(fp)
;   ez in 6(fp)
;   near in 8(fp)
strikesEnemy:
  addi sp, sp, -20
  sw ra, 10(sp)
  sw s1, 12(sp)
  sw s2, 14(sp)
  sw s3, 16(sp)
  sw s0, 18(sp)
  mv fp, sp
  sw a0, 0(fp) ; k
  mv s1, a1 ; x
  mv s2, a2 ; y
  mv s3, a3 ; z
  ; arms.e16.ts:198  if (!eAlive) return false
  lw t0, 0x1600(zero)
  bnez t0, .L1
  ; arms.e16.ts:198  return false
  li a0, 0
  j .return
.L1:
  ; arms.e16.ts:199  const ex = vget(V_REL)
  li a0, 18
  call vget
  sw a0, 2(fp) ; ex
  ; arms.e16.ts:200  const ey = vget(V_REL + 1)
  li a0, 19
  call vget
  sw a0, 4(fp) ; ey
  ; arms.e16.ts:201  const ez = vget(V_REL + 2)
  li a0, 20
  call vget
  sw a0, 6(fp) ; ez
  ; arms.e16.ts:202  if (abs16(ex - x) > 160 || abs16(ey - y) > 160 || abs16(ez - z) > 160) return false
  lw t0, 2(fp) ; ex
  sub a0, t0, s1
  call abs16
  li t0, 160
  blt t0, a0, .L3
  lw t0, 4(fp) ; ey
  sub a0, t0, s2
  call abs16
  li t0, 160
  blt t0, a0, .L3
  lw t0, 6(fp) ; ez
  sub a0, t0, s3
  call abs16
  li t0, 160
  bge t0, a0, .L2
.L3:
  ; arms.e16.ts:202  return false
  li a0, 0
  j .return
.L2:
  ; arms.e16.ts:203  const near =
  lw t0, 2(fp) ; ex
  sub t0, t0, s1
  lw t1, 4(fp) ; ey
  sub t1, t1, s2
  lw t2, 6(fp) ; ez
  sub t2, t2, s3
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 64
  call within
  mv t1, a0
  mv t0, a0
  bnez t1, .L4
  lw t0, 2(fp) ; ex
  sub t0, t0, s1
  lw t1, 0(fp) ; k
  slli t1, t1, 1
  lw t1, bVX(t1)
  srai t1, t1, 1
  add t0, t0, t1
  lw t1, 4(fp) ; ey
  sub t1, t1, s2
  lw t2, 0(fp) ; k
  slli t2, t2, 1
  lw t2, bVY(t2)
  srai t2, t2, 1
  add t1, t1, t2
  lw t2, 6(fp) ; ez
  sub t2, t2, s3
  lw t3, 0(fp) ; k
  slli t3, t3, 1
  lw t3, bVZ(t3)
  srai t3, t3, 1
  add t2, t2, t3
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 64
  call within
  mv t0, a0
.L4:
  sw t0, 8(fp) ; near
  ; arms.e16.ts:211  if (!near) return false
  lw t0, 8(fp) ; near
  bnez t0, .L5
  ; arms.e16.ts:211  return false
  li a0, 0
  j .return
.L5:
  ; arms.e16.ts:212  hitsOnEnemy++
  lw t0, 0x183c(zero)
  addi t0, t0, 1
  sw t0, 0x183c(zero)
  ; arms.e16.ts:213  roundsHit++
  lw t0, 0x1842(zero)
  addi t0, t0, 1
  sw t0, 0x1842(zero)
  ; arms.e16.ts:214  sparkAt(x, y, z)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  la t0, sparkAt
  li t1, 260
  call far_call
  ; arms.e16.ts:215  banditHit(3)
  li a0, 3
  call banditHit
  ; arms.e16.ts:216  return true
  li a0, 1
.return:
  mv sp, fp
  lw ra, 10(sp)
  lw s1, 12(sp)
  lw s2, 14(sp)
  lw s3, 16(sp)
  lw s0, 18(sp)
  addi sp, sp, 20
  ret

; arms.e16.ts:219 strikesPlayer(x, y, z) at -O1
;   x in s1
;   y in s2
;   z in s3
strikesPlayer:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; z
  ; arms.e16.ts:220  if (!within(x, y, z, 40)) return false
  mv a0, s1
  mv a1, s2
  mv a2, s3
  li a3, 40
  call within
  bnez a0, .L1
  ; arms.e16.ts:220  return false
  li a0, 0
  j .return
.L1:
  ; arms.e16.ts:221  hitsOnPlayer++
  lw t0, 0x183e(zero)
  addi t0, t0, 1
  sw t0, 0x183e(zero)
  ; arms.e16.ts:222  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; arms.e16.ts:225 within(x, y, z, r) at -O1
;   x in s2
;   y in s3
;   z in s0
;   r in s1
within:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s3, 4(sp)
  sw s0, 6(sp)
  sw s1, 8(sp)
  mv s2, a0 ; x
  mv s3, a1 ; y
  mv s0, a2 ; z
  mv s1, a3 ; r
  ; arms.e16.ts:226  if (abs16(x) > r || abs16(y) > r || abs16(z) > r) return false
  mv a0, s2
  call abs16
  blt s1, a0, .L2
  mv a0, s3
  call abs16
  blt s1, a0, .L2
  mv a0, s0
  call abs16
  bge s1, a0, .L1
.L2:
  ; arms.e16.ts:226  return false
  li a0, 0
  j .return
.L1:
  ; arms.e16.ts:227  return vlen(x, y, z) < u16(r)
  mv a0, s2
  mv a1, s3
  mv a2, s0
  call vlen
  sltu a0, a0, s1
.return:
  lw ra, 0(sp)
  lw s2, 2(sp)
  lw s3, 4(sp)
  lw s0, 6(sp)
  lw s1, 8(sp)
  addi sp, sp, 10
  ret

; arms.e16.ts:231 roundDraw(x, y, z) at -O1
;   x in s1
;   y in s2
;   z in s3
;   f in s0
roundDraw:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; z
  ; arms.e16.ts:232  vset(V_T0, x, y, z)
  li a0, 21
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call vset
  ; arms.e16.ts:233  toBody(V_T0)
  li a0, 21
  call toBody
  ; arms.e16.ts:234  if (!project() || !abovePanel(scrY, 4)) return
  call project
  beqz a0, .L2
  lw a0, 0x15ae(zero)
  li a1, 4
  call abovePanel
  bnez a0, .L1
.L2:
  ; arms.e16.ts:234  return
  j .return
.L1:
  ; arms.e16.ts:235  const f: u16 = bodyZ < 260 ? 0 : bodyZ < 700 ? 1 : bodyZ < 1500 ? 2 : 3
  lw t0, 0x15aa(zero)
  li t1, 260
  bge t0, t1, .L3
  li t0, 0
  j .L4
.L3:
  lw t0, 0x15aa(zero)
  li t1, 700
  bge t0, t1, .L5
  li t0, 1
  j .L6
.L5:
  lw t0, 0x15aa(zero)
  li t1, 1500
  bge t0, t1, .L7
  li t0, 2
  j .L8
.L7:
  li t0, 3
.L8:
.L6:
.L4:
  mv s0, t0 ; f
  ; arms.e16.ts:236  spr(scrX - 4, scrY - 4, (SHOTS_TILE + f) | ((SL_SHOT - 8) << 10), S8)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  addi t2, s0, 333
  ori t2, t2, 4096
  addi a0, t0, -4
  addi a1, t1, -4
  mv a2, t2
  li a3, 0
  call spr
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; arms.e16.ts:265 armsNew() at -O1
;   k in a0
armsNew:
  ; arms.e16.ts:266  let k: u16 = 0
  li a0, 0 ; k
  ; arms.e16.ts:267  while (k < BN) {
  j .L3
.L1:
  ; arms.e16.ts:268  bLife[k] = 0
  slli t0, a0, 1
  sw zero, bLife(t0)
  ; arms.e16.ts:269  k++
  addi a0, a0, 1
.L3:
  li t0, 24
  bltu a0, t0, .L1
  ; arms.e16.ts:271  k = 0
  li a0, 0 ; k
  ; arms.e16.ts:272  while (k < MN) {
  j .L7
.L5:
  ; arms.e16.ts:273  mOwner[k] = 0
  slli t0, a0, 1
  sw zero, mOwner(t0)
  ; arms.e16.ts:274  k++
  addi a0, a0, 1
.L7:
  li t0, 6
  bltu a0, t0, .L5
  ; arms.e16.ts:276  k = 0
  li a0, 0 ; k
  ; arms.e16.ts:277  while (k < FN) {
  j .L11
.L9:
  ; arms.e16.ts:278  fLife[k] = 0
  slli t0, a0, 1
  sw zero, fLife(t0)
  ; arms.e16.ts:279  k++
  addi a0, a0, 1
.L11:
  li t0, 8
  bltu a0, t0, .L9
  ; arms.e16.ts:281  missilesLeft = 32
  li t0, 32
  sw t0, 0x18ca(zero)
  ; arms.e16.ts:282  flaresLeft = 24
  li t0, 24
  sw t0, 0x18cc(zero)
  ; arms.e16.ts:283  lockT = 0
  sw zero, 0x1924(zero)
  ; arms.e16.ts:284  locked = false
  sw zero, 0x1926(zero)
  ; arms.e16.ts:285  roundsFired = 0
  sw zero, 0x1840(zero)
  ; arms.e16.ts:286  roundsHit = 0
  sw zero, 0x1842(zero)
  ; arms.e16.ts:287  missileCool = 0
  sw zero, 0x18ce(zero)
  ; arms.e16.ts:288  flareCool = 0
  sw zero, 0x1922(zero)
.return:
  ret

; arms.e16.ts:291 missileSlot() at -O1
;   k in a0
missileSlot:
  ; arms.e16.ts:292  let k: u16 = 0
  li a0, 0 ; k
  ; arms.e16.ts:293  while (k < MN) {
  j .L3
.L1:
  ; arms.e16.ts:294  if (mOwner[k] === 0) return k
  slli t0, a0, 1
  lw t0, mOwner(t0)
  bne t0, zero, .L5
  ; arms.e16.ts:294  return k
  ret
.L5:
  ; arms.e16.ts:295  k++
  addi a0, a0, 1
.L3:
  li t0, 6
  bltu a0, t0, .L1
  ; arms.e16.ts:297  return MN
  li a0, 6
.return:
  ret

; arms.e16.ts:301 launch(owner, dir, speed, chase) at -O1
;   owner in s3
;   dir in s2
;   speed in 0(fp)
;   chase in 2(fp)
;   k in s1
launch:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s3, 6(sp)
  sw s2, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s3, a0 ; owner
  mv s2, a1 ; dir
  sw a2, 0(fp) ; speed
  sw a3, 2(fp) ; chase
  ; arms.e16.ts:302  const k = missileSlot()
  call missileSlot
  mv s1, a0 ; k
  ; arms.e16.ts:303  if (k === MN) return
  li t0, 6
  bne s1, t0, .L1
  ; arms.e16.ts:303  return
  j .return
.L1:
  ; arms.e16.ts:304  mOwner[k] = owner
  slli t0, s1, 1
  sw s3, mOwner(t0)
  ; arms.e16.ts:305  mChase[k] = chase
  slli t0, s1, 1
  lw t1, 2(fp) ; chase
  sw t1, mChase(t0)
  ; arms.e16.ts:306  mX[k] = vec[V_T1]
  slli t0, s1, 1
  lw t1, vec+48(zero)
  sw t1, mX(t0)
  ; arms.e16.ts:307  mY[k] = vec[V_T1 + 1]
  slli t0, s1, 1
  lw t1, vec+50(zero)
  sw t1, mY(t0)
  ; arms.e16.ts:308  mZ[k] = vec[V_T1 + 2]
  slli t0, s1, 1
  lw t1, vec+52(zero)
  sw t1, mZ(t0)
  ; arms.e16.ts:309  mDX[k] = vec[dir]
  slli t0, s1, 1
  slli t1, s2, 1
  lw t1, vec(t1)
  sw t1, mDX(t0)
  ; arms.e16.ts:310  mDY[k] = vec[dir + 1]
  slli t0, s1, 1
  addi t1, s2, 1
  slli t1, t1, 1
  lw t1, vec(t1)
  sw t1, mDY(t0)
  ; arms.e16.ts:311  mDZ[k] = vec[dir + 2]
  slli t0, s1, 1
  addi t1, s2, 2
  slli t1, t1, 1
  lw t1, vec(t1)
  sw t1, mDZ(t0)
  ; arms.e16.ts:312  mSpeed[k] = u16(speed)
  slli t0, s1, 1
  lw t1, 0(fp) ; speed
  sw t1, mSpeed(t0)
  ; arms.e16.ts:313  mLife[k] = 300
  slli t0, s1, 1
  li t1, 300
  sw t1, mLife(t0)
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s3, 6(sp)
  lw s2, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; arms.e16.ts:317 playerMissile() at -O1
;   side in s1
playerMissile:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; arms.e16.ts:318  missileFired = false
  sw zero, 0x18d6(zero)
  ; arms.e16.ts:319  if (missileCool > 0) missileCool--
  lw t0, 0x18ce(zero)
  bgeu zero, t0, .L1
  ; arms.e16.ts:319  missileCool--
  lw t0, 0x18ce(zero)
  addi t0, t0, -1
  sw t0, 0x18ce(zero)
.L1:
  ; arms.e16.ts:320  if (!pressed(B_B) || missileCool > 0 || missilesLeft === 0) return
  li a0, 32
  call pressed
  beqz a0, .L3
  lw t0, 0x18ce(zero)
  bltu zero, t0, .L3
  lw t0, 0x18ca(zero)
  bne t0, zero, .L2
.L3:
  ; arms.e16.ts:320  return
  j .return
.L2:
  ; arms.e16.ts:321  missileCool = 24
  li t0, 24
  sw t0, 0x18ce(zero)
  ; arms.e16.ts:322  missilesLeft--
  lw t0, 0x18ca(zero)
  addi t0, t0, -1
  sw t0, 0x18ca(zero)
  ; arms.e16.ts:323  missileFired = true
  li t0, 1
  sw t0, 0x18d6(zero)
  ; arms.e16.ts:324  const side: i16 = (missilesLeft & 1) === 0 ? 14 : -14
  lw t0, 0x18ca(zero)
  andi t0, t0, 1
  bne t0, zero, .L4
  li t0, 14
  j .L5
.L4:
  li t0, 65522
.L5:
  mv s1, t0 ; side
  ; arms.e16.ts:325  vset(
  li a0, 3
  call vget
  mv a1, s1
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 6
  call vget
  li a1, 8
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 4
  call vget
  mv a1, s1
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 7
  call vget
  li a1, 8
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 5
  call vget
  mv a1, s1
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 8
  call vget
  li a1, 8
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  sub t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  li a0, 24
  mv a1, t2
  mv a2, t1
  mv a3, t0
  call vset
  ; arms.e16.ts:331  launch(1, V_PF, (pSpeed >> 4) + 4, locked ? 0 : 2)
  lw t0, 0x15b0(zero)
  srai t0, t0, 4
  lw t1, 0x1926(zero)
  addi t2, t0, 4
  li t0, 1
  mv t3, t1
  li t1, 0
  beqz t3, .L6
  li t3, 0
  j .L7
.L6:
  li t3, 2
.L7:
  mv a0, t0
  mv a1, t1
  mv a2, t2
  mv a3, t3
  call launch
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; arms.e16.ts:335 enemyMissile() at -O1
enemyMissile:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; arms.e16.ts:336  vset(
  li a0, 18
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 15
  call vget
  srai t0, a0, 10
  lw t1, 0(sp)
  addi sp, sp, 2
  sub t1, t1, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 19
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 16
  call vget
  srai t0, a0, 10
  lw t1, 0(sp)
  addi sp, sp, 2
  sub t1, t1, t0
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 20
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 17
  call vget
  srai t0, a0, 10
  lw t1, 0(sp)
  addi sp, sp, 2
  sub t1, t1, t0
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  li a0, 24
  mv a1, t2
  mv a2, t0
  mv a3, t1
  call vset
  ; arms.e16.ts:342  launch(2, V_EF, (eSpeed >> 4) + 4, 0)
  lw t0, 0x15f8(zero)
  srai t0, t0, 4
  li a0, 2
  li a1, 9
  addi a2, t0, 4
  li a3, 0
  call launch
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; arms.e16.ts:349 missilesStep() at -O1
;   k in s1
missilesStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; arms.e16.ts:350  missileStruck = 0
  sw zero, 0x18d4(zero)
  ; arms.e16.ts:351  missileDodged = 0
  sw zero, 0x18da(zero)
  ; arms.e16.ts:352  warned = false
  sw zero, 0x18d0(zero)
  ; arms.e16.ts:353  warnDist = 0xffff
  li t0, 65535
  sw t0, 0x18d2(zero)
  ; arms.e16.ts:354  threatDist = 0xffff
  li t0, 65535
  sw t0, 0x18d8(zero)
  ; arms.e16.ts:355  let k: u16 = 0
  li s1, 0 ; k
  ; arms.e16.ts:356  while (k < MN) {
  j .L3
.L1:
  ; arms.e16.ts:357  if (mOwner[k] !== 0) missileStep(k)
  slli t0, s1, 1
  lw t0, mOwner(t0)
  beq t0, zero, .L5
  ; arms.e16.ts:357  missileStep(k)
  mv a0, s1
  call missileStep
.L5:
  ; arms.e16.ts:358  k++
  addi s1, s1, 1
.L3:
  li t0, 6
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; arms.e16.ts:362 missileStep(k) at -O1
;   k in s1
;   s in 4(fp)
;   x in s2
;   y in s3
;   z in 0(fp)
;   d in 2(fp)
missileStep:
  addi sp, sp, -16
  sw ra, 6(sp)
  sw s1, 8(sp)
  sw s2, 10(sp)
  sw s3, 12(sp)
  sw s0, 14(sp)
  mv fp, sp
  mv s1, a0 ; k
  ; arms.e16.ts:363  mLife[k] = mLife[k] - 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, mLife(t1)
  addi t1, t1, -1
  sw t1, mLife(t0)
  ; arms.e16.ts:364  if (mLife[k] === 0) {
  slli t0, s1, 1
  lw t0, mLife(t0)
  bne t0, zero, .L1
  ; arms.e16.ts:365  mOwner[k] = 0
  slli t0, s1, 1
  sw zero, mOwner(t0)
  ; arms.e16.ts:366  puffAt(i16(mX[k]), i16(mY[k]), i16(mZ[k]), 1)
  slli t0, s1, 1
  lw t0, mX(t0)
  slli t1, s1, 1
  lw t1, mY(t1)
  slli t2, s1, 1
  lw t2, mZ(t2)
  mv a0, t0
  mv a1, t1
  mv a2, t2
  li a3, 1
  la t0, puffAt
  li t1, 260
  call far_call
  ; arms.e16.ts:367  return
  j .return
.L1:
  ; arms.e16.ts:369  if (mSpeed[k] < 50) mSpeed[k] = mSpeed[k] + 1
  slli t0, s1, 1
  lw t0, mSpeed(t0)
  li t1, 50
  bgeu t0, t1, .L2
  ; arms.e16.ts:369  mSpeed[k] = mSpeed[k] + 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, mSpeed(t1)
  addi t1, t1, 1
  sw t1, mSpeed(t0)
.L2:
  ; arms.e16.ts:370  if (mChase[k] !== 2) missileSteer(k)
  slli t0, s1, 1
  lw t0, mChase(t0)
  li t1, 2
  beq t0, t1, .L3
  ; arms.e16.ts:370  missileSteer(k)
  mv a0, s1
  call missileSteer
.L3:
  ; arms.e16.ts:371  const s = i16(mSpeed[k])
  slli t0, s1, 1
  lw t0, mSpeed(t0)
  sw t0, 4(fp) ; s
  ; arms.e16.ts:372  const x = i16(mX[k]) + mulq(i16(mDX[k]), s) - (pVel(0) >> 4)
  slli t0, s1, 1
  lw t0, mX(t0)
  slli t1, s1, 1
  lw t1, mDX(t1)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  lw a1, 4(fp)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 0
  call pVel
  srai t0, a0, 4
  lw t1, 0(sp)
  addi sp, sp, 2
  sub s2, t1, t0
  ; arms.e16.ts:373  const y = i16(mY[k]) + mulq(i16(mDY[k]), s) - (pVel(1) >> 4)
  slli t0, s1, 1
  lw t0, mY(t0)
  slli t1, s1, 1
  lw t1, mDY(t1)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  lw a1, 4(fp)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 1
  call pVel
  srai t0, a0, 4
  lw t1, 0(sp)
  addi sp, sp, 2
  sub s3, t1, t0
  ; arms.e16.ts:374  const z = i16(mZ[k]) + mulq(i16(mDZ[k]), s) - (pVel(2) >> 4)
  slli t0, s1, 1
  lw t0, mZ(t0)
  slli t1, s1, 1
  lw t1, mDZ(t1)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, t1
  lw a1, 4(fp)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 2
  call pVel
  srai t0, a0, 4
  lw t1, 0(sp)
  addi sp, sp, 2
  sub t1, t1, t0
  sw t1, 0(fp) ; z
  ; arms.e16.ts:375  mX[k] = u16(x)
  slli t0, s1, 1
  sw s2, mX(t0)
  ; arms.e16.ts:376  mY[k] = u16(y)
  slli t0, s1, 1
  sw s3, mY(t0)
  ; arms.e16.ts:377  mZ[k] = u16(z)
  slli t0, s1, 1
  lw t1, 0(fp) ; z
  sw t1, mZ(t0)
  ; arms.e16.ts:378  if (mLife[k] % 6 === 0) puffAt(x, y, z, 0)
  slli t0, s1, 1
  lw t0, mLife(t0)
  li t1, 6
  remu t0, t0, t1
  bne t0, zero, .L4
  ; arms.e16.ts:378  puffAt(x, y, z, 0)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  li a3, 0
  la t0, puffAt
  li t1, 260
  call far_call
.L4:
  ; arms.e16.ts:379  if (missileArrives(k, x, y, z)) return
  mv a0, s1
  mv a1, s2
  mv a2, s3
  lw a3, 0(fp)
  call missileArrives
  beqz a0, .L5
  ; arms.e16.ts:379  return
  j .return
.L5:
  ; arms.e16.ts:380  if (mOwner[k] === 2 && mChase[k] === 0) {
  slli t0, s1, 1
  lw t0, mOwner(t0)
  li t1, 2
  bne t0, t1, .L6
  slli t0, s1, 1
  lw t0, mChase(t0)
  bne t0, zero, .L6
  ; arms.e16.ts:381  warned = true
  li t0, 1
  sw t0, 0x18d0(zero)
  ; arms.e16.ts:382  const d = vlen(x, y, z)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  call vlen
  sw a0, 2(fp) ; d
  ; arms.e16.ts:383  if (d < warnDist) warnDist = d
  lw t0, 0x18d2(zero)
  lw t1, 2(fp) ; d
  bgeu t1, t0, .L8
  ; arms.e16.ts:383  warnDist = d
  lw t0, 2(fp) ; d
  sw t0, 0x18d2(zero)
  j .L8
.L6:
  ; arms.e16.ts:384  if (mOwner[k] === 1 && mChase[k] === 0) {
  slli t0, s1, 1
  lw t0, mOwner(t0)
  li t1, 1
  bne t0, t1, .L9
  slli t0, s1, 1
  lw t0, mChase(t0)
  bne t0, zero, .L9
  ; arms.e16.ts:385  const d = vlen(vget(V_REL) - x, vget(V_REL + 1) - y, vget(V_REL + 2) - z)
  li a0, 18
  call vget
  sub t0, a0, s2
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 19
  call vget
  sub t0, a0, s3
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 20
  call vget
  lw t0, 0(fp) ; z
  sub t0, a0, t0
  lw t1, 0(sp)
  addi sp, sp, 2
  lw t2, 0(sp)
  addi sp, sp, 2
  mv a0, t2
  mv a1, t1
  mv a2, t0
  call vlen
  sw a0, 2(fp) ; d
  ; arms.e16.ts:386  if (d < threatDist) threatDist = d
  lw t0, 0x18d8(zero)
  lw t1, 2(fp) ; d
  bgeu t1, t0, .L10
  ; arms.e16.ts:386  threatDist = d
  lw t0, 2(fp) ; d
  sw t0, 0x18d8(zero)
.L10:
.L9:
.L8:
  ; arms.e16.ts:388  missileDraw(x, y, z)
  mv a0, s2
  mv a1, s3
  lw a2, 0(fp)
  call missileDraw
.return:
  mv sp, fp
  lw ra, 6(sp)
  lw s1, 8(sp)
  lw s2, 10(sp)
  lw s3, 12(sp)
  lw s0, 14(sp)
  addi sp, sp, 16
  ret

; arms.e16.ts:392 quarry(k) at -O1
;   k in s1
;   tx in s2
;   ty in s3
;   tz in 0(fp)
;   f in 2(fp)
quarry:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s1, 6(sp)
  sw s2, 8(sp)
  sw s3, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s1, a0 ; k
  ; arms.e16.ts:393  let tx: i16 = 0
  li s2, 0 ; tx
  ; arms.e16.ts:394  let ty: i16 = 0
  li s3, 0 ; ty
  ; arms.e16.ts:395  let tz: i16 = 0
  sw zero, 0(fp) ; tz
  ; arms.e16.ts:396  if (mChase[k] === 1) {
  slli t0, s1, 1
  lw t0, mChase(t0)
  li t1, 1
  bne t0, t1, .L1
  ; arms.e16.ts:397  const f = mFlare[k]
  slli t0, s1, 1
  lw t0, mFlare(t0)
  sw t0, 2(fp) ; f
  ; arms.e16.ts:398  tx = i16(fX[f])
  lw t0, 2(fp) ; f
  slli t0, t0, 1
  lw s2, fX(t0)
  ; arms.e16.ts:399  ty = i16(fY[f])
  lw t0, 2(fp) ; f
  slli t0, t0, 1
  lw s3, fY(t0)
  ; arms.e16.ts:400  tz = i16(fZ[f])
  lw t0, 2(fp) ; f
  slli t0, t0, 1
  lw t0, fZ(t0)
  sw t0, 0(fp) ; tz
  j .L2
.L1:
  ; arms.e16.ts:401  if (mOwner[k] === 1) {
  slli t0, s1, 1
  lw t0, mOwner(t0)
  li t1, 1
  bne t0, t1, .L3
  ; arms.e16.ts:402  tx = vget(V_REL)
  li a0, 18
  call vget
  mv s2, a0 ; tx
  ; arms.e16.ts:403  ty = vget(V_REL + 1)
  li a0, 19
  call vget
  mv s3, a0 ; ty
  ; arms.e16.ts:404  tz = vget(V_REL + 2)
  li a0, 20
  call vget
  sw a0, 0(fp) ; tz
.L3:
.L2:
  ; arms.e16.ts:406  vset(V_T0, tx - i16(mX[k]), ty - i16(mY[k]), tz - i16(mZ[k]))
  slli t0, s1, 1
  lw t0, mX(t0)
  sub t0, s2, t0
  slli t1, s1, 1
  lw t1, mY(t1)
  sub t1, s3, t1
  slli t2, s1, 1
  lw t2, mZ(t2)
  lw t3, 0(fp) ; tz
  sub t3, t3, t2
  li a0, 21
  mv a1, t0
  mv a2, t1
  mv a3, t3
  call vset
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s1, 6(sp)
  lw s2, 8(sp)
  lw s3, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; arms.e16.ts:410 missileSteer(k) at -O1
;   k in s1
;   ahead in s3
;   turn in s2
missileSteer:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s3, 4(sp)
  sw s2, 6(sp)
  mv s1, a0 ; k
  ; arms.e16.ts:411  quarry(k)
  mv a0, s1
  call quarry
  ; arms.e16.ts:412  unitOf(V_T0)
  li a0, 21
  call unitOf
  ; arms.e16.ts:414  const ahead =
  li a0, 21
  call vget
  slli t0, s1, 1
  lw a1, mDX(t0)
  call mulq
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 22
  call vget
  slli t0, s1, 1
  lw a1, mDY(t0)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 23
  call vget
  slli t0, s1, 1
  lw a1, mDZ(t0)
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add s3, t0, a0
  ; arms.e16.ts:418  if (ahead < 4000) {
  li t0, 4000
  bge s3, t0, .L1
  ; arms.e16.ts:419  mChase[k] = 2
  slli t0, s1, 1
  li t1, 2
  sw t1, mChase(t0)
  ; arms.e16.ts:420  return
  j .return
.L1:
  ; arms.e16.ts:422  const turn = i16(mOwner[k] === 1 ? 760 : 620)
  slli t0, s1, 1
  lw t0, mOwner(t0)
  li t1, 1
  bne t0, t1, .L2
  li t0, 760
  j .L3
.L2:
  li t0, 620
.L3:
  mv s2, t0 ; turn
  ; arms.e16.ts:423  mDX[k] = u16(i16(mDX[k]) + mulq(vget(V_T0) - i16(mDX[k]), turn))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, mDX(t1)
  addi t0, t0, mDX
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 21
  call vget
  slli t0, s1, 1
  lw t0, mDX(t0)
  sub a0, a0, t0
  mv a1, s2
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; arms.e16.ts:424  mDY[k] = u16(i16(mDY[k]) + mulq(vget(V_T0 + 1) - i16(mDY[k]), turn))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, mDY(t1)
  addi t0, t0, mDY
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 22
  call vget
  slli t0, s1, 1
  lw t0, mDY(t0)
  sub a0, a0, t0
  mv a1, s2
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; arms.e16.ts:425  mDZ[k] = u16(i16(mDZ[k]) + mulq(vget(V_T0 + 2) - i16(mDZ[k]), turn))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, mDZ(t1)
  addi t0, t0, mDZ
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 23
  call vget
  slli t0, s1, 1
  lw t0, mDZ(t0)
  sub a0, a0, t0
  mv a1, s2
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  lw t1, 0(sp)
  addi sp, sp, 2
  sw t0, 0(t1)
  ; arms.e16.ts:426  vset(V_T0, i16(mDX[k]), i16(mDY[k]), i16(mDZ[k]))
  slli t0, s1, 1
  lw t0, mDX(t0)
  slli t1, s1, 1
  lw t1, mDY(t1)
  slli t2, s1, 1
  lw t2, mDZ(t2)
  li a0, 21
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call vset
  ; arms.e16.ts:427  vunit(V_T0)
  li a0, 21
  call vunit
  ; arms.e16.ts:428  mDX[k] = vec[V_T0]
  slli t0, s1, 1
  lw t1, vec+42(zero)
  sw t1, mDX(t0)
  ; arms.e16.ts:429  mDY[k] = vec[V_T0 + 1]
  slli t0, s1, 1
  lw t1, vec+44(zero)
  sw t1, mDY(t0)
  ; arms.e16.ts:430  mDZ[k] = vec[V_T0 + 2]
  slli t0, s1, 1
  lw t1, vec+46(zero)
  sw t1, mDZ(t0)
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s3, 4(sp)
  lw s2, 6(sp)
  addi sp, sp, 8
  ret

; arms.e16.ts:434 missileArrives(k, x, y, z) at -O1
;   k in s1
;   x in s2
;   y in s3
;   z in s0
missileArrives:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; k
  mv s2, a1 ; x
  mv s3, a2 ; y
  mv s0, a3 ; z
  ; arms.e16.ts:435  if (mChase[k] === 2) return false
  slli t0, s1, 1
  lw t0, mChase(t0)
  li t1, 2
  bne t0, t1, .L1
  ; arms.e16.ts:435  return false
  li a0, 0
  j .return
.L1:
  ; arms.e16.ts:436  quarry(k)
  mv a0, s1
  call quarry
  ; arms.e16.ts:437  if (!within(vget(V_T0), vget(V_T0 + 1), vget(V_T0 + 2), 80)) return false
  li a0, 21
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 22
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 23
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  li a3, 80
  call within
  bnez a0, .L2
  ; arms.e16.ts:437  return false
  li a0, 0
  j .return
.L2:
  ; arms.e16.ts:439  headOn =
  slli t0, s1, 1
  lw t0, mDX(t0)
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 9
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call mulq
  slli t0, s1, 1
  lw t0, mDY(t0)
  addi sp, sp, -2
  sw a0, 0(sp)
  addi sp, sp, -2
  sw t0, 0(sp)
  li a0, 10
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  slli t1, s1, 1
  lw t1, mDZ(t1)
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 11
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  mv a1, a0
  mv a0, t0
  call mulq
  lw t0, 0(sp)
  addi sp, sp, 2
  add t0, t0, a0
  slti t0, t0, -8000
  sw t0, 0x18dc(zero)
  ; arms.e16.ts:444  mOwner[k] =
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, mOwner(t1)
  addi t0, t0, mOwner
  li t2, 1
  bne t1, t2, .L3
  slli t1, s1, 1
  lw t1, mChase(t1)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  mv a1, s3
  mv a2, s0
  mv a3, t1
  call hitByMissile
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
  j .L4
.L3:
  slli t1, s1, 1
  lw t1, mChase(t1)
  addi sp, sp, -2
  sw t0, 0(sp)
  mv a0, s2
  mv a1, s3
  mv a2, s0
  mv a3, t1
  call hitPlayerMissile
  lw t0, 0(sp)
  addi sp, sp, 2
  mv t1, a0
.L4:
  sw t1, 0(t0)
  ; arms.e16.ts:446  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; arms.e16.ts:452 hitByMissile(x, y, z, chase) at -O1
;   x in s1
;   y in s2
;   z in s3
;   chase in s0
hitByMissile:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; z
  mv s0, a3 ; chase
  ; arms.e16.ts:453  boomAt(x, y, z)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  la t0, boomAt
  li t1, 260
  call far_call
  ; arms.e16.ts:454  if (chase !== 0 || !eAlive) return 0
  bne s0, zero, .L2
  lw t0, 0x1600(zero)
  bnez t0, .L1
.L2:
  ; arms.e16.ts:454  return 0
  li a0, 0
  j .return
.L1:
  ; arms.e16.ts:456  if (aiEvading && randBelow(100) < aiDodge) {
  lw t0, 0x1b6a(zero)
  beqz t0, .L3
  li a0, 100
  call randBelow
  lw t0, 0x1b6c(zero)
  bgeu a0, t0, .L3
  ; arms.e16.ts:457  missileDodged = 1
  li t0, 1
  sw t0, 0x18da(zero)
  ; arms.e16.ts:458  banditHit(4)
  li a0, 4
  call banditHit
  ; arms.e16.ts:459  return 0
  li a0, 0
  j .return
.L3:
  ; arms.e16.ts:461  missileStruck = 1
  li t0, 1
  sw t0, 0x18d4(zero)
  ; arms.e16.ts:462  banditHit(headOn ? 18 : 30)
  lw t0, 0x18dc(zero)
  beqz t0, .L4
  li t0, 18
  j .L5
.L4:
  li t0, 30
.L5:
  mv a0, t0
  call banditHit
  ; arms.e16.ts:463  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; arms.e16.ts:472 missileOnClear() at -O1
missileOnClear:
  ; arms.e16.ts:473  missileOnPlayer = false
  sw zero, 0x18de(zero)
.return:
  ret

; arms.e16.ts:476 hitPlayerMissile(x, y, z, chase) at -O1
;   x in s1
;   y in s2
;   z in s3
;   chase in s0
hitPlayerMissile:
  addi sp, sp, -10
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  sw s0, 8(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; z
  mv s0, a3 ; chase
  ; arms.e16.ts:477  boomAt(x, y, z)
  mv a0, s1
  mv a1, s2
  mv a2, s3
  la t0, boomAt
  li t1, 260
  call far_call
  ; arms.e16.ts:478  if (chase === 0) missileOnPlayer = true
  bne s0, zero, .L1
  ; arms.e16.ts:478  missileOnPlayer = true
  li t0, 1
  sw t0, 0x18de(zero)
.L1:
  ; arms.e16.ts:479  return 0
  li a0, 0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  lw s0, 8(sp)
  addi sp, sp, 10
  ret

; arms.e16.ts:482 missileDraw(x, y, z) at -O1
;   x in s1
;   y in s2
;   z in s3
missileDraw:
  addi sp, sp, -8
  sw ra, 0(sp)
  sw s1, 2(sp)
  sw s2, 4(sp)
  sw s3, 6(sp)
  mv s1, a0 ; x
  mv s2, a1 ; y
  mv s3, a2 ; z
  ; arms.e16.ts:483  vset(V_T0, x, y, z)
  li a0, 21
  mv a1, s1
  mv a2, s2
  mv a3, s3
  call vset
  ; arms.e16.ts:484  toBody(V_T0)
  li a0, 21
  call toBody
  ; arms.e16.ts:485  if (!project() || !abovePanel(scrY, 4)) return
  call project
  beqz a0, .L2
  lw a0, 0x15ae(zero)
  li a1, 4
  call abovePanel
  bnez a0, .L1
.L2:
  ; arms.e16.ts:485  return
  j .return
.L1:
  ; arms.e16.ts:486  spr(scrX - 4, scrY - 4, (SHOTS_TILE + 4 + (rand() & 1)) | ((SL_SHOT - 8) << 10), S8)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  addi t0, t0, -4
  addi sp, sp, -2
  sw t0, 0(sp)
  addi t1, t1, -4
  addi sp, sp, -2
  sw t1, 0(sp)
  call rand
  andi t0, a0, 1
  addi t0, t0, 337
  ori t0, t0, 4096
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
  lw ra, 0(sp)
  lw s1, 2(sp)
  lw s2, 4(sp)
  lw s3, 6(sp)
  addi sp, sp, 8
  ret

; arms.e16.ts:490 missileAt(k) at -O1
;   k in a0
missileAt:
  ; arms.e16.ts:491  return mOwner[k]
  slli t0, a0, 1
  lw a0, mOwner(t0)
.return:
  ret

; arms.e16.ts:494 missileX(k) at -O1
;   k in a0
missileX:
  ; arms.e16.ts:495  return i16(mX[k])
  slli t0, a0, 1
  lw a0, mX(t0)
.return:
  ret

; arms.e16.ts:498 missileY(k) at -O1
;   k in a0
missileY:
  ; arms.e16.ts:499  return i16(mY[k])
  slli t0, a0, 1
  lw a0, mY(t0)
.return:
  ret

; arms.e16.ts:515 playerFlares() at -O1
playerFlares:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; arms.e16.ts:516  if (flareCool > 0) flareCool--
  lw t0, 0x1922(zero)
  bgeu zero, t0, .L1
  ; arms.e16.ts:516  flareCool--
  lw t0, 0x1922(zero)
  addi t0, t0, -1
  sw t0, 0x1922(zero)
.L1:
  ; arms.e16.ts:517  if (!pressed(B_X) || flareCool > 0 || flaresLeft === 0) return false
  li a0, 64
  call pressed
  beqz a0, .L3
  lw t0, 0x1922(zero)
  bltu zero, t0, .L3
  lw t0, 0x18cc(zero)
  bne t0, zero, .L2
.L3:
  ; arms.e16.ts:517  return false
  li a0, 0
  j .return
.L2:
  ; arms.e16.ts:518  flareCool = 20
  li t0, 20
  sw t0, 0x1922(zero)
  ; arms.e16.ts:519  flaresLeft--
  lw t0, 0x18cc(zero)
  addi t0, t0, -1
  sw t0, 0x18cc(zero)
  ; arms.e16.ts:520  flarePair(0, 0, 0, 2)
  li a0, 0
  li a1, 0
  li a2, 0
  li a3, 2
  call flarePair
  ; arms.e16.ts:521  return true
  li a0, 1
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; arms.e16.ts:525 enemyFlares(odds) at -O1
;   odds in s2
;   k in s1
enemyFlares:
  addi sp, sp, -6
  sw ra, 0(sp)
  sw s2, 2(sp)
  sw s1, 4(sp)
  mv s2, a0 ; odds
  ; arms.e16.ts:526  flarePair(vget(V_REL), vget(V_REL + 1), vget(V_REL + 2), 1)
  li a0, 18
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 19
  call vget
  addi sp, sp, -2
  sw a0, 0(sp)
  li a0, 20
  call vget
  lw t0, 0(sp)
  addi sp, sp, 2
  lw t1, 0(sp)
  addi sp, sp, 2
  mv a1, t0
  mv a2, a0
  mv a0, t1
  li a3, 1
  call flarePair
  ; arms.e16.ts:527  let k: u16 = 0
  li s1, 0 ; k
  ; arms.e16.ts:528  while (k < MN) {
  j .L3
.L1:
  ; arms.e16.ts:529  if (mOwner[k] === 1 && mChase[k] === 0 && randBelow(256) < odds) {
  slli t0, s1, 1
  lw t0, mOwner(t0)
  li t1, 1
  bne t0, t1, .L5
  slli t0, s1, 1
  lw t0, mChase(t0)
  bne t0, zero, .L5
  li a0, 256
  call randBelow
  bgeu a0, s2, .L5
  ; arms.e16.ts:530  mChase[k] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, mChase(t0)
  ; arms.e16.ts:531  mFlare[k] = fNext
  slli t0, s1, 1
  lw t1, 0x1920(zero)
  sw t1, mFlare(t0)
.L5:
  ; arms.e16.ts:533  k++
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

; arms.e16.ts:537 flarePair(x, y, z, owner) at -O1
;   x in s2
;   y in s3
;   z in 0(fp)
;   owner in 2(fp)
;   k in s1
flarePair:
  addi sp, sp, -14
  sw ra, 4(sp)
  sw s2, 6(sp)
  sw s3, 8(sp)
  sw s1, 10(sp)
  sw s0, 12(sp)
  mv fp, sp
  mv s2, a0 ; x
  mv s3, a1 ; y
  sw a2, 0(fp) ; z
  sw a3, 2(fp) ; owner
  ; arms.e16.ts:538  flareAt(x - 20, y, z - 10)
  lw t0, 0(fp) ; z
  addi a0, s2, -20
  mv a1, s3
  addi a2, t0, -10
  call flareAt
  ; arms.e16.ts:539  flareAt(x + 20, y, z - 10)
  lw t0, 0(fp) ; z
  addi a0, s2, 20
  mv a1, s3
  addi a2, t0, -10
  call flareAt
  ; arms.e16.ts:540  if (owner !== 2) return
  li t0, 2
  lw t1, 2(fp) ; owner
  beq t1, t0, .L1
  ; arms.e16.ts:540  return
  j .return
.L1:
  ; arms.e16.ts:541  let k: u16 = 0
  li s1, 0 ; k
  ; arms.e16.ts:542  while (k < MN) {
  j .L4
.L2:
  ; arms.e16.ts:543  if (mOwner[k] === 2 && mChase[k] === 0 && randBelow(4) !== 0) {
  slli t0, s1, 1
  lw t0, mOwner(t0)
  li t1, 2
  bne t0, t1, .L6
  slli t0, s1, 1
  lw t0, mChase(t0)
  bne t0, zero, .L6
  li a0, 4
  call randBelow
  beq a0, zero, .L6
  ; arms.e16.ts:544  mChase[k] = 1
  slli t0, s1, 1
  li t1, 1
  sw t1, mChase(t0)
  ; arms.e16.ts:545  mFlare[k] = (fNext + FN - 1) % FN
  slli t0, s1, 1
  lw t1, 0x1920(zero)
  addi t1, t1, 7
  andi t1, t1, 7
  sw t1, mFlare(t0)
.L6:
  ; arms.e16.ts:547  k++
  addi s1, s1, 1
.L4:
  li t0, 6
  bltu s1, t0, .L2
.return:
  mv sp, fp
  lw ra, 4(sp)
  lw s2, 6(sp)
  lw s3, 8(sp)
  lw s1, 10(sp)
  lw s0, 12(sp)
  addi sp, sp, 14
  ret

; arms.e16.ts:551 flareAt(x, y, z) at -O1
;   x in a0
;   y in a1
;   z in a2
flareAt:
  ; arms.e16.ts:552  fX[fNext] = u16(x)
  lw t0, 0x1920(zero)
  slli t0, t0, 1
  sw a0, fX(t0)
  ; arms.e16.ts:553  fY[fNext] = u16(y)
  lw t0, 0x1920(zero)
  slli t0, t0, 1
  sw a1, fY(t0)
  ; arms.e16.ts:554  fZ[fNext] = u16(z)
  lw t0, 0x1920(zero)
  slli t0, t0, 1
  sw a2, fZ(t0)
  ; arms.e16.ts:555  fLife[fNext] = 80
  lw t0, 0x1920(zero)
  slli t0, t0, 1
  li t1, 80
  sw t1, fLife(t0)
  ; arms.e16.ts:556  fNext = (fNext + 1) % FN
  lw t0, 0x1920(zero)
  addi t0, t0, 1
  andi t0, t0, 7
  sw t0, 0x1920(zero)
.return:
  ret

; arms.e16.ts:560 flaresStep() at -O1
;   k in s1
flaresStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; arms.e16.ts:561  let k: u16 = 0
  li s1, 0 ; k
  ; arms.e16.ts:562  while (k < FN) {
  j .L3
.L1:
  ; arms.e16.ts:563  if (fLife[k] !== 0) flareStep(k)
  slli t0, s1, 1
  lw t0, fLife(t0)
  beq t0, zero, .L5
  ; arms.e16.ts:563  flareStep(k)
  mv a0, s1
  call flareStep
.L5:
  ; arms.e16.ts:564  k++
  addi s1, s1, 1
.L3:
  li t0, 8
  bltu s1, t0, .L1
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; arms.e16.ts:568 flareStep(k) at -O1
;   k in s1
flareStep:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  mv s1, a0 ; k
  ; arms.e16.ts:569  fLife[k] = fLife[k] - 1
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fLife(t1)
  addi t1, t1, -1
  sw t1, fLife(t0)
  ; arms.e16.ts:570  fX[k] = u16(i16(fX[k]) - (pVel(0) >> 5))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fX(t1)
  addi t0, t0, fX
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 0
  call pVel
  srai t0, a0, 5
  lw t1, 0(sp)
  addi sp, sp, 2
  sub t1, t1, t0
  lw t0, 0(sp)
  addi sp, sp, 2
  sw t1, 0(t0)
  ; arms.e16.ts:571  fY[k] = u16(i16(fY[k]) - (pVel(1) >> 5))
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fY(t1)
  addi t0, t0, fY
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 1
  call pVel
  srai t0, a0, 5
  lw t1, 0(sp)
  addi sp, sp, 2
  sub t1, t1, t0
  lw t0, 0(sp)
  addi sp, sp, 2
  sw t1, 0(t0)
  ; arms.e16.ts:572  fZ[k] = u16(i16(fZ[k]) - (pVel(2) >> 5) - 1)
  slli t0, s1, 1
  slli t1, s1, 1
  lw t1, fZ(t1)
  addi t0, t0, fZ
  addi sp, sp, -2
  sw t0, 0(sp)
  addi sp, sp, -2
  sw t1, 0(sp)
  li a0, 2
  call pVel
  srai t0, a0, 5
  lw t1, 0(sp)
  addi sp, sp, 2
  sub t1, t1, t0
  addi t1, t1, -1
  lw t0, 0(sp)
  addi sp, sp, 2
  sw t1, 0(t0)
  ; arms.e16.ts:573  vset(V_T0, i16(fX[k]), i16(fY[k]), i16(fZ[k]))
  slli t0, s1, 1
  lw t0, fX(t0)
  slli t1, s1, 1
  lw t1, fY(t1)
  slli t2, s1, 1
  lw t2, fZ(t2)
  li a0, 21
  mv a1, t0
  mv a2, t1
  mv a3, t2
  call vset
  ; arms.e16.ts:574  toBody(V_T0)
  li a0, 21
  call toBody
  ; arms.e16.ts:575  if (!project() || !abovePanel(scrY, 4)) return
  call project
  beqz a0, .L2
  lw a0, 0x15ae(zero)
  li a1, 4
  call abovePanel
  bnez a0, .L1
.L2:
  ; arms.e16.ts:575  return
  j .return
.L1:
  ; arms.e16.ts:576  spr(scrX - 4, scrY - 4, (SHOTS_TILE + 6 + ((fLife[k] >> 1) & 1)) | ((SL_SHOT - 8) << 10), S8)
  lw t0, 0x15ac(zero)
  lw t1, 0x15ae(zero)
  slli t2, s1, 1
  lw t2, fLife(t2)
  srli t2, t2, 1
  andi t2, t2, 1
  addi t2, t2, 339
  ori t2, t2, 4096
  addi a0, t0, -4
  addi a1, t1, -4
  mv a2, t2
  li a3, 0
  call spr
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; arms.e16.ts:587 inSeeker() at -O1
;   cone in s1
inSeeker:
  addi sp, sp, -4
  sw ra, 0(sp)
  sw s1, 2(sp)
  ; arms.e16.ts:588  if (!eAlive || eBZ <= 0 || eDist > 5600) return false
  lw t0, 0x1600(zero)
  beqz t0, .L2
  lw t0, 0x1612(zero)
  bge zero, t0, .L2
  lw t0, 0x161c(zero)
  li t1, 5600
  bgeu t1, t0, .L1
.L2:
  ; arms.e16.ts:588  return false
  li a0, 0
  j .return
.L1:
  ; arms.e16.ts:589  const cone = (eBZ >> 2) + (eBZ >> 4)
  lw t0, 0x1612(zero)
  srai t0, t0, 2
  lw t1, 0x1612(zero)
  srai t1, t1, 4
  add s1, t0, t1
  ; arms.e16.ts:590  return abs16(eBX) < cone && abs16(eBY) < cone
  lw a0, 0x160e(zero)
  call abs16
  slt t0, a0, s1
  mv t1, t0
  beqz t1, .L3
  lw a0, 0x1610(zero)
  call abs16
  slt t0, a0, s1
.L3:
  mv a0, t0
.return:
  lw ra, 0(sp)
  lw s1, 2(sp)
  addi sp, sp, 4
  ret

; arms.e16.ts:594 seekerStep() at -O1
seekerStep:
  addi sp, sp, -2
  sw ra, 0(sp)
  ; arms.e16.ts:595  if (!inSeeker()) {
  call inSeeker
  bnez a0, .L1
  ; arms.e16.ts:596  lockT = 0
  sw zero, 0x1924(zero)
  ; arms.e16.ts:597  locked = false
  sw zero, 0x1926(zero)
  ; arms.e16.ts:598  return 0
  li a0, 0
  j .return
.L1:
  ; arms.e16.ts:600  if (locked) return 3
  lw t0, 0x1926(zero)
  beqz t0, .L2
  ; arms.e16.ts:600  return 3
  li a0, 3
  j .return
.L2:
  ; arms.e16.ts:601  lockT++
  lw t0, 0x1924(zero)
  addi t0, t0, 1
  sw t0, 0x1924(zero)
  ; arms.e16.ts:602  if (lockT >= LOCK_FRAMES) {
  li t1, 50
  bltu t0, t1, .L3
  ; arms.e16.ts:603  locked = true
  li t0, 1
  sw t0, 0x1926(zero)
  ; arms.e16.ts:604  return 1
  li a0, 1
  j .return
.L3:
  ; arms.e16.ts:606  return 2
  li a0, 2
.return:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

  .align 2
