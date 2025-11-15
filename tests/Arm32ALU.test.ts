import { expect, it, describe } from "vitest";
import { Arm32ALU } from "../src/components/arm32ALU";
import { Imm12, Word } from "../src/types/binType";
import { ShiftType } from "../src/types/shiftType";
import { beforeEach } from "vitest";

const alu = new Arm32ALU();

describe("Test functions of Arm32ALU", () => {
  beforeEach(() => {
    alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
  });

  describe("Helper functions", () => {
    it("Should check if the input is all zero", () => {
      expect(alu.isZero(0)).toBe(1);
      expect(alu.isZero(123)).toBe(0);
      expect(alu.isZero(-123)).toBe(0);
    });

    it("Should check if the input is negative for a 32 bit number", () => {
      expect(alu.isNegative(-123)).toBe(1);
      expect(alu.isNegative(2 ** 31)).toBe(1); // 2**32 should be considered negative in a 32-bit number system
      expect(alu.isNegative(0)).toBe(0);
      expect(alu.isNegative(123)).toBe(0);
    });

    it("Test ProcessImm12", () => {
      let { imm32, carry } = alu.processImm12(new Imm12(255), 0);
      expect(imm32.view.getUint32(0)).toBe(255);
      expect(carry).toBe(0);

      ({ imm32, carry } = alu.processImm12(new Imm12(511), 1));
      expect(imm32.view.getUint32(0)).toBe(3221225535);
      expect(carry).toBe(1);

      ({ imm32, carry } = alu.processImm12(new Imm12(2011), 1));
      expect(imm32.view.getUint32(0)).toBe(57409536);
      expect(carry).toBe(0);

      ({ imm32, carry } = alu.processImm12(new Imm12(2049), 1));
      expect(imm32.view.getUint32(0)).toBe(65536);
      expect(carry).toBe(0);
    });

    describe("Test Add With Carry", () => {
      it("AddWithCarry, no carryIn, no carryOut, no overflow", () => {
        let { result, carry, overflow } = alu.addWithCarry(
          new Word(123),
          new Word(123),
          0,
        );
        expect(result.view.getUint32(0)).toBe(246);
        expect(carry).toBe(0);
        expect(overflow).toBe(0);

        ({ result, carry, overflow } = alu.addWithCarry(
          new Word(-1230000),
          new Word(20000),
          0,
        ));
        expect(result.view.getInt32(0)).toBe(-1210000);
        expect(carry).toBe(0);
        expect(overflow).toBe(0);

        ({ result, carry, overflow } = alu.addWithCarry(
          new Word(-(2 ** 16)),
          new Word(1),
          0,
        ));
        expect(result.view.getInt32(0)).toBe(-(2 ** 16) + 1);
        expect(carry).toBe(0);
        expect(overflow).toBe(0);
      });

      it("AddWithCarry, no carryIn, carryOut, no overflow", () => {
        let { result, carry, overflow } = alu.addWithCarry(
          new Word(-1230000),
          new Word(2000000),
          0,
        );
        expect(result.view.getUint32(0)).toBe(770000);
        expect(carry).toBe(1);
        expect(overflow).toBe(0);

        ({ result, carry, overflow } = alu.addWithCarry(
          new Word(-5756),
          new Word(-45673),
          0,
        ));
        expect(result.view.getInt32(0)).toBe(-51429);
        expect(carry).toBe(1);
        expect(overflow).toBe(0);

        ({ result, carry, overflow } = alu.addWithCarry(
          new Word(-1),
          new Word(1),
          0,
        ));
        expect(result.view.getInt32(0)).toBe(0);
        expect(carry).toBe(1);
        expect(overflow).toBe(0);
      });

      it("AddWithCarry, no carryIn, no carryOut, overflow", () => {
        const { result, carry, overflow } = alu.addWithCarry(
          new Word(2 ** 30),
          new Word(2 ** 30),
          0,
        );
        expect(result.view.getUint32(0)).toBe(2 ** 31);
        expect(carry).toBe(0);
        expect(overflow).toBe(1);
      });

      it("AddWithCarry, no carryIn, carryOut, overflow", () => {
        const { result, carry, overflow } = alu.addWithCarry(
          new Word(2 ** 31),
          new Word(2 ** 31),
          0,
        );
        expect(result.view.getUint32(0)).toBe(0);
        expect(carry).toBe(1);
        expect(overflow).toBe(1);
      });

      it("AddWithCarry, carryIn", () => {
        let { result, carry, overflow } = alu.addWithCarry(
          new Word(1),
          new Word(1),
          1,
        );
        expect(result.view.getUint32(0)).toBe(3);
        expect(carry).toBe(0);
        expect(overflow).toBe(0);

        ({ result, carry, overflow } = alu.addWithCarry(
          new Word(-220),
          new Word(-220),
          1,
        ));
        expect(result.view.getInt32(0)).toBe(-439);
        expect(carry).toBe(1);
        expect(overflow).toBe(0);

        ({ result, carry, overflow } = alu.addWithCarry(
          new Word(2 ** 30),
          new Word(2 ** 30 - 1),
          1,
        ));
        expect(result.view.getUint32(0)).toBe(2 ** 31);
        expect(carry).toBe(0);
        expect(overflow).toBe(1);
      });
    });

    describe("Test ShiftC", () => {
      it("RRX", () => {
        let { shifted, carry } = alu.shiftC(
          new Word(2 ** 31),
          ShiftType.ROR,
          0,
          1,
          0,
        );
        expect(shifted.view.getUint32(0)).toBe(2 ** 31 + 2 ** 30);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(new Word(1), ShiftType.ROR, 0, 1, 0));
        expect(shifted.view.getUint32(0)).toBe(2 ** 31);
        expect(carry).toBe(1);

        ({ shifted, carry } = alu.shiftC(new Word(10), ShiftType.ROR, 0, 0, 0));
        expect(shifted.view.getUint32(0)).toBe(5);
        expect(carry).toBe(0);
      });

      it("LSL", () => {
        let { shifted, carry } = alu.shiftC(
          new Word(2 ** 31),
          ShiftType.LSL,
          1,
          1,
          0,
        );
        expect(shifted.view.getUint32(0)).toBe(0);
        expect(carry).toBe(1);

        ({ shifted, carry } = alu.shiftC(new Word(1), ShiftType.LSL, 4, 1, 0));
        expect(shifted.view.getUint32(0)).toBe(2 ** 4);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(new Word(10), ShiftType.LSL, 4, 0, 0));
        expect(shifted.view.getUint32(0)).toBe(10 * 2 ** 4);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(
          new Word(2 ** 31 - 1),
          ShiftType.LSL,
          4,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(4294967280);
        expect(carry).toBe(1);

        // Shift more than 32
        ({ shifted, carry } = alu.shiftC(
          new Word(2 ** 31 - 1),
          ShiftType.LSL,
          100,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(
          new Word(2 ** 31 - 1),
          ShiftType.LSL,
          32,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0);
        expect(carry).toBe(1);

        // shift 0
        ({ shifted, carry } = alu.shiftC(
          new Word(0x12345678),
          ShiftType.LSL,
          0,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0x12345678);
        expect(carry).toBe(0);
      });

      it("LSR", () => {
        let { shifted, carry } = alu.shiftC(
          new Word(2 ** 30),
          ShiftType.LSR,
          10,
          1,
          0,
        );
        expect(shifted.view.getUint32(0)).toBe(2 ** 20);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(new Word(10), ShiftType.LSR, 4, 1, 0));
        expect(shifted.view.getUint32(0)).toBe(0);
        expect(carry).toBe(1);

        ({ shifted, carry } = alu.shiftC(
          new Word(-32),
          ShiftType.LSR,
          5,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(134217727);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(new Word(-1), ShiftType.LSR, 4, 0, 0));
        expect(shifted.view.getUint32(0)).toBe(268435455);
        expect(carry).toBe(1);

        // shift more than 32
        ({ shifted, carry } = alu.shiftC(
          new Word(2 ** 31 - 1),
          ShiftType.LSR,
          100,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(
          new Word(2 ** 31 - 1),
          ShiftType.LSR,
          32,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0);
        expect(carry).toBe(0);

        // shift LSR #0 is interpreted as LSR #32
        ({ shifted, carry } = alu.shiftC(
          new Word(0x12345678),
          ShiftType.LSR,
          0,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0);
        expect(carry).toBe(0);

        // shift LSR r1 where r1 = 0 is intepreted as no shift
        ({ shifted, carry } = alu.shiftC(
          new Word(0x12345678),
          ShiftType.LSR,
          0,
          0,
          1,
        ));
        expect(shifted.view.getUint32(0)).toBe(0x12345678);
        expect(carry).toBe(0);
      });

      it("ASR", () => {
        let { shifted, carry } = alu.shiftC(
          new Word(2 ** 30),
          ShiftType.ASR,
          10,
          1,
          0,
        );
        expect(shifted.view.getUint32(0)).toBe(2 ** 20);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(new Word(10), ShiftType.ASR, 4, 1, 0));
        expect(shifted.view.getUint32(0)).toBe(0);
        expect(carry).toBe(1);

        ({ shifted, carry } = alu.shiftC(
          new Word(-32),
          ShiftType.ASR,
          5,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(4294967295);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(new Word(-1), ShiftType.ASR, 4, 0, 0));
        expect(shifted.view.getUint32(0)).toBe(4294967295);
        expect(carry).toBe(1);

        // Shift more than 32
        ({ shifted, carry } = alu.shiftC(
          new Word(0x80000000),
          ShiftType.ASR,
          32,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0xffffffff);
        expect(carry).toBe(1);

        ({ shifted, carry } = alu.shiftC(
          new Word(0x80000000),
          ShiftType.ASR,
          100,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0xffffffff);
        expect(carry).toBe(1);

        // Shift more than 32
        ({ shifted, carry } = alu.shiftC(
          new Word(0x7ffffff),
          ShiftType.ASR,
          32,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0x00000000);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(
          new Word(0x7ffffff),
          ShiftType.ASR,
          100,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0x00000000);
        expect(carry).toBe(0);

        // ASR #0 is interpreted as ASR #32
        ({ shifted, carry } = alu.shiftC(
          new Word(0x12345678),
          ShiftType.ASR,
          0,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0);
        expect(carry).toBe(0);

        // But ASR r1 where r1 value is 0 is interpreted as no shift
        ({ shifted, carry } = alu.shiftC(
          new Word(0x12345678),
          ShiftType.ASR,
          0,
          0,
          1,
        ));
        expect(shifted.view.getUint32(0)).toBe(0x12345678);
        expect(carry).toBe(0);
      });

      it("ROR", () => {
        let { shifted, carry } = alu.shiftC(
          new Word(2 ** 30),
          ShiftType.ROR,
          10,
          1,
          0,
        );
        expect(shifted.view.getUint32(0)).toBe(2 ** 20);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(new Word(25), ShiftType.ROR, 4, 1, 0));
        expect(shifted.view.getUint32(0)).toBe(2415919105);
        expect(carry).toBe(1);

        ({ shifted, carry } = alu.shiftC(
          new Word(-32),
          ShiftType.ROR,
          5,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(134217727);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(new Word(-1), ShiftType.ROR, 4, 0, 0));
        expect(shifted.view.getUint32(0)).toBe(4294967295);
        expect(carry).toBe(1);

        //Shift more than 32
        ({ shifted, carry } = alu.shiftC(
          new Word(0x00000001),
          ShiftType.ROR,
          32,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0x00000001);
        expect(carry).toBe(0);

        ({ shifted, carry } = alu.shiftC(
          new Word(0x00000001),
          ShiftType.ROR,
          100,
          0,
          0,
        ));
        expect(shifted.view.getUint32(0)).toBe(0x10000000);
        expect(carry).toBe(0);
      });
    });
  });

  describe("Test AND", () => {
    it("Test AND Reg (with optional shift)", () => {
      // Case 1: LSL - Normal (no flags)
      let { result, nzcv } = alu.and(
        new Word(0xca),
        new Word(0x61),
        1,
        ShiftType.LSL,
      );
      expect(result.view.getUint32(0)).toBe(0xc2);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: LSR - zero result, Z=1
      ({ result, nzcv } = alu.and(
        new Word(0x02),
        new Word(0x80000000),
        1,
        ShiftType.LSR,
      ));
      expect(result.view.getUint32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 3: ASR - zero result, Z=1
      ({ result, nzcv } = alu.and(
        new Word(0xf0000000),
        new Word(0x80000000),
        1,
        ShiftType.ASR,
      ));
      expect(result.view.getUint32(0)).toBe(0xc0000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: ROR - general rotation
      ({ result, nzcv } = alu.and(
        new Word(0xf0f0f0f0),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      expect(result.view.getUint32(0)).toBe(0x10000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: LSL #31 → carry-out from bit 0
      ({ result, nzcv } = alu.and(
        new Word(0x01),
        new Word(0x03),
        31,
        ShiftType.LSL,
      ));
      expect(result.view.getUint32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      ({ result, nzcv } = alu.and(
        new Word(0x01),
        new Word(0x03),
        new Word(0x1f),
        ShiftType.LSL,
      ));
      expect(result.view.getUint32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 6: MSB=1 → N=1
      ({ result, nzcv } = alu.and(
        new Word(0x80000000),
        new Word(0xffffffff),
        0,
        ShiftType.LSL,
      ));
      expect(result.view.getUint32(0)).toBe(0x80000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 7: Zero result → Z=1
      ({ result, nzcv } = alu.and(
        new Word(0x00),
        new Word(0xff),
        0,
        ShiftType.LSL,
      ));
      expect(result.view.getUint32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 8: ROR #1 = RRX, with carry-in = 1
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 }); // preload carry flag
      ({ result, nzcv } = alu.and(
        new Word(0x80000000),
        new Word(0x00000001),
        0,
        ShiftType.ROR,
      ));
      expect(result.view.getUint32(0)).toBe(0x80000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });
    });

    it("Test AND Imm", () => {
      // Case 1: Simple AND where result is non-zero, positive
      // 0x0F0F0FFF & 0x00FF = 0x000000FF
      let { result, nzcv } = alu.i_and(new Word(0x0f0f0fff), new Imm12(0x0ff));
      expect(result.view.getUint32(0)).toBe(0x000000ff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Result is zero
      // 0xF0000000 & 0x0FFF = 0x00000000
      ({ result, nzcv } = alu.i_and(new Word(0xf0000000), new Imm12(0xfff)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 3: Negative result (bit 31 = 1)
      // 0x000000FF ROR 4 = 0xF000000F
      // 0xF00000FF & 0xF000000F = 0xF000000F
      ({ result, nzcv } = alu.i_and(new Word(0xf00000ff), new Imm12(0x2ff)));
      expect(result.view.getUint32(0)).toBe(0xf000000f);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });

      // Case 4: Immediate rotation case
      // 0x00000001 ROR 16 = 0x00010000
      // 0xFFFFFFFF & 0x00010000 = 0x00010000
      ({ result, nzcv } = alu.i_and(new Word(0xffffffff), new Imm12(0x801)));
      expect(result.view.getUint32(0)).toBe(0x00010000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: Check Z=1 and carry=1 propagation from rotated immediate
      // 0x00000002 ROR 1 = 0x10000000
      // 0x00000000 & 0x10000000 = 0x00000000
      ({ result, nzcv } = alu.i_and(new Word(0x00000000), new Imm12(0x102)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });
    });
  });

  describe("Test EOR", () => {
    it("Test EOR Reg (with optional shift)", () => {
      // Case 1: LSL - Normal (no flags)
      let { result, nzcv } = alu.eor(
        new Word(0xca),
        new Word(0x61),
        1,
        ShiftType.LSL,
      );
      // 0x61 << 1 = 0xC2, 0xCA ^ 0xC2 = 0x08
      expect(result.view.getUint32(0)).toBe(0x08);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: LSR - zero result, Z=1
      ({ result, nzcv } = alu.eor(
        new Word(0x02),
        new Word(0x80000000),
        1,
        ShiftType.LSR,
      ));
      // 0x80000000 >> 1 = 0x40000000, 0x02 ^ 0x40000000 = 0x40000002
      expect(result.view.getUint32(0)).toBe(0x40000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 3: ASR - zero result, Z=1
      ({ result, nzcv } = alu.eor(
        new Word(0x02),
        new Word(0x80000000),
        1,
        ShiftType.ASR,
      ));
      // 0x80000000 >>A 1 = 0xC0000000, 0x02 ^ 0xC0000000 = 0xC0000002
      expect(result.view.getUint32(0)).toBe(0xc0000002);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: ROR - general rotation
      ({ result, nzcv } = alu.eor(
        new Word(0xf0f0f0f0),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      // 0x80000001 ROR 4 = 0x18000000
      // XOR: 0xF0F0F0F0 ^ 0x18000000 = 0xE8F0F0F0
      expect(result.view.getUint32(0)).toBe(0xe8f0f0f0);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 5: LSL #31 → carry-out from bit 0
      ({ result, nzcv } = alu.eor(
        new Word(0x01),
        new Word(0x03),
        31,
        ShiftType.LSL,
      ));
      // 0x03 << 31 = 0x80000000, XOR = 0x80000001
      expect(result.view.getUint32(0)).toBe(0x80000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });

      // Case 6: MSB=1 → N=1
      ({ result, nzcv } = alu.eor(
        new Word(0x80000000),
        new Word(0xffffffff),
        0,
        ShiftType.LSL,
      ));
      // 0x80000000 ^ 0xFFFFFFFF = 0x7FFFFFFF
      expect(result.view.getUint32(0)).toBe(0x7fffffff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 7: Zero result → Z=1
      ({ result, nzcv } = alu.eor(
        new Word(0xff),
        new Word(0xff),
        0,
        ShiftType.LSL,
      ));
      // 0xFF ^ 0xFF = 0x00
      expect(result.view.getUint32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 8: ROR #1 = RRX, with carry-in = 1
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 }); // preload carry flag
      ({ result, nzcv } = alu.eor(
        new Word(0x80000000),
        new Word(0x00000001),
        0,
        ShiftType.ROR,
      ));
      // RRX: 0x00000001 with carry=1 → 0x80000000, XOR result = 0x00000000
      expect(result.view.getUint32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });
    });

    it("Test EOR Imm", () => {
      // Case 1: Simple XOR where result is non-zero
      // No rotation
      // 0x0F0F0FFF ^ 0x0000000F = 0x0F0F0FF0
      let { result, nzcv } = alu.i_eor(new Word(0x0f0f0fff), new Imm12(0x00f));
      expect(result.view.getUint32(0)).toBe(0x0f0f0ff0);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Result is zero
      // 0x000000AA ROR 20 = 0x000AA000
      // 0x000AA000 ^ 0x000AA000 = 0x00000000
      ({ result, nzcv } = alu.i_eor(new Word(0x000aa000), new Imm12(0xaaa)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 3: Negative result (bit 31 = 1)
      // No rotation
      // 0xF0000000 ^ 0x000000FF = 0xF00000FF
      ({ result, nzcv } = alu.i_eor(new Word(0xf0000000), new Imm12(0x0ff)));
      expect(result.view.getUint32(0)).toBe(0xf00000ff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: Immediate rotation case
      // 0x00000001 ROR 16 = 0x00010000
      // 0xFFFFFFFF ^ 0x00010000 = 0xFFFEFFFF
      ({ result, nzcv } = alu.i_eor(new Word(0xffffffff), new Imm12(0x801)));
      expect(result.view.getUint32(0)).toBe(0xfffeffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 5: Rotation with carry propagation
      // 0x00000001 ROR 2 = 0x40000000
      // 0x00000000 ^ 0x40000000 = 0x40000000
      ({ result, nzcv } = alu.i_eor(new Word(0x00000000), new Imm12(0x101)));
      expect(result.view.getUint32(0)).toBe(0x40000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });
    });
  });

  describe("Test SUB", () => {
    it("Test SUB Reg (with optional shift)", () => {
      // Case 1: LSL - simple subtract
      let { result, nzcv } = alu.sub(
        new Word(0xca),
        new Word(0x61),
        1,
        ShiftType.LSL,
      );
      // 0x61 << 1 = 0xC2; 0xCA - 0xC2 = 0x08
      // N=0 (positive), Z=0, C=1 (no borrow), V=0 (no overflow)
      expect(result.view.getUint32(0)).toBe(0x08);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 2: LSR - large subtraction, result negative
      ({ result, nzcv } = alu.sub(
        new Word(0x02),
        new Word(0x80000000),
        1,
        ShiftType.LSR,
      ));
      // 0x80000000 >> 1 = 0x40000000; 0x02 - 0x40000000 = 0xC0000002
      // N=1 (negative), Z=0, C=0 (borrow), V=0
      expect(result.view.getUint32(0)).toBe(0xc0000002);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 3: ASR - keep sign bit
      ({ result, nzcv } = alu.sub(
        new Word(0x02),
        new Word(0x80000000),
        1,
        ShiftType.ASR,
      ));
      // 0x80000000 >>A 1 = 0xC0000000; 0x02 - 0xC0000000 = 0x40000002
      // N=0, Z=0, C=0 (no carry), V=0 (overflow: neg→pos)
      expect(result.view.getUint32(0)).toBe(0x40000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 4: ROR - rotation with normal arithmetic
      ({ result, nzcv } = alu.sub(
        new Word(0xf0f0f0f0),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      // 0x80000001 ROR 4 = 0x18000000
      // 0xF0F0F0F0 - 0x18000000 = 0xD8F0F0E8
      // N=1, Z=0, C=1 (no borrow), V=0
      expect(result.view.getUint32(0)).toBe(0xd8f0f0f0);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });

      // Case 5: LSL #31 - potential carry-out
      ({ result, nzcv } = alu.sub(
        new Word(0x01),
        new Word(0x03),
        31,
        ShiftType.LSL,
      ));
      // 0x03 << 31 = 0x80000000; 0x01 - 0x80000000 = 0x80000001
      // N=1, Z=0, C=0 (borrow), V=1 (overflow)
      expect(result.view.getUint32(0)).toBe(0x80000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 6: Positive overflow
      ({ result, nzcv } = alu.sub(
        new Word(0x7fffffff),
        new Word(0xffffffff),
        0,
        ShiftType.LSL,
      ));
      // 0x7FFFFFFF - 0xFFFFFFFF = 0x80000000
      // N=1, Z=0, C=0, V=1 (signed overflow)
      expect(result.view.getUint32(0)).toBe(0x80000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 7: Zero result → Z=1
      ({ result, nzcv } = alu.sub(
        new Word(0xff),
        new Word(0xff),
        0,
        ShiftType.LSL,
      ));
      // 0xFF - 0xFF = 0x00
      // N=0, Z=1, C=1 (no borrow), V=0
      expect(result.view.getUint32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 8: ROR #1 = RRX with carry-in = 1
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 }); // preload carry flag
      ({ result, nzcv } = alu.sub(
        new Word(0x80000000),
        new Word(0x00000001),
        0,
        ShiftType.ROR,
      ));
      // RRX(0x00000001, carry=1) = 0x80000000
      // 0x80000000 - 0x80000000 = 0x00
      // N=0, Z=1, C=1 (no borrow), V=0
      expect(result.view.getUint32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });
    });

    it("Test SUB Imm", () => {
      // Case 1: Simple subtraction with positive result
      // 5 - 3 = 2
      // N=0, Z=0, C=1 (no borrow), V=0
      let { result, nzcv } = alu.i_sub(new Word(0x00000005), new Imm12(0x003));
      expect(result.view.getUint32(0)).toBe(0x00000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 2: Subtraction resulting in zero
      // 10 - 10 = 0
      // N=0, Z=1, C=1 (no borrow), V=0
      ({ result, nzcv } = alu.i_sub(new Word(0x0000000a), new Imm12(0x00a)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 3: Subtraction resulting in borrow
      // 3 - 5 = -2 = 0xFFFFFFFE
      // N=1, Z=0, C=0 (borrow occurred), V=0
      ({ result, nzcv } = alu.i_sub(new Word(0x00000003), new Imm12(0x005)));
      expect(result.view.getUint32(0)).toBe(0xfffffffe);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: Signed overflow (positive - negative = overflow)
      //
      // 0x7FFFFFFF - 0xFFFFFFFF = 0x80000000
      // N=1, Z=0, C=0 (borrow), V=1 (overflow)
      ({ result, nzcv } = alu.i_sub(new Word(0x7fffffff), new Imm12(0x2ff)));
      expect(result.view.getUint32(0)).toBe(0x8ffffff0);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 5: Immediate rotation case
      // 0x00000001 ROR 16 = 0x00010000
      // 0x00020000 - 0x00010000 = 0x00010000
      // N=0, Z=0, C=1 (no borrow), V=0
      ({ result, nzcv } = alu.i_sub(new Word(0x00020000), new Imm12(0x801)));
      expect(result.view.getUint32(0)).toBe(0x00010000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 6: Rotation with carry propagation
      // 0x00000001 ROR 2 = 0x40000000
      // 0x20000000 - 0x40000000 = 0xE0000000
      // N=1, Z=0, C=0 (borrow occurred), V=0
      ({ result, nzcv } = alu.i_sub(new Word(0x20000000), new Imm12(0x101)));
      expect(result.view.getUint32(0)).toBe(0xe0000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });
    });
  });

  describe("Test RSB", () => {
    it("Test RSB Reg (with optional shift)", () => {
      // Case 1: LSL - simple reverse subtract
      let { result, nzcv } = alu.rsb(
        new Word(0xca),
        new Word(0x61),
        1,
        ShiftType.LSL,
      );
      // Rm = 0x61 << 1 = 0xC2
      // RSB = 0xC2 - 0xCA = 0xF8 (unsigned wrap)
      // N=1 (negative), Z=0, C=0 , V=0
      expect(result.view.getUint32(0)).toBe(0xfffffff8);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 2: LSR - Operand2 < Operand1, borrow occurs
      ({ result, nzcv } = alu.rsb(
        new Word(0x02),
        new Word(0x80000000),
        1,
        ShiftType.LSR,
      ));
      // 0x80000000 >> 1 = 0x40000000
      // RSB = 0x40000000 - 0x02 = 0x3FFFFFFE
      // N=0, Z=0, C=1 , V=0
      expect(result.view.getUint32(0)).toBe(0x3ffffffe);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 3: ASR - signed shift preserves sign
      ({ result, nzcv } = alu.rsb(
        new Word(0x02),
        new Word(0x80000000),
        1,
        ShiftType.ASR,
      ));
      // 0x80000000 >>A 1 = 0xC0000000
      // RSB = 0xC0000000 - 0x02 = 0xBFFFFFFE
      // N=1, Z=0, C=1 , V=0 (no signed overflow)
      expect(result.view.getUint32(0)).toBe(0xbffffffe);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });

      // Case 4: ROR - corrected value (0x80000001 ROR 4 = 0x18000000)
      ({ result, nzcv } = alu.rsb(
        new Word(0xf0f0f0f0),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      // 0x80000001 ROR 4 = 0x18000000
      // RSB = 0x18000000 - 0xF0F0F0F0 = 0x27100F10
      // N=0, Z=0, C=0 , V=0
      expect(result.view.getUint32(0)).toBe(0x270f0f10);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: LSL #31 - large left shift
      ({ result, nzcv } = alu.rsb(
        new Word(0x01),
        new Word(0x03),
        31,
        ShiftType.LSL,
      ));
      // 0x03 << 31 = 0x80000000
      // RSB = 0x80000000 - 0x01 = 0x7FFFFFFF
      // N=0, Z=0, C=1 , V=1 (overflow since this is -2**31 - 1)
      expect(result.view.getInt32(0)).toBe(0x7fffffff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 1 });

      // Case 6: Positive overflow (large diff)
      ({ result, nzcv } = alu.rsb(
        new Word(0xffffffff),
        new Word(0x7fffffff),
        0,
        ShiftType.LSL,
      ));
      // 0x7FFFFFFF - 0xFFFFFFFF = 0x80000000
      // N=1, Z=0, C=0 , V=1 (signed overflow)
      expect(result.view.getUint32(0)).toBe(0x80000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 7: Zero result → Z=1
      ({ result, nzcv } = alu.rsb(
        new Word(0xff),
        new Word(0xff),
        0,
        ShiftType.LSL,
      ));
      // RSB = 0xFF - 0xFF = 0x00
      // N=0, Z=1, C=1 (no borrow), V=0
      expect(result.view.getInt32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 8: ROR #1 = RRX with carry-in = 1
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 }); // preload carry flag
      ({ result, nzcv } = alu.rsb(
        new Word(0x80000000),
        new Word(0x00000001),
        0,
        ShiftType.ROR,
      ));
      // RRX(0x00000001, carry=1) = 0x80000000
      // RSB = 0x80000000 - 0x80000000 = 0x00
      // N=0, Z=1, C=1 (no borrow), V=0
      expect(result.view.getInt32(0)).toBe(0x00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });
    });

    it("Test RSB Imm", () => {
      // Case 1: Simple reverse subtraction with positive result
      // 5 - 3 (SUB) would be 2, but RSB reverses it: 3 - 5 = -2 = 0xFFFFFFFE
      // N=1, Z=0, C=0 (borrow), V=0
      let { result, nzcv } = alu.i_rsb(new Word(0x00000005), new Imm12(0x003));
      expect(result.view.getUint32(0)).toBe(0xfffffffe);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 2: Reverse subtraction producing zero
      // 10 - 10 = 0
      // N=0, Z=1, C=1 (no borrow), V=0
      ({ result, nzcv } = alu.i_rsb(new Word(0x0000000a), new Imm12(0x00a)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 3: Reverse subtraction producing positive result
      // 8 - 3 = 5
      // N=0, Z=0, C=1 (no borrow), V=0
      ({ result, nzcv } = alu.i_rsb(new Word(0x00000008), new Imm12(0x003)));
      expect(result.view.getUint32(0)).toBe(0xfffffffb);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: Reverse subtraction with overflow
      // imm = 0x000000F7 ROR 8 = 0x7F000000, Rn = 0xFFFFFFFF
      // 0xFFF - 0xFFFFFFFF = 0x80000000
      // N=1, Z=0, C=1 (no borrow), V=1

      ({ result, nzcv } = alu.i_rsb(new Word(0x80000000), new Imm12(0x001)));
      expect(result.view.getUint32(0)).toBe(0x80000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 5: Immediate rotation case
      // 0x00000001 ROR 16 = 0x00010000
      // 0x00010000 - 0x00020000 = 0xFFFF0000
      // N=1, Z=0, C=0 (borrow), V=0
      ({ result, nzcv } = alu.i_rsb(new Word(0x00020000), new Imm12(0x801)));
      expect(result.view.getUint32(0)).toBe(0xffff0000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 6: Rotation with carry propagation
      // 0x00000001 ROR 2 = 0x40000000
      // 0x40000000 - 0x20000000 = 0x20000000
      // N=0, Z=0, C=1 (no borrow), V=0
      ({ result, nzcv } = alu.i_rsb(new Word(0x20000000), new Imm12(0x101)));
      expect(result.view.getUint32(0)).toBe(0x20000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });
    });
  });

  describe("Test ADD", () => {
    it("Test ADD Reg (with optional shift)", () => {
      // Case 1: Basic add (no shift)
      // 0x00000001 + 0x00000001 = 0x00000002
      // N=0, Z=0, C=0 (no unsigned overflow), V=0 (no signed overflow)
      let { result, nzcv } = alu.add(
        new Word(0x00000001),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      );
      expect(result.view.getUint32(0)).toBe(0x00000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: LSL shift
      // Operand2 << 1 → 0x00000001 << 1 = 0x00000002
      // 0x00000001 + 0x00000002 = 0x00000003
      // N=0, Z=0, C=0, V=0
      ({ result, nzcv } = alu.add(
        new Word(0x00000001),
        new Word(0x00000001),
        1,
        ShiftType.LSL,
      ));
      expect(result.view.getUint32(0)).toBe(0x00000003);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 3: LSR shift
      // Operand2 >> 1 → 0x00000004 >> 1 = 0x00000002
      // 0x00000002 + 0x00000002 = 0x00000004
      // N=0, Z=0, C=0, V=0
      ({ result, nzcv } = alu.add(
        new Word(0x00000002),
        new Word(0x00000004),
        1,
        ShiftType.LSR,
      ));
      expect(result.view.getUint32(0)).toBe(0x00000004);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 4: ASR shift
      // Operand2 ASR 4 → 0x10000000 >> 4 (arithmetic) = 0x01000000
      // 0xF0000000 + 0x01000000 = 0xF1000000
      // N=1 (MSB=1), Z=0, C=0, V=0
      ({ result, nzcv } = alu.add(
        new Word(0xf0000000),
        new Word(0x10000000),
        4,
        ShiftType.ASR,
      ));
      expect(result.view.getUint32(0)).toBe(0xf1000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 5: ROR shift
      // Operand2 ROR 4 → 0x80000001 ROR 4 = 0x18000000
      // 0x12345678 + 0x18000000 = 0x2A345678 (MSB=0)
      // N=0, Z=0, C=0, V=0
      ({ result, nzcv } = alu.add(
        new Word(0x12345678),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      expect(result.view.getUint32(0)).toBe(0x2a345678);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 6: Carry-out
      // 0xFFFFFFFF + 0x00000001 = 0x100000000 → wraps to 0x00000000
      // N=0, Z=1 (result=0), C=1 (unsigned overflow), V=0
      ({ result, nzcv } = alu.add(
        new Word(0xffffffff),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      ));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 7: Signed overflow
      // 0x7FFFFFFF + 0x00000001 = 0x80000000
      // N=1, Z=0, C=0 (no unsigned wrap), V=1 (signed overflow)
      ({ result, nzcv } = alu.add(
        new Word(0x7fffffff),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      ));
      expect(result.view.getUint32(0)).toBe(0x80000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 8: Zero result
      // 0x00000000 + 0x00000000 = 0x00000000
      // N=0, Z=1, C=0, V=0
      ({ result, nzcv } = alu.add(
        new Word(0x00000000),
        new Word(0x00000000),
        0,
        ShiftType.LSL,
      ));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 9: Special RRX (ROR #1 with C=1)
      // Carry-in=1 rotates into MSB of Operand2
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.add(
        new Word(0x00000001),
        new Word(0x80000000),
        0,
        ShiftType.ROR,
      ));
      // 0x80000000 RRX + 0x1 = 0xC0000000
      // N=1, Z=0, C=0, V=0
      expect(result.view.getUint32(0)).toBe(0xc0000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });
    });

    it("Test ADD Imm", () => {
      // Case 1: Simple addition without carry or overflow
      // 5 + 3 = 8
      // N=0, Z=0, C=0, V=0
      let { result, nzcv } = alu.i_add(new Word(0x00000005), new Imm12(0x003));
      expect(result.view.getUint32(0)).toBe(0x00000008);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Addition resulting in zero
      // 0xFFFFFFFF + 1 = 0x00000000 (wraps around)
      // N=0, Z=1, C=1 (carry out), V=0
      ({ result, nzcv } = alu.i_add(new Word(0xffffffff), new Imm12(0x001)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 3: Addition causing signed overflow
      // 0x7FFFFFFF + 1 = 0x80000000
      // N=1, Z=0, C=0, V=1
      ({ result, nzcv } = alu.i_add(new Word(0x7fffffff), new Imm12(0x001)));
      expect(result.view.getUint32(0)).toBe(0x80000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 4: Addition with carry out (unsigned overflow)
      // 0xFFFFFFF0 + 0x30 = 0x00000020
      // N=0, Z=0, C=1 (carry out), V=0
      ({ result, nzcv } = alu.i_add(new Word(0xfffffff0), new Imm12(0x030)));
      expect(result.view.getUint32(0)).toBe(0x00000020);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 5: Immediate rotation case
      // 0x00000001 ROR 16 = 0x00010000
      // 0x00000010 + 0x00010000 = 0x00010010
      // N=0, Z=0, C=0, V=0
      ({ result, nzcv } = alu.i_add(new Word(0x00000010), new Imm12(0x801)));
      expect(result.view.getUint32(0)).toBe(0x00010010);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 6: Rotation with carry propagation
      // 0x00000001 ROR 2 = 0x40000000
      // 0x40000000 + 0x40000000 = 0x80000000
      // N=1, Z=0, C=0, V=1 (signed overflow)
      ({ result, nzcv } = alu.i_add(new Word(0x40000000), new Imm12(0x101)));
      expect(result.view.getUint32(0)).toBe(0x80000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });
    });
  });

  describe("Test ADC", () => {
    it("Test ADC Reg (with optional shift)", () => {
      // Case 1: Basic add with carry-in=0
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      let { result, nzcv } = alu.adc(
        new Word(0x00000001),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      );
      // 1+1+0 = 2
      expect(result.view.getUint32(0)).toBe(0x00000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Basic add with carry-in=1
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.adc(
        new Word(0x00000001),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      ));
      // 1+1+1 = 3
      expect(result.view.getUint32(0)).toBe(0x00000003);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 3: LSL shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.adc(
        new Word(0x00000001),
        new Word(0x00000001),
        1,
        ShiftType.LSL,
      ));
      // Operand2 << 1 = 0x2 → 1+2=3
      expect(result.view.getUint32(0)).toBe(0x00000003);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 4: LSR shift with carry-in=1
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.adc(
        new Word(0x00000002),
        new Word(0x00000004),
        1,
        ShiftType.LSR,
      ));
      // Operand2 >>1 =2 → 2+2+1=5
      expect(result.view.getUint32(0)).toBe(0x00000005);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: ASR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.adc(
        new Word(0xf0000000),
        new Word(0x10000000),
        4,
        ShiftType.ASR,
      ));
      // Operand2 >>A 4 = 0x01000000 → 0xF0000000+0x01000000=0xF1000000
      expect(result.view.getUint32(0)).toBe(0xf1000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 6: ROR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.adc(
        new Word(0x12345678),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      // 0x80000001 ROR 4 = 0x18000000 → 0x12345678+0x18000000=0x92345678
      expect(result.view.getUint32(0)).toBe(0x2a345679);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 7: Carry-out
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.adc(
        new Word(0xffffffff),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      ));
      // 0xFFFFFFFF+0x1+1=0x100000001 → 0x00000001
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 8: Signed overflow
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.adc(
        new Word(0x7fffffff),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      ));
      // 0x7FFFFFFF+0x1+0=0x80000000 → signed overflow
      expect(result.view.getUint32(0)).toBe(0x80000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 9: Zero result
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.adc(
        new Word(0x00000000),
        new Word(0x00000000),
        0,
        ShiftType.LSL,
      ));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 10: Update carry-in in ALU
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 }); // manually set C=1
      ({ result, nzcv } = alu.adc(
        new Word(0x00000001),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      ));
      // 1+1+1=3 → check that carry-in was used
      expect(result.view.getUint32(0)).toBe(0x00000003);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });
    });

    it("Test ADC Imm", () => {
      // Case 1: Basic ADC with carry = 0
      // Carry in = 0
      // 5 + 3 + 0 = 8
      // N=0, Z=0, C=0, V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      let { result, nzcv } = alu.i_adc(new Word(0x00000005), new Imm12(0x003));
      expect(result.view.getUint32(0)).toBe(0x00000008);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Basic ADC with carry = 1
      // Carry in = 1
      // 5 + 3 + 1 = 9
      // N=0, Z=0, C=0, V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_adc(new Word(0x00000005), new Imm12(0x003)));
      expect(result.view.getUint32(0)).toBe(0x00000009);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 3: Addition resulting in unsigned carry
      // Carry in = 0
      // 0xFFFFFFFE + 1 + 0 = 0xFFFFFFFF
      // N=1, Z=0, C=0, V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.i_adc(new Word(0xfffffffe), new Imm12(0x001)));
      expect(result.view.getUint32(0)).toBe(0xffffffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: Addition with carry-in producing unsigned overflow
      // Carry in = 1
      // 0xFFFFFFFF + 0x1 + 1 = 0x00000001 (wrap around)
      // N=0, Z=0, C=1, V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_adc(new Word(0xffffffff), new Imm12(0x001)));
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 5: Signed overflow
      // Carry in = 0
      // 0x7FFFFFFF + 1 + 0 = 0x80000000
      // N=1, Z=0, C=0, V=1
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.i_adc(new Word(0x7fffffff), new Imm12(0x001)));
      expect(result.view.getUint32(0)).toBe(0x80000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 6: Immediate rotation case
      // Carry in = 0
      // 0x00000001 ROR 16 = 0x00010000
      // 0x00000010 + 0x00010000 + 0 = 0x00010010
      // N=0, Z=0, C=0, V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.i_adc(new Word(0x00000010), new Imm12(0x801)));
      expect(result.view.getUint32(0)).toBe(0x00010010);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 7: Rotation with carry propagation
      // Carry in = 1
      // 0x00000001 ROR 2 = 0x40000000
      // 0x40000000 + 0x40000000 + 1 = 0x80000001
      // N=1, Z=0, C=0, V=1
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_adc(new Word(0x40000000), new Imm12(0x101)));
      expect(result.view.getUint32(0)).toBe(0x80000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });
    });
  });

  describe("Test SBC", () => {
    it("Test SBC Reg (with optional shift)", () => {
      // Case 1: Basic subtract, carry-in=1 (no borrow)
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      let { result, nzcv } = alu.sbc(
        new Word(0x00000003),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      );
      // 3 - 1 - (1-1)=2
      expect(result.view.getUint32(0)).toBe(0x00000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 2: Basic subtract, carry-in=0 (borrow)
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.sbc(
        new Word(0x00000003),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      ));
      // 3 - 1 - (1-0)=1
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 3: LSL shift
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.sbc(
        new Word(0x00000004),
        new Word(0x00000001),
        1,
        ShiftType.LSL,
      ));
      // Operand2 <<1 =2 → 4- 2 + 1 - 1 =2
      expect(result.view.getUint32(0)).toBe(0x00000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 4: LSR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.sbc(
        new Word(0x00000004),
        new Word(0x00000008),
        1,
        ShiftType.LSR,
      ));
      // Operand2 >>1 =4 → 4 - 4 + 0 - 1 (without carry)=0
      expect(result.view.getUint32(0)).toBe(0xffffffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 5: ASR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.sbc(
        new Word(0xf0000000),
        new Word(0x10000000),
        4,
        ShiftType.ASR,
      ));
      // Operand2 >>4=0x01000000 → 0xF0000000-0x01000000=0xEFFFFFFF
      expect(result.view.getUint32(0)).toBe(0xef000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });

      // Case 6: ROR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.sbc(
        new Word(0x12345678),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      // Operand2 ROR4=0x18000000 → 0x12345678-0x18000000 - 1 =0xFA345676
      expect(result.view.getUint32(0)).toBe(0xfa345677);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 7: Borrow occurs
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.sbc(
        new Word(0x00000001),
        new Word(0x00000002),
        0,
        ShiftType.LSL,
      ));
      // 1 - 2 + 1 - 1 = -1
      expect(result.view.getUint32(0)).toBe(0xffffffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 8: Signed overflow
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.sbc(
        new Word(0x80000000),
        new Word(0xffffffff),
        0,
        ShiftType.LSL,
      ));
      // 0x80000000-0xFFFFFFFF-0=(0x80000000+1)=0x80000001 → signed overflow
      expect(result.view.getUint32(0)).toBe(0x80000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 9: Zero result
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.sbc(
        new Word(0x12345678),
        new Word(0x12345678),
        0,
        ShiftType.LSL,
      ));
      // 0x12345678-0x12345678-(1-1)=0
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 10: Update carry in ALU
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 }); // manually set C=0
      ({ result, nzcv } = alu.sbc(
        new Word(0x00000003),
        new Word(0x00000001),
        0,
        ShiftType.LSL,
      ));
      // 3-1-(1-0)=1 → carry-in used
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });
    });

    it("Test SBC Imm", () => {
      // Case 1: Simple subtraction with carry = 1
      // Carry in = 1 → normal subtraction
      // 10 - 3 - (1 - 1) = 7
      // N=0, Z=0, C=1 (no borrow), V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      let { result, nzcv } = alu.i_sbc(new Word(0x0000000a), new Imm12(0x003));
      expect(result.view.getUint32(0)).toBe(0x00000007);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 2: Subtraction with carry = 0 (subtracts one extra)
      // Carry in = 0 → subtract extra 1
      // 10 - 3 - (1 - 0) = 6
      // N=0, Z=0, C=1 (no borrow), V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.i_sbc(new Word(0x0000000a), new Imm12(0x003)));
      expect(result.view.getUint32(0)).toBe(0x00000006);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 3: Subtraction resulting in negative value
      // Carry in = 1
      // 3 - 10 - (1 - 1) = -7 = 0xFFFFFFF9
      // N=1, Z=0, C=0 (borrow), V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_sbc(new Word(0x00000003), new Imm12(0x00a)));
      expect(result.view.getUint32(0)).toBe(0xfffffff9);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: Subtraction producing zero
      // Carry in = 1
      // 5 - 5 - (1 - 1) = 0
      // N=0, Z=1, C=1 (no borrow), V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_sbc(new Word(0x00000005), new Imm12(0x005)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 5: Signed overflow
      // Carry in = 1
      // 0x000000FF ROR 4 = 0xF000000F
      // 0x7FFFFFFF - 0xF000000F - (1 - 1) = 0x8FFFFFF0
      // N=1, Z=0, C=0 (borrow), V=1
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_sub(new Word(0x7fffffff), new Imm12(0x2ff)));
      expect(result.view.getUint32(0)).toBe(0x8ffffff0);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 1 });

      // Case 6: Immediate rotation case
      // Carry in = 1
      // 0x00000001 ROR 16 = 0x00010000
      // 0x00020000 - 0x00010000 - (1 - 1) = 0x00010000
      // N=0, Z=0, C=1 (no borrow), V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_sbc(new Word(0x00020000), new Imm12(0x801)));
      expect(result.view.getUint32(0)).toBe(0x00010000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 7: Rotation with carry propagation
      // Carry in = 0
      // 0x00000001 ROR 2 = 0x40000000
      // 0x40000000 - 0x40000000 - (1 - 0) = 0xFFFFFFFF
      // N=0, Z=0, C=1 (no borrow), V=0
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.i_sbc(new Word(0x40000000), new Imm12(0x101)));
      expect(result.view.getUint32(0)).toBe(0xffffffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });
    });
  });

  describe("Test RSC", () => {
    it("Test RSC Reg (with optional shift)", () => {
      // Case 1: Basic reverse subtract, carry-in=1
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      let { result, nzcv } = alu.rsc(
        new Word(0x00000001),
        new Word(0x00000003),
        0,
        ShiftType.LSL,
      );
      // 3-1-(1-1)=2
      expect(result.view.getUint32(0)).toBe(0x00000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 2: Basic reverse subtract, carry-in=0
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.rsc(
        new Word(0x00000001),
        new Word(0x00000003),
        0,
        ShiftType.LSL,
      ));
      // 3-1-(1-0)=1
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 3: LSL shift
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.rsc(
        new Word(0x00000001),
        new Word(0x00000004),
        2,
        ShiftType.LSL,
      ));
      // Operand2 <<2 = 0x10 → 0x10-0x1-(1-1)=0xF
      expect(result.view.getUint32(0)).toBe(0x0000000f);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 4: LSR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.rsc(
        new Word(0x00000004),
        new Word(0x00000008),
        1,
        ShiftType.LSR,
      ));
      // 8>>1 =4 → 4-4-(1-1)=0
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 5: ASR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.rsc(
        new Word(0xf0000000),
        new Word(0x10000000),
        4,
        ShiftType.ASR,
      ));
      // 0x10000000 >>4 =0x01000000 → 0x01000000 -0xF0000000=0x11000000
      expect(result.view.getUint32(0)).toBe(0x11000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 6: ROR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.rsc(
        new Word(0x12345678),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      // Operand2 ROR4 = 0x18000000 → 0x18000000-0x12345678-(1-1)=0x05CAAB88
      expect(result.view.getUint32(0)).toBe(0x05cba988);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 7: Borrow occurs
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.rsc(
        new Word(0x00000005),
        new Word(0x00000002),
        0,
        ShiftType.LSL,
      ));
      // 2-5-(1-0)=2-5-1=-4=0xFFFFFFFC
      expect(result.view.getUint32(0)).toBe(0xfffffffc);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 8: Signed overflow
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.rsc(
        new Word(0x7fffffff),
        new Word(0x80000000),
        0,
        ShiftType.LSL,
      ));
      // 0x80000000-0x7FFFFFFF-(1-1)=1
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 1 });

      // Case 9: Zero result
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.rsc(
        new Word(0x12345678),
        new Word(0x12345678),
        0,
        ShiftType.LSL,
      ));
      // 0x12345678 - 0x12345678 -(1-1)=0
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 10: Update carry in ALU
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.rsc(
        new Word(0x00000001),
        new Word(0x00000003),
        0,
        ShiftType.LSL,
      ));
      // 3-1-(1-0)=1
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });
    });

    it("Test RSC Imm", () => {
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      let { result, nzcv } = alu.i_rsc(new Word(0x00000003), new Imm12(0x005));
      expect(result.view.getUint32(0)).toBe(0x00000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 2: With carry = 0 (subtract extra 1)
      // 0x00000005 ROR 0 = 0x00000005
      // 0x00000005 - 0x00000003 - (1 - 0) = 1
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.i_rsc(new Word(0x00000003), new Imm12(0x005)));
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 3: Result = 0
      // 0x00000007 ROR 0 = 0x00000007
      // 0x00000007 - 0x00000007 - (1 - 1) = 0
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_rsc(new Word(0x00000007), new Imm12(0x007)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 1, V: 0 });

      // Case 4: Negative result (set N)
      // 0x00000002 ROR 0 = 0x00000002
      // 0x00000002 - 0x00000005 - (1 - 1) = -3 → 0xFFFFFFFD
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_rsc(new Word(0x00000005), new Imm12(0x002)));
      expect(result.view.getUint32(0)).toBe(0xfffffffd);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 5: Immediate rotation case
      // 0x00000001 ROR 8 = 0x01000000
      // 0x01000000 - 0x00000001 - (1 - 1) = 0x00FFFFFF
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_rsc(new Word(0x00000001), new Imm12(0x401)));
      expect(result.view.getUint32(0)).toBe(0x00ffffff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 6: Signed overflow (set V)
      // 0x00000008 ROR 4 = 0x80000000
      // 0x80000000 - 0x7FFFFFFF - (1 - 1)
      // = 0x00000001 (since -2147483648 - 2147483647 = 1 with signed overflow)
      // Overflow occurs because negative - positive → positive result
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.i_rsc(new Word(0x7fffffff), new Imm12(0x208)));
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 1 });
    });
  });

  describe("Test ORR", () => {
    it("Test ORR Reg (with optional shift)", () => {
      // Case 1: Basic ORR, no shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      let { result, nzcv } = alu.orr(
        new Word(0x00000001),
        new Word(0x00000002),
        0,
        ShiftType.LSL,
      );
      // 0x1 | 0x2 = 0x3
      expect(result.view.getUint32(0)).toBe(0x00000003);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: LSL shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.orr(
        new Word(0x00000001),
        new Word(0x00000001),
        1,
        ShiftType.LSL,
      ));
      // 0x1 | (0x1<<1) = 0x3
      expect(result.view.getUint32(0)).toBe(0x00000003);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 3: LSR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.orr(
        new Word(0x00000002),
        new Word(0x00000004),
        1,
        ShiftType.LSR,
      ));
      // 0x2 | (0x4>>1)=0x2 | 0x2=0x2
      expect(result.view.getUint32(0)).toBe(0x00000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 4: ASR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.orr(
        new Word(0xf0000000),
        new Word(0x10000000),
        4,
        ShiftType.ASR,
      ));
      // 0xF0000000 | (0x10000000>>4) = 0xF1000000
      expect(result.view.getUint32(0)).toBe(0xf1000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 5: ROR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.orr(
        new Word(0x12345678),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      // 0x12345678 | (0x80000001 ROR4) = 0x12345678 | (0x18000000)
      expect(result.view.getUint32(0)).toBe(0x1a345678);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 6: Zero result
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.orr(
        new Word(0x00000000),
        new Word(0x00000000),
        0,
        ShiftType.LSL,
      ));
      // 0x0 | 0x0 = 0x0
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 7: ORR with carry-in set in ALU
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.orr(
        new Word(0x00000001),
        new Word(0x00000002),
        0,
        ShiftType.LSL,
      ));
      // 0x1 | 0x2 = 0x3, carry-in should not affect ORR
      expect(result.view.getUint32(0)).toBe(0x00000003);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });
    });

    it("Test ORR Imm", () => {
      // Case 1: Basic OR
      // 0x000000FF ROR 0 = 0x000000FF
      // 0x0F0F0000 | 0x000000FF = 0x0F0F00FF
      let { result, nzcv } = alu.i_orr(new Word(0x0f0f0000), new Imm12(0x0ff));
      expect(result.view.getUint32(0)).toBe(0x0f0f00ff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Result = 0 (Z flag set)
      // 0x00000000 ROR 0 = 0x00000000
      // 0x00000000 | 0x00000000 = 0x00000000
      ({ result, nzcv } = alu.i_orr(new Word(0x00000000), new Imm12(0x000)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 3: Negative result (N flag set)
      // 0x00000008 ROR 4 = 0x80000000
      // 0x00000001 | 0x80000000 = 0x80000001
      ({ result, nzcv } = alu.i_orr(new Word(0x00000001), new Imm12(0x208)));
      expect(result.view.getUint32(0)).toBe(0x80000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });

      // Case 4: Immediate rotation case
      // 0x00000001 ROR 8 = 0x01000000
      // 0x00FF0000 | 0x01000000 = 0x01FF0000
      ({ result, nzcv } = alu.i_orr(new Word(0x00ff0000), new Imm12(0x401)));
      expect(result.view.getUint32(0)).toBe(0x01ff0000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: Carry-out from rotation propagates
      // 0x00000001 ROR 2 = 0x40000000 (carry from bit 1)
      // 0x00000000 | 0x40000000 = 0x40000000
      ({ result, nzcv } = alu.i_orr(new Word(0x00000000), new Imm12(0x101)));
      expect(result.view.getUint32(0)).toBe(0x40000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 6: Large pattern OR
      // 0x0F0F0F0F ROR 0 = 0x0F0F0F0F
      // 0xF0000000 | 0x0F0F0F0F = 0xFF0F0F0F
      ({ result, nzcv } = alu.i_orr(new Word(0xf0000000), new Imm12(0xf0f)));
      expect(result.view.getUint32(0)).toBe(0xf000003c);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });
    });
  });

  describe("Test Shift", () => {
    it("Test Shift Reg (with optional shift)", () => {
      let { result, nzcv } = alu.mov(
        new Word(0x00000001),
        new Word(0x00000002),
        ShiftType.LSL,
      );
      // 0x1  << 2 = 0x4
      expect(result.view.getUint32(0)).toBe(0x00000004);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      ({ result, nzcv } = alu.mov(
        new Word(0x80000000),
        new Word(0x000000f9),
        ShiftType.LSR,
      ));
      // shift >= 32 => everything is 0
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      ({ result, nzcv } = alu.mov(
        new Word(0x80000000),
        new Word(0x00000010),
        ShiftType.ASR,
      ));
      // shift = 16
      expect(result.view.getUint32(0)).toBe(0xffff8000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      ({ result, nzcv } = alu.mov(
        new Word(0x000fffff),
        new Word(0x00000014),
        ShiftType.ROR,
      ));
      // shift = 16
      expect(result.view.getUint32(0)).toBe(0xfffff000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });

      // This is ROR rd, rn, rm where rm is 0
      // This is interpreted as no shift
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.mov(
        new Word(0x000fffff),
        new Word(0x00000000),
        ShiftType.ROR,
      ));
      // shift = 16
      expect(result.view.getUint32(0)).toBe(0x000fffff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      ({ result, nzcv } = alu.mov(new Word(0x00000001), 2, ShiftType.LSL));
      // 0x1  << 2 = 0x4
      expect(result.view.getUint32(0)).toBe(0x00000004);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      ({ result, nzcv } = alu.mov(new Word(0x80000000), 9, ShiftType.LSR));
      // shift = 9 => everything is 0
      expect(result.view.getUint32(0)).toBe(0x00400000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      ({ result, nzcv } = alu.mov(new Word(0x80000000), 16, ShiftType.ASR));
      // shift = 16
      expect(result.view.getUint32(0)).toBe(0xffff8000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      ({ result, nzcv } = alu.mov(new Word(0x000fffff), 20, ShiftType.ROR));
      // shift = 16
      expect(result.view.getUint32(0)).toBe(0xfffff000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });

      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.mov(new Word(0x000fffff), 0, ShiftType.ROR));
      // shift = 16
      expect(result.view.getUint32(0)).toBe(0x8007ffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });
    });
  });

  describe("Test BIC", () => {
    it("Test BIC Reg (with optional shift)", () => {
      // Case 1: Basic BIC, no shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      let { result, nzcv } = alu.bic(
        new Word(0xf0f0f0f0),
        new Word(0x0f0f0f0f),
        0,
        ShiftType.LSL,
      );
      // 0xF0F0F0F0 & ~0x0F0F0F0F = 0xF0F0F0F0
      expect(result.view.getUint32(0)).toBe(0xf0f0f0f0);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 2: LSL shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.bic(
        new Word(0x12345678),
        new Word(0x00000001),
        1,
        ShiftType.LSL,
      ));
      // 0x12345678 & ~(0x1 <<1) = 0x12345678 & ~0x2 = 0x12345678 (bit cleared if set)
      expect(result.view.getUint32(0)).toBe(0x12345678);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 3: LSR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.bic(
        new Word(0xffffffff),
        new Word(0x00000002),
        1,
        ShiftType.LSR,
      ));
      // Operand2 >>1 =1 → 0xFFFFFFFF & ~0x1 = 0xFFFFFFFE
      expect(result.view.getUint32(0)).toBe(0xfffffffe);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: ASR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.bic(
        new Word(0xf0f0f0f0),
        new Word(0xf0000000),
        4,
        ShiftType.ASR,
      ));
      // Operand2 >>4 = 0x0F000000 → 0xF0F0F0F0 & ~0xFF000000 = 0xF0F0F0F0 & 0x00FFFFFF = 0x00F0F0F0
      expect(result.view.getUint32(0)).toBe(0x00f0f0f0);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: ROR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.bic(
        new Word(0x12345678),
        new Word(0x80000001),
        4,
        ShiftType.ROR,
      ));
      // Operand2 ROR4 = 0x18000000 → 0x12345678 & ~0x18000000 = 0x02345678
      expect(result.view.getUint32(0)).toBe(0x02345678);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 6: Zero result
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.bic(
        new Word(0xffffffff),
        new Word(0xffffffff),
        0,
        ShiftType.LSL,
      ));
      // 0xFFFFFFFF & ~0xFFFFFFFF = 0x0
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 7: BIC with carry-in set in ALU
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.bic(
        new Word(0x12345678),
        new Word(0x0f0f0f0f),
        0,
        ShiftType.LSL,
      ));
      // 0x12345678 & ~0x0F0F0F0F = 0x12345678 & 0xF0F0F0F0 = 0x10305070
      expect(result.view.getUint32(0)).toBe(0x10305070);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });
    });

    it("Test BIC Imm", () => {
      // Case 1: Simple BIC
      // 0x000000FF ROR 0 = 0x000000FF
      // 0x0F0F0FFF & ~0x000000FF = 0x0F0F0F00
      let { result, nzcv } = alu.i_bic(new Word(0x0f0f0fff), new Imm12(0x0ff));
      expect(result.view.getUint32(0)).toBe(0x0f0f0f00);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Result = 0 (Z flag)
      // 0x0000000F ROR 0 = 0x0000000F
      // 0x0000000F & ~0x0000000F = 0x00000000
      ({ result, nzcv } = alu.i_bic(new Word(0x0000000f), new Imm12(0x00f)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 3: Negative result (N flag)
      // 0x000000FF ROR 14 = 0x03FC0000
      // 0xFFFFFFFF & ~0x03FC0000 = 0x80000000
      ({ result, nzcv } = alu.i_bic(new Word(0xffffffff), new Imm12(0x7ff)));
      expect(result.view.getUint32(0)).toBe(0xfc03ffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: Immediate rotation case
      // 0x00000001 ROR 8 = 0x01000000
      // 0x0F0F0F0F & ~0x01000000 = 0x0E0F0F0F
      ({ result, nzcv } = alu.i_bic(new Word(0x0f0f0f0f), new Imm12(0x401)));
      expect(result.view.getUint32(0)).toBe(0x0e0f0f0f);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: Rotation carry propagation
      // 0x00000003 ROR 2 = 0xC0000000
      // 0x000000FF & ~0x40000000 = 0x000000FF
      ({ result, nzcv } = alu.i_bic(new Word(0x000000ff), new Imm12(0x103)));
      expect(result.view.getUint32(0)).toBe(0x000000ff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });
    });
  });

  describe("Test MVN", () => {
    it("Test MVN Reg (with optional shift)", () => {
      // Case 1: Basic MVN, no shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      let { result, nzcv } = alu.mvn(new Word(0x00000000), 0, ShiftType.LSL);
      // ~0x0 = 0xFFFFFFFF
      expect(result.view.getUint32(0)).toBe(0xffffffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 2: LSL shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.mvn(new Word(0x00000001), 1, ShiftType.LSL));
      // ~(0x1 <<1) = ~0x2 = 0xFFFFFFFD
      expect(result.view.getUint32(0)).toBe(0xfffffffd);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 3: LSR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.mvn(new Word(0x00000004), 1, ShiftType.LSR));
      // ~(0x4 >>1) = ~0x2 = 0xFFFFFFFD
      expect(result.view.getUint32(0)).toBe(0xfffffffd);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: ASR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.mvn(new Word(0x80000000), 4, ShiftType.ASR));
      // Operand >>4 = 0xF8000000 → ~0xF8000000 = 0x07FFFFFF
      expect(result.view.getUint32(0)).toBe(0x07ffffff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: ROR shift
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.mvn(new Word(0x12345678), 4, ShiftType.ROR));
      // 0x12345678 ROR4 = 0x81234567 → ~0x81234567 = 0x7EDCBA98
      // C = 1 since the last bit shifted in is 1
      expect(result.view.getUint32(0)).toBe(0x7edcba98);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });

      // Case 6: Zero result after NOT
      alu.updateNZCV({ N: 0, Z: 0, C: 0, V: 0 });
      ({ result, nzcv } = alu.mvn(new Word(0xffffffff), 0, ShiftType.LSL));
      // ~0xFFFFFFFF = 0x0
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 7: MVN with carry-in set (should remain unaffected except shift RRX)
      alu.updateNZCV({ N: 0, Z: 0, C: 1, V: 0 });
      ({ result, nzcv } = alu.mvn(new Word(0x00000001), 0, ShiftType.ROR));
      // Operand ROR0 with carry-in → ~rotated result
      expect(result.view.getUint32(0)).toBe(0x7fffffff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 1, V: 0 });
    });

    it("Test MVN Imm", () => {
      // Case 1: Basic NOT operation
      // 0x000000FF ROR 0 = 0x000000FF
      // ~0x000000FF = 0xFFFFFF00
      let { result, nzcv } = alu.i_mvn(new Imm12(0x0ff));
      expect(result.view.getUint32(0)).toBe(0xffffff00);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 2: Result = 0xFFFFFFFF (Z=0, N=1)
      // 0x00000000 ROR 0 = 0x00000000
      // ~0x00000000 = 0xFFFFFFFF
      ({ result, nzcv } = alu.i_mvn(new Imm12(0x000)));
      expect(result.view.getUint32(0)).toBe(0xffffffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 3: Immediate rotation case
      // 0x00000001 ROR 8 = 0x01000000
      // ~0x01000000 = 0xFEFFFFFF
      ({ result, nzcv } = alu.i_mvn(new Imm12(0x401)));
      expect(result.view.getUint32(0)).toBe(0xfeffffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: Rotation carry propagation
      // 0x00000001 ROR 2 = 0x40000000
      // ~0x40000000 = 0xBFFFFFFF
      ({ result, nzcv } = alu.i_mvn(new Imm12(0x101)));
      expect(result.view.getUint32(0)).toBe(0xbfffffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 5: Negative result after inversion (N=1)
      // 0x03FC0000 ROR 0 = 0x7FFFFFFF
      // ~0x03FC0000 = FC03FFFF
      ({ result, nzcv } = alu.i_mvn(new Imm12(0x7ff)));
      expect(result.view.getUint32(0)).toBe(0xfc03ffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });
    });
  });

  describe("Test MOV", () => {
    it("Test MOV Imm", () => {
      // Case 1: Basic move
      // 0x000000FF ROR 0 = 0x000000FF
      let { result, nzcv } = alu.i_mov(new Imm12(0x0ff));
      expect(result.view.getUint32(0)).toBe(0x000000ff);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Move zero
      // 0x00000000 ROR 0 = 0x00000000
      ({ result, nzcv } = alu.i_mov(new Imm12(0x000)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 3: Move negative (MSB set)
      // 0x00000008 ROR 4 = 0x80000000
      ({ result, nzcv } = alu.i_mov(new Imm12(0x208)));
      expect(result.view.getUint32(0)).toBe(0x80000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });

      // Case 4: Immediate rotation
      // 0x00000001 ROR 8 = 0x01000000
      ({ result, nzcv } = alu.i_mov(new Imm12(0x4ff)));
      expect(result.view.getUint32(0)).toBe(0xff000000);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 1, V: 0 });
    });
  });

  describe("Test MUL", () => {
    it("Test MUL", () => {
      // Case 1: Basic multiply
      // 0x00000002 * 0x00000003 = 0x00000006
      // N=0, Z=0
      let { result, nzcv } = alu.mul(
        new Word(0x00000002),
        new Word(0x00000003),
      );
      expect(result.view.getUint32(0)).toBe(0x00000006);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Multiply by zero
      // 0x12345678 * 0x00000000 = 0x00000000
      // N=0, Z=1
      ({ result, nzcv } = alu.mul(new Word(0x12345678), new Word(0x00000000)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 3: Multiply negative by positive (signed overflow ignored)
      // 0xFFFFFFFF (-1) * 0x00000002 = 0xFFFFFFFE (-2)
      // N=1, Z=0
      ({ result, nzcv } = alu.mul(new Word(0xffffffff), new Word(0x00000002)));
      expect(result.view.getUint32(0)).toBe(0xfffffffe);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: Multiply two large values, result wraps around
      // 0xFFFFFFFF * 0xFFFFFFFF = 0x00000001 (only low 32 bits kept)
      // N=0, Z=0
      ({ result, nzcv } = alu.mul(new Word(0xffffffff), new Word(0xffffffff)));
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: High bit set in result
      // 0x80000000 * 0x00000002 = 0x00000000 (since 0x100000000 wraps)
      // N=0, Z=1
      ({ result, nzcv } = alu.mul(new Word(0x80000000), new Word(0x00000002)));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 6: Mixed positive and negative (two’s complement behavior)
      // 0x00000002 * 0xFFFFFFFE (-2) = 0xFFFFFFFC (-4)
      // N=1, Z=0
      ({ result, nzcv } = alu.mul(new Word(0x00000002), new Word(0xfffffffe)));
      expect(result.view.getUint32(0)).toBe(0xfffffffc);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });
    });
  });

  describe("Test MLA", () => {
    it("Test MLA", () => {
      // Case 1: Basic multiply-accumulate
      // (0x00000002 * 0x00000003) + 0x00000001 = 0x00000007
      // N=0, Z=0
      let { result, nzcv } = alu.mla(
        new Word(0x00000002),
        new Word(0x00000003),
        new Word(0x00000001),
      );
      expect(result.view.getUint32(0)).toBe(0x00000007);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Accumulate zero
      // (0x00000005 * 0x00000005) + 0x00000000 = 0x00000019
      // N=0, Z=0
      ({ result, nzcv } = alu.mla(
        new Word(0x00000005),
        new Word(0x00000005),
        new Word(0x00000000),
      ));
      expect(result.view.getUint32(0)).toBe(0x00000019);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 3: Negative multiplication result with positive accumulator
      // (0xFFFFFFFF * 0x00000002) + 0x00000003 = 0x00000001
      // (-1 * 2) + 3 = 1
      // N=0, Z=0
      ({ result, nzcv } = alu.mla(
        new Word(0xffffffff),
        new Word(0x00000002),
        new Word(0x00000003),
      ));
      expect(result.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 4: Wraparound (only low 32 bits kept)
      // (0xFFFFFFFF * 0xFFFFFFFF) + 0x00000001 = 0x00000002
      // N=0, Z=0
      ({ result, nzcv } = alu.mla(
        new Word(0xffffffff),
        new Word(0xffffffff),
        new Word(0x00000001),
      ));
      expect(result.view.getUint32(0)).toBe(0x00000002);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: Result becomes zero after accumulation
      // (0x00000002 * 0xFFFFFFFF) + 0x00000002 = 0x00000002
      ({ result, nzcv } = alu.mla(
        new Word(0x00000002),
        new Word(0xffffffff),
        new Word(0x00000002),
      ));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 6: High-bit result (negative in signed interpretation)
      // (0x80000000 * 0x00000002) + 0x00000000 = 0x00000000 (wraps)
      // N=0, Z=1
      ({ result, nzcv } = alu.mla(
        new Word(0x80000000),
        new Word(0x00000002),
        new Word(0x00000000),
      ));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 7: Accumulation with negative accumulator
      // (0x00000004 * 0x00000004) + 0xFFFFFFF0 = 0x00000010 + 0xFFFFFFF0 = 0x00000000
      // N=0, Z=1
      ({ result, nzcv } = alu.mla(
        new Word(0x00000004),
        new Word(0x00000004),
        new Word(0xfffffff0),
      ));
      expect(result.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });
    });
  });

  describe("Test UMAAL", () => {
    it("Test UMAAL", () => {
      // Case 1: Basic operation
      // (rdHi:rdLo) = 0x00000000_00000000
      // rn * rm = 0x00000002 * 0x00000003 = 0x0000000000000006
      // Final = 0x0000000000000006
      let { resultHi, resultLo } = alu.umaal(
        new Word(0x00000002),
        new Word(0x00000003),
        new Word(0x00000000),
        new Word(0x00000000),
      );
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000006);

      // Case 2: With accumulation (rdLo nonzero)
      // rn * rm = 0x00000004 * 0x00000005 = 0x0000000000000014
      // Add rdLo = 0x00000003, rdHi = 0x00000000
      // Final = 0x0000000000000017
      ({ resultHi, resultLo } = alu.umaal(
        new Word(0x00000004),
        new Word(0x00000005),
        new Word(0x00000000),
        new Word(0x00000003),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000017);

      // Case 3: Addition causes 32-bit carry
      // rn * rm = 0xFFFFFFFF * 0x00000002 = 0x00000001_FFFFFFFE
      // Add rdHi = 0x00000000, rdLo = 0x00000002
      // Result = 0x00000001_FFFFFFFE + 0x0000000000000002 = 0x00000002_00000000
      ({ resultHi, resultLo } = alu.umaal(
        new Word(0xffffffff),
        new Word(0x00000002),
        new Word(0x00000000),
        new Word(0x00000002),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000002);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);

      // Case 4: Large numbers with accumulation in both hi/lo
      // rn * rm = 0xFFFFFFFE * 0xFFFFFFFE = 0xFFFFFFFC_00000004
      // Add rdHi:rdLo = 0x00000001_00000001
      // Final = 0xFFFFFFFD_00000006
      ({ resultHi, resultLo } = alu.umaal(
        new Word(0xfffffffe),
        new Word(0xfffffffe),
        new Word(0x00000001),
        new Word(0x00000001),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0xfffffffc);
      expect(resultLo.view.getUint32(0)).toBe(0x00000006);

      // Case 5: Result wraps around 64-bit boundary
      // rn * rm = 0xFFFFFFFF * 0xFFFFFFFF = 0xFFFFFFFE_00000001
      // Add rdHi:rdLo = 0x00000000_FFFFFFFF
      // Final = 0xFFFFFFFF_00000000 (wrap)
      ({ resultHi, resultLo } = alu.umaal(
        new Word(0xffffffff),
        new Word(0xffffffff),
        new Word(0x00000000),
        new Word(0xffffffff),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0xffffffff);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);

      // Case 6: Edge case with rdHi and rdLo both max
      // rn * rm = 0x00000001 * 0x00000001 = 0x0000000000000001
      // Add rdHi:rdLo = 0x00000001_FFFFFFFF
      // Final = 0x00000000_00000000 (wrap around)
      ({ resultHi, resultLo } = alu.umaal(
        new Word(0x00000001),
        new Word(0x00000001),
        new Word(0xffffffff),
        new Word(0xffffffff),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000001);
      expect(resultLo.view.getUint32(0)).toBe(0xffffffff);
    });
  });

  describe("Test MLS", () => {
    it("Test MLS", () => {
      // Case 1: Basic multiply-subtract
      // ra - (rn * rm)
      // 0x00000010 - (0x00000002 * 0x00000003) = 0x00000010 - 0x00000006 = 0x0000000A
      let { result } = alu.mls(
        new Word(0x00000002),
        new Word(0x00000003),
        new Word(0x00000010),
      );
      expect(result.view.getUint32(0)).toBe(0x0000000a);

      // Case 2: Result goes negative (wrap-around)
      // 0x00000005 - (0x00000003 * 0x00000003) = 0x00000005 - 0x00000009 = 0xFFFFFFFC
      ({ result } = alu.mls(
        new Word(0x00000003),
        new Word(0x00000003),
        new Word(0x00000005),
      ));
      expect(result.view.getUint32(0)).toBe(0xfffffffc);

      // Case 3: Subtract zero
      // 0x12345678 - (0x00000000 * 0x00000009) = 0x12345678 - 0x00000000 = 0x12345678
      ({ result } = alu.mls(
        new Word(0x00000000),
        new Word(0x00000009),
        new Word(0x12345678),
      ));
      expect(result.view.getUint32(0)).toBe(0x12345678);

      // Case 4: Multiply by zero
      // 0x000000AA - (0xFFFFFFFF * 0x00000000) = 0x000000AA - 0x00000000 = 0x000000AA
      ({ result } = alu.mls(
        new Word(0xffffffff),
        new Word(0x00000000),
        new Word(0x000000aa),
      ));
      expect(result.view.getUint32(0)).toBe(0x000000aa);

      // Case 5: Large operands causing wrap-around
      // 0x00000000 - (0xFFFFFFFF * 0xFFFFFFFF) = 0x00000000 - 0xFFFFFFFE_00000001 = 0xFFFFFFFF
      ({ result } = alu.mls(
        new Word(0xffffffff),
        new Word(0xffffffff),
        new Word(0x00000000),
      ));
      expect(result.view.getUint32(0)).toBe(0xffffffff);

      // Case 6: Mixed signed-like behavior
      // 0xFFFFFFFE - (0x00000002 * 0xFFFFFFFE)
      // = 0xFFFFFFFE - 0x1FFFFFFFC = 0x00000002
      ({ result } = alu.mls(
        new Word(0x00000002),
        new Word(0xfffffffe),
        new Word(0xfffffffe),
      ));
      expect(result.view.getUint32(0)).toBe(0x00000002);

      // Case 7: Overflow wrap-around
      // 0x00000001 - (0x80000000 * 0x00000002)
      // = 0x00000001 - 0x00000000 (since 0x100000000 wraps) = 0x00000001
      ({ result } = alu.mls(
        new Word(0x80000000),
        new Word(0x00000002),
        new Word(0x00000001),
      ));
      expect(result.view.getUint32(0)).toBe(0x00000001);
    });
  });

  describe("Test UMULL", () => {
    it("Test UMULL", () => {
      // Case 1: Basic multiply
      // 0x00000002 * 0x00000003 = 0x00000000_00000006
      // N=0, Z=0
      let { resultHi, resultLo, nzcv } = alu.umull(
        new Word(0x00000002),
        new Word(0x00000003),
      );
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000006);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Multiplying by zero
      // 0x12345678 * 0x00000000 = 0x00000000_00000000
      // N=0, Z=1
      ({ resultHi, resultLo, nzcv } = alu.umull(
        new Word(0x12345678),
        new Word(0x00000000),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 3: Large operands (no overflow beyond 64-bit)
      // 0xFFFFFFFF * 0x00000002 = 0x00000001_FFFFFFFE
      // N=0, Z=0
      ({ resultHi, resultLo, nzcv } = alu.umull(
        new Word(0xffffffff),
        new Word(0x00000002),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000001);
      expect(resultLo.view.getUint32(0)).toBe(0xfffffffe);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 4: Both operands max (0xFFFFFFFF × 0xFFFFFFFF)
      // = 0xFFFFFFFE_00000001
      // N=1 (since high bit of 64-bit result = 1), Z=0
      ({ resultHi, resultLo, nzcv } = alu.umull(
        new Word(0xffffffff),
        new Word(0xffffffff),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0xfffffffe);
      expect(resultLo.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 5: Mid-range values (no carry)
      // 0x00010000 * 0x00010000 = 0x00000001_00000000
      // N=0, Z=0
      ({ resultHi, resultLo, nzcv } = alu.umull(
        new Word(0x00010000),
        new Word(0x00010000),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000001);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 6: Single high-bit operand
      // 0x80000000 * 0x00000002 = 0x00000001_00000000
      // N=0, Z=0
      ({ resultHi, resultLo, nzcv } = alu.umull(
        new Word(0x80000000),
        new Word(0x00000002),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000001);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 7: Result zero (both inputs 0)
      // 0x00000000 * 0x00000000 = 0x00000000_00000000
      // N=0, Z=1
      ({ resultHi, resultLo, nzcv } = alu.umull(
        new Word(0x00000000),
        new Word(0x00000000),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });
    });
  });

  describe("Test UMLAL", () => {
    it("Test UMLAL", () => {
      // Case 1: Basic multiply-accumulate
      // rn * rm = 0x00000002 * 0x00000003 = 0x00000000_00000006
      // + rdHi:rdLo = 0x00000000_00000001
      // Result = 0x00000000_00000007
      // N=0, Z=0
      let { resultHi, resultLo, nzcv } = alu.umlal(
        new Word(0x00000002),
        new Word(0x00000003),
        new Word(0x00000000),
        new Word(0x00000001),
      );
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000007);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Accumulation with nonzero high part
      // rn * rm = 0x00000004 * 0x00000005 = 0x00000000_00000014
      // + rdHi:rdLo = 0x00000001_00000000
      // Result = 0x00000001_00000014
      // N=0, Z=0
      ({ resultHi, resultLo, nzcv } = alu.umlal(
        new Word(0x00000004),
        new Word(0x00000005),
        new Word(0x00000001),
        new Word(0x00000000),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000001);
      expect(resultLo.view.getUint32(0)).toBe(0x00000014);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 3: Accumulation causes 64-bit carry
      // rn * rm = 0xFFFFFFFF * 0x00000002 = 0x00000001_FFFFFFFE
      // + rdHi:rdLo = 0x00000000_FFFFFFFF
      // Result = 0x00000002_FFFFFFFD (carry into high part)
      // N=0, Z=0
      ({ resultHi, resultLo, nzcv } = alu.umlal(
        new Word(0xffffffff),
        new Word(0x00000002),
        new Word(0x00000000),
        new Word(0xffffffff),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000002);
      expect(resultLo.view.getUint32(0)).toBe(0xfffffffd);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 4: Both operands max (0xFFFFFFFF * 0xFFFFFFFF)
      // = 0xFFFFFFFE_00000001
      // + rdHi:rdLo = 0x00000000_00000000
      // = 0xFFFFFFFE_00000001
      // N=1 (MSB of resultHi is 1), Z=0
      ({ resultHi, resultLo, nzcv } = alu.umlal(
        new Word(0xffffffff),
        new Word(0xffffffff),
        new Word(0x00000000),
        new Word(0x00000000),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0xfffffffe);
      expect(resultLo.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 5: Result becomes zero
      // rn * rm = 0x00000001 * 0x00000001 = 0x00000000_00000001
      // + rdHi:rdLo = 0xFFFFFFFF_FFFFFFFF
      // = 0x00000000_00000000 (wrap)
      // N=0, Z=1
      ({ resultHi, resultLo, nzcv } = alu.umlal(
        new Word(0x00000001),
        new Word(0x00000001),
        new Word(0xffffffff),
        new Word(0xffffffff),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 6: High-bit result (overflow into high word)
      // rn * rm = 0x80000000 * 0x00000002 = 0x00000001_00000000
      // + rdHi:rdLo = 0x00000000_00000000
      // = 0x00000001_00000000
      // N=0, Z=0
      ({ resultHi, resultLo, nzcv } = alu.umlal(
        new Word(0x80000000),
        new Word(0x00000002),
        new Word(0x00000000),
        new Word(0x00000000),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000001);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 7: Simple accumulation adds up multiple times (for chaining test)
      // 1) 0x00000001 * 0x00000002 = 0x00000000_00000002
      //    + rdHi:rdLo = 0x00000000_00000003
      //    => 0x00000000_00000005
      ({ resultHi, resultLo, nzcv } = alu.umlal(
        new Word(0x00000001),
        new Word(0x00000002),
        new Word(0x00000000),
        new Word(0x00000003),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000005);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });
    });
  });

  describe("Test SMULL", () => {
    it("Test SMULL", () => {
      // Case 1: Positive × Positive
      // rn * rm = 0x00000002 * 0x00000003 = 0x00000000_00000006
      // N=0, Z=0
      let { resultHi, resultLo, nzcv } = alu.smull(
        new Word(0x00000002),
        new Word(0x00000003),
      );
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000006);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Negative × Positive
      // rn * rm = (-2) * 3 = -6 = 0xFFFFFFFF_FFFFFFFA
      // ResultHi = 0xFFFFFFFF, ResultLo = 0xFFFFFFFA
      // N=1, Z=0
      ({ resultHi, resultLo, nzcv } = alu.smull(
        new Word(0xfffffffe),
        new Word(0x00000003),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0xffffffff);
      expect(resultLo.view.getUint32(0)).toBe(0xfffffffa);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 3: Positive × Negative
      // rn * rm = 2 * (-3) = -6 = 0xFFFFFFFF_FFFFFFFA
      ({ resultHi, resultLo, nzcv } = alu.smull(
        new Word(0x00000002),
        new Word(0xfffffffd),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0xffffffff);
      expect(resultLo.view.getUint32(0)).toBe(0xfffffffa);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 4: Negative × Negative
      // rn * rm = (-2) * (-3) = 6 = 0x00000000_00000006
      // N=0, Z=0
      ({ resultHi, resultLo, nzcv } = alu.smull(
        new Word(0xfffffffe),
        new Word(0xfffffffd),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000006);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: Large positive values cause high part to fill
      // rn * rm = 0x7FFFFFFF * 0x00000002 = 0x00000000_FFFFFFFE
      // N=0, Z=0
      ({ resultHi, resultLo, nzcv } = alu.smull(
        new Word(0x7fffffff),
        new Word(0x00000002),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0xfffffffe);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 6: Large negative × Large negative
      // (-2147483648) * (-2147483648) = 0x40000000_00000000
      // N=0, Z=0
      ({ resultHi, resultLo, nzcv } = alu.smull(
        new Word(0x80000000),
        new Word(0x80000000),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x40000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 7: Result is zero
      // rn * rm = 0x00000000 * 0xFFFFFFFF = 0x00000000_00000000
      // N=0, Z=1
      ({ resultHi, resultLo, nzcv } = alu.smull(
        new Word(0x00000000),
        new Word(0xffffffff),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 8: Result is zero
      // rn * rm = 0xFFFFFFFF * 0xFFFFFFFF = 0x00000000_00000001
      // N=0, Z=1
      ({ resultHi, resultLo, nzcv } = alu.smull(
        new Word(0xffffffff),
        new Word(0xffffffff),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });
    });
  });

  describe("Test SMLAL", () => {
    it("Test SMLAL", () => {
      // Case 1: Basic positive accumulate
      // (0x00000002 * 0x00000003) + 0x00000000_00000001
      // = 0x00000000_00000007
      // N=0, Z=0
      let { resultHi, resultLo, nzcv } = alu.smlal(
        new Word(0x00000002),
        new Word(0x00000003),
        new Word(0x00000000),
        new Word(0x00000001),
      );
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000007);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 2: Negative × Positive with accumulator
      // (-2 * 3) + 5 = -1 = 0xFFFFFFFF_FFFFFFFF
      ({ resultHi, resultLo, nzcv } = alu.smlal(
        new Word(0xfffffffe),
        new Word(0x00000003),
        new Word(0x00000000),
        new Word(0x00000005),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0xffffffff);
      expect(resultLo.view.getUint32(0)).toBe(0xffffffff);
      expect(nzcv).toStrictEqual({ N: 1, Z: 0, C: 0, V: 0 });

      // Case 3: Negative × Negative, accumulate positive
      // (-2 * -3) + 1 = 6 + 1 = 7 = 0x00000000_00000007
      ({ resultHi, resultLo, nzcv } = alu.smlal(
        new Word(0xfffffffe),
        new Word(0xfffffffd),
        new Word(0x00000000),
        new Word(0x00000001),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000007);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 4: Large negative operands with accumulator overflow
      // (-2147483648 * -2147483648) + 1
      // = 0x40000000_00000000 + 1 = 0x40000000_00000001
      ({ resultHi, resultLo, nzcv } = alu.smlal(
        new Word(0x80000000),
        new Word(0x80000000),
        new Word(0x00000000),
        new Word(0x00000001),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x40000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000001);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });

      // Case 5: Result becomes zero after accumulation
      // (-2 * 3) + 6 = -6 + 6 = 0
      // 0x00000000_00000000
      ({ resultHi, resultLo, nzcv } = alu.smlal(
        new Word(0xfffffffe),
        new Word(0x00000003),
        new Word(0x00000000),
        new Word(0x00000006),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000000);
      expect(resultLo.view.getUint32(0)).toBe(0x00000000);
      expect(nzcv).toStrictEqual({ N: 0, Z: 1, C: 0, V: 0 });

      // Case 6: Accumulating into a large 64-bit value
      // (0x7FFFFFFF * 0x00000002) + 0x00000000_FFFFFFFF
      // = 0x00000000_FFFFFFFE + 0x00000000_FFFFFFFF = 0x00000001_FFFFFFFD
      ({ resultHi, resultLo, nzcv } = alu.smlal(
        new Word(0x7fffffff),
        new Word(0x00000002),
        new Word(0x00000000),
        new Word(0xffffffff),
      ));
      expect(resultHi.view.getUint32(0)).toBe(0x00000001);
      expect(resultLo.view.getUint32(0)).toBe(0xfffffffd);
      expect(nzcv).toStrictEqual({ N: 0, Z: 0, C: 0, V: 0 });
    });
  });
});
