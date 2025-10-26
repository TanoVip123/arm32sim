import type { Word } from "../types/binType";

export interface Memory {
  readWord(offset: Word): Word;
  writeWord(offset: Word, content: Word): void;
  readBuffer(offset: Word, length: number): ArrayBuffer;
  writeBuffer(offset: Word, content: ArrayBuffer): void;
}
