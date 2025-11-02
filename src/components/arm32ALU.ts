import type { ArmALU } from "../interface/ALU";
import { toFlag, type Flag, type NZCV } from "../types/flags";
import { ShiftType } from "../types/shiftType";
import { Imm12, Word } from "../types/binType";
import { extractBits } from "../function/bitManip";

export class Arm32ALU implements ArmALU {
  nzcv: NZCV;

  constructor() {
    this.nzcv = { N: 0, Z: 0, C: 0, V: 0 };
  }

  //----------------------------------REG------------------------------------------
  and(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted, carry } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const result = rn.view.getUint32(0) & shifted.view.getUint32(0);
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  eor(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted, carry } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );

    const result = rn.view.getUint32(0) ^ shifted.view.getUint32(0);
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  sub(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const { result, carry, overflow } = this.addWithCarry(
      rn,
      new Word(~shifted.view.getUint32(0)),
      1,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  rsb(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const { result, carry, overflow } = this.addWithCarry(
      new Word(~rn.view.getUint32(0)),
      shifted,
      1,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  add(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const { result, carry, overflow } = this.addWithCarry(rn, shifted, 0);

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  adc(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const { result, carry, overflow } = this.addWithCarry(
      rn,
      shifted,
      this.nzcv.C,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  sbc(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const { result, carry, overflow } = this.addWithCarry(
      rn,
      new Word(~shifted.view.getUint32(0)),
      this.nzcv.C,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  rsc(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const { result, carry, overflow } = this.addWithCarry(
      new Word(~rn.view.getUint32(0)),
      shifted,
      this.nzcv.C,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  orr(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted, carry } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const result = rn.view.getUint32(0) | shifted.view.getUint32(0);

    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  bic(
    rn: Word,
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted, carry } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const result = rn.view.getUint32(0) & ~shifted.view.getUint32(0);
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  mvn(
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted, carry } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );
    const result = ~shifted.view.getUint32(0);
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  mov(
    rm: Word,
    shift: number | Word,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV } {
    const { shifted, carry } = this.shiftC(
      rm,
      shiftType,
      this.unpackShiftAmount(shift),
      this.nzcv.C,
    );

    return {
      result: shifted,
      nzcv: {
        N: this.isNegative(shifted.view.getUint32(0)),
        Z: this.isZero(shifted.view.getUint32(0)),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  //----------------------------------REG------------------------------------------

  //----------------------------------IMM------------------------------------------

  i_and(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32, carry } = this.processImm12(imm12, this.nzcv.C);
    const result = rn.view.getUint32(0) & imm32.view.getUint32(0);
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  i_eor(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32, carry } = this.processImm12(imm12, this.nzcv.C);
    const result = rn.view.getUint32(0) ^ imm32.view.getUint32(0);
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  i_sub(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32 } = this.processImm12(imm12, this.nzcv.C);
    const { result, carry, overflow } = this.addWithCarry(
      rn,
      new Word(~imm32.view.getUint32(0)),
      1,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  i_rsb(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32 } = this.processImm12(imm12, this.nzcv.C);
    const { result, carry, overflow } = this.addWithCarry(
      new Word(~rn.view.getUint32(0)),
      imm32,
      1,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  i_add(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32 } = this.processImm12(imm12, this.nzcv.C);
    const { result, carry, overflow } = this.addWithCarry(rn, imm32, 0);
    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  adr(rn: Word, imm12: Imm12, isAdd: boolean): { result: Word } {
    const { imm32 } = this.processImm12(imm12, this.nzcv.C);
    const alignedRn = new Word(rn.view.getUint32(0) & ~0x3);
    let result: Word;
    if (isAdd) {
      ({ result } = this.addWithCarry(alignedRn, imm32, 0));
    } else {
      ({ result } = this.addWithCarry(
        alignedRn,
        new Word(~imm32.view.getUint32(0)),
        1,
      ));
    }
    return { result };
  }

  i_adc(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32 } = this.processImm12(imm12, this.nzcv.C);
    const { result, carry, overflow } = this.addWithCarry(
      rn,
      imm32,
      this.nzcv.C,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  i_sbc(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32 } = this.processImm12(imm12, this.nzcv.C);
    const { result, carry, overflow } = this.addWithCarry(
      rn,
      new Word(~imm32.view.getUint32(0)),
      this.nzcv.C,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  i_rsc(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32 } = this.processImm12(imm12, this.nzcv.C);
    const { result, carry, overflow } = this.addWithCarry(
      new Word(~rn.view.getUint32(0)),
      imm32,
      this.nzcv.C,
    );

    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: overflow,
      },
    };
  }

  i_orr(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32, carry } = this.processImm12(imm12, this.nzcv.C);
    const result = rn.view.getUint32(0) | imm32.view.getUint32(0);

    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  i_mov(imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32: result, carry } = this.processImm12(imm12, this.nzcv.C);
    return {
      result: result,
      nzcv: {
        N: this.isNegative(result.view.getUint32(0)),
        Z: this.isZero(result.view.getUint32(0)),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  i_bic(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32, carry } = this.processImm12(imm12, this.nzcv.C);
    const result = rn.view.getUint32(0) & ~imm32.view.getUint32(0);
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }

  i_mvn(imm12: Imm12): { result: Word; nzcv: NZCV } {
    const { imm32, carry } = this.processImm12(imm12, this.nzcv.C);
    const result = ~imm32.view.getUint32(0);
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: carry,
        V: this.nzcv.V,
      },
    };
  }
  //----------------------------------IMM------------------------------------------

  //----------------------------------MUL and Acc----------------------------------
  mul(rn: Word, rm: Word): { result: Word; nzcv: NZCV } {
    const operand1: number = rn.view.getInt32(0);
    const operand2: number = rm.view.getInt32(0);
    const result: number = (operand1 * operand2) | 0; //This will truncate the result to 32 bit
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: this.nzcv.C,
        V: this.nzcv.V,
      },
    };
  }

  mla(rn: Word, rm: Word, ra: Word): { result: Word; nzcv: NZCV } {
    const operand1: number = rn.view.getInt32(0);
    const operand2: number = rm.view.getInt32(0);
    const addend: number = ra.view.getInt32(0);
    const result: number = (operand1 * operand2 + addend) | 0; //truncate to 32 bit
    return {
      result: new Word(result),
      nzcv: {
        N: this.isNegative(result),
        Z: this.isZero(result),
        C: this.nzcv.C,
        V: this.nzcv.V,
      },
    };
  }

  umaal(
    rn: Word,
    rm: Word,
    rdHi: Word,
    rdLo: Word,
  ): { resultHi: Word; resultLo: Word } {
    // Safer to use bigint since regular number bitwise operation truncate the number to 32 bit implicitly
    // Convert everything to BigInt first to since number only support up to 2**53 -1, not 2**64-1
    const result: bigint = BigInt.asUintN(
      64,
      BigInt(rn.view.getUint32(0)) * BigInt(rm.view.getUint32(0)) +
        BigInt(rdHi.view.getUint32(0)) +
        BigInt(rdLo.view.getUint32(0)),
    );
    const resultHi: number = Number(result >> 32n) | 0;
    const resultLo: number = Number(result & 0xffffffffn) | 0;
    return {
      resultHi: new Word(resultHi),
      resultLo: new Word(resultLo),
    };
  }

  mls(rn: Word, rm: Word, ra: Word): { result: Word } {
    const operand1: number = rn.view.getInt32(0);
    const operand2: number = rm.view.getInt32(0);
    const addend: number = ra.view.getInt32(0);
    const result: number = (addend - operand1 * operand2) | 0; //truncate to 32 bit
    return {
      result: new Word(result),
    };
  }

  umull(rn: Word, rm: Word): { resultHi: Word; resultLo: Word; nzcv: NZCV } {
    const result: bigint = BigInt.asUintN(
      64,
      BigInt(rn.view.getUint32(0)) * BigInt(rm.view.getUint32(0)),
    );
    const resultHi: number = Number(result >> 32n) | 0;
    const resultLo: number = Number(result & 0xffffffffn) | 0;
    return {
      resultHi: new Word(resultHi),
      resultLo: new Word(resultLo),
      nzcv: {
        N: this.isNegative(resultHi),
        Z: this.isZero(resultHi) && this.isZero(resultLo),
        C: this.nzcv.C,
        V: this.nzcv.V,
      },
    };
  }

  umlal(
    rn: Word,
    rm: Word,
    rdHi: Word,
    rdLo: Word,
  ): { resultHi: Word; resultLo: Word; nzcv: NZCV } {
    const addend: bigint =
      BigInt.asUintN(64, BigInt(rdHi.view.getUint32(0)) << 32n) |
      BigInt(rdLo.view.getUint32(0));
    const result: bigint = BigInt.asUintN(
      64,
      BigInt(rn.view.getUint32(0)) * BigInt(rm.view.getUint32(0)) + addend,
    );
    const resultHi: number = Number(result >> 32n) | 0;
    const resultLo: number = Number(result & 0xffffffffn) | 0;
    return {
      resultHi: new Word(resultHi),
      resultLo: new Word(resultLo),
      nzcv: {
        N: this.isNegative(resultHi),
        Z: this.isZero(resultHi) && this.isZero(resultLo),
        C: this.nzcv.C,
        V: this.nzcv.V,
      },
    };
  }

  smull(rn: Word, rm: Word): { resultHi: Word; resultLo: Word; nzcv: NZCV } {
    const result: bigint = BigInt.asIntN(
      64,
      BigInt(rn.view.getInt32(0)) * BigInt(rm.view.getInt32(0)),
    );
    const resultHi: number = Number(result >> 32n) | 0;
    const resultLo: number = Number(result & 0xffffffffn) | 0;
    return {
      resultHi: new Word(resultHi),
      resultLo: new Word(resultLo),
      nzcv: {
        N: this.isNegative(resultHi),
        Z: this.isZero(resultHi) && this.isZero(resultLo),
        C: this.nzcv.C,
        V: this.nzcv.V,
      },
    };
  }

  smlal(
    rn: Word,
    rm: Word,
    rdHi: Word,
    rdLo: Word,
  ): { resultHi: Word; resultLo: Word; nzcv: NZCV } {
    const addend: bigint =
      BigInt.asIntN(64, BigInt(rdHi.view.getUint32(0)) << 32n) |
      BigInt(rdLo.view.getUint32(0));
    const result: bigint = BigInt.asIntN(
      64,
      BigInt(rn.view.getInt32(0)) * BigInt(rm.view.getInt32(0)) + addend,
    );
    const resultHi: number = Number(result >> 32n) | 0;
    const resultLo: number = Number(result & 0xffffffffn) | 0;
    return {
      resultHi: new Word(resultHi),
      resultLo: new Word(resultLo),
      nzcv: {
        N: this.isNegative(resultHi),
        Z: this.isZero(resultHi) && this.isZero(resultLo),
        C: this.nzcv.C,
        V: this.nzcv.V,
      },
    };
  }

  //----------------------------------MUL and Acc----------------------------------

  //----------------------------------HEPLER---------------------------------------

  updateNZCV(nzcv: NZCV): void {
    this.nzcv = nzcv;
  }

  isZero(input: number): Flag {
    return toFlag(input === 0 ? 1 : 0);
  }

  isNegative(input: number): Flag {
    return toFlag((input >>> 31) & 1);
  }

  unpackShiftAmount(input: number | Word): number {
    if (input instanceof Word) {
      return extractBits(input, 0, 8);
    }
    if (input >= 32) {
      throw new Error("Imm for shift can not be larger than 32");
    }
    return input;
  }

  processImm12(imm12: Imm12, carry: Flag): { imm32: Word; carry: Flag } {
    const shiftAmount: number = extractBits(imm12, 8, 12);
    const imm8: number = extractBits(imm12, 0, 8);
    if (shiftAmount === 0) {
      return { imm32: new Word(imm8), carry };
    }
    // Pass carry in per spec but since shiftAmount != 0 in this case, RRX is never going to be used
    const { shifted: imm32, carry: carryOut } = this.shiftC(
      new Word(imm8),
      ShiftType.ROR,
      shiftAmount * 2,
      carry,
    );
    return { imm32, carry: carryOut };
  }

  addWithCarry(
    rn: Word,
    rm: Word,
    carry: Flag,
  ): { result: Word; carry: Flag; overflow: Flag } {
    const unsignedSum = rn.view.getUint32(0) + rm.view.getUint32(0) + carry;
    const signedSum = rn.view.getInt32(0) + rm.view.getInt32(0) + carry;

    // Truncate the result to 32 bit
    const result = new Word(unsignedSum);

    const carryOut = result.view.getUint32(0) == unsignedSum ? 0 : 1;
    const overflow = result.view.getInt32(0) == signedSum ? 0 : 1;
    return {
      result: result,
      carry: toFlag(carryOut),
      overflow: toFlag(overflow),
    };
  }

  shiftC(
    input: Word,
    type: ShiftType,
    shift: number,
    carry: Flag,
  ): { shifted: Word; carry: Flag } {
    // Carry is set to the last bit shift out
    let carryOut: Flag = carry;
    let value = input.view.getUint32(0);
    if (shift == 0) {
      if (type === ShiftType.ROR) {
        carryOut = toFlag(value & 1);
        value = (value >>> 1) | (carry << 31);
      }
      return { shifted: new Word(value), carry: carryOut };
    }

    // in typescript all bitwise operation is masked by the width of the input
    // So we need to handle these things seperately
    if (shift >= 32) {
      switch (type) {
        case ShiftType.LSL:
          carryOut = 0;
          value = 0;
          break;
        case ShiftType.LSR:
          carryOut = 0;
          value = 0;
          break;
        case ShiftType.ASR:
          carryOut = toFlag((value >>> 31) & 1);
          // For ASR, shift >= 32 will cause the value to be all filled with sign bit
          value = carryOut === 0 ? 0 : -1;
          break;
        case ShiftType.ROR:
          shift = shift % 32;
          value = (value >>> shift) | (value << (32 - shift));
          carryOut = toFlag((value >>> 31) & 1);
          break;
        default:
          throw new Error("Unknow shift type");
      }
    } else {
      switch (type) {
        case ShiftType.LSL:
          carryOut = toFlag((value >>> (32 - shift)) & 1);
          value = value << shift;
          break;
        case ShiftType.LSR:
          carryOut = toFlag((value >>> (shift - 1)) & 1);
          value = value >>> shift;
          break;
        case ShiftType.ASR:
          carryOut = toFlag((value >>> (shift - 1)) & 1);
          value = value >> shift;
          break;
        case ShiftType.ROR:
          value = (value >>> shift) | (value << (32 - shift));
          carryOut = toFlag((value >>> 31) & 1);
          break;
        default:
          throw new Error("Unknow shift type");
      }
    }
    return { shifted: new Word(value), carry: carryOut };
  }

  //----------------------------------HEPLER---------------------------------------
}
