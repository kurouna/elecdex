; The ROM's work area at the bottom of RAM (docs/elec16.md section 3, 0000-00FF).
; Every variable is a word at an even address, reached as VAR(zero).

CURX    = 0x00      ; the cursor's column
CURY    = 0x02      ; and its row
COLS    = 0x04      ; text columns: the screen's width / 6
ROWS    = 0x06      ; text rows: its height / 8
WIDTH   = 0x08      ; the screen's width in dots: the bytes in one text row of a plane
PLANE   = 0x0a      ; the bytes in one plane of video memory
DEPTH   = 0x0c      ; 1, or 2 for four shades (two planes)
FLAGS   = 0x0e      ; F_SHIFT and F_CAPS
DNEXT   = 0x10      ; where D goes on when given no address
RETPC   = 0x12      ; where an ECALL service returns to
ERA     = 0x14      ; the caller's ra while an ECALL service runs
CAUSE   = 0x16      ; mcause of the last break or fault
MONWAIT = 0x18      ; 1 while the monitor waits at its prompt for a line
ANNMODE = 0x1a      ; the mode's annunciators (MON, RUN or PRO), shown with SHIFT and CAPS
INBASIC = 0x1c      ; 1 while BASIC has the machine: BRK then only raises BRKFLAG
BRKFLAG = 0x1e      ; BRK pressed in BASIC, taken at the next statement or the next key
REGS    = 0x20      ; 16 words at the last break or fault: pc, then x1 to x15
LINEBUF = 0x40      ; the line being typed, ended by a zero (64 bytes)
BASIC_SP = 0x80     ; BASIC's stack at its prompt, where an error goes back to

F_SHIFT = 1
F_CAPS  = 2

STACK_TOP = 0x8000  ; the stack grows down from the top of RAM, above the code area
LINE_MAX  = 62
K_BRK     = 0x03    ; what getkey gives when BRK was pressed while BASIC waited
