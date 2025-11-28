import { expect, it, describe } from "vitest";
import { Arm32Assembler } from "../src/components/arm32Assembler";
import { Imm12, Word } from "../src/types/binType";
import { CODE_SEGMENT } from "../src/constants/SegmentPosition";
import { beforeEach } from "node:test";
import { ShiftType } from "../src/types/shiftType";
import { TextToRegister } from "../src/types/registerName";
import {
  BlockLoad,
  BlockStore,
  DataProcessing,
  MultiplyAcc,
} from "../src/types/instructions";
import { Condition } from "../src/types/conditions";
import { getValueIfKeyExists } from "../src/function/helper";
import { CODE_END } from "../src/constants/directives";
const assembler = new Arm32Assembler();
let pc = CODE_SEGMENT;

beforeEach(() => {
  pc = CODE_SEGMENT;
});

describe("3Ops Data processing instruction assemble", () => {
  const dataProcessing3Ops = [
    "AND",
    "EOR",
    "SUB",
    "RSB",
    "ADD",
    "ADC",
    "SBC",
    "RSC",
    "BIC",
    "ORR",
  ];
  dataProcessing3Ops.forEach((op) => {
    it(`${op} R1, R2, R3`, () => {
      const code = `
        .text  
        ${op} R1, R2, R3
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op);
      const rd = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1, R2, R3`,
        encode: (0xe << 28) | (opCode << 21) | (rn << 16) | (rd << 12) | rm,
      });
      expect(instructions.get(pc+4)).toStrictEqual({
        origin: CODE_END,
        encode: 0xFFFFFFFF,
      });
    });

    it(`${op} R1, R2, R3, RRX`, () => {
      const code = `
        .text  
        ${op} R1, R2, R3, RRX
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op);
      const shiftType = ShiftType.ROR;
      const rd = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1, R2, R3, RRX`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (rn << 16) |
          (rd << 12) |
          (shiftType << 5) |
          rm,
      });
    });

    it(`${op} R2, R2, R3, ASR #2`, () => {
      const code = `
        .text  
        ${op} R2, R2, R3, ASR #2
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op);
      const imm = 2;
      const shiftType = ShiftType.ASR;
      const rd = TextToRegister.R2;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R2, R2, R3, ASR #2`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (rn << 16) |
          (rd << 12) |
          (imm << 7) |
          (shiftType << 5) |
          rm,
      });
    });

    it(`${op} R4, R5, R5, ROR R6`, () => {
      const code = `
        .text  
        ${op} R4, R5, R5, ROR R6
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op);
      const shiftType = ShiftType.ROR;
      const rd = TextToRegister.R4;
      const rn = TextToRegister.R5;
      const rm = TextToRegister.R5;
      const rs = TextToRegister.R6;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R4, R5, R5, ROR R6`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (rn << 16) |
          (rd << 12) |
          (rs << 8) |
          (shiftType << 5) |
          (1 << 4) |
          rm,
      });
    });

    it(`${op} R7, r8, #4080 (encodable immediate)`, () => {
      const code = `
        .text  
        ${op} R7, r8, #4080
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op);
      const rd = TextToRegister.R7;
      const rn = TextToRegister.R8;
      const imm = 0xeff; // 0xFF ROR 28
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R7, r8, #4080`,
        encode:
          (0xe << 28) |
          (1 << 25) |
          (opCode << 21) |
          (rn << 16) |
          (rd << 12) |
          imm,
      });
    });

    it(`${op} r10, r11, #8160 (non-encodable immediate)`, () => {
      const code = `
        .text  
        ${op} r10, r11, #8160
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op);
      const rd = TextToRegister.R10;
      const rn = TextToRegister.R11;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(6);
      expect(instructions.get(pc)).toStrictEqual({
        origin: "PUSH {R12}",
        encode:
          (0xe << 28) | (0x9 << 24) | (0x1 << 21) | (0xd << 16) | (1 << 12),
      });
      expect(instructions.get(pc + 4)).toStrictEqual({
        origin: "MOVW R12, #8160",
        encode: (0xe << 28) | (0x3 << 24) | (1 << 16) | (0xc << 12) | 0xfe0,
      });
      expect(instructions.get(pc + 8)).toStrictEqual({
        origin: "MOVT R12, #0",
        encode: (0xe << 28) | (0x3 << 24) | (1 << 22) | (0xc << 12),
      });
      expect(instructions.get(pc + 12)).toStrictEqual({
        origin: `${op} r10, r11, #8160`,
        encode: (0xe << 28) | (opCode << 21) | (rn << 16) | (rd << 12) | 0xc,
      });
      expect(instructions.get(pc + 16)).toStrictEqual({
        origin: "POP {R12}",
        encode:
          (0xe << 28) |
          (0x8 << 24) |
          (0x1 << 23) |
          (0x1 << 21) |
          (0x1 << 20) |
          (0xd << 16) |
          (1 << 12),
      });
    });

    it(`${op} R1, R2, #-1 (non-encodable immediate)`, () => {
      const code = `
        .text  
        ${op} R1, R2, #-1
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op);
      const rd = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(6);
      expect(instructions.get(pc)).toStrictEqual({
        origin: "PUSH {R12}",
        encode:
          (0xe << 28) | (0x9 << 24) | (0x1 << 21) | (0xd << 16) | (1 << 12),
      });
      expect(instructions.get(pc + 4)).toStrictEqual({
        origin: "MOVW R12, #65535",
        encode: (0xe << 28) | (0x3 << 24) | (0xf << 16) | (0xc << 12) | 0xfff,
      });
      expect(instructions.get(pc + 8)).toStrictEqual({
        origin: "MOVT R12, #65535",
        encode:
          (0xe << 28) |
          (0x3 << 24) |
          (1 << 22) |
          (0xf << 16) |
          (0xc << 12) |
          0xfff,
      });
      expect(instructions.get(pc + 12)).toStrictEqual({
        origin: `${op} R1, R2, #-1`,
        encode: (0xe << 28) | (opCode << 21) | (rn << 16) | (rd << 12) | 0xc,
      });
      expect(instructions.get(pc + 16)).toStrictEqual({
        origin: "POP {R12}",
        encode:
          (0xe << 28) |
          (0x8 << 24) |
          (0x1 << 23) |
          (0x1 << 21) |
          (0x1 << 20) |
          (0xd << 16) |
          (1 << 12),
      });
    });

    it(`${op}S R1, R2, R3`, () => {
      const code = `
        .text  
        ${op}S r1, r2, r3
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op);
      const rd = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op}S r1, r2, r3`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rn << 16) |
          (rd << 12) |
          rm,
      });
    });

    Object.keys(Condition).forEach((cond) => {
      it(`${op}${cond} R1, R2, R4`, () => {
        const code = `
            .text  
            ${op}${cond} R1, R2, R4
            `;
        const opCode = getValueIfKeyExists(DataProcessing, op);
        const rd = TextToRegister.R1;
        const rn = TextToRegister.R2;
        const rm = TextToRegister.R4;
        const { instructions } = assembler.assemble(code);
        expect(instructions.size).toBe(2);
        expect(instructions.get(pc)).toStrictEqual({
          origin: `${op}${cond} R1, R2, R4`,
          encode:
            (Condition[cond as keyof typeof Condition] << 28) |
            (opCode << 21) |
            (rn << 16) |
            (rd << 12) |
            rm,
        });
      });

      it(`${op}S${cond} R1, R2, R4`, () => {
        const code = `
            .text  
            ${op}S${cond} R1, R2, R4
            `;
        const opCode = getValueIfKeyExists(DataProcessing, op);
        const rd = TextToRegister.R1;
        const rn = TextToRegister.R2;
        const rm = TextToRegister.R4;
        const { instructions } = assembler.assemble(code);
        expect(instructions.size).toBe(2);
        expect(instructions.get(pc)).toStrictEqual({
          origin: `${op}S${cond} R1, R2, R4`,
          encode:
            (Condition[cond as keyof typeof Condition] << 28) |
            (opCode << 21) |
            (1 << 20) |
            (rn << 16) |
            (rd << 12) |
            rm,
        });
      });
    });
  });
});

describe("Test instruction assemble", () => {
  // I intentional make these lower case to test the upper case and lower case shouldn't matter
  const testOps = ["tst", "teq", "cmp", "cmn"];
  testOps.forEach((op) => {
    it(`${op} R2, R3`, () => {
      const code = `
        .text  
        ${op} R2, R3
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op.toUpperCase());
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R2, R3`,
        encode: (0xe << 28) | (opCode << 21) | (1 << 20) | (rn << 16) | rm,
      });
    });

    it(`${op} R3, R3, RRX`, () => {
      const code = `
        .text  
        ${op} R3, R3, RRX
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op.toUpperCase());
      const shiftType = ShiftType.ROR;
      const rn = TextToRegister.R3;
      const rm = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R3, R3, RRX`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rn << 16) |
          (shiftType << 5) |
          rm,
      });
    });

    it(`${op} R5, R6, LSL #10`, () => {
      const code = `
        .text  
        ${op} R5, R6, LSL #10
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op.toUpperCase());
      const imm = 10;
      const shiftType = ShiftType.LSL;
      const rn = TextToRegister.R5;
      const rm = TextToRegister.R6;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R5, R6, LSL #10`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rn << 16) |
          (imm << 7) |
          (shiftType << 5) |
          rm,
      });
    });

    it(`${op} R4, R5 ROR R6`, () => {
      const code = `
        .text  
        ${op} R4, R5, ROR R6
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op.toUpperCase());
      const shiftType = ShiftType.ROR;
      const rn = TextToRegister.R4;
      const rm = TextToRegister.R5;
      const rs = TextToRegister.R6;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R4, R5, ROR R6`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rn << 16) |
          (rs << 8) |
          (shiftType << 5) |
          (1 << 4) |
          rm,
      });
    });

    it(`${op} r8, #1 (encodable immediate)`, () => {
      const code = `
        .text  
        ${op} r8, #1
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op.toUpperCase());
      const rn = TextToRegister.R8;
      const imm = 0x001; // 0xFF ROR 28
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} r8, #1`,
        encode:
          (0xe << 28) |
          (1 << 25) |
          (1 << 20) |
          (opCode << 21) |
          (rn << 16) |
          imm,
      });
    });

    it(`${op} r11, #8160 (non-encodable immediate)`, () => {
      const code = `
        .text  
        ${op} r11, #8160
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op.toUpperCase());
      const rn = TextToRegister.R11;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(6);
      expect(instructions.get(pc)).toStrictEqual({
        origin: "PUSH {R12}",
        encode:
          (0xe << 28) | (0x9 << 24) | (0x1 << 21) | (0xd << 16) | (1 << 12),
      });
      expect(instructions.get(pc + 4)).toStrictEqual({
        origin: "MOVW R12, #8160",
        encode: (0xe << 28) | (0x3 << 24) | (1 << 16) | (0xc << 12) | 0xfe0,
      });
      expect(instructions.get(pc + 8)).toStrictEqual({
        origin: "MOVT R12, #0",
        encode: (0xe << 28) | (0x3 << 24) | (1 << 22) | (0xc << 12),
      });
      expect(instructions.get(pc + 12)).toStrictEqual({
        origin: `${op} r11, #8160`,
        encode: (0xe << 28) | (opCode << 21) | (1 << 20) | (rn << 16) | 0xc,
      });
      expect(instructions.get(pc + 16)).toStrictEqual({
        origin: "POP {R12}",
        encode:
          (0xe << 28) |
          (0x8 << 24) |
          (0x1 << 23) |
          (0x1 << 21) |
          (0x1 << 20) |
          (0xd << 16) |
          (1 << 12),
      });
    });

    it(`${op} R2, #-1 (non-encodable immediate)`, () => {
      const code = `
        .text  
        ${op} R2, #-1
        `;
      const opCode = getValueIfKeyExists(DataProcessing, op.toUpperCase());
      const rn = TextToRegister.R2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(6);
      expect(instructions.get(pc)).toStrictEqual({
        origin: "PUSH {R12}",
        encode:
          (0xe << 28) | (0x9 << 24) | (0x1 << 21) | (0xd << 16) | (1 << 12),
      });
      expect(instructions.get(pc + 4)).toStrictEqual({
        origin: "MOVW R12, #65535",
        encode: (0xe << 28) | (0x3 << 24) | (0xf << 16) | (0xc << 12) | 0xfff,
      });
      expect(instructions.get(pc + 8)).toStrictEqual({
        origin: "MOVT R12, #65535",
        encode:
          (0xe << 28) |
          (0x3 << 24) |
          (1 << 22) |
          (0xf << 16) |
          (0xc << 12) |
          0xfff,
      });
      expect(instructions.get(pc + 12)).toStrictEqual({
        origin: `${op} R2, #-1`,
        encode: (0xe << 28) | (opCode << 21) | (1 << 20) | (rn << 16) | 0xc,
      });
      expect(instructions.get(pc + 16)).toStrictEqual({
        origin: "POP {R12}",
        encode:
          (0xe << 28) |
          (0x8 << 24) |
          (0x1 << 23) |
          (0x1 << 21) |
          (0x1 << 20) |
          (0xd << 16) |
          (1 << 12),
      });
    });

    Object.keys(Condition).forEach((cond) => {
      it(`${op}${cond} R1, R4`, () => {
        const code = `
            .text  
            ${op}${cond} R1, R4
            `;
        const opCode = getValueIfKeyExists(DataProcessing, op.toUpperCase());
        const rn = TextToRegister.R1;
        const rm = TextToRegister.R4;
        const { instructions } = assembler.assemble(code);
        expect(instructions.size).toBe(2);
        expect(instructions.get(pc)).toStrictEqual({
          origin: `${op}${cond} R1, R4`,
          encode:
            (Condition[cond as keyof typeof Condition] << 28) |
            (opCode << 21) |
            (1 << 20) |
            (rn << 16) |
            rm,
        });
      });
    });
  });
});

describe("MVN instruction assemble", () => {
  it("MVN R2, R3", () => {
    const code = `
        .text  
        MVN R2, R3
        `;
    const opCode = DataProcessing.MVN;
    const rd = TextToRegister.R2;
    const rm = TextToRegister.R3;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MVN R2, R3",
      encode: (0xe << 28) | (opCode << 21) | (rd << 12) | rm,
    });
  });

  it("MVN R3, R3, RRX", () => {
    const code = `
        .text  
        MVN R3, R3, RRX
        `;
    const opCode = DataProcessing.MVN;
    const shiftType = ShiftType.ROR;
    const rd = TextToRegister.R3;
    const rm = TextToRegister.R3;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MVN R3, R3, RRX",
      encode: (0xe << 28) | (opCode << 21) | (rd << 12) | (shiftType << 5) | rm,
    });
  });

  it("MVN R5, R6, LSL #12", () => {
    const code = `
      .text
      MVN R5, R6, LSL #12
      `;
    const opCode = DataProcessing.MVN;
    const imm = 12;
    const shiftType = ShiftType.LSL;
    const rd = TextToRegister.R5;
    const rm = TextToRegister.R6;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MVN R5, R6, LSL #12",
      encode:
        (0xe << 28) |
        (opCode << 21) |
        (rd << 12) |
        (imm << 7) |
        (shiftType << 5) |
        rm,
    });
  });

  it("MVN R4, R5 ROR R6", () => {
    const code = `
      .text
      MVN R4, R5, ROR R6
      `;
    const opCode = DataProcessing.MVN;
    const shiftType = ShiftType.ROR;
    const rd = TextToRegister.R4;
    const rm = TextToRegister.R5;
    const rs = TextToRegister.R6;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MVN R4, R5, ROR R6",
      encode:
        (0xe << 28) |
        (opCode << 21) |
        (rd << 12) |
        (rs << 8) |
        (shiftType << 5) |
        (1 << 4) |
        rm,
    });
  });

  it("MVN r8, #808 (encodable immediate)", () => {
    const code = `
      .text
      MVN r8, #808
      `;
    const opCode = DataProcessing.MVN;
    const rd = TextToRegister.R8;
    const imm = 0xfca; //
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MVN r8, #808",
      encode: (0xe << 28) | (1 << 25) | (opCode << 21) | (rd << 12) | imm,
    });
  });

  it("MVN r11, #8160 (non-encodable immediate)", () => {
    const code = `
      .text
      MVN r11, #8160
      `;
    const opCode = DataProcessing.MVN;
    const rd = TextToRegister.R11;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(6);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "PUSH {R12}",
      encode: (0xe << 28) | (0x9 << 24) | (0x1 << 21) | (0xd << 16) | (1 << 12),
    });
    expect(instructions.get(pc + 4)).toStrictEqual({
      origin: "MOVW R12, #8160",
      encode: (0xe << 28) | (0x3 << 24) | (1 << 16) | (0xc << 12) | 0xfe0,
    });
    expect(instructions.get(pc + 8)).toStrictEqual({
      origin: "MOVT R12, #0",
      encode: (0xe << 28) | (0x3 << 24) | (1 << 22) | (0xc << 12),
    });
    expect(instructions.get(pc + 12)).toStrictEqual({
      origin: "MVN r11, #8160",
      encode: (0xe << 28) | (opCode << 21) | (rd << 12) | 0xc,
    });
    expect(instructions.get(pc + 16)).toStrictEqual({
      origin: "POP {R12}",
      encode:
        (0xe << 28) |
        (0x8 << 24) |
        (0x1 << 23) |
        (0x1 << 21) |
        (0x1 << 20) |
        (0xd << 16) |
        (1 << 12),
    });
  });

  it("MVN R2, #-1 (non-encodable immediate)", () => {
    const code = `
      .text
      MVN R2, #-1
      `;
    const opCode = DataProcessing.MVN;
    const rd = TextToRegister.R2;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(6);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "PUSH {R12}",
      encode: (0xe << 28) | (0x9 << 24) | (0x1 << 21) | (0xd << 16) | (1 << 12),
    });
    expect(instructions.get(pc + 4)).toStrictEqual({
      origin: "MOVW R12, #65535",
      encode: (0xe << 28) | (0x3 << 24) | (0xf << 16) | (0xc << 12) | 0xfff,
    });
    expect(instructions.get(pc + 8)).toStrictEqual({
      origin: "MOVT R12, #65535",
      encode:
        (0xe << 28) |
        (0x3 << 24) |
        (1 << 22) |
        (0xf << 16) |
        (0xc << 12) |
        0xfff,
    });
    expect(instructions.get(pc + 12)).toStrictEqual({
      origin: "MVN R2, #-1",
      encode: (0xe << 28) | (opCode << 21) | (rd << 12) | 0xc,
    });
    expect(instructions.get(pc + 16)).toStrictEqual({
      origin: "POP {R12}",
      encode:
        (0xe << 28) |
        (0x8 << 24) |
        (0x1 << 23) |
        (0x1 << 21) |
        (0x1 << 20) |
        (0xd << 16) |
        (1 << 12),
    });
  });

  it("MVNS R1, R2", () => {
    const code = `
        .text  
        MVNS r1, r2
        `;
    const opCode = DataProcessing.MVN;
    const rd = TextToRegister.R1;
    const rm = TextToRegister.R2;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MVNS r1, r2",
      encode: (0xe << 28) | (opCode << 21) | (1 << 20) | (rd << 12) | rm,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`MVN${cond} R1, R2`, () => {
      const code = `
            .text  
            MVN${cond} R1, R2
            `;
      const opCode = DataProcessing.MVN;
      const rd = TextToRegister.R1;
      const rm = TextToRegister.R2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `MVN${cond} R1, R2`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (rd << 12) |
          rm,
      });
    });

    it(`MVNS${cond} R1, R4`, () => {
      const code = `
            .text  
            MVNS${cond} R1, R4
            `;
      const opCode = DataProcessing.MVN;
      const rd = TextToRegister.R1;
      const rm = TextToRegister.R4;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `MVNS${cond} R1, R4`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rd << 12) |
          rm,
      });
    });
  });
});

describe("MOV instruction assemble", () => {
  it("MOV R2, R3", () => {
    const code = `
        .text  
        MOV R2, R3
        `;
    const opCode = DataProcessing.MOV;
    const rd = TextToRegister.R2;
    const rm = TextToRegister.R3;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MOV R2, R3",
      encode: (0xe << 28) | (opCode << 21) | (rd << 12) | rm,
    });
  });

  it("MOV r8, #808 (encodable immediate)", () => {
    const code = `
      .text
      MOV r8, #808
      `;
    const opCode = DataProcessing.MOV;
    const rd = TextToRegister.R8;
    const imm = 0xfca; //
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MOV r8, #808",
      encode: (0xe << 28) | (1 << 25) | (opCode << 21) | (rd << 12) | imm,
    });
  });

  it("MOV r11, #8160 (non-encodable immediate)", () => {
    const code = `
      .text
      MOV r11, #8160
      `;
    const opCode = DataProcessing.MOV;
    const rd = TextToRegister.R11;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(6);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "PUSH {R12}",
      encode: (0xe << 28) | (0x9 << 24) | (0x1 << 21) | (0xd << 16) | (1 << 12),
    });
    expect(instructions.get(pc + 4)).toStrictEqual({
      origin: "MOVW R12, #8160",
      encode: (0xe << 28) | (0x3 << 24) | (1 << 16) | (0xc << 12) | 0xfe0,
    });
    expect(instructions.get(pc + 8)).toStrictEqual({
      origin: "MOVT R12, #0",
      encode: (0xe << 28) | (0x3 << 24) | (1 << 22) | (0xc << 12),
    });
    expect(instructions.get(pc + 12)).toStrictEqual({
      origin: "MOV r11, #8160",
      encode: (0xe << 28) | (opCode << 21) | (rd << 12) | 0xc,
    });
    expect(instructions.get(pc + 16)).toStrictEqual({
      origin: "POP {R12}",
      encode:
        (0xe << 28) |
        (0x8 << 24) |
        (0x1 << 23) |
        (0x1 << 21) |
        (0x1 << 20) |
        (0xd << 16) |
        (1 << 12),
    });
  });

  it("MOV R2, #-1 (non-encodable immediate)", () => {
    const code = `
      .text
      MOV R2, #-1
      `;
    const opCode = DataProcessing.MOV;
    const rd = TextToRegister.R2;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(6);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "PUSH {R12}",
      encode: (0xe << 28) | (0x9 << 24) | (0x1 << 21) | (0xd << 16) | (1 << 12),
    });
    expect(instructions.get(pc + 4)).toStrictEqual({
      origin: "MOVW R12, #65535",
      encode: (0xe << 28) | (0x3 << 24) | (0xf << 16) | (0xc << 12) | 0xfff,
    });
    expect(instructions.get(pc + 8)).toStrictEqual({
      origin: "MOVT R12, #65535",
      encode:
        (0xe << 28) |
        (0x3 << 24) |
        (1 << 22) |
        (0xf << 16) |
        (0xc << 12) |
        0xfff,
    });
    expect(instructions.get(pc + 12)).toStrictEqual({
      origin: "MOV R2, #-1",
      encode: (0xe << 28) | (opCode << 21) | (rd << 12) | 0xc,
    });
    expect(instructions.get(pc + 16)).toStrictEqual({
      origin: "POP {R12}",
      encode:
        (0xe << 28) |
        (0x8 << 24) |
        (0x1 << 23) |
        (0x1 << 21) |
        (0x1 << 20) |
        (0xd << 16) |
        (1 << 12),
    });
  });

  it("MOVS R1, R2", () => {
    const code = `
        .text  
        MOVS r1, r2
        `;
    const opCode = DataProcessing.MOV;
    const rd = TextToRegister.R1;
    const rm = TextToRegister.R2;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MOVS r1, r2",
      encode: (0xe << 28) | (opCode << 21) | (1 << 20) | (rd << 12) | rm,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`MOV${cond} R1, R2`, () => {
      const code = `
            .text  
            MOV${cond} R1, R2
            `;
      const opCode = DataProcessing.MOV;
      const rd = TextToRegister.R1;
      const rm = TextToRegister.R2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `MOV${cond} R1, R2`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (rd << 12) |
          rm,
      });
    });

    it(`MOVS${cond} R1, R4`, () => {
      const code = `
            .text  
            MOVS${cond} R1, R4
            `;
      const opCode = DataProcessing.MOV;
      const rd = TextToRegister.R1;
      const rm = TextToRegister.R4;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `MOVS${cond} R1, R4`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rd << 12) |
          rm,
      });
    });
  });
});

describe("Shift Instruction RRX case instruction assemble", () => {
  const shiftOps = ["LSL", "LSR", "ASR", "ROR"];
  shiftOps.forEach((op) => {
    it(`${op} R1, R2, #3`, () => {
      const code = `
        .text  
        ${op} R1, R2, #3
        `;
      const opCode = DataProcessing.MOV;
      const shiftType = getValueIfKeyExists(ShiftType, op);
      const rd = TextToRegister.R1;
      const rm = TextToRegister.R2;
      const imm = 3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1, R2, #3`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (rd << 12) |
          (imm << 7) |
          (shiftType << 5) |
          rm,
      });
    });

    it(`${op} R1, R2, R5`, () => {
      const code = `
        .text  
        ${op} R1, R2, R5
        `;
      const opCode = DataProcessing.MOV;
      const shiftType = getValueIfKeyExists(ShiftType, op);
      const rd = TextToRegister.R1;
      const rbase = TextToRegister.R2;
      const rshift = TextToRegister.R5;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1, R2, R5`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (rd << 12) |
          (rshift << 8) |
          (shiftType << 5) |
          (1 << 4) |
          rbase,
      });
    });

    it(`${op}S R1, R2 #16`, () => {
      const code = `
        .text  
        ${op}S r1, r2, #16
        `;
      const opCode = DataProcessing.MOV;
      const imm = 16;
      const shiftType = getValueIfKeyExists(ShiftType, op);
      const rd = TextToRegister.R1;
      const rbase = TextToRegister.R2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op}S r1, r2, #16`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rd << 12) |
          (imm << 7) |
          (shiftType << 5) |
          rbase,
      });
    });

    Object.keys(Condition).forEach((cond) => {
      it(`${op}${cond} R1, R2, R4`, () => {
        const code = `
            .text  
            ${op}${cond} R1, R2, R4
            `;
        const opCode = DataProcessing.MOV;
        const shiftType = getValueIfKeyExists(ShiftType, op);
        const rd = TextToRegister.R1;
        const rbase = TextToRegister.R2;
        const rs = TextToRegister.R4;
        const { instructions } = assembler.assemble(code);
        expect(instructions.size).toBe(2);
        expect(instructions.get(pc)).toStrictEqual({
          origin: `${op}${cond} R1, R2, R4`,
          encode:
            (Condition[cond as keyof typeof Condition] << 28) |
            (opCode << 21) |
            (rd << 12) |
            (rs << 8) |
            (shiftType << 5) |
            (1 << 4) |
            rbase,
        });
      });

      it(`${op}S${cond} R1, R2, #31`, () => {
        const code = `
            .text  
            ${op}S${cond} R1, R2, #31
            `;
        const opCode = DataProcessing.MOV;
        const shiftType = getValueIfKeyExists(ShiftType, op);
        const rd = TextToRegister.R1;
        const rbase = TextToRegister.R2;
        const imm = 31;
        const { instructions } = assembler.assemble(code);
        expect(instructions.size).toBe(2);
        expect(instructions.get(pc)).toStrictEqual({
          origin: `${op}S${cond} R1, R2, #31`,
          encode:
            (Condition[cond as keyof typeof Condition] << 28) |
            (opCode << 21) |
            (1 << 20) |
            (rd << 12) |
            (imm << 7) |
            (shiftType << 5) |
            rbase,
        });
      });
    });
  });
});

describe("Shift Instruction processing instruction assemble", () => {
  it("RRX R1, R2", () => {
    const code = `
        .text  
        RRX R1, R2
        `;
    const opCode = DataProcessing.MOV;
    const shiftType = ShiftType.ROR;
    const rd = TextToRegister.R1;
    const rm = TextToRegister.R2;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "RRX R1, R2",
      encode: (0xe << 28) | (opCode << 21) | (rd << 12) | (shiftType << 5) | rm,
    });
  });

  it("RRXS R1, R2", () => {
    const code = `
        .text  
        RRXS r1, r2
        `;
    const opCode = DataProcessing.MOV;
    const shiftType = ShiftType.ROR;
    const rd = TextToRegister.R1;
    const rbase = TextToRegister.R2;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "RRXS r1, r2",
      encode:
        (0xe << 28) |
        (opCode << 21) |
        (1 << 20) |
        (rd << 12) |
        (shiftType << 5) |
        rbase,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`RRX${cond} R1, R2`, () => {
      const code = `
            .text  
            RRX${cond} R1, R2
            `;
      const opCode = DataProcessing.MOV;
      const shiftType = ShiftType.ROR;
      const rd = TextToRegister.R1;
      const rbase = TextToRegister.R2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `RRX${cond} R1, R2`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (rd << 12) |
          (shiftType << 5) |
          rbase,
      });
    });

    it(`RRXS${cond} R1, R2`, () => {
      const code = `
            .text  
            RRXS${cond} R1, R2
            `;
      const opCode = DataProcessing.MOV;
      const shiftType = ShiftType.ROR;
      const rd = TextToRegister.R1;
      const rbase = TextToRegister.R2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `RRXS${cond} R1, R2`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rd << 12) |
          (shiftType << 5) |
          rbase,
      });
    });
  });
});

describe("MUL instruction assemble", () => {
  it("MUL R1, R2, R3", () => {
    const code = `
    .text  
    MUL R1, R2, R3
    `;
    const opCode = MultiplyAcc.MUL;
    const rd = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MUL R1, R2, R3",
      encode:
        (0xe << 28) | (opCode << 21) | (rd << 16) | (rm << 8) | (0x9 << 4) | rn,
    });
  });

  it("MULS R1, R2, R3", () => {
    const code = `
    .text  
    MULS R1, R2, R3
    `;
    const opCode = MultiplyAcc.MUL;
    const rd = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MULS R1, R2, R3",
      encode:
        (0xe << 28) |
        (opCode << 21) |
        (1 << 20) |
        (rd << 16) |
        (rm << 8) |
        (0x9 << 4) |
        rn,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`MUL${cond} R1, R2, R3`, () => {
      const code = `
            .text  
            MUL${cond} R1, R2, R3
            `;
      const opCode = MultiplyAcc.MUL;
      const rd = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `MUL${cond} R1, R2, R3`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (rd << 16) |
          (rm << 8) |
          (0x9 << 4) |
          rn,
      });
    });

    it(`MULS${cond} R1, R2, R3`, () => {
      const code = `
            .text  
           MULS${cond} R1, R2, R3
            `;
      const opCode = MultiplyAcc.MUL;
      const rd = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `MULS${cond} R1, R2, R3`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rd << 16) |
          (rm << 8) |
          (0x9 << 4) |
          rn,
      });
    });
  });
});

describe("MLA instruction assemble", () => {
  it("MLA R1, R2, R3, R4", () => {
    const code = `
    .text  
    MLA R1, R2, R3, R4
    `;
    const opCode = MultiplyAcc.MLA;
    const rd = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    const ra = TextToRegister.R4;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MLA R1, R2, R3, R4",
      encode:
        (0xe << 28) |
        (opCode << 21) |
        (rd << 16) |
        (ra << 12) |
        (rm << 8) |
        (0x9 << 4) |
        rn,
    });
  });

  it("MLAS R1, R2, R3, R4", () => {
    const code = `
    .text
    MLAS R1, R2, R3, R4
    `;
    const opCode = MultiplyAcc.MLA;
    const rd = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    const ra = TextToRegister.R4;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MLAS R1, R2, R3, R4",
      encode:
        (0xe << 28) |
        (opCode << 21) |
        (1 << 20) |
        (rd << 16) |
        (ra << 12) |
        (rm << 8) |
        (0x9 << 4) |
        rn,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`MLA${cond} R1, R2, R3, R4`, () => {
      const code = `
            .text
            MLA${cond} R1, R2, R3, R4
            `;
      const opCode = MultiplyAcc.MLA;
      const rd = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const ra = TextToRegister.R4;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `MLA${cond} R1, R2, R3, R4`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (rd << 16) |
          (ra << 12) |
          (rm << 8) |
          (0x9 << 4) |
          rn,
      });
    });

    it(`MLAS${cond} R1, R2, R3, R4`, () => {
      const code = `
            .text
           MLAS${cond} R1, R2, R3, R4
            `;
      const opCode = MultiplyAcc.MLA;
      const rd = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const ra = TextToRegister.R4;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `MLAS${cond} R1, R2, R3, R4`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rd << 16) |
          (ra << 12) |
          (rm << 8) |
          (0x9 << 4) |
          rn,
      });
    });
  });
});

describe("MLS instruction assemble", () => {
  it("MLS R1, R2, R3, R4", () => {
    const code = `
    .text  
    MLS R1, R2, R3, R4
    `;
    const opCode = MultiplyAcc.MLS;
    const rd = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    const ra = TextToRegister.R4;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "MLS R1, R2, R3, R4",
      encode:
        (0xe << 28) |
        (opCode << 21) |
        (rd << 16) |
        (ra << 12) |
        (rm << 8) |
        (0x9 << 4) |
        rn,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`MLS${cond} R1, R2, R3, R4`, () => {
      const code = `
            .text
            MLS${cond} R1, R2, R3, R4
            `;
      const opCode = MultiplyAcc.MLS;
      const rd = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      const ra = TextToRegister.R4;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `MLS${cond} R1, R2, R3, R4`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (rd << 16) |
          (ra << 12) |
          (rm << 8) |
          (0x9 << 4) |
          rn,
      });
    });
  });
});

describe("UMAAL instruction assemble", () => {
  it("UMAAL R1, R2, R3, R4", () => {
    const code = `
    .text  
    UMAAL R1, R2, R3, R4
    `;
    const opCode = MultiplyAcc.UMAAL;
    const rdLo = TextToRegister.R1;
    const rdHi = TextToRegister.R2;
    const rn = TextToRegister.R3;
    const rm = TextToRegister.R4;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "UMAAL R1, R2, R3, R4",
      encode:
        (0xe << 28) |
        (opCode << 21) |
        (rdHi << 16) |
        (rdLo << 12) |
        (rm << 8) |
        (0x9 << 4) |
        rn,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`UMAAL${cond} R1, R2, R3, R4`, () => {
      const code = `
            .text
            UMAAL${cond} R1, R2, R3, R4
            `;
      const opCode = MultiplyAcc.UMAAL;
      const rdLo = TextToRegister.R1;
      const rdHi = TextToRegister.R2;
      const rn = TextToRegister.R3;
      const rm = TextToRegister.R4;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `UMAAL${cond} R1, R2, R3, R4`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (opCode << 21) |
          (rdHi << 16) |
          (rdLo << 12) |
          (rm << 8) |
          (0x9 << 4) |
          rn,
      });
    });
  });
});

describe("Other Signed/Unsigned Multiplication instruction assemble", () => {
  const signedMul = ["UMULL", "UMLAL", "SMULL", "SMLAL"];
  signedMul.forEach((op) => {
    it(`${op} R1, R2, R3, R4`, () => {
      const code = `
    .text  
    ${op} R1, R2, R3, R4
    `;
      const opCode = getValueIfKeyExists(MultiplyAcc, op);
      const rdLo = TextToRegister.R1;
      const rdHi = TextToRegister.R2;
      const rn = TextToRegister.R3;
      const rm = TextToRegister.R4;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1, R2, R3, R4`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (rdHi << 16) |
          (rdLo << 12) |
          (rm << 8) |
          (0x9 << 4) |
          rn,
      });
    });

    it(`${op}S R1, R2, R3, R4`, () => {
      const code = `
    .text  
    ${op}S R1, R2, R3, R4
    `;
      const opCode = getValueIfKeyExists(MultiplyAcc, op);
      const rdLo = TextToRegister.R1;
      const rdHi = TextToRegister.R2;
      const rn = TextToRegister.R3;
      const rm = TextToRegister.R4;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op}S R1, R2, R3, R4`,
        encode:
          (0xe << 28) |
          (opCode << 21) |
          (1 << 20) |
          (rdHi << 16) |
          (rdLo << 12) |
          (rm << 8) |
          (0x9 << 4) |
          rn,
      });
    });

    Object.keys(Condition).forEach((cond) => {
      it(`${op}${cond} R1, R2, R3, R4`, () => {
        const code = `
            .text
            ${op}${cond} R1, R2, R3, R4
            `;
        const opCode = getValueIfKeyExists(MultiplyAcc, op);
        const rdLo = TextToRegister.R1;
        const rdHi = TextToRegister.R2;
        const rn = TextToRegister.R3;
        const rm = TextToRegister.R4;
        const { instructions } = assembler.assemble(code);
        expect(instructions.size).toBe(2);
        expect(instructions.get(pc)).toStrictEqual({
          origin: `${op}${cond} R1, R2, R3, R4`,
          encode:
            (Condition[cond as keyof typeof Condition] << 28) |
            (opCode << 21) |
            (rdHi << 16) |
            (rdLo << 12) |
            (rm << 8) |
            (0x9 << 4) |
            rn,
        });
      });

      it(`${op}S${cond} R1, R2, R3, R4`, () => {
        const code = `
            .text
            ${op}S${cond} R1, R2, R3, R4
            `;
        const opCode = getValueIfKeyExists(MultiplyAcc, op);
        const rdLo = TextToRegister.R1;
        const rdHi = TextToRegister.R2;
        const rn = TextToRegister.R3;
        const rm = TextToRegister.R4;
        const { instructions } = assembler.assemble(code);
        expect(instructions.size).toBe(2);
        expect(instructions.get(pc)).toStrictEqual({
          origin: `${op}S${cond} R1, R2, R3, R4`,
          encode:
            (Condition[cond as keyof typeof Condition] << 28) |
            (opCode << 21) |
            (1 << 20) |
            (rdHi << 16) |
            (rdLo << 12) |
            (rm << 8) |
            (0x9 << 4) |
            rn,
        });
      });
    });
  });
});

describe("Block Load instruction assemble", () => {
  const blockLoadOps = ["LDMIA", "LDMDA", "LDMDB", "LDMIB", "LDM"];
  blockLoadOps.forEach((op) => {
    it(`${op} R1 {R2}`, () => {
      const code = `
      .text
      ${op} R1, {R2}
      `;
      const opCode = getValueIfKeyExists(BlockLoad, op);
      const rn = TextToRegister.R1;
      const registerList = 1 << 2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1, {R2}`,
        encode:
          (0xe << 28) |
          (1 << 27) |
          (opCode << 22) |
          (1 << 20) |
          (rn << 16) |
          registerList,
      });
    });

    it(`${op} R1!, {R2}`, () => {
      const code = `
      .text
      ${op} R1!, {R2}
      `;
      const opCode = getValueIfKeyExists(BlockLoad, op);
      const rn = TextToRegister.R1;
      const registerList = 1 << 2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1!, {R2}`,
        encode:
          (0xe << 28) |
          (1 << 27) |
          (opCode << 22) |
          (1 << 21) |
          (1 << 20) |
          (rn << 16) |
          registerList,
      });
    });

    it(`${op} R1!, {R2, R3, R4, R7, R9}`, () => {
      const code = `
      .text
      ${op} R1!, {R2, R3, R4, R7, R9}
      `;
      const opCode = getValueIfKeyExists(BlockLoad, op);
      const rn = TextToRegister.R1;
      const registerList = (1 << 2) | (1 << 3) | (1 << 4) | (1 << 7) | (1 << 9);
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1!, {R2, R3, R4, R7, R9}`,
        encode:
          (0xe << 28) |
          (1 << 27) |
          (opCode << 22) |
          (1 << 21) |
          (1 << 20) |
          (rn << 16) |
          registerList,
      });
    });

    Object.keys(Condition).forEach((cond) => {
      it(`${op}${cond} R5, {R2, R4}`, () => {
        const code = `
              .text  
              ${op}${cond} R5, {R2, R4}
              `;
        const opCode = getValueIfKeyExists(BlockLoad, op);
        const rn = TextToRegister.R5;
        const registerList = (1 << 2) | (1 << 4);
        const { instructions } = assembler.assemble(code);
        expect(instructions.size).toBe(2);
        expect(instructions.get(pc)).toStrictEqual({
          origin: `${op}${cond} R5, {R2, R4}`,
          encode:
            (Condition[cond as keyof typeof Condition] << 28) |
            (1 << 27) |
            (opCode << 22) |
            (1 << 20) |
            (rn << 16) |
            registerList,
        });
      });
    });
  });
});

describe("Block Store instruction assemble", () => {
  const blockLoadOps = ["STMIA", "STMDA", "STMDB", "STMIB", "STM"];
  blockLoadOps.forEach((op) => {
    it(`${op} R1 {R2}`, () => {
      const code = `
      .text
      ${op} R1, {R2}
      `;
      const opCode = getValueIfKeyExists(BlockStore, op);
      const rn = TextToRegister.R1;
      const registerList = 1 << 2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1, {R2}`,
        encode:
          (0xe << 28) | (1 << 27) | (opCode << 22) | (rn << 16) | registerList,
      });
    });

    it(`${op} R1!, {R2}`, () => {
      const code = `
      .text
      ${op} R1!, {R2}
      `;
      const opCode = getValueIfKeyExists(BlockStore, op);
      const rn = TextToRegister.R1;
      const registerList = 1 << 2;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1!, {R2}`,
        encode:
          (0xe << 28) |
          (1 << 27) |
          (opCode << 22) |
          (1 << 21) |
          (rn << 16) |
          registerList,
      });
    });

    it(`${op} R1!, {R2, R3, R4, R7, R9}`, () => {
      const code = `
      .text
      ${op} R1!, {R2, R3, R4, R7, R9}
      `;
      const opCode = getValueIfKeyExists(BlockStore, op);
      const rn = TextToRegister.R1;
      const registerList = (1 << 2) | (1 << 3) | (1 << 4) | (1 << 7) | (1 << 9);
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `${op} R1!, {R2, R3, R4, R7, R9}`,
        encode:
          (0xe << 28) |
          (1 << 27) |
          (opCode << 22) |
          (1 << 21) |
          (rn << 16) |
          registerList,
      });
    });

    Object.keys(Condition).forEach((cond) => {
      it(`${op}${cond} R5, {R2, R4}`, () => {
        const code = `
              .text  
              ${op}${cond} R5, {R2, R4}
              `;
        const opCode = getValueIfKeyExists(BlockStore, op);
        const rn = TextToRegister.R5;
        const registerList = (1 << 2) | (1 << 4);
        const { instructions } = assembler.assemble(code);
        expect(instructions.size).toBe(2);
        expect(instructions.get(pc)).toStrictEqual({
          origin: `${op}${cond} R5, {R2, R4}`,
          encode:
            (Condition[cond as keyof typeof Condition] << 28) |
            (1 << 27) |
            (opCode << 22) |
            (rn << 16) |
            registerList,
        });
      });
    });
  });
});

describe("POP instruction assemble", () => {
  it("POP {R1, R2, R4}", () => {
    const code = `
      .text
      POP {R1, R2, R4}
      `;
    const rn = TextToRegister.SP;
    const opCode = BlockLoad.LDM;
    const registerList = (1 << 1) | (1 << 2) | (1 << 4);
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "POP {R1, R2, R4}",
      encode:
        (0xe << 28) |
        (1 << 27) |
        (opCode << 22) |
        (1 << 21) |
        (1 << 20) |
        (rn << 16) |
        registerList,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`POP${cond} {R2, R4}`, () => {
      const code = `
              .text  
              POP${cond} {R2, R4}
              `;
      const opCode = BlockLoad.LDM;
      const rn = TextToRegister.SP;
      const registerList = (1 << 2) | (1 << 4);
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `POP${cond} {R2, R4}`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (1 << 27) |
          (opCode << 22) |
          (1 << 21) |
          (1 << 20) |
          (rn << 16) |
          registerList,
      });
    });
  });
});

describe("PUSH instruction assemble", () => {
  it("PUSH {R1, R2, R4}", () => {
    const code = `
      .text
      PUSH {R1, R2, R4}
      `;
    const rn = TextToRegister.SP;
    const opCode = BlockStore.STMDB;
    const registerList = (1 << 1) | (1 << 2) | (1 << 4);
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "PUSH {R1, R2, R4}",
      encode:
        (0xe << 28) |
        (1 << 27) |
        (opCode << 22) |
        (1 << 21) |
        (rn << 16) |
        registerList,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`PUSH${cond} {R0, R4}`, () => {
      const code = `
            .text  
            PUSH${cond} {R0, R4}
            `;
      const opCode = BlockStore.STMDB;
      const rn = TextToRegister.SP;
      const registerList = 1 | (1 << 4);
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `PUSH${cond} {R0, R4}`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (1 << 27) |
          (opCode << 22) |
          (1 << 21) |
          (rn << 16) |
          registerList,
      });
    });
  });
});

describe("SWAP instruction assemble", () => {
  it("SWP R1, R2, [R3]", () => {
    const code = `
      .text  
      SWP R1, R2, [R3]
      `;
    const rt = TextToRegister.R1;
    const rt2 = TextToRegister.R2;
    const rn = TextToRegister.R3;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "SWP R1, R2, [R3]",
      encode:
        (0xe << 28) | (1 << 24) | (rn << 16) | (rt << 12) | (0x9 << 4) | rt2,
    });
  });

  it("SWPB R1, R2, [R3]", () => {
    const code = `
      .text  
      SWPB R1, R2, [R3]
      `;
    const rt = TextToRegister.R1;
    const rt2 = TextToRegister.R2;
    const rn = TextToRegister.R3;
    const { instructions } = assembler.assemble(code);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "SWPB R1, R2, [R3]",
      encode:
        (0xe << 28) |
        (1 << 22) |
        (1 << 24) |
        (rn << 16) |
        (rt << 12) |
        (0x9 << 4) |
        rt2,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`SWP${cond} R1, R2, [R3]`, () => {
      const code = `
          .text  
          SWP${cond} R1, R2, [R3]
          `;
      const rt = TextToRegister.R1;
      const rt2 = TextToRegister.R2;
      const rn = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `SWP${cond} R1, R2, [R3]`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (1 << 24) |
          (rn << 16) |
          (rt << 12) |
          (0x9 << 4) |
          rt2,
      });
    });

    it(`SWPB${cond} R1, R2, [R3]`, () => {
      const code = `
          .text  
          SWPB${cond} R1, R2, [R3]
          `;
      const rt = TextToRegister.R1;
      const rt2 = TextToRegister.R2;
      const rn = TextToRegister.R3;
      const { instructions } = assembler.assemble(code);
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `SWPB${cond} R1, R2, [R3]`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (1 << 22) |
          (1 << 24) |
          (rn << 16) |
          (rt << 12) |
          (0x9 << 4) |
          rt2,
      });
    });
  });
});

describe("LDR instruction assemble", () => {
  it("LDR literal", () => {
    const code = `
    .data
    data1: .int 123456
    data2: .int 654321
    .text
    LDR R1, data1
    `;

    const { data, instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    expect(data.length).toBe(8);
    // 1E240 and 9FBF1
    expect(data).toStrictEqual([
      0x00, 0x01, 0xe2, 0x40, 0x00, 0x09, 0xfb, 0xf1,
    ]);
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, data1",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 24) |
        (0 << 23) |
        (1 << 20) |
        (0xf << 16) |
        (rt << 12) |
        0x8,
    });
  });

  it("LDR literal far away", () => {
    const code = `
    .data
    data1: .asciz "${new Array(5000).fill("A").join("")}"
    .text
    LDR R1, data1
    `;

    const { data, instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    expect(data.length).toBe(5001);
    // 1E240 and 9FBF1
    expect(data[0]).toStrictEqual(0x41);
    expect(instructions.size).toBe(6);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "PUSH {R12}",
      encode: (0xe << 28) | (0x9 << 24) | (0x1 << 21) | (0xd << 16) | (1 << 12),
    });

    // final address = 0x3FFFEC77
    expect(instructions.get(pc + 4)).toStrictEqual({
      origin: "MOVW R12, #60535",
      encode: (0xe << 28) | (0x3 << 24) | (0xe << 16) | (0xc << 12) | 0xc77,
    });
    expect(instructions.get(pc + 8)).toStrictEqual({
      origin: "MOVT R12, #16383",
      encode:
        (0xe << 28) |
        (0x3 << 24) |
        (1 << 22) |
        (0x3 << 16) |
        (0xc << 12) |
        0xfff,
    });
    expect(instructions.get(pc + 12)).toStrictEqual({
      origin: `LDR R1, data1`,
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 24) |
        (1 << 20) |
        (0xc << 16) |
        (rt << 12),
    });
    expect(instructions.get(pc + 16)).toStrictEqual({
      origin: "POP {R12}",
      encode:
        (0xe << 28) |
        (0x8 << 24) |
        (0x1 << 23) |
        (0x1 << 21) |
        (0x1 << 20) |
        (0xd << 16) |
        (1 << 12),
    });
  });

  it("LDR R1, [R2] (P=1)", () => {
    const code = `
    .text
    LDR R1, [R2]
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2]",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 24) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12),
    });
  });

  it("LDR R1, [R2, #12] (P = 1, U = 1)", () => {
    const code = `
    .text
    LDR R1, [R2, #12]
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2, #12]",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 23) |
        (1 << 24) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        0xc,
    });
  });

  it("LDR R1, [R2, #12]! (P = 1, U = 1)", () => {
    const code = `
    .text
    LDR R1, [R2, #12]!
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2, #12]!",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 23) |
        (1 << 24) |
        (1 << 21) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        0xc,
    });
  });

  it("LDR R1, [R2, #-8]! (P = 1, U = 0)", () => {
    const code = `
    .text
    LDR R1, [R2, #-8]!
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2, #-8]!",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 24) |
        (1 << 21) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        0x8,
    });
  });

  it("LDR R1, [R2], #12 (P = 0, U = 1)", () => {
    const code = `
    .text
    LDR R1, [R2], #12
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2], #12",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 23) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        0xc,
    });
  });

  it("LDR R1, [R2], #-10 (P = 0, U = 0)", () => {
    const code = `
    .text
    LDR R1, [R2], #-10
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2], #-10",
      encode:
        (0xe << 28) | (1 << 26) | (1 << 20) | (rn << 16) | (rt << 12) | 0xa,
    });
  });

  it("LDR R1, [R2], #-10 (P = 0, U = 0)", () => {
    const code = `
    .text
    LDR R1, [R2], #-10
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2], #-10",
      encode:
        (0xe << 28) | (1 << 26) | (1 << 20) | (rn << 16) | (rt << 12) | 0xa,
    });
  });

  it("LDR R1, [R2], +R3, RRX (P = 0, U = 1)", () => {
    const code = `
    .text
    LDR R1, [R2], +R3, RRX
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.ROR;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2], +R3, RRX",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 23) |
        (1 << 25) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        (shiftType << 5) |
        rm,
    });
  });

  it("LDR R1, [R2, -R3, RRX] (P = 1, U = 0)", () => {
    const code = `
    .text
    LDR R1, [R2, -R3, RRX]
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.ROR;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2, -R3, RRX]",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 25) |
        (1 << 24) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        (shiftType << 5) |
        rm,
    });
  });

  it("LDR R1, [R2, -R3, RRX]! (P = 1, U = 0, W=1)", () => {
    const code = `
    .text
    LDR R1, [R2, -R3, RRX]!
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.ROR;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2, -R3, RRX]!",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 25) |
        (1 << 24) |
        (1 << 21) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        (shiftType << 5) |
        rm,
    });
  });

  it("LDR R1, [R2], R3, LSL #4 (P = 0, U = 1)", () => {
    const code = `
    .text
    LDR R1, [R2], R3, LSL #4
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.LSL;
    const shiftAmount = 4;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2], R3, LSL #4",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 23) |
        (1 << 25) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        (shiftAmount << 7) |
        (shiftType << 5) |
        rm,
    });
  });

  it("LDR R1, [R2, -R3, ASR #31] (P = 1, U = 0)", () => {
    const code = `
    .text
    LDR R1, [R2, -R3, ASR #31]
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.ASR;
    const shiftAmount = 31;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2, -R3, ASR #31]",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 25) |
        (1 << 24) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        (shiftAmount << 7) |
        (shiftType << 5) |
        rm,
    });
  });

  it("LDR R1, [R2, -R3, LSR #13]! (P = 1, U = 0, W=1)", () => {
    const code = `
    .text
    LDR R1, [R2, -R3, LSR #13]!
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.LSR;
    const shiftAmount = 13;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDR R1, [R2, -R3, LSR #13]!",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 25) |
        (1 << 24) |
        (1 << 21) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12) |
        (shiftAmount << 7) |
        (shiftType << 5) |
        rm,
    });
  });

  it("LDRB R1, [R2] (P=1)", () => {
    const code = `
    .text
    LDRB R1, [R2]
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "LDRB R1, [R2]",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 24) |
        (1 << 22) |
        (1 << 20) |
        (rn << 16) |
        (rt << 12),
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`LDR${cond} R1, [R2, -R3, LSR #13]! (P = 1, U = 0, W=1)`, () => {
      const code = `
    .text
    LDR${cond} R1, [R2, -R3, LSR #13]!
    `;
      const { instructions } = assembler.assemble(code);
      const shiftType = ShiftType.LSR;
      const shiftAmount = 13;
      const rt = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `LDR${cond} R1, [R2, -R3, LSR #13]!`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (1 << 26) |
          (1 << 25) |
          (1 << 24) |
          (1 << 21) |
          (1 << 20) |
          (rn << 16) |
          (rt << 12) |
          (shiftAmount << 7) |
          (shiftType << 5) |
          rm,
      });
    });

    it(`LDRB${cond} R1, [R2], #-10 (P = 0, U = 0)`, () => {
      const code = `
    .text
    LDRB${cond} R1, [R2], #-10
    `;
      const { instructions } = assembler.assemble(code);
      const rt = TextToRegister.R1;
      const rn = TextToRegister.R2;
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `LDRB${cond} R1, [R2], #-10`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (1 << 26) |
          (1 << 22) |
          (1 << 20) |
          (rn << 16) |
          (rt << 12) |
          0xa,
      });
    });
  });
});

describe("STR instruction assemble", () => {
  it("STR R1, [R2] (P=1)", () => {
    const code = `
    .text
    STR R1, [R2]
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2]",
      encode: (0xe << 28) | (1 << 26) | (1 << 24) | (rn << 16) | (rt << 12),
    });
  });

  it("STR R1, [R2, #12] (P = 1, U = 1)", () => {
    const code = `
    .text
    str R1, [R2, #12]
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "str R1, [R2, #12]",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 23) |
        (1 << 24) |
        (rn << 16) |
        (rt << 12) |
        0xc,
    });
  });

  it("str R1, [R2, #12]! (P = 1, U = 1)", () => {
    const code = `
    .text
    str r1, [r2, #12]!
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "str r1, [r2, #12]!",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 23) |
        (1 << 24) |
        (1 << 21) |
        (rn << 16) |
        (rt << 12) |
        0xc,
    });
  });

  it("STR R1, [R2, #-8]! (P = 1, U = 0)", () => {
    const code = `
    .text
    STR R1, [R2, #-8]!
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2, #-8]!",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 24) |
        (1 << 21) |
        (rn << 16) |
        (rt << 12) |
        0x8,
    });
  });

  it("STR R1, [R2], #12 (P = 0, U = 1)", () => {
    const code = `
    .text
    STR R1, [R2], #12
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2], #12",
      encode:
        (0xe << 28) | (1 << 26) | (1 << 23) | (rn << 16) | (rt << 12) | 0xc,
    });
  });

  it("STR R1, [R2], #-10 (P = 0, U = 0)", () => {
    const code = `
    .text
    STR R1, [R2], #-10
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2], #-10",
      encode: (0xe << 28) | (1 << 26) | (rn << 16) | (rt << 12) | 0xa,
    });
  });

  it("STR R1, [R2], #-10 (P = 0, U = 0)", () => {
    const code = `
    .text
    STR R1, [R2], #-10
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2], #-10",
      encode: (0xe << 28) | (1 << 26) | (rn << 16) | (rt << 12) | 0xa,
    });
  });

  it("STR R1, [R2], +R3, RRX (P = 0, U = 1)", () => {
    const code = `
    .text
    STR R1, [R2], +R3, RRX
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.ROR;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2], +R3, RRX",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 23) |
        (1 << 25) |
        (rn << 16) |
        (rt << 12) |
        (shiftType << 5) |
        rm,
    });
  });

  it("STR R1, [R2, -R3, RRX] (P = 1, U = 0)", () => {
    const code = `
    .text
    STR R1, [R2, -R3, RRX]
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.ROR;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2, -R3, RRX]",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 25) |
        (1 << 24) |
        (rn << 16) |
        (rt << 12) |
        (shiftType << 5) |
        rm,
    });
  });

  it("STR R1, [R2, -R3, RRX]! (P = 1, U = 0, W=1)", () => {
    const code = `
    .text
    STR R1, [R2, -R3, RRX]!
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.ROR;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2, -R3, RRX]!",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 25) |
        (1 << 24) |
        (1 << 21) |
        (rn << 16) |
        (rt << 12) |
        (shiftType << 5) |
        rm,
    });
  });

  it("STR R1, [R2], R3, LSL #4 (P = 0, U = 1)", () => {
    const code = `
    .text
    STR R1, [R2], R3, LSL #4
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.LSL;
    const shiftAmount = 4;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2], R3, LSL #4",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 23) |
        (1 << 25) |
        (rn << 16) |
        (rt << 12) |
        (shiftAmount << 7) |
        (shiftType << 5) |
        rm,
    });
  });

  it("STR R1, [R2, -R3, ASR #31] (P = 1, U = 0)", () => {
    const code = `
    .text
    STR R1, [R2, -R3, ASR #31]
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.ASR;
    const shiftAmount = 31;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2, -R3, ASR #31]",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 25) |
        (1 << 24) |
        (rn << 16) |
        (rt << 12) |
        (shiftAmount << 7) |
        (shiftType << 5) |
        rm,
    });
  });

  it("STR R1, [R2, -R3, LSR #13]! (P = 1, U = 0, W=1)", () => {
    const code = `
    .text
    STR R1, [R2, -R3, LSR #13]!
    `;
    const { instructions } = assembler.assemble(code);
    const shiftType = ShiftType.LSR;
    const shiftAmount = 13;
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    const rm = TextToRegister.R3;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STR R1, [R2, -R3, LSR #13]!",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 25) |
        (1 << 24) |
        (1 << 21) |
        (rn << 16) |
        (rt << 12) |
        (shiftAmount << 7) |
        (shiftType << 5) |
        rm,
    });
  });

  it("STRB R1, [R2] (P=1)", () => {
    const code = `
    .text
    STRB R1, [R2]
    `;
    const { instructions } = assembler.assemble(code);
    const rt = TextToRegister.R1;
    const rn = TextToRegister.R2;
    expect(instructions.size).toBe(2);
    expect(instructions.get(pc)).toStrictEqual({
      origin: "STRB R1, [R2]",
      encode:
        (0xe << 28) |
        (1 << 26) |
        (1 << 24) |
        (1 << 22) |
        (rn << 16) |
        (rt << 12),
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`STR${cond} R1, [R2, -R3, LSR #13]! (P = 1, U = 0, W=1)`, () => {
      const code = `
    .text
    STR${cond} R1, [R2, -R3, LSR #13]!
    `;
      const { instructions } = assembler.assemble(code);
      const shiftType = ShiftType.LSR;
      const shiftAmount = 13;
      const rt = TextToRegister.R1;
      const rn = TextToRegister.R2;
      const rm = TextToRegister.R3;
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `STR${cond} R1, [R2, -R3, LSR #13]!`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (1 << 26) |
          (1 << 25) |
          (1 << 24) |
          (1 << 21) |
          (rn << 16) |
          (rt << 12) |
          (shiftAmount << 7) |
          (shiftType << 5) |
          rm,
      });
    });

    it(`STRB${cond} R1, [R2], #-10 (P = 0, U = 0)`, () => {
      const code = `
    .text
    STRB${cond} R1, [R2], #-10
    `;
      const { instructions } = assembler.assemble(code);
      const rt = TextToRegister.R1;
      const rn = TextToRegister.R2;
      expect(instructions.size).toBe(2);
      expect(instructions.get(pc)).toStrictEqual({
        origin: `STRB${cond} R1, [R2], #-10`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (1 << 26) |
          (1 << 22) |
          (rn << 16) |
          (rt << 12) |
          0xa,
      });
    });
  });
});

describe("B instruction assemble", () => {
  it("B label", () => {
    const code = `
    .text
    ADD R1, R2, R3
    Loops:
    ADD R1, R2, R3
    ADD R1, R2, R3
    ADD R1, R2, R3
    B Loops
    `;

    const { instructions } = assembler.assemble(code);
    const offset = (-12 >> 2) & 0x00ffffff;
    expect(instructions.size).toBe(6);
    // we only care about the branch
    expect(instructions.get(pc + 16)).toStrictEqual({
      origin: "B Loops",
      encode: (0xe << 28) | (0xa << 24) | offset,
    });
  });

  it("B label", () => {
    const code = `
    .text
    B Loops
    ADD R1, R2, R3
    ADD R1, R2, R3
    ADD R1, R2, R3
    Loops:
    ADD R1, R2, R3
    
    `;

    const { instructions } = assembler.assemble(code);
    const offset = (16 >> 2) & 0x00ffffff;
    expect(instructions.size).toBe(6);
    // we only care about the branch
    expect(instructions.get(pc)).toStrictEqual({
      origin: "B Loops",
      encode: (0xe << 28) | (0xa << 24) | offset,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`B${cond} label`, () => {
      const code = `
    .text
    B${cond} Loops
    ADD R1, R2, R3
    ADD R1, R2, R3
    ADD R1, R2, R3
    Loops:
    ADD R1, R2, R3
    
    `;

      const { instructions } = assembler.assemble(code);
      const offset = (16 >> 2) & 0x00ffffff;
      expect(instructions.size).toBe(6);
      // we only care about the branch
      expect(instructions.get(pc)).toStrictEqual({
        origin: `B${cond} Loops`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (0xa << 24) |
          offset,
      });
    });
  });
});

describe("BL instruction assemble", () => {
  it("BL label", () => {
    const code = `
    .text
    ADD R1, R2, R3
    Loops:
    ADD R1, R2, R3
    ADD R1, R2, R3
    ADD R1, R2, R3
    BL Loops
    `;

    const { instructions } = assembler.assemble(code);
    const offset = (-12 >> 2) & 0x00ffffff;
    expect(instructions.size).toBe(6);
    // we only care about the branch
    expect(instructions.get(pc + 16)).toStrictEqual({
      origin: "BL Loops",
      encode: (0xe << 28) | (0xb << 24) | offset,
    });
  });

  it("BL label", () => {
    const code = `
    .text
    BL Loops
    ADD R1, R2, R3
    ADD R1, R2, R3
    ADD R1, R2, R3
    Loops:
    ADD R1, R2, R3
    
    `;

    const { instructions } = assembler.assemble(code);
    const offset = (16 >> 2) & 0x00ffffff;
    expect(instructions.size).toBe(6);
    // we only care about the branch
    expect(instructions.get(pc)).toStrictEqual({
      origin: "BL Loops",
      encode: (0xe << 28) | (0xb << 24) | offset,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`BL${cond} label`, () => {
      const code = `
    .text
    BL${cond} Loops
    ADD R1, R2, R3
    ADD R1, R2, R3
    ADD R1, R2, R3
    Loops:
    ADD R1, R2, R3
    
    `;

      const { instructions } = assembler.assemble(code);
      const offset = (16 >> 2) & 0x00ffffff;
      expect(instructions.size).toBe(6);
      // we only care about the branch
      expect(instructions.get(pc)).toStrictEqual({
        origin: `BL${cond} Loops`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (0xb << 24) |
          offset,
      });
    });
  });
});

describe("BX instruction assemble", () => {
  it("BX R10", () => {
    const code = `
    .text
    BX R10
    `;

    const { instructions } = assembler.assemble(code);
    const rm = TextToRegister.R10;
    expect(instructions.size).toBe(2);
    // we only care about the branch
    expect(instructions.get(pc)).toStrictEqual({
      origin: "BX R10",
      encode: (0xe << 28) | (0x9 << 21) | (0xfff << 8) | (1 << 4) | rm,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`BX${cond} R0`, () => {
      const code = `
    .text
    Bx${cond} R0
    
    `;

      const { instructions } = assembler.assemble(code);
      const rm = TextToRegister.R0;
      expect(instructions.size).toBe(2);
      // we only care about the branch
      expect(instructions.get(pc)).toStrictEqual({
        origin: `Bx${cond} R0`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (0x9 << 21) |
          (0xfff << 8) |
          (1 << 4) |
          rm,
      });
    });
  });
});

describe("BLX instruction assemble", () => {
  it("BLX R10", () => {
    const code = `
    .text
    BLX R10
    `;

    const { instructions } = assembler.assemble(code);
    const rm = TextToRegister.R10;
    expect(instructions.size).toBe(2);
    // we only care about the branch
    expect(instructions.get(pc)).toStrictEqual({
      origin: "BLX R10",
      encode: (0xe << 28) | (0x9 << 21) | (0xfff << 8) | (0x3 << 4) | rm,
    });
  });

  Object.keys(Condition).forEach((cond) => {
    it(`BLX${cond} R0`, () => {
      const code = `
    .text
    BLx${cond} R0
    
    `;

      const { instructions } = assembler.assemble(code);
      const rm = TextToRegister.R0;
      expect(instructions.size).toBe(2);
      // we only care about the branch
      expect(instructions.get(pc)).toStrictEqual({
        origin: `BLx${cond} R0`,
        encode:
          (Condition[cond as keyof typeof Condition] << 28) |
          (0x9 << 21) |
          (0xfff << 8) |
          (0x3 << 4) |
          rm,
      });
    });
  });
});
