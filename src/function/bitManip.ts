import type { ByteType } from "../interface/binType";

// Without the Record type, getter[totalBitSize will throw a warning because number doesn't fit with literal of 8 | 16 | 32]
// You can create a type BitSize = 8 | 16 | 32 or make getters a Record
// Another solution is to cast totalBitSize as keyof typeof getters
const getters: Record<
  number,
  (byteOffset: number, littleEndian?: boolean) => number
> = {
  8: DataView.prototype.getUint8 as (
    byteOffset: number,
    littleEndian?: boolean,
  ) => number,
  16: DataView.prototype.getUint16 as (
    byteOffset: number,
    littleEndian?: boolean,
  ) => number,
  32: DataView.prototype.getUint32 as (
    byteOffset: number,
    littleEndian?: boolean,
  ) => number,
};

export function extractBits(
  buffer: ByteType,
  start: number = 0,
  end: number = -1,
): number {
  if (end === -1) {
    end = buffer.size;
  }

  if (start > end) {
    throw new Error(
      `Start position ${start} must be less than or equal to end position ${end}:`,
    );
  }

  if (end > buffer.size) {
    throw new Error(
      `End position ${end} should be less than buffer size ${buffer.size}`,
    );
  }

  const totalBitSize = Math.ceil(buffer.size / 8) * 8;
  const getter = getters[totalBitSize];
  const bitMask: number = 2 ** totalBitSize - 1;
  const value = getter.call(buffer.view, 0);
  const result =
    (value >>> start) & (bitMask >>> (totalBitSize - (end - start)));
  return result;
}

export function writeBits(
  buffer: ByteType,
  content: number,
  start: number,
  end: number = -1,
): number {
  if (end === -1) {
    end = buffer.size;
  }

  if (start > end) {
    throw new Error(
      `Start position ${start} must be less than or equal to end position ${end}:`,
    );
  }

  if (end > buffer.size) {
    throw new Error(
      `End position ${end} should be less than buffer size ${buffer.size}`,
    );
  }

  const totalBitSize = Math.ceil(buffer.size / 8) * 8;
  const getter = getters[totalBitSize];
  const bitMask = 2 ** (end - start) - 1;
  const cleanedContent = content & bitMask;
  const value = getter.call(buffer.view, 0);
  const result = (value & ~(bitMask << start)) | (cleanedContent << start);
  return result;
}

export function countBits(value: number): number {
  let bitCount: number = 0;
  while (value) {
    value = value & (value - 1);
    bitCount += 1;
  }
  return bitCount;
}
