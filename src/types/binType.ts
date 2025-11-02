import type { ByteType } from "../interface/binType";

export class Word implements ByteType {
  size: number = 32;
  private dataView: DataView;
  private buffer: ArrayBuffer;

  constructor(value: number = 0) {
    this.buffer = new ArrayBuffer(4);
    this.dataView = new DataView(this.buffer);
    this.view.setUint32(0, value);
  }

  get view(): DataView {
    return this.dataView;
  }

  get raw() {
    return this.buffer;
  }

  equals(other: Word): boolean {
    return this.view.getUint32(0) === other.view.getUint32(0);
  }
}

export class Imm12 implements ByteType {
  size: number = 12;
  private dataView: DataView;
  private buffer: ArrayBuffer;

  constructor(value: number = 0) {
    if (value >> 12 !== 0) {
      // value >>> 0 ensure that value is an unsigned number and can be pad correctly with toSTring(2). toSTring
      throw new Error(
        `Bit 15~12 must be 0 for Imm12: 0b${(value >>> 0).toString(2).padStart(16, "0")}`,
      );
    }
    this.buffer = new ArrayBuffer(2);
    this.dataView = new DataView(this.buffer);
    this.view.setUint16(0, value & 0x0fff);
  }

  get view(): DataView {
    return this.dataView;
  }

  get raw() {
    return this.buffer;
  }

  equals(other: Imm12): boolean {
    return this.view.getUint16(0) === other.view.getUint16(0);
  }
}

/*

 Unerlying structure is probablArrayBuffer and convert to Uint8 as needed const uint32Array = new Uint32Array(uint8Array.buffer)
 You probably want in memory:
 readWord(Position)
 writeWord(Position)
 readByteArray() return arrayBuffer => a CustomLength with 2 constructor for size or an ArrayBuffer
 writeByteArray(ArrayBuffer)
 */
