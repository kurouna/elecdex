; The LCD driver: text in cells of 6 x 8 dots, as many as the model's screen holds.
; A byte of video memory is a column of eight dots, bit 0 at the top, so a text row is one
; band of WIDTH bytes and a character is six of them. A four-shade screen has two planes;
; text is drawn in both, as the darkest shade.

; Reads the screen's size, clears it and puts the cursor home.
lcd_init:
  addi sp, sp, -2
  sw ra, 0(sp)
  lw t0, IO_WIDTH(zero)
  sw t0, WIDTH(zero)
  li t1, 6
  divu t2, t0, t1
  sw t2, COLS(zero)
  lw t1, IO_HEIGHT(zero)
  srli t2, t1, 3
  sw t2, ROWS(zero)
  mul t2, t2, t0
  sw t2, PLANE(zero)
  lw t0, IO_DEPTH(zero)
  sw t0, DEPTH(zero)
  li t0, 1
  sw t0, IO_LCD_CTRL(zero)
  call cls
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; Clears every plane and puts the cursor home.
cls:
  lw t0, PLANE(zero)
  lw t1, DEPTH(zero)
  mul t0, t0, t1
  li t1, VRAM
  add t0, t0, t1
.loop:
  addi t0, t0, -2
  sw zero, 0(t0)
  bne t0, t1, .loop
  sw zero, CURX(zero)
  sw zero, CURY(zero)
  j cursor_sync

; Moves the cursor: a0 column, a1 row (held to the screen).
locate:
  lw t0, COLS(zero)
  addi t0, t0, -1
  minu a0, a0, t0
  lw t0, ROWS(zero)
  addi t0, t0, -1
  minu a1, a1, t0
  sw a0, CURX(zero)
  sw a1, CURY(zero)
  j cursor_sync

; Tells the LCD where the cursor is (it draws it, blinking, when CURMODE asks).
cursor_sync:
  lw t0, CURY(zero)
  slli t0, t0, 8
  lw t1, CURX(zero)
  or t0, t0, t1
  sw t0, IO_CURSOR(zero)
  ret

; Writes a character at the cursor and moves on: CR or LF starts a new line, BS steps back
; and rubs out, CLS clears; other control characters do nothing.
putc:
  addi sp, sp, -2
  sw ra, 0(sp)
  li t0, K_ENTER
  beq a0, t0, .newline
  li t0, 10
  beq a0, t0, .newline
  li t0, K_BS
  beq a0, t0, .back
  li t0, K_CLS
  beq a0, t0, .cls
  li t0, 0x20
  bltu a0, t0, .done
  call draw_char
  lw t0, CURX(zero)
  addi t0, t0, 1
  sw t0, CURX(zero)
  lw t1, COLS(zero)
  bltu t0, t1, .sync
.newline:
  call newline
  j .done
.back:
  call back
  j .done
.cls:
  call cls
  j .done
.sync:
  call cursor_sync
.done:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; Text ended by a zero, at a0.
puts:
  enter3 s0, s1
  mv s0, a0
.loop:
  lbu a0, 0(s0)
  beqz a0, .done
  call putc
  addi s0, s0, 1
  j .loop
.done:
  leave3 s0, s1
  ret

; To the start of the next line, scrolling the screen up when it is at the bottom.
newline:
  addi sp, sp, -2
  sw ra, 0(sp)
  sw zero, CURX(zero)
  lw t0, CURY(zero)
  addi t0, t0, 1
  lw t1, ROWS(zero)
  bltu t0, t1, .keep
  call scroll
  lw t0, ROWS(zero)
  addi t0, t0, -1
.keep:
  sw t0, CURY(zero)
  call cursor_sync
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; A new line only when the cursor is not already at the start of one.
fresh_line:
  lw t0, CURX(zero)
  bnez t0, newline
  ret

; One step back (to the end of the line above at a line's start), rubbing out the cell.
back:
  addi sp, sp, -2
  sw ra, 0(sp)
  lw t0, CURX(zero)
  bnez t0, .left
  lw t1, CURY(zero)
  beqz t1, .done
  addi t1, t1, -1
  sw t1, CURY(zero)
  lw t0, COLS(zero)
.left:
  addi t0, t0, -1
  sw t0, CURX(zero)
  li a0, 0x20
  call draw_char
  call cursor_sync
.done:
  lw ra, 0(sp)
  addi sp, sp, 2
  ret

; Moves every text row up one, in each plane, and clears the bottom one.
scroll:
  lw t3, DEPTH(zero)
  li a2, VRAM           ; this plane's start
  lw a3, WIDTH(zero)    ; one text row
.plane:
  lw t1, PLANE(zero)
  add t1, t1, a2        ; this plane's end
  add t0, a2, a3        ; from its second row
.move:
  lw t2, 0(t0)
  sub a1, t0, a3
  sw t2, 0(a1)
  addi t0, t0, 2
  bltu t0, t1, .move
  sub t0, t1, a3        ; the bottom row, cleared
.zero:
  sw zero, 0(t0)
  addi t0, t0, 2
  bltu t0, t1, .zero
  mv a2, t1             ; the next plane starts where this one ends
  addi t3, t3, -1
  bnez t3, .plane
  ret

; Draws the character a0 in the cell at the cursor, in every plane.
draw_char:
  lw t0, CURY(zero)
  lw t1, WIDTH(zero)
  mul t0, t0, t1
  lw t1, CURX(zero)
  li t2, 6
  mul t1, t1, t2
  add t0, t0, t1
  li t1, VRAM
  add t0, t0, t1
  ; The glyph: five bytes a character from 0x20.
  li t1, 0x20
  bgeu a0, t1, .known
  li a0, 0x20
.known:
  sub a0, a0, t1
  li t1, 5
  mul a0, a0, t1
  la t1, font
  add a0, a0, t1
  lw t3, DEPTH(zero)
.plane:
  li t1, 5
  mv a1, a0
  mv a2, t0
.byte:
  lbu t2, 0(a1)
  sb t2, 0(a2)
  addi a1, a1, 1
  addi a2, a2, 1
  addi t1, t1, -1
  bnez t1, .byte
  sb zero, 0(a2)
  lw t1, PLANE(zero)
  add t0, t0, t1
  addi t3, t3, -1
  bnez t3, .plane
  ret
