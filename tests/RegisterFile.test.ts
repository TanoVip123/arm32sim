import { expect, it, describe } from "vitest";
import { Arm32RegisterFile } from "../src/components/arm32RegisterFile";
import { Word } from "../src/types/binType";

const registerFile = new Arm32RegisterFile();
describe("Read and Write register", () => {
  it("Read and Write register", () => {
    // every register should start at 0
    for (let i = 0; i < registerFile.size; i++) {
      expect(registerFile.readRegister(i).view.getUint32(0)).toBe(0);
    }

    registerFile.writeRegister(0, new Word(0xff00ff00));
    expect(registerFile.readRegister(0).view.getUint32(0)).toBe(0xff00ff00);

    registerFile.writeRegister(0, new Word(0x12345678));
    expect(registerFile.readRegister(0).view.getUint32(0)).toBe(0x12345678);

    for (let i = 0; i < registerFile.size; i++) {
      registerFile.writeRegister(i, new Word(i * 10));
    }

    for (let i = 0; i < registerFile.size; i++) {
      expect(registerFile.readRegister(i).view.getUint32(0)).toBe(i * 10);
    }
  });
});
