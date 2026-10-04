; TICKER: a message typed in rolls across the LCD, moved by MCPY; any key ends it.
; From BASIC: LOAD "TICKER.BIN":CALL 28672
;
; It asks for a line with the ROM's READLINE (ENTER alone takes the machine's own words),
; writes it on the middle text row with LOCATE and PUTS, and then, thirty-two times a
; second, rolls that row one dot to the left: the band's first byte is kept, the rest moves
; down a byte in one MCPY (an overlapping move, which MCPY does like memmove), and the kept
; byte goes in at the end - so the words come round again from the right. Every plane of
; the LCD is rolled (the four-shade one has two). Between steps it sleeps in WFI on the
; timer, as BASIC's WAIT does; a key in the FIFO ends it, and is taken, so BASIC's prompt
; does not see it. It keeps ra and s0-s3 as the calling convention asks, and returns with
; RET.

  .org 0x7000
WIDTH    = -0xe0            ; FF20: the screen's width in dots
HEIGHT   = -0xde            ; FF22: its height
DEPTH    = -0xdc            ; FF24: bits a dot, 1 or 2
KEYDATA  = -0xf0            ; FF10: the next key, taken
KEYCOUNT = -0xee            ; FF12: keys waiting
CURMODE  = -0xd4            ; FF2C: the cursor's shape
TCOUNT   = -0xd0            ; FF30: the 1,024 Hz counter
TCMP     = -0xce            ; FF32: what it is compared with
TCTRL    = -0xcc            ; FF34: bit 0 arms the compare, bit 1 says it matched
VRAM     = 0xe000
STEP     = 32               ; counts between moves: a dot every 1/32 s

start:
  addi sp, sp, -10
  sw ra, 8(sp)
  sw s0, 6(sp)
  sw s1, 4(sp)
  sw s2, 2(sp)
  sw s3, 0(sp)
  li t0, 3                  ; CLS
  ecall
  la a0, ask
  li t0, 1                  ; PUTS
  ecall
  ; A line of up to a row's characters: the width / 6 (40, or 26).
  lw s0, WIDTH(zero)
  li t0, 6
  divu a1, s0, t0
  la a0, line
  li t0, 7                  ; READLINE
  ecall
  bltz a0, .out             ; CLS, BRK or MODE: nothing to show
  la s3, line
  bnez a0, .show
  la s3, words              ; ENTER alone: the machine's own words
.show:
  li t0, 3                  ; CLS
  ecall
  ; The middle text row: the rows are the height / 8.
  lw s1, HEIGHT(zero)
  srli s1, s1, 4
  li a0, 0
  mv a1, s1
  li t0, 4                  ; LOCATE
  ecall
  mv a0, s3
  li t0, 1                  ; PUTS
  ecall
  ; That row's band in the first plane, and how far the next plane is.
  mul s1, s1, s0
  li t0, VRAM
  add s1, s1, t0
  lw s2, HEIGHT(zero)
  mul s2, s2, s0
  srli s2, s2, 3
  lw s3, CURMODE(zero)      ; kept, to be put back
  sw zero, CURMODE(zero)    ; no cursor over the rolling words
  csrsi mie, 1              ; the timer wakes WFI as well as a key
.tick:
  lw t0, TCOUNT(zero)
  addi t0, t0, STEP
  sw t0, TCMP(zero)
  li t0, 1
  sw t0, TCTRL(zero)
.sleep:
  wfi
  lw t0, KEYCOUNT(zero)
  bnez t0, .done
  lw t0, TCTRL(zero)
  andi t0, t0, 2
  beqz t0, .sleep           ; woken for nothing: sleep on
  sw zero, TCTRL(zero)
  ; One dot to the left, in every plane.
  mv t3, s1
  lw a3, DEPTH(zero)
.plane:
  lbu t1, 0(t3)             ; the first byte, to come round at the end
  mv a0, t3
  addi a1, t3, 1
  addi a2, s0, -1
  mcpy a0, a1, a2           ; the rest, one byte down
  add t2, t3, s0
  sb t1, -1(t2)
  add t3, t3, s2
  addi a3, a3, -1
  bnez a3, .plane
  j .tick
.done:
  ; The keys that ended it, taken: they are not typed at the prompt.
  lw t0, KEYDATA(zero)
  lw t0, KEYCOUNT(zero)
  bnez t0, .done
  sw zero, TCTRL(zero)
  csrci mie, 1
  sw s3, CURMODE(zero)
  li t0, 3                  ; CLS
  ecall
.out:
  lw s3, 0(sp)
  lw s2, 2(sp)
  lw s1, 4(sp)
  lw s0, 6(sp)
  lw ra, 8(sp)
  addi sp, sp, 10
  ret

ask:
  .asciz "TEXT? "
words:
  .asciz "ELEC-16 POCKET COMPUTER"
line:
  .space 42
