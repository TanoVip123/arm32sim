import type { Word } from "../types/binType";

// Every register should be 32 bit
export interface RegisterFile {
  writeRegister(id: number, word: Word): void;
  readRegister(id: number): Word;

  // Special instruction to assess CPSR to not confused with regular register
  readCPSR(): Word;
  writeCPSR(word: Word): void;
  getAllregisters(): Word[];
  reset(): void;
}
