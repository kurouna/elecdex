/**
 * A machine's snapshot as bytes, written and read field by field (docs/emu.md).
 *
 * Little-endian throughout. The reader never throws on a short or foreign input: what a
 * machine checks (magic, version, ranges) is the machine's own, and a field read past the
 * end comes back as 0 with `overrun` set, so a cut file decodes to "not ours" rather than to
 * an exception in the middle of a page. Pure and machine-agnostic.
 */

export class ByteWriter {
  readonly bytes: Uint8Array
  readonly #view: DataView
  #at = 0

  constructor(size: number) {
    this.bytes = new Uint8Array(size)
    this.#view = new DataView(this.bytes.buffer)
  }

  /** How many bytes have been written. */
  get at(): number {
    return this.#at
  }

  u8(value: number): void {
    this.#view.setUint8(this.#at++, value)
  }

  i8(value: number): void {
    this.#view.setInt8(this.#at++, value)
  }

  u16(value: number): void {
    this.#view.setUint16(this.#at, value, true)
    this.#at += 2
  }

  u32(value: number): void {
    this.#view.setUint32(this.#at, value, true)
    this.#at += 4
  }

  f64(value: number): void {
    this.#view.setFloat64(this.#at, value, true)
    this.#at += 8
  }

  raw(values: ArrayLike<number>): void {
    this.bytes.set(values, this.#at)
    this.#at += values.length
  }
}

export class ByteReader {
  readonly #bytes: Uint8Array
  readonly #view: DataView
  #at = 0
  /** A read went past the end: what came back was made up, and the input is not whole. */
  overrun = false

  constructor(bytes: Uint8Array) {
    this.#bytes = bytes
    this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }

  /** How many bytes have been read. */
  get at(): number {
    return this.#at
  }

  /** Whether `size` more bytes are there to read; marks the overrun when they are not. */
  #has(size: number): boolean {
    if (this.#at + size <= this.#bytes.length) return true
    this.overrun = true
    this.#at = this.#bytes.length
    return false
  }

  u8(): number {
    if (!this.#has(1)) return 0
    return this.#view.getUint8(this.#at++)
  }

  i8(): number {
    if (!this.#has(1)) return 0
    return this.#view.getInt8(this.#at++)
  }

  u16(): number {
    if (!this.#has(2)) return 0
    const value = this.#view.getUint16(this.#at, true)
    this.#at += 2
    return value
  }

  u32(): number {
    if (!this.#has(4)) return 0
    const value = this.#view.getUint32(this.#at, true)
    this.#at += 4
    return value
  }

  f64(): number {
    if (!this.#has(8)) return 0
    const value = this.#view.getFloat64(this.#at, true)
    this.#at += 8
    return value
  }

  /** The next `length` bytes, as a view (copy it to keep it); short if the input ends first. */
  raw(length: number): Uint8Array {
    const start = this.#at
    if (!this.#has(length)) return this.#bytes.subarray(start)
    this.#at += length
    return this.#bytes.subarray(start, this.#at)
  }
}
