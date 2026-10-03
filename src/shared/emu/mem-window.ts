/**
 * The window a MEM view shows of a machine's memory (docs/emu.md): rows of bytes, placed
 * round what it follows - a program counter, a pointer, or where the player scrolled to -
 * and which bytes changed since the last look. Pure and machine-agnostic: what a byte is to
 * its machine (font, program, I/O) is the machine's own, and the view asks it separately.
 *
 * Memory is read through a `ByteSource`: a plain array for a machine whose memory is one,
 * or a function for one with devices mapped in, which must read without side effects (a
 * view looking at a key FIFO must not pop it).
 */

/** Bytes a row: eight reads as bits too, and as one sprite row of a CHIP-8 sprite. */
export const MEM_COLUMNS = 8
/** Rows shown. */
export const MEM_ROWS = 16

export interface MemRow {
  address: number
  bytes: number[]
}

/** Memory as a view reads it: an array, or a reader with the size of the address space. */
export type ByteSource = Uint8Array | { readonly size: number; read(address: number): number }

const sizeOf = (source: ByteSource): number =>
  source instanceof Uint8Array ? source.length : source.size

/**
 * The first address of the window: `target`'s row a quarter of the way down, so what comes
 * after it shows more than what came before; never past either end of memory.
 */
export function windowStart(target: number, size: number, rows = MEM_ROWS): number {
  const row = Math.floor(target / MEM_COLUMNS)
  const last = Math.max(0, size / MEM_COLUMNS - rows)
  const first = Math.min(last, Math.max(0, row - Math.floor(rows / 4)))
  return first * MEM_COLUMNS
}

/** Moves a window by whole rows, kept inside memory. */
export function scrollWindow(start: number, rows: number, size: number): number {
  const last = Math.max(0, size - MEM_ROWS * MEM_COLUMNS)
  return Math.min(last, Math.max(0, start + rows * MEM_COLUMNS))
}

/** The rows of memory from `start` (a row's first address). */
export function memoryRows(source: ByteSource, start: number, rows = MEM_ROWS): MemRow[] {
  const size = sizeOf(source)
  const out: MemRow[] = []
  for (let r = 0; r < rows; r++) {
    const address = start + r * MEM_COLUMNS
    if (address >= size) break
    const end = Math.min(size, address + MEM_COLUMNS)
    const bytes =
      source instanceof Uint8Array
        ? Array.from(source.subarray(address, end))
        : Array.from({ length: end - address }, (_, k) => source.read(address + k) & 0xff)
    out.push({ address, bytes })
  }
  return out
}

/** The addresses whose byte differs from the last look, for a beat's mark. */
export function changedBytes(
  before: ReadonlyMap<number, number> | null,
  rows: MemRow[],
): Set<number> {
  const changed = new Set<number>()
  if (before === null) return changed
  for (const row of rows) {
    row.bytes.forEach((value, k) => {
      const was = before.get(row.address + k)
      if (was !== undefined && was !== value) changed.add(row.address + k)
    })
  }
  return changed
}

/** The bytes shown, by address, to compare the next look with. */
export function byteMap(rows: MemRow[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const row of rows) {
    row.bytes.forEach((value, k) => {
      map.set(row.address + k, value)
    })
  }
  return map
}
