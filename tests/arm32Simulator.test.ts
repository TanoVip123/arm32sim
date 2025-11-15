import { expect, it, describe, vi } from "vitest";
import { Arm32Simulator } from "../src/components/arm32Simulator";
import { Imm12, Word } from "../src/types/binType";
import { beforeEach } from "vitest";
import { mock } from "vitest-mock-extended";
import { ArmALU } from "../src/interface/ALU";
import { RegisterFile } from "../src/interface/registerFile";
import { Memory } from "../src/interface/memory";
import { NZCV, nzcvToNum } from "../src/types/flags";
import { Condition } from "../src/types/conditions";
import {
  BlockLoad,
  BlockStore,
  DataProcessing,
  MultiplyAcc,
} from "../src/types/instructions";
import { ShiftType } from "../src/types/shiftType";

const mockALU = mock<ArmALU>();
const mockRegisterFile = mock<RegisterFile>();
const mockMemory = mock<Memory>();

const DEFAULT_ALU_RETURN: Word = new Word(0x12345678);
const DEFAULT_ALU_FLAG: NZCV = { N: 1, Z: 1, C: 1, V: 1 };
const DEFAULT_CPSR_VALUE: Word = new Word(0xe0000000);
const DEFAULT_MEMORY_VALUE: Word = new Word(0x87654321);
const DEFAULT_MEMORY_BUFFER: ArrayBuffer = new Uint8Array([
  0xff, 0xff, 0xff, 0xff,
]).buffer;
const DEFAULT_REGISTER_VALUE: number = 0x00000ff0;
const simulator = new Arm32Simulator(mockALU, mockRegisterFile, mockMemory);

beforeEach(() => {
  vi.resetAllMocks();
  for (let i = 0; i < 16; i++) {
    mockRegisterFile.readRegister
      .calledWith(i)
      .mockReturnValue(new Word(DEFAULT_REGISTER_VALUE));
  }
  mockRegisterFile.readCPSR.mockReturnValue(DEFAULT_CPSR_VALUE);

  mockMemory.readWord.mockReturnValue(DEFAULT_MEMORY_VALUE);
  mockMemory.readBuffer.mockReturnValue(DEFAULT_MEMORY_BUFFER);

  // mockALU return value
  mockALU.and.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.eor.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.sub.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.rsb.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.add.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.adc.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.sbc.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.rsc.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.orr.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.bic.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.mvn.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.mov.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });

  mockALU.i_and.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_eor.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_sub.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_rsb.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_add.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_adc.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_sbc.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_rsc.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_orr.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_mov.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_bic.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.i_mvn.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });

  mockALU.adr.mockReturnValue({ result: DEFAULT_ALU_RETURN });

  mockALU.mul.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.mla.mockReturnValue({
    result: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.umaal.mockReturnValue({
    resultHi: DEFAULT_ALU_RETURN,
    resultLo: DEFAULT_ALU_RETURN,
  });
  mockALU.mls.mockReturnValue({ result: DEFAULT_ALU_RETURN });
  mockALU.umull.mockReturnValue({
    resultHi: DEFAULT_ALU_RETURN,
    resultLo: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.umlal.mockReturnValue({
    resultHi: DEFAULT_ALU_RETURN,
    resultLo: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.smull.mockReturnValue({
    resultHi: DEFAULT_ALU_RETURN,
    resultLo: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
  mockALU.smlal.mockReturnValue({
    resultHi: DEFAULT_ALU_RETURN,
    resultLo: DEFAULT_ALU_RETURN,
    nzcv: DEFAULT_ALU_FLAG,
  });
});

describe("checkCondition()", () => {
  let nzcv: NZCV;
  // EQ - Equal (Z == 1)
  it("Condition.EQ - should pass when Z == 1", () => {
    nzcv = { N: 0, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.EQ, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.EQ, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.EQ, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.EQ, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.EQ, nzcv)).toBe(false);
  });

  // NE - Not Equal (Z == 0)
  it("Condition.NE - should pass when Z == 0", () => {
    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.NE, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.NE, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.NE, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.NE, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 1, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.NE, nzcv)).toBe(false);
  });

  // CS/HS - Carry Set or Unsigned Higher or Same (C == 1)
  it("Condition.HS - should pass when C == 1", () => {
    nzcv = { N: 0, Z: 0, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.HS, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.HS, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.HS, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.HS, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.HS, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.HS, nzcv)).toBe(false);
  });

  // CC/LO - Carry Clear or Unsigned Lower (C == 0)
  it("Condition.LO - should pass when C == 0", () => {
    nzcv = { N: 0, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LO, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LO, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LO, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.LO, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 1, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.LO, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.LO, nzcv)).toBe(false);
  });

  // MI - Negative (N == 1)
  it("Condition.MI - should pass when N == 1", () => {
    nzcv = { N: 1, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.MI, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.MI, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.MI, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.MI, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.MI, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.MI, nzcv)).toBe(false);
  });

  // PL - Positive or Zero (N == 0)
  it("Condition.PL - should pass when N == 0", () => {
    nzcv = { N: 0, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.PL, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.PL, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.PL, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.PL, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.PL, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.PL, nzcv)).toBe(false);
  });

  // VS - Overflow set (V == 1)
  it("Condition.VS - should pass when V == 1", () => {
    nzcv = { N: 0, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.VS, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.VS, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.VS, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.VS, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.VS, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.VS, nzcv)).toBe(false);
  });

  // VC - Overflow clear (V == 0)
  it("Condition.VC - should pass when V == 0", () => {
    nzcv = { N: 0, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.VC, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.VC, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.VC, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.VC, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.VC, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 1, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.VC, nzcv)).toBe(false);
  });

  // HI - Unsigned higher (C == 1 && Z == 0)
  it("Condition.HI - should pass when C == 1 && Z == 0", () => {
    nzcv = { N: 0, Z: 0, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.HI, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.HI, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.HI, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.HI, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.HI, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.HI, nzcv)).toBe(false);
  });

  // LS - Unsigned lower or same (C == 0 || Z == 1)
  it("Condition.LS - should pass when C == 0 || Z == 1", () => {
    nzcv = { N: 0, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.LS, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LS, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LS, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.LS, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.LS, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.LS, nzcv)).toBe(false);
  });

  // GE - Signed greater or equal (N == V)
  it("Condition.GE - should pass when N == V", () => {
    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.GE, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.GE, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.GE, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.GE, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 1, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.GE, nzcv)).toBe(false);
  });

  // LT - Signed less than (N != V)
  it("Condition.LT - should pass when N != V", () => {
    nzcv = { N: 1, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.LT, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LT, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.LT, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LT, nzcv)).toBe(false);
  });

  // GT - Signed greater than (Z == 0 && N == V)
  it("Condition.GT - should pass when Z == 0 && N == V", () => {
    nzcv = { N: 0, Z: 0, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.GT, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.GT, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.GT, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.GT, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.GT, nzcv)).toBe(false);

    nzcv = { N: 0, Z: 1, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.GT, nzcv)).toBe(false);
  });

  // LE - Signed less or equal (Z == 1 || N != V)
  it("Condition.LE - should pass when Z == 1 || N != V", () => {
    nzcv = { N: 1, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.LE, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.LE, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LE, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.LE, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LE, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.LE, nzcv)).toBe(false);

    nzcv = { N: 1, Z: 0, C: 0, V: 1 };
    expect(simulator.checkCondition(Condition.LE, nzcv)).toBe(false);
  });

  // AL - Always (unconditional)
  it("Condition.AL - should always pass", () => {
    nzcv = { N: 0, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.AL, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 0, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.AL, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 1, C: 0, V: 0 };
    expect(simulator.checkCondition(Condition.AL, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.AL, nzcv)).toBe(true);

    nzcv = { N: 0, Z: 0, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.AL, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 1, V: 0 };
    expect(simulator.checkCondition(Condition.AL, nzcv)).toBe(true);

    nzcv = { N: 1, Z: 1, C: 1, V: 1 };
    expect(simulator.checkCondition(Condition.AL, nzcv)).toBe(true);
  });

  // NV (0xF) - Undefined condition (should never execute)
  it("Condition.NV - undefined condition should always return false", () => {
    nzcv = { N: 0, Z: 1, C: 1, V: 1 };
    expect(simulator.checkCondition(0xf, nzcv)).toBe(false);
  });
});

describe("Test LOAD instruction", () => {
  //Condition is always 1110 for simplicity
  it("should handle LDR with R=0, P=0, U=0, W=0", () => {
    const R = 0;
    const P = 0;
    const U = 0;
    const W = 0;
    const rn = 0x1;
    const rt = 0x3;
    const imm = 0x004;
    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (1 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockMemory.readWord).toBeCalledTimes(1);
    expect(mockMemory.readWord.mock.calls[0][0]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE),
    );

    // 2 calls because we have write back (P == '0' || W == '1')
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      DEFAULT_MEMORY_VALUE,
    ]);

    // since U = 0 => -dec => offset = 4 - 4
    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE - imm),
    ]);
  });

  it("should handle LDR with R=0, P=1, U=0, W=0", () => {
    const R = 0;
    const P = 1;
    const U = 0;
    const W = 0;
    const rn = 0x2;
    const rt = 0x5;
    const imm = 0x004;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (1 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    // Verify memory read at base - imm
    expect(mockMemory.readWord).toBeCalledTimes(1);
    expect(mockMemory.readWord.mock.calls[0][0]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE - imm),
    );

    // Only 1 write: destination register (no write-back)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      DEFAULT_MEMORY_VALUE,
    ]);
  });

  it("should handle LDR with R=0, P=0, U=1, W=0", () => {
    const R = 0;
    const P = 0;
    const U = 1;
    const W = 0;
    const rn = 0x2;
    const rt = 0x4;
    const imm = 0x008;

    // cond=0xE (AL)
    // P=0, U=1, W=0, L=1 → 0b0011 << 20
    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (1 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    // Memory access occurs at base (post-index), so address = DEFAULT_REGISTER_VALUE
    expect(mockMemory.readWord).toBeCalledTimes(1);
    expect(mockMemory.readWord.mock.calls[0][0]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE),
    );

    // Write destination register
    // 2 calls because post-index (P=0) triggers write-back: base + imm
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      DEFAULT_MEMORY_VALUE,
    ]);
    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE + imm),
    ]);
  });

  it("should handle LDR with R=0, P=1, U=1, W=0", () => {
    const R = 0;
    const P = 1;
    const U = 1;
    const W = 0;
    const rn = 0x3;
    const rt = 0x5;
    const imm = 0x010;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (1 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockMemory.readWord).toBeCalledTimes(1);
    expect(mockMemory.readWord.mock.calls[0][0]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE + imm),
    );

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      DEFAULT_MEMORY_VALUE,
    ]);
  });

  it("should handle LDR with R=0, P=0, U=0, W=1", () => {
    const R = 0;
    const P = 0;
    const U = 0;
    const W = 1;
    const rn = 0x2;
    const rt = 0x4;
    const imm = 0x008;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (1 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    // Post-indexing (P=0), memory access at base - imm (U=0)
    expect(mockMemory.readWord).toBeCalledTimes(1);
    expect(mockMemory.readWord.mock.calls[0][0]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE),
    );

    // Two writes: destination register + write-back to base register (W=1)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      DEFAULT_MEMORY_VALUE,
    ]);
    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE - imm),
    ]);
  });

  it("should handle LDR with R=0, P=1, U=0, W=1", () => {
    const R = 0;
    const P = 1;
    const U = 0;
    const W = 1;
    const rn = 0x3;
    const rt = 0x5;
    const imm = 0x010;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (1 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    // Pre-indexing (P=1), memory access at base - imm (U=0)
    expect(mockMemory.readWord).toBeCalledTimes(1);
    expect(mockMemory.readWord.mock.calls[0][0]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE - imm),
    );

    // Two writes: destination register + write-back to base register (W=1)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      DEFAULT_MEMORY_VALUE,
    ]);
    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE - imm),
    ]);
  });

  it("should handle LDR with R=0, P=0, U=1, W=1", () => {
    const R = 0;
    const P = 0;
    const U = 1;
    const W = 1;
    const rn = 0x2;
    const rt = 0x4;
    const imm = 0x008;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (1 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    // Post-indexing (P=0), memory access at base (U=1 → add offset for write-back)
    expect(mockMemory.readWord).toBeCalledTimes(1);
    expect(mockMemory.readWord.mock.calls[0][0]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE),
    );

    // Two writes: destination register + write-back to base register (base + imm)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      DEFAULT_MEMORY_VALUE,
    ]);
    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE + imm),
    ]);
  });

  it("should handle LDR with R=1", () => {
    const R = 1;
    const P = 0;
    const U = 1;
    const W = 1;
    const rn = 0x2;
    const rt = 0x4;
    const rm = 0x8;
    const shiftType = 0;
    const imm = 0b00011;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm << 7) |
        (rt << 12) |
        (rn << 16) |
        (1 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);

    // Post-indexing (P=0), memory access at base (U=1 → add offset for write-back)
    expect(mockMemory.readWord).toBeCalledTimes(1);
    expect(mockMemory.readWord.mock.calls[0][0]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE),
    );

    // Two writes: destination register + write-back to base register (base + imm)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      DEFAULT_MEMORY_VALUE,
    ]);

    // it read rm before going to ALU, which in this case is DEFAULT_REGISTER_VALUE
    expect(mockALU.mov.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      imm,
      shiftType,
    ]);

    // ALU always return DEFAULT_ALU_RETURN so the shift will return an offset of DEFAULT_ALU_RETURN.
    // the final address is [Rn] + offset = DEFAULT_REGISTER_VALUE + DEFAULT_ALU_RETURN
    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE + DEFAULT_ALU_RETURN.view.getUint32(0)),
    ]);
  });

  it("should handle LDR with B=1", () => {
    const R = 0;
    const P = 0;
    const U = 1;
    const W = 1;
    const rn = 0x2;
    const rt = 0x4;
    const imm = 0b00011;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (1 << 20) |
        (W << 21) |
        (1 << 22) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    // Post-indexing (P=0), memory access at base (U=1 → add offset for write-back)
    expect(mockMemory.readBuffer).toBeCalledTimes(1);
    expect(mockMemory.readBuffer.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      1,
    ]);

    // Two writes: destination register + write-back to base register (base + imm)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      new Word(new Uint8Array(DEFAULT_MEMORY_BUFFER)[0]),
    ]);
    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE + imm),
    ]);
  });
});

describe("Test STORE instruction", () => {
  //Condition is always 1110 for simplicity
  it("should handle STR with R=0, P=0, U=0, W=0", () => {
    const R = 0;
    const P = 0;
    const U = 0;
    const W = 0;
    const rn = 0x1;
    const rt = 0x3;
    const imm = 0x004;
    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (0 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);

    // STR reads from both base (rn) and source (rt)
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt);

    // Post-indexing (P=0) → memory access at base
    expect(mockMemory.writeWord).toBeCalledTimes(1);
    expect(mockMemory.writeWord.mock.calls[0][0]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE),
    );
    expect(mockMemory.writeWord.mock.calls[0][1]).toStrictEqual(
      new Word(DEFAULT_REGISTER_VALUE),
    );

    // Two writes since post-index (P=0) triggers write-back (base - imm)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE - imm),
    ]);
  });

  it("should handle STR with R=0, P=1, U=0, W=0", () => {
    const R = 0;
    const P = 1;
    const U = 0;
    const W = 0;
    const rn = 0x2;
    const rt = 0x5;
    const imm = 0x004;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (0 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);

    // STR reads from both base (rn) and source (rt)
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt);

    // Verify memory write at base - imm
    expect(mockMemory.writeWord).toBeCalledTimes(1);
    expect(mockMemory.writeWord.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE - imm),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    // Only 1 write: destination register (no write-back)
    expect(mockRegisterFile.writeRegister).not.toBeCalled();
  });

  it("should handle STR with R=0, P=0, U=1, W=0", () => {
    const R = 0;
    const P = 0;
    const U = 1;
    const W = 0;
    const rn = 0x2;
    const rt = 0x4;
    const imm = 0x008;

    // cond=0xE (AL)
    // P=0, U=1, W=0, L=1 → 0b0011 << 20
    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (0 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);

    // STR reads from both base (rn) and source (rt)
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt);

    // Memory write occurs at base (post-index), so address = DEFAULT_REGISTER_VALUE
    expect(mockMemory.writeWord).toBeCalledTimes(1);
    expect(mockMemory.writeWord.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    // Write destination register
    // 2 calls because post-index (P=0) triggers write-back: base + imm
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE + imm),
    ]);
  });

  it("should handle STR with R=0, P=1, U=1, W=0", () => {
    const R = 0;
    const P = 1;
    const U = 1;
    const W = 0;
    const rn = 0x3;
    const rt = 0x5;
    const imm = 0x010;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (0 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);

    // STR reads from both base (rn) and source (rt)
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt);

    // P = 1 => post-index
    expect(mockMemory.writeWord).toBeCalledTimes(1);
    expect(mockMemory.writeWord.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE + imm),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).not.toBeCalled();
  });

  it("should handle STR with R=0, P=0, U=0, W=1", () => {
    const R = 0;
    const P = 0;
    const U = 0;
    const W = 1;
    const rn = 0x2;
    const rt = 0x4;
    const imm = 0x008;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (0 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);

    // STR reads from both base (rn) and source (rt)
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt);

    // Post-indexing (P=0), memory access at base - imm (U=0)
    expect(mockMemory.writeWord).toBeCalledTimes(1);
    expect(mockMemory.writeWord.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    // Write-back to base register (W=1)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE - imm),
    ]);
  });

  it("should handle STR with R=0, P=1, U=0, W=1", () => {
    const R = 0;
    const P = 1;
    const U = 0;
    const W = 1;
    const rn = 0x3;
    const rt = 0x5;
    const imm = 0x010;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (0 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    // STR reads from both base (rn) and source (rt)
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt);

    // Pre-indexing (P=1), memory access at base - imm (U=0)
    expect(mockMemory.writeWord).toBeCalledTimes(1);
    expect(mockMemory.writeWord.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE - imm),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    // Write-back to base register (W=1)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE - imm),
    ]);
  });

  it("should handle STR with R=0, P=0, U=1, W=1", () => {
    const R = 0;
    const P = 0;
    const U = 1;
    const W = 1;
    const rn = 0x2;
    const rt = 0x4;
    const imm = 0x008;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (0 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);

    // STR reads from both base (rn) and source (rt)
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt);

    // Post-indexing (P=0), memory access at base (U=1 → add offset for write-back)
    expect(mockMemory.writeWord).toBeCalledTimes(1);
    expect(mockMemory.writeWord.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    // Two writes: destination register + write-back to base register (base + imm)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE + imm),
    ]);
  });

  it("should handle STR with R=1", () => {
    const R = 1;
    const P = 1;
    const U = 0;
    const W = 1;
    const rn = 0x2;
    const rt = 0x4;
    const rm = 0x8;
    const shiftType = 0;
    const imm = 0b00011;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm << 7) |
        (rt << 12) |
        (rn << 16) |
        (0 << 20) |
        (W << 21) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt);

    // Post-indexing (P=0), memory access at base (U=0 → dec offset for write-back)
    expect(mockMemory.writeWord).toBeCalledTimes(1);
    expect(mockMemory.writeWord.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE - DEFAULT_ALU_RETURN.view.getUint32(0)),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    // write-back to base register (base + imm)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);

    // it read rm before going to ALU, which in this case is DEFAULT_REGISTER_VALUE
    expect(mockALU.mov.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      imm,
      shiftType,
    ]);

    // ALU always return DEFAULT_ALU_RETURN so the shift will return an offset of DEFAULT_ALU_RETURN.
    // the final address is [Rn] + offset = DEFAULT_REGISTER_VALUE + DEFAULT_ALU_RETURN
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE - DEFAULT_ALU_RETURN.view.getUint32(0)),
    ]);
  });

  it("should handle STR with B=1", () => {
    const R = 0;
    const P = 0;
    const U = 1;
    const W = 1;
    const rn = 0x2;
    const rt = 0x4;
    const imm = 0b00011;

    const instruction = new Word(
      imm |
        (rt << 12) |
        (rn << 16) |
        (0 << 20) |
        (W << 21) |
        (1 << 22) |
        (U << 23) |
        (P << 24) |
        (R << 25) |
        (1 << 26) |
        (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalledTimes(1);

    // STR reads from both base (rn) and source (rt)
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt);

    // Post-indexing (P=0), memory access at base (U=1 → add offset for write-back)
    expect(mockMemory.writeBuffer).toBeCalledTimes(1);
    expect(mockMemory.writeBuffer.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Uint8Array([DEFAULT_REGISTER_VALUE & 0xff]).buffer,
    ]);

    //write-back to base register (base + imm)
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(DEFAULT_REGISTER_VALUE + imm),
    ]);
  });
});

describe("Branch", () => {
  it("Branch B", () => {
    const imm = 0xff00ff;
    const instruction = new Word(imm | (0b1010 << 24) | (0xe << 28));

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(15);

    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      15,
      new Word(new Word(0xfffc03fc).view.getInt32(0) + DEFAULT_REGISTER_VALUE),
    ]);
  });

  it("Branch BL", () => {
    // offset = 0x000003FC
    const imm = 0x0000ff;
    const instruction = new Word(imm | (0b1011 << 24) | (0xe << 28));

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(15);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);

    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      14,
      new Word(4 + DEFAULT_REGISTER_VALUE),
    ]);
    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      15,
      new Word(new Word(0x000003fc).view.getInt32(0) + DEFAULT_REGISTER_VALUE),
    ]);
  });
});

describe("Block Load", () => {
  it("LDMA with W = 0", () => {
    const W = 0;
    const rn = 10;
    const registerList = [0, 3, 4, 6, 7];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockLoad.LDMDA << 22) |
      (W << 21) |
      (1 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE - registerList.length * 4 + 4;
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(registerList.length);
    for (let i = 0; i < registerList.length; i++) {
      expect(mockMemory.readWord.mock.calls[i]).toStrictEqual([
        new Word(address),
      ]);
      expect(mockRegisterFile.writeRegister.mock.calls[i]).toStrictEqual([
        registerList[i],
        DEFAULT_MEMORY_VALUE,
      ]);
      address += 4;
    }
  });

  it("LDMA with W = 1", () => {
    const W = 1;
    const rn = 10;
    const registerList = [0, 3, 4, 6, 7];

    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockLoad.LDMDA << 22) |
      (W << 21) |
      (1 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE - registerList.length * 4 + 4;

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(
      registerList.length + 1,
    );
    for (let i = 0; i < registerList.length; i++) {
      expect(mockMemory.readWord.mock.calls[i]).toStrictEqual([
        new Word(address),
      ]);
      expect(mockRegisterFile.writeRegister.mock.calls[i]).toStrictEqual([
        registerList[i],
        DEFAULT_MEMORY_VALUE,
      ]);
      address += 4;
    }

    const writeBackAddress = DEFAULT_REGISTER_VALUE - 4 * registerList.length;
    expect(
      mockRegisterFile.writeRegister.mock.calls[registerList.length],
    ).toStrictEqual([rn, new Word(writeBackAddress)]);
  });

  it("LDM with W = 0", () => {
    const W = 0;
    const rn = 10;
    const registerList = [0, 3, 4, 6, 7];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockLoad.LDM << 22) |
      (W << 21) |
      (1 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE;
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(registerList.length);
    for (let i = 0; i < registerList.length; i++) {
      expect(mockMemory.readWord.mock.calls[i]).toStrictEqual([
        new Word(address),
      ]);
      expect(mockRegisterFile.writeRegister.mock.calls[i]).toStrictEqual([
        registerList[i],
        DEFAULT_MEMORY_VALUE,
      ]);
      address += 4;
    }
  });

  it("LDM with W = 1", () => {
    const W = 1;
    const rn = 10;
    const registerList = [0, 3, 4, 6, 7];

    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockLoad.LDM << 22) |
      (W << 21) |
      (1 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE;

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(
      registerList.length + 1,
    );
    for (let i = 0; i < registerList.length; i++) {
      expect(mockMemory.readWord.mock.calls[i]).toStrictEqual([
        new Word(address),
      ]);
      expect(mockRegisterFile.writeRegister.mock.calls[i]).toStrictEqual([
        registerList[i],
        DEFAULT_MEMORY_VALUE,
      ]);
      address += 4;
    }

    const writeBackAddress = DEFAULT_REGISTER_VALUE + 4 * registerList.length;
    expect(
      mockRegisterFile.writeRegister.mock.calls[registerList.length],
    ).toStrictEqual([rn, new Word(writeBackAddress)]);
  });

  it("LDMDB with W = 0", () => {
    const W = 0;
    const rn = 10;
    const registerList = [0, 3, 4, 6, 7];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockLoad.LDMDB << 22) |
      (W << 21) |
      (1 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE - registerList.length * 4;
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(registerList.length);
    for (let i = 0; i < registerList.length; i++) {
      expect(mockMemory.readWord.mock.calls[i]).toStrictEqual([
        new Word(address),
      ]);
      expect(mockRegisterFile.writeRegister.mock.calls[i]).toStrictEqual([
        registerList[i],
        DEFAULT_MEMORY_VALUE,
      ]);
      address += 4;
    }
  });

  it("LDMDB with W = 1", () => {
    const W = 1;
    const rn = 10;
    const registerList = [0, 3, 4, 6, 7];

    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockLoad.LDMDB << 22) |
      (W << 21) |
      (1 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE - registerList.length * 4;

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(
      registerList.length + 1,
    );
    for (let i = 0; i < registerList.length; i++) {
      expect(mockMemory.readWord.mock.calls[i]).toStrictEqual([
        new Word(address),
      ]);
      expect(mockRegisterFile.writeRegister.mock.calls[i]).toStrictEqual([
        registerList[i],
        DEFAULT_MEMORY_VALUE,
      ]);
      address += 4;
    }

    const writeBackAddress = DEFAULT_REGISTER_VALUE - registerList.length * 4;
    expect(
      mockRegisterFile.writeRegister.mock.calls[registerList.length],
    ).toStrictEqual([rn, new Word(writeBackAddress)]);
  });

  it("LDMIB with W = 0", () => {
    const W = 0;
    const rn = 10;
    const registerList = [0, 3, 4, 6, 7];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockLoad.LDMIB << 22) |
      (W << 21) |
      (1 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE + 4;
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(registerList.length);
    for (let i = 0; i < registerList.length; i++) {
      expect(mockMemory.readWord.mock.calls[i]).toStrictEqual([
        new Word(address),
      ]);
      expect(mockRegisterFile.writeRegister.mock.calls[i]).toStrictEqual([
        registerList[i],
        DEFAULT_MEMORY_VALUE,
      ]);
      address += 4;
    }
  });

  it("LDMIB with W = 1", () => {
    const W = 1;
    const rn = 10;
    const registerList = [0, 3, 4, 6, 7];

    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockLoad.LDMIB << 22) |
      (W << 21) |
      (1 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE + 4;

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(
      registerList.length + 1,
    );
    for (let i = 0; i < registerList.length; i++) {
      expect(mockMemory.readWord.mock.calls[i]).toStrictEqual([
        new Word(address),
      ]);
      expect(mockRegisterFile.writeRegister.mock.calls[i]).toStrictEqual([
        registerList[i],
        DEFAULT_MEMORY_VALUE,
      ]);
      address += 4;
    }

    const writeBackAddress = DEFAULT_REGISTER_VALUE + registerList.length * 4;
    expect(
      mockRegisterFile.writeRegister.mock.calls[registerList.length],
    ).toStrictEqual([rn, new Word(writeBackAddress)]);
  });
});

describe("Block Store", () => {
  it("STMDA with W = 0", () => {
    const W = 0;
    const rn = 10;
    const registerList = [0, 1, 5, 11, 13];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockStore.STMDA << 22) |
      (W << 21) |
      (0 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE - registerList.length * 4 + 4;

    // + 1 when checking the next read to account for the first rn read
    for (let i = 0; i < registerList.length; i++) {
      expect(mockRegisterFile.readRegister.mock.calls[i + 1]).toStrictEqual([
        registerList[i],
      ]);
      expect(mockMemory.writeWord.mock.calls[i]).toStrictEqual([
        new Word(address),
        new Word(DEFAULT_REGISTER_VALUE),
      ]);
      address += 4;
    }

    expect(mockRegisterFile.writeRegister).not.toBeCalled();
  });

  it("STMDA with W = 1", () => {
    const W = 1;
    const rn = 10;

    // For easy verification, these
    const registerList = [0, 1, 5, 11, 13];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockStore.STMDA << 22) |
      (W << 21) |
      (0 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE - registerList.length * 4 + 4;

    // + 1 when checking the next read to account for the first rn read
    for (let i = 0; i < registerList.length; i++) {
      expect(mockRegisterFile.readRegister.mock.calls[i + 1]).toStrictEqual([
        registerList[i],
      ]);
      expect(mockMemory.writeWord.mock.calls[i]).toStrictEqual([
        new Word(address),
        new Word(DEFAULT_REGISTER_VALUE),
      ]);
      address += 4;
    }

    const writeBackAddress = DEFAULT_REGISTER_VALUE - registerList.length * 4;
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(writeBackAddress),
    ]);
  });

  it("STM with W = 0", () => {
    const W = 0;
    const rn = 10;
    const registerList = [0, 1, 5, 11, 13];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockStore.STM << 22) |
      (W << 21) |
      (0 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE;
    // + 1 when checking the next read to account for the first rn read
    for (let i = 0; i < registerList.length; i++) {
      expect(mockRegisterFile.readRegister.mock.calls[i + 1]).toStrictEqual([
        registerList[i],
      ]);
      expect(mockMemory.writeWord.mock.calls[i]).toStrictEqual([
        new Word(address),
        new Word(DEFAULT_REGISTER_VALUE),
      ]);
      address += 4;
    }

    expect(mockRegisterFile.writeRegister).not.toBeCalled();
  });

  it("STM with W = 1", () => {
    const W = 1;
    const rn = 10;

    // For easy verification, these
    const registerList = [0, 1, 5, 11, 13];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockStore.STM << 22) |
      (W << 21) |
      (0 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE;

    // + 1 when checking the next read to account for the first rn read
    for (let i = 0; i < registerList.length; i++) {
      expect(mockRegisterFile.readRegister.mock.calls[i + 1]).toStrictEqual([
        registerList[i],
      ]);
      expect(mockMemory.writeWord.mock.calls[i]).toStrictEqual([
        new Word(address),
        new Word(DEFAULT_REGISTER_VALUE),
      ]);
      address += 4;
    }

    const writeBackAddress = DEFAULT_REGISTER_VALUE + registerList.length * 4;
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(writeBackAddress),
    ]);
  });

  it("STMDB with W = 0", () => {
    const W = 0;
    const rn = 10;
    const registerList = [0, 1, 5, 11, 13];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockStore.STMDB << 22) |
      (W << 21) |
      (0 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE - registerList.length * 4;
    // + 1 when checking the next read to account for the first rn read
    for (let i = 0; i < registerList.length; i++) {
      expect(mockRegisterFile.readRegister.mock.calls[i + 1]).toStrictEqual([
        registerList[i],
      ]);
      expect(mockMemory.writeWord.mock.calls[i]).toStrictEqual([
        new Word(address),
        new Word(DEFAULT_REGISTER_VALUE),
      ]);
      address += 4;
    }

    expect(mockRegisterFile.writeRegister).not.toBeCalled();
  });

  it("STMDB with W = 1", () => {
    const W = 1;
    const rn = 10;

    // For easy verification, these
    const registerList = [0, 1, 5, 11, 13];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockStore.STMDB << 22) |
      (W << 21) |
      (0 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE - registerList.length * 4;

    // + 1 when checking the next read to account for the first rn read
    for (let i = 0; i < registerList.length; i++) {
      expect(mockRegisterFile.readRegister.mock.calls[i + 1]).toStrictEqual([
        registerList[i],
      ]);
      expect(mockMemory.writeWord.mock.calls[i]).toStrictEqual([
        new Word(address),
        new Word(DEFAULT_REGISTER_VALUE),
      ]);
      address += 4;
    }

    const writeBackAddress = DEFAULT_REGISTER_VALUE - registerList.length * 4;
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(writeBackAddress),
    ]);
  });

  it("STMIB with W = 0", () => {
    const W = 0;
    const rn = 10;
    const registerList = [0, 1, 5, 11, 13];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockStore.STMIB << 22) |
      (W << 21) |
      (0 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE + 4;
    // + 1 when checking the next read to account for the first rn read
    for (let i = 0; i < registerList.length; i++) {
      expect(mockRegisterFile.readRegister.mock.calls[i + 1]).toStrictEqual([
        registerList[i],
      ]);
      expect(mockMemory.writeWord.mock.calls[i]).toStrictEqual([
        new Word(address),
        new Word(DEFAULT_REGISTER_VALUE),
      ]);
      address += 4;
    }

    expect(mockRegisterFile.writeRegister).not.toBeCalled();
  });

  it("STMIB with W = 1", () => {
    const W = 1;
    const rn = 10;

    // For easy verification, these
    const registerList = [0, 1, 5, 11, 13];
    const instructionBase =
      (0xe << 28) |
      (0b10 << 26) |
      (BlockStore.STMIB << 22) |
      (W << 21) |
      (0 << 20) |
      (rn << 16);
    const instruction = new Word(
      registerList.reduce((a, b) => {
        return a | (1 << b);
      }, instructionBase),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    let address = DEFAULT_REGISTER_VALUE + 4;

    // + 1 when checking the next read to account for the first rn read
    for (let i = 0; i < registerList.length; i++) {
      expect(mockRegisterFile.readRegister.mock.calls[i + 1]).toStrictEqual([
        registerList[i],
      ]);
      expect(mockMemory.writeWord.mock.calls[i]).toStrictEqual([
        new Word(address),
        new Word(DEFAULT_REGISTER_VALUE),
      ]);
      address += 4;
    }

    const writeBackAddress = DEFAULT_REGISTER_VALUE + registerList.length * 4;
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rn,
      new Word(writeBackAddress),
    ]);
  });
});

describe("Miscellaneous", () => {
  it("BX", () => {
    const rm = 0x5;
    const instruction = new Word(
      rm | (0b0001 << 4) | (0xfff << 8) | (0b00010010 << 20) | (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      15,
      new Word(DEFAULT_REGISTER_VALUE),
    ]);
  });

  it("BLX", () => {
    const rm = 0x5;
    const instruction = new Word(
      rm | (0b0011 << 4) | (0xfff << 8) | (0b00010010 << 20) | (0xe << 28),
    );

    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(15);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      14,
      new Word(DEFAULT_REGISTER_VALUE + 4),
    ]);
    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      15,
      new Word(DEFAULT_REGISTER_VALUE),
    ]);
  });
});

describe("Swap", () => {
  it("SWP", () => {
    const rt = 0x1;
    const rt2 = 0x3;
    const rn = 0x6;
    const instruction = new Word(
      rt2 |
        (0b1001 << 4) |
        (rt << 12) |
        (rn << 16) |
        (0b0001 << 24) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt2);

    expect(mockMemory.readWord).toBeCalledTimes(1);
    // read from memory first
    expect(mockMemory.readWord.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockMemory.writeWord).toBeCalledTimes(1);
    // Write rt into memory
    expect(mockMemory.writeWord.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      DEFAULT_MEMORY_VALUE,
    ]);
  });

  it("SWPB", () => {
    const rt = 0x1;
    const rt2 = 0x1;
    const rn = 0x6;
    const instruction = new Word(
      rt2 |
        (0b1001 << 4) |
        (rt << 12) |
        (rn << 16) |
        (1 << 22) |
        (0b0001 << 24) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rt2);

    expect(mockMemory.readBuffer).toBeCalledTimes(1);

    // read from memory first
    expect(mockMemory.readBuffer.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      1,
    ]);

    expect(mockMemory.writeBuffer).toBeCalledTimes(1);

    // Write rt into memory
    expect(mockMemory.writeBuffer.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Uint8Array([DEFAULT_REGISTER_VALUE & 0xff]).buffer,
    ]);

    // Use the DEFAULT Memory buffer instead because we are using the mock value return by readBuffer
    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rt,
      new Word(new DataView(DEFAULT_MEMORY_BUFFER).getUint8(0)),
    ]);
  });
});

describe("Data Processing Imm", () => {
  it("i_and with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.AND << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_and).toBeCalledTimes(1);
    expect(mockALU.i_and.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_and with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.AND << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_and).toBeCalledTimes(1);
    expect(mockALU.i_and.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_eor with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.EOR << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_eor).toBeCalledTimes(1);
    expect(mockALU.i_eor.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_eor with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.EOR << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_eor).toBeCalledTimes(1);
    expect(mockALU.i_eor.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_sub with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SUB << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_sub).toBeCalledTimes(1);
    expect(mockALU.i_sub.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_sub with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SUB << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_sub).toBeCalledTimes(1);
    expect(mockALU.i_sub.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("adr with with add = false", () => {
    const S = 0;
    const rn = 0xf;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SUB << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.adr).toBeCalledTimes(1);
    expect(mockALU.adr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
      false,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_rsb with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSB << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_rsb).toBeCalledTimes(1);
    expect(mockALU.i_rsb.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_rsb with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSB << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_rsb).toBeCalledTimes(1);
    expect(mockALU.i_rsb.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_add with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADD << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_add).toBeCalledTimes(1);
    expect(mockALU.i_add.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_add with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADD << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_add).toBeCalledTimes(1);
    expect(mockALU.i_add.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("adr with with add = true", () => {
    const S = 0;
    const rn = 0xf;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADD << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.adr).toBeCalledTimes(1);
    expect(mockALU.adr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
      true,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_adc with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADC << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_adc).toBeCalledTimes(1);
    expect(mockALU.i_adc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_adc with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADC << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_adc).toBeCalledTimes(1);
    expect(mockALU.i_adc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_sbc with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SBC << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_sbc).toBeCalledTimes(1);
    expect(mockALU.i_sbc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_sbc with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SBC << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_sbc).toBeCalledTimes(1);
    expect(mockALU.i_sbc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_rsc with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSC << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_rsc).toBeCalledTimes(1);
    expect(mockALU.i_rsc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_rsc with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSC << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_rsc).toBeCalledTimes(1);
    expect(mockALU.i_rsc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("TST with imm", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.TST << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_and).toBeCalledTimes(1);
    expect(mockALU.i_and.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).not.toBeCalled();

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("TEQ with imm", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.TEQ << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_eor).toBeCalledTimes(1);
    expect(mockALU.i_eor.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).not.toBeCalled();

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("CMP with imm", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.CMP << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_sub).toBeCalledTimes(1);
    expect(mockALU.i_sub.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).not.toBeCalled();

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("CMN with imm", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.CMN << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_add).toBeCalledTimes(1);
    expect(mockALU.i_add.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).not.toBeCalled();

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_orr with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ORR << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_orr).toBeCalledTimes(1);
    expect(mockALU.i_orr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_orr with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ORR << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_orr).toBeCalledTimes(1);
    expect(mockALU.i_orr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_mov with S = 0", () => {
    const S = 0;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MOV << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockALU.i_mov).toBeCalledTimes(1);
    expect(mockALU.i_mov.mock.calls[0]).toStrictEqual([new Imm12(imm)]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_mov with S = 1", () => {
    const S = 1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MOV << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockALU.i_mov).toBeCalledTimes(1);
    expect(mockALU.i_mov.mock.calls[0]).toStrictEqual([new Imm12(imm)]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_orr with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ORR << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_orr).toBeCalledTimes(1);
    expect(mockALU.i_orr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_orr with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ORR << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_orr).toBeCalledTimes(1);
    expect(mockALU.i_orr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_bic with S = 0", () => {
    const S = 0;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.BIC << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_bic).toBeCalledTimes(1);
    expect(mockALU.i_bic.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_bic with S = 1", () => {
    const S = 1;
    const rn = 0x1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.BIC << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.i_bic).toBeCalledTimes(1);
    expect(mockALU.i_bic.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Imm12(imm),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("i_mvn with S = 0", () => {
    const S = 0;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MVN << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockALU.i_mvn).toBeCalledTimes(1);
    expect(mockALU.i_mvn.mock.calls[0]).toStrictEqual([new Imm12(imm)]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("i_mvn with S = 1", () => {
    const S = 1;
    const rd = 0x5;
    const imm = 0x2ff;
    const instruction = new Word(
      imm |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MVN << 21) |
        (1 << 25) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockALU.i_mvn).toBeCalledTimes(1);
    expect(mockALU.i_mvn.mock.calls[0]).toStrictEqual([new Imm12(imm)]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });
});

describe("Data Processing register shift imm", () => {
  it("and Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.AND << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.and).toBeCalledTimes(1);
    expect(mockALU.and.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("and Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.AND << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.and).toBeCalledTimes(1);
    expect(mockALU.and.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("eor Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.LSL;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.EOR << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.eor).toBeCalledTimes(1);
    expect(mockALU.eor.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("eor Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.EOR << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.eor).toBeCalledTimes(1);
    expect(mockALU.eor.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("sub Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SUB << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.sub).toBeCalledTimes(1);
    expect(mockALU.sub.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("sub Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SUB << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.sub).toBeCalledTimes(1);
    expect(mockALU.sub.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("rsb Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.LSR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSB << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.rsb).toBeCalledTimes(1);
    expect(mockALU.rsb.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("rsb Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSB << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.rsb).toBeCalledTimes(1);
    expect(mockALU.rsb.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("add Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADD << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.add).toBeCalledTimes(1);
    expect(mockALU.add.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("add Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADD << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.add).toBeCalledTimes(1);
    expect(mockALU.add.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("adc Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.adc).toBeCalledTimes(1);
    expect(mockALU.adc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("adc Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10111;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.adc).toBeCalledTimes(1);
    expect(mockALU.adc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("sbc Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10011;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SBC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.sbc).toBeCalledTimes(1);
    expect(mockALU.sbc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("sbc Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SBC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.sbc).toBeCalledTimes(1);
    expect(mockALU.sbc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("rsc Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10011;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.rsc).toBeCalledTimes(1);
    expect(mockALU.rsc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("rsc Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.rsc).toBeCalledTimes(1);
    expect(mockALU.rsc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("TST Register shift imm", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.TST << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.and).toBeCalledTimes(1);
    expect(mockALU.and.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("TEQ Register shift imm", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.TEQ << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.eor).toBeCalledTimes(1);
    expect(mockALU.eor.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("CMP Register shift imm", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.CMP << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.sub).toBeCalledTimes(1);
    expect(mockALU.sub.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("CMN Register shift imm", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.CMN << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.add).toBeCalledTimes(1);
    expect(mockALU.add.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("orr Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10011;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ORR << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.orr).toBeCalledTimes(1);
    expect(mockALU.orr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("orr Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ORR << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.orr).toBeCalledTimes(1);
    expect(mockALU.orr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("mov Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MOV << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);

    expect(mockALU.mov).toBeCalledTimes(1);
    expect(mockALU.mov.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("mov Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MOV << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);

    expect(mockALU.mov).toBeCalledTimes(1);
    expect(mockALU.mov.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("bic Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10011;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.BIC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.bic).toBeCalledTimes(1);
    expect(mockALU.bic.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("bic Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.BIC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.bic).toBeCalledTimes(1);
    expect(mockALU.bic.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("mvn Register shift imm, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const S = 0;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MVN << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);

    expect(mockALU.mvn).toBeCalledTimes(1);
    expect(mockALU.mvn.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("mvn Register shift imm, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ROR;
    const imm5 = 0b10100;
    const rd = 0x2;
    const S = 1;

    const instruction = new Word(
      rm |
        (shiftType << 5) |
        (imm5 << 7) |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MVN << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);

    expect(mockALU.mvn).toBeCalledTimes(1);
    expect(mockALU.mvn.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      imm5,
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });
});

describe("Data Processing register shift register", () => {
  it("and Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.AND << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.and).toBeCalledTimes(1);
    expect(mockALU.and.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("and Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.AND << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.and).toBeCalledTimes(1);
    expect(mockALU.and.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("eor Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.EOR << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.eor).toBeCalledTimes(1);
    expect(mockALU.eor.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("eor Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.EOR << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.eor).toBeCalledTimes(1);
    expect(mockALU.eor.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("sub Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SUB << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.sub).toBeCalledTimes(1);
    expect(mockALU.sub.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("sub Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SUB << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.sub).toBeCalledTimes(1);
    expect(mockALU.sub.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("rsb Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSB << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.rsb).toBeCalledTimes(1);
    expect(mockALU.rsb.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("rsb Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSB << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.rsb).toBeCalledTimes(1);
    expect(mockALU.rsb.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("add Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADD << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.add).toBeCalledTimes(1);
    expect(mockALU.add.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("add Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADD << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.add).toBeCalledTimes(1);
    expect(mockALU.add.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("adc Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.adc).toBeCalledTimes(1);
    expect(mockALU.adc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("adc Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ADC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.adc).toBeCalledTimes(1);
    expect(mockALU.adc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("sbc Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SBC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.sbc).toBeCalledTimes(1);
    expect(mockALU.sbc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("sbc Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.SBC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.sbc).toBeCalledTimes(1);
    expect(mockALU.sbc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("rsc Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.rsc).toBeCalledTimes(1);
    expect(mockALU.rsc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("rsc Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.RSC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.rsc).toBeCalledTimes(1);
    expect(mockALU.rsc.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("tst Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.TST << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.and).toBeCalledTimes(1);
    expect(mockALU.and.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("teq Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.TEQ << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.eor).toBeCalledTimes(1);
    expect(mockALU.eor.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("cmp Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.CMP << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.sub).toBeCalledTimes(1);
    expect(mockALU.sub.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("cmn Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.CMN << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.add).toBeCalledTimes(1);
    expect(mockALU.add.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("orr Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ORR << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.orr).toBeCalledTimes(1);
    expect(mockALU.orr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("orr Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.ORR << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.orr).toBeCalledTimes(1);
    expect(mockALU.orr.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("mov Register shift reg, S = 0", () => {
    const rn = 0x1;
    const shiftType = ShiftType.ASR;
    const rm = 0x4;
    const rd = 0x2;
    const S = 0;

    const instruction = new Word(
      rn |
        (1 << 4) |
        (shiftType << 5) |
        (rm << 8) |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MOV << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.mov).toBeCalledTimes(1);
    expect(mockALU.mov.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("mov Register shift reg, S = 1", () => {
    const rn = 0x1;
    const shiftType = ShiftType.ASR;
    const rm = 0x4;
    const rd = 0x2;
    const S = 1;

    const instruction = new Word(
      rn |
        (1 << 4) |
        (shiftType << 5) |
        (rm << 8) |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MOV << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.mov).toBeCalledTimes(1);
    expect(mockALU.mov.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("bic Register shift reg, S = 0", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 0;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.BIC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.bic).toBeCalledTimes(1);
    expect(mockALU.bic.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("bic Register shift reg, S = 1", () => {
    const rm = 0x1;
    const shiftType = ShiftType.ASR;
    const rs = 0x4;
    const rd = 0x2;
    const rn = 0x3;
    const S = 1;

    const instruction = new Word(
      rm |
        (1 << 4) |
        (shiftType << 5) |
        (rs << 8) |
        (rd << 12) |
        (rn << 16) |
        (S << 20) |
        (DataProcessing.BIC << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rs);

    expect(mockALU.bic).toBeCalledTimes(1);
    expect(mockALU.bic.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("mvn Register shift reg, S = 0", () => {
    const rn = 0x1;
    const shiftType = ShiftType.ASR;
    const rm = 0x4;
    const rd = 0x2;
    const S = 0;

    const instruction = new Word(
      rn |
        (1 << 4) |
        (shiftType << 5) |
        (rm << 8) |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MVN << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    // It receive a Word because it is reg shift reg.
    // reg shift imm receive a number, not a Word
    expect(mockALU.mvn).toBeCalledTimes(1);
    expect(mockALU.mvn.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);
  });

  it("mvn Register shift reg, S = 1", () => {
    const rn = 0x1;
    const shiftType = ShiftType.ASR;
    const rm = 0x4;
    const rd = 0x2;
    const S = 1;

    const instruction = new Word(
      rn |
        (1 << 4) |
        (shiftType << 5) |
        (rm << 8) |
        (rd << 12) |
        (S << 20) |
        (DataProcessing.MVN << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);
    expect(mockRegisterFile.readCPSR).toBeCalled();

    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.mvn).toBeCalledTimes(1);
    expect(mockALU.mvn.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      shiftType,
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });
});

describe("Multiply and Accumulate", () => {
  it("mul with S = 0", () => {
    const rm = 0x6;
    const rd = 0xa;
    const rn = 0x1;
    const S = 0;

    const instruction = new Word(
      rm |
        (0b1001 << 4) |
        (rn << 8) |
        (rd << 16) |
        (S << 20) |
        (MultiplyAcc.MUL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.mul).toBeCalledTimes(1);
    expect(mockALU.mul.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("mul with S = 1", () => {
    const rm = 0x6;
    const rd = 0xa;
    const rn = 0x1;
    const S = 1;

    const instruction = new Word(
      rm |
        (0b1001 << 4) |
        (rn << 8) |
        (rd << 16) |
        (S << 20) |
        (MultiplyAcc.MUL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.mul).toBeCalledTimes(1);
    expect(mockALU.mul.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("mla with S = 0", () => {
    const rm = 0x6;
    const rd = 0xa;
    const ra = 0x2;
    const rn = 0x1;
    const S = 0;

    const instruction = new Word(
      rm |
        (0b1001 << 4) |
        (rn << 8) |
        (ra << 12) |
        (rd << 16) |
        (S << 20) |
        (MultiplyAcc.MLA << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(ra);

    expect(mockALU.mla).toBeCalledTimes(1);
    expect(mockALU.mla.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("mla with S = 1", () => {
    const rm = 0x6;
    const rd = 0xa;
    const ra = 0x3;
    const rn = 0x1;
    const S = 1;

    const instruction = new Word(
      rm |
        (0b1001 << 4) |
        (rn << 8) |
        (ra << 12) |
        (rd << 16) |
        (S << 20) |
        (MultiplyAcc.MLA << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.mla).toBeCalledTimes(1);
    expect(mockALU.mla.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("umaal (there is no flag write back)", () => {
    const rm = 0x6;
    const rdHi = 0xa;
    const rdLo = 0x2;
    const rn = 0x1;
    const S = 0;

    const instruction = new Word(
      rn |
        (0b1001 << 4) |
        (rm << 8) |
        (rdLo << 12) |
        (rdHi << 16) |
        (S << 20) |
        (MultiplyAcc.UMAAL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rdHi);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rdLo);

    expect(mockALU.umaal).toBeCalledTimes(1);
    expect(mockALU.umaal.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rdHi,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rdLo,
      DEFAULT_ALU_RETURN,
    ]);
    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("mls (there is no flag write back)", () => {
    const rm = 0x6;
    const rd = 0xa;
    const ra = 0x2;
    const rn = 0x1;
    const S = 0;

    const instruction = new Word(
      rm |
        (0b1001 << 4) |
        (rn << 8) |
        (ra << 12) |
        (rd << 16) |
        (S << 20) |
        (MultiplyAcc.MLS << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(ra);

    expect(mockALU.mls).toBeCalledTimes(1);
    expect(mockALU.mls.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("umull with S = 0", () => {
    const rm = 0x6;
    const rdHi = 0xa;
    const rdLo = 0x2;
    const rn = 0x1;
    const S = 0;

    const instruction = new Word(
      rn |
        (0b1001 << 4) |
        (rm << 8) |
        (rdLo << 12) |
        (rdHi << 16) |
        (S << 20) |
        (MultiplyAcc.UMULL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.umull).toBeCalledTimes(1);
    expect(mockALU.umull.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rdHi,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rdLo,
      DEFAULT_ALU_RETURN,
    ]);
    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("umull with S = 1", () => {
    const rm = 0x6;
    const rdHi = 0xa;
    const rdLo = 0x2;
    const rn = 0x1;
    const S = 1;

    const instruction = new Word(
      rn |
        (0b1001 << 4) |
        (rm << 8) |
        (rdLo << 12) |
        (rdHi << 16) |
        (S << 20) |
        (MultiplyAcc.UMULL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.umull).toBeCalledTimes(1);
    expect(mockALU.umull.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rdHi,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rdLo,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("umlal S = 0", () => {
    const rm = 0x6;
    const rdHi = 0xa;
    const rdLo = 0x2;
    const rn = 0x1;
    const S = 0;

    const instruction = new Word(
      rn |
        (0b1001 << 4) |
        (rm << 8) |
        (rdLo << 12) |
        (rdHi << 16) |
        (S << 20) |
        (MultiplyAcc.UMLAL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rdHi);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rdLo);

    expect(mockALU.umlal).toBeCalledTimes(1);
    expect(mockALU.umlal.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rdHi,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rdLo,
      DEFAULT_ALU_RETURN,
    ]);
    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("umlal S = 1", () => {
    const rm = 0x6;
    const rdHi = 0xa;
    const rdLo = 0x2;
    const rn = 0x1;
    const S = 1;

    const instruction = new Word(
      rn |
        (0b1001 << 4) |
        (rm << 8) |
        (rdLo << 12) |
        (rdHi << 16) |
        (S << 20) |
        (MultiplyAcc.UMLAL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rdHi);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rdLo);

    expect(mockALU.umlal).toBeCalledTimes(1);
    expect(mockALU.umlal.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rdHi,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rdLo,
      DEFAULT_ALU_RETURN,
    ]);
    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("smull S = 0", () => {
    const rm = 0x6;
    const rdHi = 0xa;
    const rdLo = 0x2;
    const rn = 0x1;
    const S = 0;

    const instruction = new Word(
      rn |
        (0b1001 << 4) |
        (rm << 8) |
        (rdLo << 12) |
        (rdHi << 16) |
        (S << 20) |
        (MultiplyAcc.SMULL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.smull).toBeCalledTimes(1);
    expect(mockALU.smull.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rdHi,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rdLo,
      DEFAULT_ALU_RETURN,
    ]);
    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("smull S = 1", () => {
    const rm = 0x6;
    const rdHi = 0xa;
    const rdLo = 0x2;
    const rn = 0x1;
    const S = 1;

    const instruction = new Word(
      rn |
        (0b1001 << 4) |
        (rm << 8) |
        (rdLo << 12) |
        (rdHi << 16) |
        (S << 20) |
        (MultiplyAcc.SMULL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.smull).toBeCalledTimes(1);
    expect(mockALU.smull.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rdHi,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rdLo,
      DEFAULT_ALU_RETURN,
    ]);
    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });

  it("smlal S = 0", () => {
    const rm = 0x6;
    const rdHi = 0xa;
    const rdLo = 0x2;
    const rn = 0x1;
    const S = 0;

    const instruction = new Word(
      rn |
        (0b1001 << 4) |
        (rm << 8) |
        (rdLo << 12) |
        (rdHi << 16) |
        (S << 20) |
        (MultiplyAcc.SMLAL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.smlal).toBeCalledTimes(1);
    expect(mockALU.smlal.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rdHi,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rdLo,
      DEFAULT_ALU_RETURN,
    ]);
    expect(mockRegisterFile.writeCPSR).not.toBeCalled();
  });

  it("smlal S = 1", () => {
    const rm = 0x6;
    const rdHi = 0xa;
    const rdLo = 0x2;
    const rn = 0x1;
    const S = 1;

    const instruction = new Word(
      rn |
        (0b1001 << 4) |
        (rm << 8) |
        (rdLo << 12) |
        (rdHi << 16) |
        (S << 20) |
        (MultiplyAcc.SMLAL << 21) |
        (0xe << 28),
    );
    simulator.execInstruction(instruction);

    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rm);
    expect(mockRegisterFile.readRegister).toBeCalledWith(rn);

    expect(mockALU.smlal).toBeCalledTimes(1);
    expect(mockALU.smlal.mock.calls[0]).toStrictEqual([
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
      new Word(DEFAULT_REGISTER_VALUE),
    ]);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(2);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rdHi,
      DEFAULT_ALU_RETURN,
    ]);

    expect(mockRegisterFile.writeRegister.mock.calls[1]).toStrictEqual([
      rdLo,
      DEFAULT_ALU_RETURN,
    ]);
    expect(mockRegisterFile.writeCPSR).toBeCalledTimes(1);
    expect(mockRegisterFile.writeCPSR.mock.calls[0]).toStrictEqual([
      new Word(nzcvToNum(DEFAULT_ALU_FLAG) << 28),
    ]);
  });
});

describe("Halfword move", () => {
  it("MOVT", () => {
    const rd = 0x3;
    const imm4 = 0x4;
    const imm12 = 0x123;

    const instruction = new Word(
      imm12 | (rd << 12) | (imm4 << 16) | (1 << 22) | (0x3 << 24) | (0xe << 28),
    );
    simulator.execInstruction(instruction);

    const newValue =
      (DEFAULT_REGISTER_VALUE & 0xffff) | ((imm12 | (imm4 << 12)) << 16);
    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rd);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      new Word(newValue),
    ]);
  });

  it("MOVW", () => {
    const rd = 0x3;
    const imm4 = 0x4;
    const imm12 = 0x123;

    const instruction = new Word(
      imm12 | (rd << 12) | (imm4 << 16) | (0x3 << 24) | (0xe << 28),
    );
    simulator.execInstruction(instruction);

    const newValue =
      (DEFAULT_REGISTER_VALUE & 0xffff0000) | (imm12 | (imm4 << 12));
    expect(mockRegisterFile.readCPSR).toBeCalled();
    expect(mockRegisterFile.readRegister).toBeCalledWith(rd);

    expect(mockRegisterFile.writeRegister).toBeCalledTimes(1);
    expect(mockRegisterFile.writeRegister.mock.calls[0]).toStrictEqual([
      rd,
      new Word(newValue),
    ]);
  });
});
