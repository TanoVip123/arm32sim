import { countBits, extractBits, writeBits } from "../function/bitManip";
import type { Memory } from "../interface/memory";
import type { RegisterFile } from "../interface/registerFile";
import { Imm12, Word } from "../types/binType";
import { Condition } from "../types/conditions";
import {
  BlockLoad,
  BlockStore,
  DataProcessing,
  MultiplyAcc,
} from "../types/instructions";
import { numToNZCV, nzcvToNum, type NZCV } from "../types/flags";
import type { ArmALU } from "../interface/ALU";
import type { ArmSimulator } from "../interface/simulator";

// Maybe this should be the worker or something
// Need a simulator state
export class Arm32Simulator implements ArmSimulator {
  alu: ArmALU;
  registerFile: RegisterFile;
  memory: Memory;
  isDone: boolean;
  isBranch: boolean;
  constructor(alu: ArmALU, registerFile: RegisterFile, memory: Memory) {
    this.alu = alu;
    this.registerFile = registerFile;
    this.memory = memory;
    this.isDone = false;
    this.isBranch = false;
  }

  reset(){
    this.isDone = false;
  }

  checkCondition(condition: number, NZCV: NZCV): boolean {
    switch (condition) {
      //EQ
      case Condition.EQ:
        if (NZCV.Z == 1) {
          return true;
        }
        break;
      case Condition.NE:
        if (NZCV.Z == 0) {
          return true;
        }
        break;
      case Condition.HS:
        if (NZCV.C == 1) {
          return true;
        }
        break;
      case Condition.LO:
        if (NZCV.C == 0) {
          return true;
        }
        break;
      case Condition.MI:
        if (NZCV.N == 1) {
          return true;
        }
        break;
      case Condition.PL:
        if (NZCV.N == 0) {
          return true;
        }
        break;
      case Condition.VS:
        if (NZCV.V == 1) {
          return true;
        }
        break;
      case Condition.VC:
        if (NZCV.V == 0) {
          return true;
        }
        break;
      case Condition.HI:
        if (NZCV.C == 1 && NZCV.Z == 0) {
          return true;
        }
        break;
      case Condition.LS:
        if (NZCV.C == 0 || NZCV.Z == 1) {
          return true;
        }
        break;
      case Condition.GE:
        if (NZCV.N == NZCV.V) {
          return true;
        }
        break;
      case Condition.LT:
        if (NZCV.N != NZCV.V) {
          return true;
        }
        break;
      case Condition.GT:
        if (NZCV.Z == 0 && NZCV.N == NZCV.V) {
          return true;
        }
        break;
      case Condition.LE:
        if (NZCV.Z == 1 || NZCV.N != NZCV.V) {
          return true;
        }
        break;
      case Condition.AL:
        return true;
      default:
        return false;
    }
    return false;
  }

  execDataProcessingRegShiftReg(instruction: Word) {
    // need special safeguard for rd = 15
    const op = extractBits(instruction, 21, 25);
    const shouldWriteCPSR = Boolean(extractBits(instruction, 20, 21));
    const rn = this.registerFile.readRegister(extractBits(instruction, 16, 20));
    const rm = this.registerFile.readRegister(extractBits(instruction, 0, 4));
    const rd = extractBits(instruction, 12, 16);
    const shiftAmount = this.registerFile.readRegister(
      extractBits(instruction, 8, 12),
    );
    const shiftType = extractBits(instruction, 5, 7);

    let result: Word;
    let nzcv: NZCV;
    switch (op) {
      case DataProcessing.AND:
        ({ result, nzcv } = this.alu.and(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.EOR:
        ({ result, nzcv } = this.alu.eor(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.SUB:
        ({ result, nzcv } = this.alu.sub(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.RSB:
        ({ result, nzcv } = this.alu.rsb(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.ADD:
        ({ result, nzcv } = this.alu.add(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.ADC:
        ({ result, nzcv } = this.alu.adc(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.SBC:
        ({ result, nzcv } = this.alu.sbc(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.RSC:
        ({ result, nzcv } = this.alu.rsc(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.TST:
        ({ result, nzcv } = this.alu.and(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.TEQ:
        ({ result, nzcv } = this.alu.eor(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.CMP:
        ({ result, nzcv } = this.alu.sub(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.CMN:
        ({ result, nzcv } = this.alu.add(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.ORR:
        ({ result, nzcv } = this.alu.orr(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.MOV:
        ({ result, nzcv } = this.alu.mov(rm, shiftAmount, shiftType));
        break;
      case DataProcessing.BIC:
        ({ result, nzcv } = this.alu.bic(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.MVN:
        ({ result, nzcv } = this.alu.mvn(rm, shiftAmount, shiftType));
        break;
      default:
        throw new Error("Unknown operation");
    }
    // Should apply to all operation. TST, TEQ, CMP, CMN automatically have S of 1
    if (shouldWriteCPSR) {
      const cpsr = this.registerFile.readCPSR();
      const writeNZCV = nzcvToNum(nzcv);
      const value = writeBits(cpsr, writeNZCV, 28, 32);
      this.registerFile.writeCPSR(new Word(value));
    }

    // If the op is not TST, TEQ, CMP, CMN, write rd
    if (op < 0x8 || op > 0xb) {
      this.registerFile.writeRegister(rd, result);
    }
  }

  execDataProcessingReg(instruction: Word) {
    // need special safeguard for rd = 15
    const op = extractBits(instruction, 21, 25);
    const shouldWriteCPSR = Boolean(extractBits(instruction, 20, 21));
    const rn = this.registerFile.readRegister(extractBits(instruction, 16, 20));
    const rm = this.registerFile.readRegister(extractBits(instruction, 0, 4));
    const rd = extractBits(instruction, 12, 16);
    const shiftType = extractBits(instruction, 5, 7);
    const shiftAmount = extractBits(instruction, 7, 12);

    let result: Word;
    let nzcv: NZCV;
    switch (op) {
      case DataProcessing.AND:
        ({ result, nzcv } = this.alu.and(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.EOR:
        ({ result, nzcv } = this.alu.eor(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.SUB:
        ({ result, nzcv } = this.alu.sub(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.RSB:
        ({ result, nzcv } = this.alu.rsb(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.ADD:
        ({ result, nzcv } = this.alu.add(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.ADC:
        ({ result, nzcv } = this.alu.adc(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.SBC:
        ({ result, nzcv } = this.alu.sbc(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.RSC:
        ({ result, nzcv } = this.alu.rsc(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.TST:
        ({ result, nzcv } = this.alu.and(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.TEQ:
        ({ result, nzcv } = this.alu.eor(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.CMP:
        ({ result, nzcv } = this.alu.sub(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.CMN:
        ({ result, nzcv } = this.alu.add(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.ORR:
        ({ result, nzcv } = this.alu.orr(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.MOV:
        ({ result, nzcv } = this.alu.mov(rm, shiftAmount, shiftType));
        break;
      case DataProcessing.BIC:
        ({ result, nzcv } = this.alu.bic(rn, rm, shiftAmount, shiftType));
        break;
      case DataProcessing.MVN:
        ({ result, nzcv } = this.alu.mvn(rm, shiftAmount, shiftType));
        break;
      default:
        throw new Error("Unknown operation");
    }

    // Should apply to all operation. TST, TEQ, CMP, CMN automatically have S of 1
    if (shouldWriteCPSR) {
      const cpsr = this.registerFile.readCPSR();
      const writeNZCV = nzcvToNum(nzcv);
      const value = writeBits(cpsr, writeNZCV, 28, 32);
      this.registerFile.writeCPSR(new Word(value));
    }

    // If the op is not TST, TEQ, CMP, CMN, write rd
    if (op < 0x8 || op > 0xb) {
      this.registerFile.writeRegister(rd, result);
    }
  }

  execDataProcessingImm(instruction: Word) {
    // need special safeguard for rd = 15
    const op = extractBits(instruction, 21, 25);
    const shouldWriteCPSR = Boolean(extractBits(instruction, 20, 21));

    // This is a bit special, extract the index for ADR. ADR needs to align before adding
    const rn_index = extractBits(instruction, 16, 20);
    const rn = this.registerFile.readRegister(rn_index);
    const rd = extractBits(instruction, 12, 16);
    const imm12 = new Imm12(extractBits(instruction, 0, 12));

    let result: Word;

    // nzcv can be undefined because of the special case ADR. This case doesn't write to the CPSR at all so
    // the spec doesn't return any flag. I do this to properly reflect that
    let nzcv: NZCV | undefined = undefined;

    switch (op) {
      case DataProcessing.AND:
        ({ result, nzcv } = this.alu.i_and(rn, imm12));
        break;
      case DataProcessing.EOR:
        ({ result, nzcv } = this.alu.i_eor(rn, imm12));
        break;
      case DataProcessing.SUB:
        if (rn_index == 0xf) {
          ({ result } = this.alu.adr(rn, imm12, false));
        } else {
          ({ result, nzcv } = this.alu.i_sub(rn, imm12));
        }
        break;
      case DataProcessing.RSB:
        ({ result, nzcv } = this.alu.i_rsb(rn, imm12));
        break;
      case DataProcessing.ADD:
        if (rn_index == 0xf) {
          ({ result } = this.alu.adr(rn, imm12, true));
        } else {
          ({ result, nzcv } = this.alu.i_add(rn, imm12));
        }
        break;
      case DataProcessing.ADC:
        ({ result, nzcv } = this.alu.i_adc(rn, imm12));
        break;
      case DataProcessing.SBC:
        ({ result, nzcv } = this.alu.i_sbc(rn, imm12));
        break;
      case DataProcessing.RSC:
        ({ result, nzcv } = this.alu.i_rsc(rn, imm12));
        break;
      case DataProcessing.TST:
        ({ result, nzcv } = this.alu.i_and(rn, imm12));
        break;
      case DataProcessing.TEQ:
        ({ result, nzcv } = this.alu.i_eor(rn, imm12));
        break;
      case DataProcessing.CMP:
        ({ result, nzcv } = this.alu.i_sub(rn, imm12));
        break;
      case DataProcessing.CMN:
        ({ result, nzcv } = this.alu.i_add(rn, imm12));
        break;
      case DataProcessing.ORR:
        ({ result, nzcv } = this.alu.i_orr(rn, imm12));
        break;
      case DataProcessing.MOV:
        ({ result, nzcv } = this.alu.i_mov(imm12));
        break;
      case DataProcessing.BIC:
        ({ result, nzcv } = this.alu.i_bic(rn, imm12));
        break;
      case DataProcessing.MVN:
        ({ result, nzcv } = this.alu.i_mvn(imm12));
        break;
      default:
        throw new Error("Unknown operation");
    }

    // Should apply to all operation. TST, TEQ, CMP, CMN automatically have S of 1
    // ADR S is 0 by default
    if (shouldWriteCPSR) {
      if (nzcv == undefined) {
        throw new Error("Unknown operation");
      }

      const cpsr = this.registerFile.readCPSR();
      const writeNZCV = nzcvToNum(nzcv);
      const value = writeBits(cpsr, writeNZCV, 28, 32);
      this.registerFile.writeCPSR(new Word(value));
    }

    // If the op is not TST, TEQ, CMP, CMN, write rd
    if (op < 0x8 || op > 0xb) {
      this.registerFile.writeRegister(rd, result);
    }
  }

  execMultiplyAcc(instruction: Word) {
    const op = extractBits(instruction, 21, 24);
    const shouldWriteCPSR = Boolean(extractBits(instruction, 20, 21));

    // rd is also rHi
    const rd_index = extractBits(instruction, 16, 20);
    const rd = this.registerFile.readRegister(rd_index);

    // ra is also rLo
    const ra_index = extractBits(instruction, 12, 16);
    const ra = this.registerFile.readRegister(ra_index);

    const rm = this.registerFile.readRegister(extractBits(instruction, 8, 12));
    const rn = this.registerFile.readRegister(extractBits(instruction, 0, 4));

    let result: Word | undefined;
    let nzcv: NZCV | undefined;
    let resultHi: Word | undefined;
    let resultLo: Word | undefined;
    switch (op) {
      case MultiplyAcc.MUL:
        ({ result, nzcv } = this.alu.mul(rn, rm));
        break;
      case MultiplyAcc.MLA:
        ({ result, nzcv } = this.alu.mla(rn, rm, ra));
        break;
      case MultiplyAcc.UMAAL:
        ({ resultHi, resultLo } = this.alu.umaal(rn, rm, rd, ra));
        break;
      case MultiplyAcc.MLS:
        ({ result } = this.alu.mls(rn, rm, ra));
        break;
      case MultiplyAcc.UMULL:
        ({ resultHi, resultLo, nzcv } = this.alu.umull(rn, rm));
        break;
      case MultiplyAcc.UMLAL:
        ({ resultHi, resultLo, nzcv } = this.alu.umlal(rn, rm, rd, ra));
        break;
      case MultiplyAcc.SMULL:
        ({ resultHi, resultLo, nzcv } = this.alu.smull(rn, rm));
        break;
      case MultiplyAcc.SMLAL:
        ({ resultHi, resultLo, nzcv } = this.alu.smlal(rn, rm, rd, ra));
        break;
      default:
        throw new Error("Unknown Multipy and Multipy Accumulate Operation");
    }

    if (!(op == MultiplyAcc.UMAAL || op == MultiplyAcc.MLS)) {
      if (shouldWriteCPSR) {
        if (nzcv == undefined) {
          throw new Error("Unknown operation");
        }
        const cpsr = this.registerFile.readCPSR();
        const writeNZCV = nzcvToNum(nzcv);
        const value = writeBits(cpsr, writeNZCV, 28, 32);
        this.registerFile.writeCPSR(new Word(value));
      }
    }

    if (
      op == MultiplyAcc.MUL ||
      op == MultiplyAcc.MLA ||
      op == MultiplyAcc.MLS
    ) {
      if (result == undefined) {
        throw new Error(
          "Result must NOT be undefined for MultiplyAccumulation",
        );
      }
      this.registerFile.writeRegister(rd_index, result);
    } else {
      if (resultHi == undefined || resultLo == undefined) {
        throw new Error(
          "ResultHi and resultLo must NOT be MultiplyAccumulation",
        );
      }
      this.registerFile.writeRegister(rd_index, resultHi);
      this.registerFile.writeRegister(ra_index, resultLo);
    }
  }

  execSwap(instruction: Word) {
    const op = extractBits(instruction, 20, 24);
    if ((op & 0b1011) != 0b0000) {
      throw new Error("Instruction under construction");
    }

    const swapByte = extractBits(instruction, 22, 23);
    const rn = extractBits(instruction, 16, 20);
    const address = this.registerFile.readRegister(rn);
    const rt = extractBits(instruction, 12, 16);
    const rt2 = extractBits(instruction, 0, 4);

    if (swapByte) {
      const data = new Uint8Array(this.memory.readBuffer(address, 1));
      // We read a word but only need the first byte

      // Overide the first byte of data from memory with the least significant byte from rt2
      const dataToStore = new Uint8Array([
        this.registerFile.readRegister(rt2).view.getUint8(3),
      ]);

      this.memory.writeBuffer(address, dataToStore.buffer);
      this.registerFile.writeRegister(rt, new Word(data[0]));
    } else {
      const data = this.memory.readWord(address);
      this.memory.writeWord(address, this.registerFile.readRegister(rt2));
      this.registerFile.writeRegister(rt, data);
    }
  }

  // If we produce a negative address, it would just wrap around
  execLoad(instruction: Word) {
    const op1 = extractBits(instruction, 21, 25);
    if ((op1 & 10111) == 0b00010) {
      throw new Error("Load Unpriviledge is not implemented");
    }

    const index = extractBits(instruction, 24, 25);
    const add = extractBits(instruction, 23, 24);
    const writeBack = extractBits(instruction, 21, 22) || index == 0;
    const rn_index = extractBits(instruction, 16, 20);
    const rn = this.registerFile.readRegister(rn_index);
    const rt_index = extractBits(instruction, 12, 16);
    const isByte = extractBits(instruction, 22, 23);
    // Op2 is imm12 or reg shift imm (documentation doesn't have register shift register)
    let offset: Word | undefined = undefined;

    // Calculate Offset
    if (extractBits(instruction, 25, 26)) {
      if (rn_index == 15) {
        throw new Error(
          "LDR: PC can not be used as based for a register offset",
        );
      }
      const rm = this.registerFile.readRegister(extractBits(instruction, 0, 4));
      const type = extractBits(instruction, 5, 7);

      const shiftAmount = extractBits(instruction, 7, 12);
      ({ result: offset } = this.alu.mov(rm, shiftAmount, type));
    } else {
      offset = new Word(extractBits(instruction, 0, 12));
    }

    let base: Word;

    if (rn_index == 15) {
      base = new Word(
        this.registerFile.readRegister(15).view.getUint32(0) & ~0x3,
      );
    } else {
      base = rn;
    }

    const offset_addr = add
      ? base.view.getUint32(0) + offset.view.getUint32(0)
      : base.view.getUint32(0) - offset.view.getUint32(0);
    const address = index ? offset_addr : rn.view.getUint32(0);

    if (isByte) {
      const data = new Uint8Array(this.memory.readBuffer(new Word(address), 1));
      this.registerFile.writeRegister(rt_index, new Word(data[0]));
    } else {
      // For simplicity, we will assume all type of load is possible, regardless of alignment
      const data = this.memory.readWord(new Word(address));
      this.registerFile.writeRegister(rt_index, data);
    }

    if (writeBack) {
      this.registerFile.writeRegister(rn_index, new Word(offset_addr));
    }
  }

  execStore(instruction: Word) {
    const op1 = extractBits(instruction, 21, 25);
    if ((op1 & 10111) == 0b00010) {
      throw new Error("Store Unpriviledge is not implemented");
    }

    const index = extractBits(instruction, 24, 25);
    const add = extractBits(instruction, 23, 24);
    const writeBack = extractBits(instruction, 21, 22) || index == 0;
    const rn_index = extractBits(instruction, 16, 20);
    const rn = this.registerFile.readRegister(rn_index);
    const rt_index = extractBits(instruction, 12, 16);
    const rt = this.registerFile.readRegister(rt_index);
    const isByte = extractBits(instruction, 22, 23);
    // is Op2 imm12 opr reg shift imm (documentation doesn't have register shift register)
    let offset: Word | undefined = undefined;

    // Calculate Offset
    if (extractBits(instruction, 25, 26)) {
      if (rn_index == 15) {
        throw new Error(
          "STR: PC can not be used as based for a register offset",
        );
      }
      const rm = this.registerFile.readRegister(extractBits(instruction, 0, 4));
      const type = extractBits(instruction, 5, 7);
      const shiftAmount = extractBits(instruction, 7, 12);
      ({ result: offset } = this.alu.mov(rm, shiftAmount, type));
    } else {
      offset = new Word(extractBits(instruction, 0, 12));
    }

    const offset_addr = add
      ? rn.view.getUint32(0) + offset.view.getUint32(0)
      : rn.view.getUint32(0) - offset.view.getUint32(0);
    const address = index ? offset_addr : rn.view.getUint32(0);
    if (isByte) {
      const dataToStore = new Uint8Array([rt.view.getUint8(3)]);
      this.memory.writeBuffer(new Word(address), dataToStore.buffer);
    } else {
      this.memory.writeWord(new Word(address), rt);
    }

    if (writeBack) {
      this.registerFile.writeRegister(rn_index, new Word(offset_addr));
    }
  }

  execBlockLoad(instruction: Word) {
    const op = extractBits(instruction, 22, 26);
    const rn_index = extractBits(instruction, 16, 20);
    const rn = this.registerFile.readRegister(rn_index);
    const registerList = extractBits(instruction, 0, 16);
    const bitsCount = countBits(registerList);
    const writeBack = extractBits(instruction, 21, 22);
    let address: number;

    switch (op) {
      case BlockLoad.LDMDA:
        address = rn.view.getUint32(0) - bitsCount * 4 + 4;
        break;
      case BlockLoad.LDM:
        address = rn.view.getUint32(0);
        break;
      case BlockLoad.LDMDB:
        address = rn.view.getUint32(0) - bitsCount * 4;
        break;
      case BlockLoad.LDMIB:
        address = rn.view.getUint32(0) + 4;
        break;
      default:
        throw new Error("Unknown Block Load operation");
    }

    for (let i = 0; i < 16; i++) {
      if ((registerList >> i) & 1) {
        this.registerFile.writeRegister(
          i,
          this.memory.readWord(new Word(address)),
        );
        address += 4;
      }
    }

    let writeBackAddress: number;
    if (writeBack) {
      switch (op) {
        case BlockLoad.LDMDA:
          writeBackAddress = rn.view.getUint32(0) - bitsCount * 4;
          break;
        case BlockLoad.LDM:
          writeBackAddress = rn.view.getUint32(0) + bitsCount * 4;
          break;
        case BlockLoad.LDMDB:
          writeBackAddress = rn.view.getUint32(0) - bitsCount * 4;
          break;
        case BlockLoad.LDMIB:
          writeBackAddress = rn.view.getUint32(0) + bitsCount * 4;
          break;
        default:
          throw new Error("Unknown Block Load operation");
      }
      this.registerFile.writeRegister(rn_index, new Word(writeBackAddress));
    }
  }

  execBlockStore(instruction: Word) {
    const op = extractBits(instruction, 22, 26);
    const rn_index = extractBits(instruction, 16, 20);
    const rn = this.registerFile.readRegister(rn_index);
    const registerList = extractBits(instruction, 0, 16);
    const bitsCount = countBits(registerList);
    const writeBack = extractBits(instruction, 21, 22);
    let address: number;

    // If the base register is set in the register list, there is going to be ambiguity
    // since the address is modified while storing and then write back at the end.
    // AKA the value stored to the memory of the base register is going to be modified right after it is stored
    // due to the writeback.

    // The only safe case is if this register is the lowestSetBit since then, then it is the original value that is stored
    // (pseudo code seems to show separation of address and register value but that is not how real CPU behaves)
    switch (op) {
      case BlockStore.STMDA:
        address = rn.view.getUint32(0) - bitsCount * 4 + 4;
        break;
      case BlockStore.STM:
        address = rn.view.getUint32(0);
        break;
      case BlockStore.STMDB:
        address = rn.view.getUint32(0) - bitsCount * 4;
        break;
      case BlockStore.STMIB:
        address = rn.view.getUint32(0) + 4;
        break;
      default:
        throw new Error("Unknown Block Store operation");
    }

    for (let i = 0; i < 16; i++) {
      if ((registerList >> i) & 1) {
        this.memory.writeWord(
          new Word(address),
          this.registerFile.readRegister(i),
        );
        address += 4;
      }
    }

    let writeBackAddress: number;
    if (writeBack) {
      switch (op) {
        case BlockStore.STMDA:
          writeBackAddress = rn.view.getUint32(0) - bitsCount * 4;
          break;
        case BlockStore.STM:
          writeBackAddress = rn.view.getUint32(0) + bitsCount * 4;
          break;
        case BlockStore.STMDB:
          writeBackAddress = rn.view.getUint32(0) - bitsCount * 4;
          break;
        case BlockStore.STMIB:
          writeBackAddress = rn.view.getUint32(0) + bitsCount * 4;
          break;
        default:
          throw new Error("Unknown Block Store operation");
      }
      this.registerFile.writeRegister(rn_index, new Word(writeBackAddress));
    }
  }

  execBranch(instruction: Word) {
    this.isBranch = true
    const offset: Word = new Word((extractBits(instruction, 0, 24) << 8) >> 6);
    const isLink = extractBits(instruction, 24, 25);

    const PC = this.registerFile.readRegister(15).view.getUint32(0) & ~0x3;
    const targetAddress = PC + offset.view.getInt32(0);
    // BLX immediate
    if (isLink) {
      // return to the next instruction after this instruction (otherwise you have an infinite loop)
      const linkAddress = PC + 4;
      this.registerFile.writeRegister(14, new Word(linkAddress));
    }
    // For simplicity, assume PC is always word aligned
    this.registerFile.writeRegister(15, new Word(targetAddress));
  }

  execMiscellaneous(instruction: Word) {
    const op2 = extractBits(instruction, 4, 7);
    const op = extractBits(instruction, 21, 23);
    const rm = extractBits(instruction, 0, 4);

    //BX
    if (op2 == 0b001 && op == 0b01) {
      this.isBranch = true
      this.registerFile.writeRegister(15, this.registerFile.readRegister(rm));
    }
    //BLX register
    else if (op2 == 0b011 && op == 0b01) {
      this.isBranch = true
      const target = this.registerFile.readRegister(rm);
      const nextInstruction =
        this.registerFile.readRegister(15).view.getUint32(0) + 4;

      this.registerFile.writeRegister(14, new Word(nextInstruction));
      this.registerFile.writeRegister(15, target);
    } else {
      throw new Error(
        "Only BX and BLX reg in Miscellaneous instructions are implemented",
      );
    }
  }

  execHalfWordMov(instruction: Word) {
    const isTop = extractBits(instruction, 22, 23);
    const imm12 = extractBits(instruction, 0, 12);
    const imm4 = extractBits(instruction, 16, 20);
    const rd_index = extractBits(instruction, 12, 16);
    const rd = this.registerFile.readRegister(rd_index);

    const imm16 = (imm4 << 12) | imm12;

    const newValue = writeBits(rd, imm16, isTop ? 16 : 0, isTop ? 32 : 16);
    this.registerFile.writeRegister(rd_index, new Word(newValue));
  }

  isSimulationDone(): boolean {
    return this.isDone;
  }

  runOnce() {
    // return if reach end of program
    if (this.isDone)
    {
      return;
    }

    const pc = this.registerFile.readRegister(15)
    const instruction = this.memory.readWord(pc)
    // if we see an instruction that is 0, 
    if(instruction.view.getUint32(0) == 0xFFFFFFFF)
    {
      this.isDone = true
      return
    }

    this.execInstruction(instruction)
    // Do not modified PC if we execute a branch instruction since these instruction would have already modified PC
    // just silently clear the branch flag
    if(!this.isBranch)
    {
      this.registerFile.writeRegister(15, new Word(pc.view.getUint32(0) + 4))
    } else {
      this.isBranch = false
    }
  }

  execInstruction(instruction: Word) {
    if (instruction.view.getUint32(0) === 0) {
      this.isDone = true;
      return;
    }

    const nzcvFlag: NZCV = numToNZCV(
      extractBits(this.registerFile.readCPSR(), 28, 32),
    );
    const cond: number = extractBits(instruction, 28, 32);
    if (!this.checkCondition(cond, nzcvFlag)) {
      return;
    }

    this.alu.updateNZCV(nzcvFlag);
    const op = extractBits(instruction, 26, 28);
    if (op == 0b00) {
      if (extractBits(instruction, 25, 26) == 0) {
        const op1 = extractBits(instruction, 20, 25);
        const op2 = extractBits(instruction, 4, 8);
        if (op2 == 0b1001) {
          if ((op1 & 0b10000) == 0b10000) {
            // Only SWP and SWPB is implemented
            this.execSwap(instruction);
            return;
          } else {
            this.execMultiplyAcc(instruction);
            return;
          }
        } else if (op2 == 0b1011 || (op2 & 0b1101) == 0b1101) {
          if ((op1 & 0b10010) == 0b00010) {
            throw new Error(
              "Extra load/store instructions, unprivileged are NOT implemented",
            );
          } else {
            throw new Error(
              "Extra load/store instructions are NOT implemented",
            );
          }
        }

        if ((op1 & 0b11001) == 0b10000) {
          if ((op2 & 0b1000) == 0b0000) {
            this.execMiscellaneous(instruction);
            return;
          } else if ((op2 & 0b1001) == 0b1001) {
            throw new Error(
              "Halfword multiply and multiply accumulate instructions are NOT implemented",
            );
          }
        } else {
          // Register shift imm (AKA Data-processing (register))
          if ((op2 & 0b0001) == 0b0000) {
            this.execDataProcessingReg(instruction);
            return;
          }

          // Reigster shift register (AKA Data-processing (register-shifted register))
          else if ((op2 & 0b1001) == 0b0001) {
            this.execDataProcessingRegShiftReg(instruction);
            return;
          }
        }
      } else {
        const op1 = extractBits(instruction, 20, 25);
        if (op1 == 0b10000) {
          this.execHalfWordMov(instruction);
          return;
        } else if (op1 == 0b10100) {
          this.execHalfWordMov(instruction);
          return;
        } else if ((op1 & 0b11011) == 0b10010) {
          throw new Error(
            "MSR (immediate), and hints instructions are NOT imnplemented",
          );
        } else if ((op1 & 0b11001) != 0b10000) {
          this.execDataProcessingImm(instruction);
          return;
        }
      }
    } else if (op == 0b01) {
      //Load/Store
      if (extractBits(instruction, 20, 21)) {
        // 1 => Load operation
        this.execLoad(instruction);
      } else {
        // 0 => store operation
        this.execStore(instruction);
      }
    } else if (op == 0b10) {
      if (extractBits(instruction, 25, 26)) {
        // branch
        this.execBranch(instruction);
      }
      // Block L/S
      else {
        if (extractBits(instruction, 22, 23)) {
          throw new Error(
            "User registers mode for block L/S is NOT implemented",
          );
        }

        if (extractBits(instruction, 20, 21)) {
          // Block Load
          this.execBlockLoad(instruction);
        } else {
          // Block Store
          this.execBlockStore(instruction);
        }
      }
    } else {
      throw new Error("Interupts (SWI) are NOT implemented");
    }
  }
}
