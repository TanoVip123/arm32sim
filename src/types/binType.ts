import type { ByteType } from "../interface/binType";

export class Word implements ByteType {
  size: number = 32;
  private dataView: DataView;
  private buffer: ArrayBuffer;

  constructor(value: number = 0) {
    this.buffer = new ArrayBuffer(4);
    this.dataView = new DataView(this.buffer);
    this.view.setUint32(0, value, false);
  }

  get view(): DataView {
    return this.dataView;
  }

  get raw() {
    return this.buffer;
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
    this.view.setUint16(0, value & 0x0fff, false);
  }

  get view(): DataView {
    return this.dataView;
  }

  get raw() {
    return this.buffer;
  }
}
