; LINK (docs/elec16.md section 12): service 8, a question put to one of main's services - the
; AI is service 0 - and the answer waited for.
;
; a0: the question (ended by a zero), a1: where the answer goes, a2: the most bytes it may
; have, a3: the service * 256 + its type. The answer comes back ended by a zero: a0 is its
; length, a1 where it is; a negative a0 is -STATUS (OFF, HELD, FAILED ...). It sleeps in WFI
; with LINK's line enabled, as the card's commands do, and puts mie back after.
;
; BRK while BASIC has the machine only raises BRKFLAG: the request is cancelled here and
; -CANCELLED returned, for BASIC to stop on. Run from machine code, BRK goes to the monitor,
; whose way in cancels it.

link:
  srli t0, a3, 8
  sw t0, IO_LINK_SERVICE(zero)
  andi t0, a3, 0xff
  sw t0, IO_LINK_TYPE(zero)
  sw a0, IO_LINK_QUERY(zero)
  sw a1, IO_LINK_REPLY(zero)
  sw a2, IO_LINK_MAX(zero)
  li t0, LINK_SEND
  sw t0, IO_LINK_CMD(zero)
  csrr t2, mie
  li t0, 1 << IRQ_LINK
  or t0, t0, t2
  csrw mie, t0
.wait:
  ; Reading STATUS drops the line, so WFI sleeps until the answer raises it again.
  lw t0, IO_LINK_STATUS(zero)
  li t1, LINK_ST_BUSY
  bne t0, t1, .done
  lw t1, BRKFLAG(zero)
  bnez t1, .cancel
  wfi
  j .wait
.cancel:
  li t0, LINK_CANCEL
  sw t0, IO_LINK_CMD(zero)
  lw t0, IO_LINK_STATUS(zero)
.done:
  csrw mie, t2
  lw a1, IO_LINK_REPLY(zero)
  lw a0, IO_LINK_LENGTH(zero)
  beqz t0, .out
  sub a0, zero, t0
.out:
  ret
