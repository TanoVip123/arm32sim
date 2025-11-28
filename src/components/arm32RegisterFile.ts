import { CODE_SEGMENT, STACK_SEGMENT } from "../constants/SegmentPosition";
import type { RegisterFile } from "../interface/registerFile";
import { Word } from "../types/binType";

export class Arm32RegisterFile implements RegisterFile {
  size: number;
  private registerFile: Word[];
  constructor(size: number = 17) {
    this.size = size;
    this.registerFile = new Array<Word>(this.size).fill(new Word(0));
    this.registerFile[15] = new Word(CODE_SEGMENT);
    this.registerFile[13] = new Word(STACK_SEGMENT);
  }

  reset() {
    this.registerFile = new Array<Word>(this.size).fill(new Word(0));
    this.registerFile[15] = new Word(CODE_SEGMENT);
    this.registerFile[13] = new Word(STACK_SEGMENT);
  }

  readRegister(id: number): Word {
    if (id >= this.size) {
      throw new Error(`ID ${id} does not exist in the registerFile`);
    }
    return this.registerFile[id];
  }

  writeRegister(id: number, word: Word): void {
    if (id >= this.size) {
      throw new Error(`ID ${id} does not exist in the registerFile`);
    }
    this.registerFile[id] = word;
  }

  readCPSR(): Word {
    return this.registerFile[16];
  }

  writeCPSR(word: Word): void {
    this.registerFile[16] = word;
  }

  getAllregisters(): Word[] {
    return this.registerFile;
  }
}
