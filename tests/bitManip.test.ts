import { expect, it, describe } from "vitest";
import { Imm12, Word } from "../src/types/binType";
import { extractBits, writeBits } from "../src/function/bitManip";

const word = new Word(0xf3ca70ff);
const imm = new Imm12(0x08fa);

describe("Test extractBits", () => {
  it("Extract one bit", () => {
    expect(extractBits(word, 0, 1)).toBe(1);
    expect(extractBits(word, 31, 32)).toBe(1);
    expect(extractBits(word, 8, 9)).toBe(0);

    expect(extractBits(imm, 0, 1)).toBe(0);
    expect(extractBits(imm, 4, 5)).toBe(1);
  });

  it("Extract entire buffer", () => {
    // Force unsign for test
    expect(extractBits(word, 0) >>> 0).toBe(word.view.getUint32(0));
    expect(extractBits(word, 0, 32) >>> 0).toBe(word.view.getUint32(0));

    expect(extractBits(imm, 0) >>> 0).toBe(imm.view.getUint16(0));
    expect(extractBits(imm, 0, 12) >>> 0).toBe(imm.view.getUint16(0));
  });

  it("Extract parts of the buffer", () => {
    expect(extractBits(word, 0, 8)).toBe(0xff);
    expect(extractBits(word, 4, 19)).toBe(0x270f);

    expect(extractBits(imm, 3, 6)).toBe(0b111);
    expect(extractBits(imm, 4, 8)).toBe(0xf);
  });

  it("Error case", () => {
    expect(() => extractBits(word, 3, 0)).toThrowError();
    expect(() => extractBits(word, 0, 33)).toThrow();

    expect(() => extractBits(imm, 3, 0)).toThrow();
    expect(() => extractBits(imm, 0, 13)).toThrow();
  });
});

describe("Test writeBits", () => {
  it("Write one bit", () => {
    expect(writeBits(word, 0, 0, 1) >>> 0).toBe(0xf3ca70fe);
    expect(writeBits(word, 0, 31, 32) >>> 0).toBe(0x73ca70ff);
    expect(writeBits(word, 1, 8, 9) >>> 0).toBe(0xf3ca71ff);

    expect(writeBits(imm, 1, 0, 1) >>> 0).toBe(0x08fb);
    expect(writeBits(imm, 0, 4, 5) >>> 0).toBe(0x08ea);
  });

  it("Write entire buffer", () => {
    expect(writeBits(word, 0xffaabbcc, 0) >>> 0).toBe(0xffaabbcc);
    expect(writeBits(word, 0x12345678, 0, 32) >>> 0).toBe(0x12345678);

    expect(writeBits(imm, 0xffaa, 0) >>> 0).toBe(0x0faa);
    expect(writeBits(imm, 0x0234, 0, 12) >>> 0).toBe(0x0234);
  });

  it("Write part of the buffer", () => {
    expect(writeBits(word, 0xa, 4, 8) >>> 0).toBe(0xf3ca70af);
    expect(writeBits(word, 0xcc, 8, 16) >>> 0).toBe(0xf3caccff);

    expect(writeBits(imm, 0x3, 0, 4) >>> 0).toBe(0x08f3);

    // 0x5 => 0b00000101
    expect(writeBits(imm, 0x5, 5, 12) >>> 0).toBe(0x00ba);
  });

  it("Error case", () => {
    expect(() => writeBits(word, 10, 3, 0)).toThrowError();
    expect(() => writeBits(word, 10, 3, 0)).toThrow();

    expect(() => writeBits(imm, 10, 3, 0)).toThrow();
    expect(() => writeBits(imm, 10, 0, 13)).toThrow();
  });
});
