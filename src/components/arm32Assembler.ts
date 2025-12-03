import {
  CODE_SECTION,
  DATA_SECTION,
  ASCIZ_DIRECTIVE,
  STRING_DIRECTIVE,
  INT_DIRECTIVE,
  CODE_END,
} from "../constants/directives";
import { CODE_SEGMENT } from "../constants/SegmentPosition";
import { encodeImm12, getValueIfKeyExists } from "../function/helper";
import type { ArmAssembler } from "../interface/Assembler";
import { Word } from "../types/binType";
import { Condition } from "../types/conditions";
import {
  BlockLoad,
  BlockStore,
  DataProcessing,
  MovImmediate,
  MultiplyAcc,
  type InstructionBlob,
} from "../types/instructions";
import { TextToRegister } from "../types/registerName";
import { ShiftType } from "../types/shiftType";

const DATA_PROCESSING_3_OPS: string[] = [
  "and",
  "eor",
  "sub",
  "rsb",
  "add",
  "adc",
  "sbc",
  "rsc",
  "bic",
  "orr",
];
const DATA_PROCESSING_2_OPS: string[] = ["mvn"];
const DATA_PROCESSING_MOV: string[] = ["mov"];
const DATA_PROCESSING_TEST: string[] = ["tst", "teq", "cmp", "cmn"];
const DATA_PROCESSING_SHIFT: string[] = ["lsl", "lsr", "asr", "ror", "rrx"];
const MUL: string = "mul";
const MUL_ACC: string[] = ["mla", "mls"];
const MUL_SIGNED: string[] = ["umaal", "umull", "umlal", "smull", "smlal"];
const SWP: string = "swp";
const LOAD_STORE: string[] = ["str", "ldr"];
const BLOCK_LOAD_STORE: string[] = [
  "ldmia",
  "stmia",
  "ldmda",
  "ldmdb",
  "ldmib",
  "stmda",
  "stmdb",
  "stmib",
  "stmdb",
];
const IMMEDIATE_MOVE = ["movt", "movw"]
const BLOCK_LOAD_STORE_INCREMENT_AFTER: string[] = ["stm", "ldm"];
const POP_PUSH: string[] = ["pop", "push"];
const BRANCH: string[] = ["b", "bx", "blx", "bl"];

export class Arm32Assembler implements ArmAssembler {
  dataLabels: Map<string, number>;
  subroutineLabels: Map<string, number>;
  dataBlobs: number[];
  instructionBlobs: Map<number, InstructionBlob>;
  constructor() {
    this.dataLabels = new Map<string, number>();
    this.subroutineLabels = new Map<string, number>();
    this.dataBlobs = [];
    this.instructionBlobs = new Map<number, InstructionBlob>();
  }

  reset() {
    this.dataLabels = new Map<string, number>();
    this.subroutineLabels = new Map<string, number>();
    this.dataBlobs = [];
    this.instructionBlobs = new Map<number, InstructionBlob>();
  }

  getAssembledData(): number[] {
    return this.dataBlobs;
  }

  getAssembledCode(): Map<number, InstructionBlob> {
    return this.instructionBlobs;
  }

  assemble(code: string): {
    data: number[];
    instructions: Map<number, InstructionBlob>;
  } {
    this.reset();
    code = code.trim();
    const dataSectionStart = code.indexOf(DATA_SECTION);
    const codeSectionStart = code.indexOf(CODE_SECTION);

    if (codeSectionStart == -1) {
      throw new Error("Missing a .text indicator");
    }

    if (dataSectionStart != -1) {
      const dataSection = code.substring(dataSectionStart, codeSectionStart);
      this.assembleData(dataSection);
    }

    const codeSection = code.substring(codeSectionStart);
    if (codeSection.indexOf(DATA_SECTION) != -1) {
      throw new Error(".text directive should not include any .data");
    }

    this.assembleCode(codeSection);

    return { data: this.dataBlobs, instructions: this.instructionBlobs };
  }

  assembleDataProcessing3Ops(line: string): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);

    if (tokens.length > 6) {
      throw new Error(
        `Maximum number of tokens for this instruction is 6: ${line}`,
      );
    }

    if (tokens.length < 4) {
      throw new Error(
        `Minimum number of tokens for this instruction is 4: ${line}`,
      );
    }
    const op = getValueIfKeyExists(DataProcessing, tokens[0].slice(0, 3))!;
    const flag = tokens[0].slice(3);
    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      flag,
    );

    const rd = getValueIfKeyExists(TextToRegister, tokens[1]);
    const rn = getValueIfKeyExists(TextToRegister, tokens[2]);
    const rm = getValueIfKeyExists(TextToRegister, tokens[3]);

    if (rd == undefined || rn == undefined) {
      throw new Error(`Undefined registers: ${rn} ${rd}`);
    }

    // Register operator with shift
    if (rm != undefined) {
      let instruction =
        (condition << 28) |
        (op << 21) |
        (S << 20) |
        (rn << 16) |
        (rd << 12) |
        rm;
      if (tokens.length === 5) {
        if (tokens[4] == "RRX") {
          instruction = instruction | (0x3 << 5);
        } else {
          throw new Error(`Invalid Shift ${tokens[4]}`);
        }
      } else if (tokens.length === 6) {
        const shiftType = getValueIfKeyExists(ShiftType, tokens[4]);
        if (shiftType == undefined) {
          throw new Error(`Invalid Shift ${tokens[4]}`);
        }
        const rs = getValueIfKeyExists(TextToRegister, tokens[5]);
        if (rs != undefined) {
          instruction = instruction | (1 << 4) | (shiftType << 5) | (rs << 8);
        } else {
          const imm = this.extractImm(tokens[5]);
          if (imm >= 32) {
            throw new Error(`Shift can not exceed 31: ${imm}`);
          }
          instruction = instruction | (shiftType << 5) | (imm << 7);
        }
      }
      return [{ origin: line, encode: instruction }];
    } else {
      const imm = this.extractImm(tokens[3]);
      const { imm8, rotate } = encodeImm12(imm);
      if (rotate == -1) {
        const {immSeq, tempReg} = this.constructImmSequence(imm, [rd, rn]);
        // This becomes a register operation
        immSeq.splice(3, 0, {
          origin: line,
          encode:
            (condition << 28) |
            (op << 21) |
            (S << 20) |
            (rn << 16) |
            (rd << 12) |
            tempReg,
        });
        return immSeq;
      } else {
        const imm12 = imm8 | (rotate << 8);
        const instruction =
          (condition << 28) |
          (1 << 25) |
          (op << 21) |
          (S << 20) |
          (rn << 16) |
          (rd << 12) |
          imm12;
        return [{ origin: line, encode: instruction }];
      }
    }
  }

  assembleImmediateMove(line: string): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);
    if (tokens.length != 3){
      throw new Error(
        `Maximum number of tokens for this instruction is 3: ${line}`,
      );
    }
    const op = getValueIfKeyExists(MovImmediate, tokens[0].slice(0, 4))!;
    const flag = tokens[0].slice(4);
    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      flag,
    );

    if (S) {
      throw new Error(
        "MOVW and MOVT doesn't have S flag",
      );
    }
    const rd = getValueIfKeyExists(TextToRegister, tokens[1]);
    const imm = this.extractImm(tokens[2]);
    if (rd == undefined) {
      throw new Error(`Undefined registers: ${rd}`);
    }

    if(imm <0 || imm > 65535) {
      throw new Error(`Imm overflow for MOVT or MOVW: ${imm}`);
    }

    const encode = condition << 28 | 0x3 << 24 | op << 22 | (imm >>> 12) << 16 | rd << 12 | (imm & 0xFFF)

    return [{origin: line, encode:encode}]
  }

  assembleDataProcessingTest(line: string): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);
    if (tokens.length > 5) {
      throw new Error(
        `Maximum number of tokens for this instruction is 5: ${line}`,
      );
    }

    if (tokens.length < 3) {
      throw new Error(
        `Minimum number of tokens for this instruction is 3: ${line}`,
      );
    }
    const op = getValueIfKeyExists(DataProcessing, tokens[0].slice(0, 3))!;
    const flag = tokens[0].slice(3);
    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      flag,
    );
    if (S) {
      throw new Error(
        "TST, TEQ, CMN, CMP should not have S flag. S is implied",
      );
    }

    const rn = getValueIfKeyExists(TextToRegister, tokens[1]);
    const rm = getValueIfKeyExists(TextToRegister, tokens[2]);

    if (rn == undefined) {
      throw new Error(`Undefined registers: ${rn}`);
    }

    // Register operator with shift
    if (rm != undefined) {
      let instruction =
        (condition << 28) | (op << 21) | (1 << 20) | (rn << 16) | rm;
      if (tokens.length === 4) {
        if (tokens[3] == "RRX") {
          instruction = instruction | (0x3 << 5);
        } else {
          throw new Error(`Invalid Shift ${tokens[3]}`);
        }
      } else if (tokens.length === 5) {
        const shiftType = getValueIfKeyExists(ShiftType, tokens[3]);
        if (shiftType == undefined) {
          throw new Error(`Invalid Shift ${tokens[3]}`);
        }
        const rs = getValueIfKeyExists(TextToRegister, tokens[4]);
        if (rs != undefined) {
          instruction = instruction | (1 << 4) | (shiftType << 5) | (rs << 8);
        } else {
          const imm = this.extractImm(tokens[4]);
          if (imm >= 32) {
            throw new Error(`Shift can not exceed 31: ${imm}`);
          }
          instruction = instruction | (shiftType << 5) | (imm << 7);
        }
      }
      return [{ origin: line, encode: instruction }];
    } else {
      const imm = this.extractImm(tokens[2]);
      const { imm8, rotate } = encodeImm12(imm);
      if (rotate == -1) {
        const {immSeq, tempReg} = this.constructImmSequence(imm, [rn]);

        // This is now actually register with register
        immSeq.splice(3, 0, {
          origin: line,
          encode: (condition << 28) | (op << 21) | (1 << 20) | (rn << 16) | tempReg,
        });
        return immSeq;
      } else {
        const imm12 = imm8 | (rotate << 8);
        const instruction =
          (condition << 28) |
          (1 << 25) |
          (op << 21) |
          (1 << 20) |
          (rn << 16) |
          imm12;
        return [{ origin: line, encode: instruction }];
      }
    }
  }

  assembleDataProcessingMov(line: string): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);
    if (tokens.length != 3) {
      throw new Error(`Number of tokens for this instruction is 3: ${line}`);
    }

    const op = getValueIfKeyExists(DataProcessing, tokens[0].slice(0, 3))!;
    const flag = tokens[0].slice(3);
    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      flag,
    );

    const rd = getValueIfKeyExists(TextToRegister, tokens[1]);
    const rm = getValueIfKeyExists(TextToRegister, tokens[2]);

    if (rd == undefined) {
      throw new Error(`Undefined registers: ${rd}`);
    }

    // Mov with register
    if (rm != undefined) {
      const instruction =
        (condition << 28) | (op << 21) | (S << 20) | (rd << 12) | rm;
      return [{ origin: line, encode: instruction }];
    }

    // Imm
    else {
      const imm = this.extractImm(tokens[2]);
      const { imm8, rotate } = encodeImm12(imm);
      if (rotate == -1) {
        const {immSeq, tempReg} = this.constructImmSequence(imm, [rd]);
        immSeq.splice(3, 0, {
          origin: line,
          encode: (condition << 28) | (op << 21) | (S << 20) | (rd << 12) | tempReg,
        });
        return immSeq;
      } else {
        const imm12 = imm8 | (rotate << 8);
        const instruction =
          (condition << 28) |
          (1 << 25) |
          (op << 21) |
          (S << 20) |
          (rd << 12) |
          imm12;
        return [{ origin: line, encode: instruction }];
      }
    }
  }

  assembleDataProcessing2Ops(line: string): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);
    if (tokens.length > 5) {
      throw new Error(
        `Maximum number of tokens for this instruction is 5: ${line}`,
      );
    }

    if (tokens.length < 3) {
      throw new Error(
        `Minimum number of tokens for this instruction is 3: ${line}`,
      );
    }
    const op = getValueIfKeyExists(DataProcessing, tokens[0].slice(0, 3))!;
    const flag = tokens[0].slice(3);
    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      flag,
    );

    const rd = getValueIfKeyExists(TextToRegister, tokens[1]);
    const rm = getValueIfKeyExists(TextToRegister, tokens[2]);

    if (rd == undefined) {
      throw new Error(`Undefined registers: ${rd}`);
    }

    // Register operator with shift
    if (rm != undefined) {
      let instruction =
        (condition << 28) | (op << 21) | (S << 20) | (rd << 12) | rm;
      if (tokens.length === 4) {
        if (tokens[3] == "RRX") {
          instruction = instruction | (0x3 << 5);
        } else {
          throw new Error(`Invalid Shift ${tokens[4]}`);
        }
      } else if (tokens.length === 5) {
        const shiftType = getValueIfKeyExists(ShiftType, tokens[3]);
        if (shiftType == undefined) {
          throw new Error(`Invalid Shift ${tokens[3]}`);
        }
        const rs = getValueIfKeyExists(TextToRegister, tokens[4]);
        if (rs != undefined) {
          instruction = instruction | (1 << 4) | (shiftType << 5) | (rs << 8);
        } else {
          const imm = this.extractImm(tokens[4]);
          if (imm >= 32) {
            throw new Error(`Shift can not exceed 31: ${imm}`);
          }
          instruction = instruction | (shiftType << 5) | (imm << 7);
        }
      }
      return [{ origin: line, encode: instruction }];
    } else {
      const imm = this.extractImm(tokens[2]);
      const { imm8, rotate } = encodeImm12(imm);
      if (rotate == -1) {
        const {immSeq, tempReg} = this.constructImmSequence(imm, [rd]);
        immSeq.splice(3, 0, {
          origin: line,
          encode: (condition << 28) | (op << 21) | (S << 20) | (rd << 12) | tempReg,
        });
        return immSeq;
      } else {
        const imm12 = imm8 | (rotate << 8);
        const instruction =
          (condition << 28) |
          (1 << 25) |
          (op << 21) |
          (S << 20) |
          (rd << 12) |
          imm12;
        return [{ origin: line, encode: instruction }];
      }
    }
  }

  assembleDataProcessingShift(line: string): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);
    if (tokens.length > 4) {
      throw new Error(
        `Maximum number of tokens for this instruction is 4: ${line}`,
      );
    }

    if (tokens.length < 3) {
      throw new Error(
        `Minimum number of tokens for shift instruction is 3: ${line}`,
      );
    }

    const shiftType = getValueIfKeyExists(ShiftType, tokens[0].slice(0, 3))!;
    const flag = tokens[0].slice(3);
    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      flag,
    );

    const rd = getValueIfKeyExists(TextToRegister, tokens[1]);
    const rbase = getValueIfKeyExists(TextToRegister, tokens[2]);

    if (rd == undefined || rbase == undefined) {
      throw new Error(`Undefined registers: ${rd}`);
    }

    let instruction: number;
    // Special case for RRX
    if (shiftType == undefined) {
      if (tokens.length != 3) {
        throw new Error(
          `Maximum number of tokens for RRX instruction is 3: ${line}`,
        );
      }

      instruction =
        (condition << 28) |
        (DataProcessing.MOV << 21) |
        (S << 20) |
        (rd << 12) |
        (0x3 << 5) |
        rbase;
    }

    // LSL, LSR, ASR, ROR
    else {
      const rs = getValueIfKeyExists(TextToRegister, tokens[3]);
      if (rs != undefined) {
        instruction =
          (condition << 28) |
          (DataProcessing.MOV << 21) |
          (S << 20) |
          (rd << 12) |
          (rs << 8) |
          (shiftType << 5) |
          (1 << 4) |
          rbase;
      } else {
        const imm = this.extractImm(tokens[3]);
        if (imm >= 32) {
          throw new Error(`Shift can not exceed 31: ${imm}`);
        }
        instruction =
          (condition << 28) |
          (DataProcessing.MOV << 21) |
          (S << 20) |
          (rd << 12) |
          (imm << 7) |
          (shiftType << 5) |
          rbase;
      }
    }
    return [{ origin: line, encode: instruction }];
  }

  assembleMul(line: string): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);
    if (tokens.length > 4) {
      throw new Error(
        `The number of tokens for this instruction is 4: ${line}`,
      );
    }
    const flag = tokens[0].slice(3);
    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      flag,
    );

    const rd = getValueIfKeyExists(TextToRegister, tokens[1]);
    const rn = getValueIfKeyExists(TextToRegister, tokens[2]);
    const rm = getValueIfKeyExists(TextToRegister, tokens[3]);

    if (rd == undefined || rn == undefined || rm == undefined) {
      throw new Error(`Undefined registers: ${rd} ${rn} ${rm}`);
    }

    const instruction =
      (condition << 28) |
      (S << 20) |
      (rd << 16) |
      (rm << 8) |
      (0b1001 << 4) |
      rn;
    return [{ origin: line, encode: instruction }];
  }

  assembleMulAcc(line: string): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);
    if (tokens.length > 5) {
      throw new Error(
        `The number of tokens for this instruction is 5: ${line}`,
      );
    }
    let opCode = undefined;
    let flag = "";
    if (tokens[0].startsWith("UMAAL")) {
      opCode = getValueIfKeyExists(MultiplyAcc, "UMAAL");
      flag = tokens[0].slice(5);
    } else {
      opCode = getValueIfKeyExists(MultiplyAcc, tokens[0].slice(0, 3));
      flag = tokens[0].slice(3);
    }

    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      flag,
    );
    if (opCode == MultiplyAcc.MLS && S) {
      throw new Error(`MLS doesn't have S flag: ${line}`);
    }

    const rd = getValueIfKeyExists(TextToRegister, tokens[1]);
    const rn = getValueIfKeyExists(TextToRegister, tokens[2]);
    const rm = getValueIfKeyExists(TextToRegister, tokens[3]);
    const ra = getValueIfKeyExists(TextToRegister, tokens[4]);

    if (
      rd == undefined ||
      rn == undefined ||
      rm == undefined ||
      ra == undefined
    ) {
      throw new Error(`Undefined registers: ${rd} ${rn} ${rm} ${ra}`);
    }

    const instruction =
      (condition << 28) |
      (opCode! << 21) |
      (S << 20) |
      (rd << 16) |
      (ra << 12) |
      (rm << 8) |
      (0b1001 << 4) |
      rn;
    return [{ origin: line, encode: instruction }];
  }

  assembleMulSigned(line: string): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);
    if (tokens.length > 5) {
      throw new Error(
        `The number of tokens for this instruction is 5: ${line}`,
      );
    }

    const op = getValueIfKeyExists(MultiplyAcc, tokens[0].slice(0, 5))!;
    const flag = tokens[0].slice(5);
    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      flag,
    );

    if (op == MultiplyAcc.UMAAL && S) {
      throw new Error(`UMAAL doesn't have S flag ${line}`);
    }

    const rdLo = getValueIfKeyExists(TextToRegister, tokens[1]);
    const rdHi = getValueIfKeyExists(TextToRegister, tokens[2]);
    const rn = getValueIfKeyExists(TextToRegister, tokens[3]);
    const rm = getValueIfKeyExists(TextToRegister, tokens[4]);

    if (
      rdHi == undefined ||
      rn == undefined ||
      rm == undefined ||
      rdLo == undefined
    ) {
      throw new Error(`Undefined registers: ${rdHi} ${rn} ${rm} ${rdLo}`);
    }

    const instruction =
      (condition << 28) |
      (op << 21) |
      (S << 20) |
      (rdHi << 16) |
      (rdLo << 12) |
      (rm << 8) |
      (0b1001 << 4) |
      rn;
    return [{ origin: line, encode: instruction }];
  }

  assembleBlockLoadStore(line: string): InstructionBlob[] {
    const processedLine = line.trim().toUpperCase().replace(/\s+/g, " ");
    const groupSeparator = processedLine.indexOf(",");
    if (groupSeparator == -1) {
      throw new Error(`Instruction missing a , ${line}`);
    }

    const registerList = processedLine.slice(groupSeparator + 1).trim();
    const opAndBaseTokens = processedLine
      .slice(0, groupSeparator)
      .trim()
      .split(" ");

    if (opAndBaseTokens.length != 2) {
      throw new Error(`Invalid instruction tokens: ${line}`);
    }
    const opToken = opAndBaseTokens[0];
    let baseToken = opAndBaseTokens[1];
    let isLoad = 0;
    let baseWrite = 0;
    let opCode = undefined;
    if (opToken.startsWith("L")) {
      opCode = getValueIfKeyExists(BlockLoad, opToken.slice(0, 5));
      isLoad = 1;
    } else {
      opCode = getValueIfKeyExists(BlockStore, opToken.slice(0, 5));
      isLoad = 0;
    }

    if (opCode == undefined) {
      throw new Error(`Unknown Instruction: ${line}`);
    }
    const { extractedFlag: S, condition } = this.extractFlagAndCondition(
      "S",
      opToken.slice(5),
    );

    if (S) {
      throw new Error("There should be no S flag for Block load and store");
    }

    // Check ! flag
    if (baseToken.endsWith("!")) {
      baseWrite = 1;
      baseToken = baseToken.slice(0, baseToken.length - 1);
    }

    const baseRegister = getValueIfKeyExists(TextToRegister, baseToken);

    if (baseRegister == undefined) {
      throw new Error(`Unknown base register: ${baseToken}`);
    }

    // Process list of registers
    const registerTokens = registerList.replace(/{|}/g, "").split(",");
    let registerListEncoding = 0;
    registerTokens.forEach((reg) => {
      const regIndex = getValueIfKeyExists(TextToRegister, reg.trim());
      if (regIndex == undefined) {
        throw new Error(`Unknown register: ${reg}`);
      }
      registerListEncoding = registerListEncoding | (1 << regIndex);
    });

    const instruction =
      (condition << 28) |
      (1 << 27) |
      (opCode << 22) |
      (baseWrite << 21) |
      (isLoad << 20) |
      (baseRegister << 16) |
      registerListEncoding;
    return [{ origin: line, encode: instruction }];
  }

  assembleLoadStore(line: string, pc: number): InstructionBlob[] {
    const tokens: string[] = this.getProcessedToken(line);
    const lastIndex = tokens.length - 1;
    if (tokens.length > 6 || tokens.length < 3) {
      throw new Error(`Invalid Instruction ${line}`);
    }

    if (tokens[lastIndex].endsWith("!") && !tokens[lastIndex].endsWith("]!")) {
      throw new Error(`Invalid offset bracket: ${line}`);
    }

    const op = tokens[0];
    const rt = getValueIfKeyExists(TextToRegister, tokens[1]);
    const { extractedFlag: B, condition } = this.extractFlagAndCondition(
      "B",
      op.slice(3),
    );

    if (rt == undefined) {
      throw new Error(`Unknown register: ${rt}`);
    }

    const isLoad = op.startsWith("L");
    if (tokens.length == 3) {
      // This is load literal
      const originalLabel = line.split(",")[1].trim();
      if (isLoad && this.dataLabels.has(originalLabel)) {
        let offset = this.dataLabels.get(originalLabel)! - pc;
        if (offset < -4095 || offset > 4095) {
          const {immSeq, tempReg} = this.constructImmSequence(
            this.dataLabels.get(originalLabel)!, [rt]
          );
          immSeq.splice(3, 0, {
            origin: line,
            encode:
              (condition << 28) |
              (1 << 26) |
              (1 << 24) |
              (B << 22) |
              (1 << 20) |
              (tempReg << 16) |
              (rt << 12),
          });
          return immSeq;
        } else {
          const U = offset > 0 ? 1 : 0;
          offset = Math.abs(offset);
          const instruction =
            (condition << 28) |
            (1 << 26) |
            (1 << 24) |
            (B << 22) |
            (U << 23) |
            (1 << 20) |
            (0xf << 16) |
            (rt << 12) |
            offset;
          return [{ origin: line, encode: instruction }];
        }
      }
      // Otherwise it is a load/store immediate but with no immediate
      if (!tokens[2].startsWith("[") || !tokens[2].endsWith("]")) {
        throw new Error(`Invalid base syntax: ${line}`);
      }

      // There is no writeBack flag if there is no imm (there is no need)
      const rn = getValueIfKeyExists(
        TextToRegister,
        tokens[2].slice(1, tokens[2].length - 1).trim(),
      );
      if (rn == undefined) {
        throw new Error(`Unknown register: ${rn}`);
      }
      const instruction =
        (condition << 28) |
        (1 << 26) |
        (1 << 24) |
        (B << 22) |
        (Number(isLoad) << 20) |
        (rn << 16) |
        (rt << 12);
      return [{ origin: line, encode: instruction }];
    }
    // if token > 3
    else {
      const writeBack = tokens[lastIndex].endsWith("!") ? 1 : 0;
      tokens[lastIndex] = tokens[lastIndex].replace("!", "");
      const { indexFlag, firstToken, lastToken } = this.getPostIndexFlag(
        tokens[2],
        tokens[lastIndex],
      );
      tokens[lastIndex] = lastToken;
      tokens[2] = firstToken;
      const rn = getValueIfKeyExists(TextToRegister, tokens[2]);
      let U = 1;
      if (rn == undefined) {
        throw new Error(`Unknown register ${rn}`);
      }

      let rm = undefined;
      if (tokens[3].startsWith("-") || tokens[3].startsWith("+")) {
        U = tokens[3].startsWith("-") ? 0 : 1;
        rm = getValueIfKeyExists(TextToRegister, tokens[3].slice(1));
      } else {
        rm = getValueIfKeyExists(TextToRegister, tokens[3]);
      }

      if (tokens.length == 4) {
        if (rm != undefined) {
          if (rn == 15) {
            throw new Error(
              `PC is not allowed as rn in LDR/STR with register offset ${line}`,
            );
          }
          const instruction =
            (condition << 28) |
            (1 << 26) |
            (1 << 25) |
            (indexFlag << 24) |
            (U << 23) |
            (B << 22) |
            (writeBack << 21) |
            (Number(isLoad) << 20) |
            (rn << 16) |
            (rt << 12) |
            rm;
          return [{ origin: line, encode: instruction }];
        } else {
          let imm = this.extractImm(lastToken);
          U = imm < 0 ? 0 : 1;
          imm = Math.abs(imm);
          if (imm <= 4095) {
            const instruction =
              (condition << 28) |
              (1 << 26) |
              (indexFlag << 24) |
              (U << 23) |
              (B << 22) |
              (writeBack << 21) |
              (Number(isLoad) << 20) |
              (rn << 16) |
              (rt << 12) |
              imm;
            return [{ origin: line, encode: instruction }];
          } else {
            const {immSeq, tempReg} = this.constructImmSequence(imm, [rt, rn]);

            immSeq.splice(3, 0, {
              origin: line,
              encode:
                (condition << 28) |
                (1 << 26) |
                (1 << 25) |
                (indexFlag << 24) |
                (U << 23) |
                (B << 22) |
                (writeBack << 21) |
                (Number(isLoad) << 20) |
                (rn << 16) |
                (rt << 12) |
                tempReg,
            });
            return immSeq;
          }
        }
      } else if (tokens.length == 5) {
        if (lastToken != "RRX") {
          throw new Error(`Invalid instruction ${line}`);
        }

        if (rm == undefined) {
          throw new Error(`Unknown Register ${rm}`);
        }

        if (rn == 15) {
          throw new Error(
            `PC is not allowed as rn in LDR/STR with register offset ${line}`,
          );
        }
        const instruction =
          (condition << 28) |
          (1 << 26) |
          (1 << 25) |
          (indexFlag << 24) |
          (U << 23) |
          (B << 22) |
          (writeBack << 21) |
          (Number(isLoad) << 20) |
          (rn << 16) |
          (rt << 12) |
          (0b11 << 5) |
          rm;
        return [{ origin: line, encode: instruction }];
      } else {
        const shiftType = getValueIfKeyExists(ShiftType, tokens[4]);
        if (shiftType == undefined) {
          throw new Error(`Unknown Register ${rm}`);
        }

        if (rm == undefined) {
          throw new Error(`Unknown Register ${rm}`);
        }

        if (rn == 15) {
          throw new Error(
            `PC is not allowed as rn in LDR/STR with register offset ${line}`,
          );
        }

        const shiftAmount = this.extractImm(tokens[5]);
        if (shiftAmount >= 32) {
          throw new Error(
            `Shift amount can only be from 0~31: receiving ${shiftAmount}`,
          );
        }

        const instruction =
          (condition << 28) |
          (1 << 26) |
          (1 << 25) |
          (indexFlag << 24) |
          (U << 23) |
          (B << 22) |
          (writeBack << 21) |
          (Number(isLoad) << 20) |
          (rn << 16) |
          (rt << 12) |
          (shiftAmount << 7) |
          (shiftType << 5) |
          rm;
        return [{ origin: line, encode: instruction }];
      }
    }
  }

  assembleSwap(line: string): InstructionBlob[] {
    const tokens = this.getProcessedToken(line);
    const op = tokens[0];
    if (tokens.length !== 4) {
      throw new Error(`Invalid Instruction ${line}`);
    }

    const { extractedFlag: B, condition } = this.extractFlagAndCondition(
      "B",
      op.slice(3),
    );
    const rt = getValueIfKeyExists(TextToRegister, tokens[1]);
    const rt2 = getValueIfKeyExists(TextToRegister, tokens[2]);
    if (!(tokens[3].startsWith("[") && tokens[3].endsWith("]"))) {
      throw new Error(`Invalid syntax ${line}`);
    }

    const rn = getValueIfKeyExists(
      TextToRegister,
      tokens[3].replace(/\[|\]/g, "").trim(),
    );

    if (rt == undefined || rt2 == undefined || rn == undefined) {
      throw new Error(
        `Unknown register: ${rt == undefined ? tokens[1] : rt2 == undefined ? tokens[2] : tokens[3]}`,
      );
    }
    const instruction =
      (condition << 28) |
      (1 << 24) |
      (B << 22) |
      (rn << 16) |
      (rt << 12) |
      (0b1001 << 4) |
      rt2;
    return [{ origin: line, encode: instruction }];
  }

  assembleBranch(line: string, pc: number): InstructionBlob[] {
    const tokens: string[] = line.split(" ");
    tokens.forEach((token, index) => (tokens[index] = token.trim()));
    const op = tokens[0].toUpperCase();
    let instruction = 0;
    if (op.startsWith("BLX") && (op.length === 3 || op.length === 5)) {
      const { condition } = this.extractFlagAndCondition("", op.slice(3));
      const rm = getValueIfKeyExists(TextToRegister, tokens[1]);
      if (rm == undefined) {
        throw new Error(`Unknown register: ${rm}`);
      }
      instruction =
        (condition << 28) |
        (1 << 24) |
        (1 << 21) |
        (0xfff << 8) |
        (0x3 << 4) |
        rm;
    } else if (op.startsWith("BX") && (op.length === 2 || op.length === 4)) {
      const { condition } = this.extractFlagAndCondition("", op.slice(2));
      const rm = getValueIfKeyExists(TextToRegister, tokens[1]);
      if (rm == undefined) {
        throw new Error(`Unknown register: ${rm}`);
      }
      instruction =
        (condition << 28) |
        (1 << 24) |
        (1 << 21) |
        (0xfff << 8) |
        (0x1 << 4) |
        rm;
    } else if (op.startsWith("BL") && (op.length === 2 || op.length === 4)) {
      const { condition } = this.extractFlagAndCondition("", op.slice(2));
      const address = this.subroutineLabels.get(tokens[1]);
      if (address == undefined) {
        throw new Error(`Undefine label: ${tokens[1]}`);
      }
      const offset = address - pc;
      if (offset < -33554432 || offset > 33554428) {
        throw new Error(`Branch offset too large: ${offset}`);
      }
      instruction =
        (condition << 28) | (0b1011 << 24) | ((offset >> 2) & 0x00ffffff);
    } else {
      const { condition } = this.extractFlagAndCondition("", op.slice(1));
      const address = this.subroutineLabels.get(tokens[1]);
      if (address == undefined) {
        throw new Error(`Undefine label: ${tokens[1]}`);
      }
      const offset = address - pc;
      if (offset < -33554432 || offset > 33554428) {
        throw new Error(`Branch offset too large: ${offset}`);
      }
      instruction =
        (condition << 28) | (0b1010 << 24) | ((offset >> 2) & 0x00ffffff);
    }

    return [{ origin: line, encode: instruction }];
  }

  getPostIndexFlag(
    firstToken: string,
    lastToken: string,
  ): { indexFlag: number; firstToken: string; lastToken: string } {
    if (firstToken.startsWith("[") && lastToken.endsWith("]")) {
      return {
        indexFlag: 1,
        firstToken: firstToken.slice(1),
        lastToken: lastToken.slice(0, lastToken.length - 1),
      };
    } else if (firstToken.startsWith("[") && firstToken.endsWith("]")) {
      return {
        indexFlag: 0,
        firstToken: firstToken.replace(/\[|\]/g, ""),
        lastToken: lastToken,
      };
    } else {
      throw new Error("Invalid bracket");
    }
  }

  constructImmSequence(imm: number, operands: number[]): { immSeq: InstructionBlob[], tempReg: number} {
    // push R12 (AKA the scratch register), use MOVT and MOVW to load the immediate, add that register normally, POP R12
    // use R12 by default by if R12 is one of the operand, use another register that is not in the operand list
    let tempReg = 0xc
    if(operands.includes(tempReg))
    {
      for(let i = 0; i < 16; i++)
      {
        if (!operands.includes(i))
        {
          tempReg = i;
          break;
        }
      }
    }

    if (imm > 0x7fffffff || imm < 1 << 31) {
      throw new Error(`imm out of 32 bit range: ${imm}`);
    }

    const tempRegName = "R" + tempReg.toString()
    const topHalf = (imm & 0xffff0000) >>> 16;
    const bottomHalf = imm & 0x0000ffff;
    return {immSeq: [
      {
        origin: `PUSH {${tempRegName}}`,
        encode:
          (0xe << 28) | (0x9 << 24) | (1 << 21) | (0xd << 16) | (1 << tempReg),
      },
      {
        origin: `MOVW ${tempRegName}, #${bottomHalf}`,
        encode:
          (0xe << 28) |
          (0x3 << 24) |
          (((bottomHalf & 0xf000) >>> 12) << 16) |
          (tempReg << 12) |
          (bottomHalf & 0x0fff),
      },
      {
        origin: `MOVT ${tempRegName}, #${topHalf}`,
        encode:
          (0xe << 28) |
          (0x3 << 24) |
          (1 << 22) |
          (((topHalf & 0xf000) >>> 12) << 16) |
          (tempReg << 12) |
          (topHalf & 0x0fff),
      },
      {
        origin: `POP {${tempRegName}}`,
        encode:
          (0xe << 28) |
          (0x8 << 24) |
          (1 << 23) |
          (1 << 21) |
          (1 << 20) |
          (0xd << 16) |
          (1 << tempReg),
      },
    ], tempReg: tempReg}
  }

  assembleCode(codeSection: string) {
    const lines = codeSection.split("\n");

    let pc = CODE_SEGMENT;
    const toFix: number[] = [];
    if (lines[0].trim() != CODE_SECTION) {
      throw new Error(".text directive must be on its own line");
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // ignore empty line
      if (line == "") {
        continue;
      }

      // ignore comment
      if (line.startsWith(";")) {
        continue;
      }

      let op = line.split(" ", 1)[0];
      // extract op

      if (this.isLabel(op)) {
        this.subroutineLabels.set(op.replace(":", ""), pc);
        continue;
      }

      // Encode instruction
      op = op.toLowerCase();
      let newInstruction: InstructionBlob[] = [];
      if (this.opStartWithGroup(DATA_PROCESSING_3_OPS, op)) {
        newInstruction = this.assembleDataProcessing3Ops(line);
      } else if(this.opStartWithGroup(IMMEDIATE_MOVE, op)){
        newInstruction = this.assembleImmediateMove(line);
      } else if (this.opStartWithGroup(DATA_PROCESSING_MOV, op)) {
        newInstruction = this.assembleDataProcessingMov(line);
      } else if (this.opStartWithGroup(DATA_PROCESSING_2_OPS, op)) {
        newInstruction = this.assembleDataProcessing2Ops(line);
      } else if (this.opStartWithGroup(DATA_PROCESSING_TEST, op)) {
        newInstruction = this.assembleDataProcessingTest(line);
      } else if (this.opStartWithGroup(DATA_PROCESSING_SHIFT, op)) {
        newInstruction = this.assembleDataProcessingShift(line);
      } else if (this.opStartWithGroup(BLOCK_LOAD_STORE, op)) {
        newInstruction = this.assembleBlockLoadStore(line);
      } else if (this.opStartWithGroup(BLOCK_LOAD_STORE_INCREMENT_AFTER, op)) {
        let modifiedLine = line;
        if (op.startsWith("stm")) {
          modifiedLine = modifiedLine.replace(/stm/i, "stmia");
        } else if (op.startsWith("ldm")) {
          modifiedLine = modifiedLine.replace(/ldm/i, "ldmia");
        }
        newInstruction = this.assembleBlockLoadStore(modifiedLine);
        newInstruction[0].origin = line;
      } else if (this.opStartWithGroup(LOAD_STORE, op)) {
        newInstruction = this.assembleLoadStore(line, pc);
      } else if (this.opStartWithGroup(POP_PUSH, op)) {
        let modifiedLine = line;
        if (op.startsWith("push")) {
          const flag = op.slice(4);
          modifiedLine =
            "stmdb" + flag + " sp!," + modifiedLine.slice(op.length + 1);
        } else if (op.startsWith("pop")) {
          const flag = op.slice(3);
          modifiedLine =
            "ldmia" + flag + " sp!," + modifiedLine.slice(op.length + 1);
        }
        newInstruction = this.assembleBlockLoadStore(modifiedLine);
        newInstruction[0].origin = line;
      } else if (this.opStartWithGroup(MUL_SIGNED, op)) {
        newInstruction = this.assembleMulSigned(line);
      } else if (this.opStartWithGroup(MUL_ACC, op)) {
        newInstruction = this.assembleMulAcc(line);
      } else if (op.startsWith(MUL)) {
        newInstruction = this.assembleMul(line);
      } else if (op.startsWith(SWP)) {
        newInstruction = this.assembleSwap(line);
      } else if (this.opStartWithGroup(BRANCH, op)) {
        toFix.push(pc);
        newInstruction = [{ origin: line, encode: 0 }];
      } else {
        throw new Error(`Unknown instruction: ${line}`);
      }

      for (let i = 0; i < newInstruction.length; i++) {
        this.instructionBlobs.set(pc, newInstruction[i]);
        pc += 4;
      }
      this.instructionBlobs.set(pc, {encode: 0xFFFFFFFF, origin: CODE_END})
    }

    toFix.forEach((branch_pc) => {
      // There is only one instruction for branch
      const newInstruction = this.assembleBranch(
        this.instructionBlobs.get(branch_pc)!["origin"],
        branch_pc,
      );
      this.instructionBlobs.set(branch_pc, newInstruction[0]);
    });
  }

  opStartWithGroup(prefixGroup: string[], op: string) {
    return prefixGroup.some((prefix) => op.startsWith(prefix));
  }

  assembleData(dataSection: string) {
    const lines = dataSection.split("\n");
    let byteCount = 0;
    if (lines[0].trim() != DATA_SECTION) {
      throw new Error(".data directive must be on its own line");
    }

    for (let i = 1; i < lines.length; i++) {
      // ignore empty line
      if (lines[i].trim() == "") {
        continue;
      }

      //ignore comment
      if (lines[i].startsWith(";")) {
        continue;
      }
      const line = lines[i].trim();
      const tokens = line.split(" ");
      if (!this.isLabel(tokens[0])) {
        throw new Error(`${tokens[0]} is not a valid label`);
      }

      if (tokens.length < 3) {
        throw new Error(
          "Data directives must have at least a label, a directive and a value",
        );
      }

      if (tokens[1] == ASCIZ_DIRECTIVE || tokens[1] == STRING_DIRECTIVE) {
        let string_value = tokens.slice(2).join(" ");

        if (!/^".*"$/gs.test(string_value)) {
          throw new Error("The value is not a string");
        }

        string_value = string_value.replace(/^"|"$/g, "");

        // set label address
        this.dataLabels.set(tokens[0].replace(":", ""), byteCount);
        const asciiArray = Array.from(string_value).map((char) =>
          char.charCodeAt(0),
        );

        // Add the array of characters as ascii code
        this.dataBlobs = this.dataBlobs.concat(asciiArray);
        this.dataBlobs.push(0);
        byteCount += asciiArray.length + 1;
      } else if (tokens[1] == INT_DIRECTIVE) {
        if (tokens.length > 3 || isNaN(Number(tokens[2]))) {
          throw new Error("value to .int is not an integer");
        }

        this.dataLabels.set(tokens[0].replace(":", ""), byteCount);
        // Write the integer as 4 bytes
        const int8Array = new Word(Number(tokens[2])).view;
        for (let i = 0; i < 4; i++) {
          this.dataBlobs.push(int8Array.getUint8(i));
        }
        byteCount += 4;
      } else {
        throw new Error(`Unrecognized directive ${tokens[1]}`);
      }
    }

    //Calculate where memoryStart and callibrate the address location of label
    const memoryStart = CODE_SEGMENT - byteCount;
    for (const [key, value] of this.dataLabels) {
      this.dataLabels.set(key, value + memoryStart);
    }
  }

  getProcessedToken(line: string, isUpper: boolean = true) {
    let processedLine = line.trim().toUpperCase().replace(/\s+/g, " "); //normalize space
    if (isUpper) {
      processedLine = processedLine.toUpperCase();
    }

    let tokensList: string[] = [];
    const firstToken = processedLine.split(" ", 1)[0];
    const otherTokens = processedLine.slice(firstToken.length).split(",");
    tokensList.push(firstToken);
    otherTokens.forEach((token) => {
      tokensList.push(token.trim());
    });

    // Incase the last token is <shiftType> amount
    const hasShift = Object.keys(ShiftType).some((shiftType) => {
      return tokensList[tokensList.length - 1]
        .toUpperCase()
        .includes(shiftType);
    });
    if (hasShift && tokensList[tokensList.length - 1].split(" ").length == 2) {
      const lastToken = tokensList.pop()!;

      tokensList = tokensList.concat(lastToken.split(" "));
    }
    return tokensList;
  }

  isLabel(label: string): boolean {
    // If a label doesn't end with :, or start with non alphabet or contain special symbol, it is not a valid label
    const cleanLabel = label.slice(0, label.length - 1);
    if (
      !label.endsWith(":") ||
      /^[^A-Za-z]/.test(cleanLabel) ||
      /[^A-Za-z0-9_]/.test(cleanLabel)
    ) {
      return false;
    }

    return true;
  }

  extractImm(imm: string): number {
    if (!imm.startsWith("#")) {
      throw new Error(`A number format should be #XXXX: ${imm}`);
    }
    const extractedNum = Number(imm.slice(1));
    if (isNaN(extractedNum)) {
      throw new Error(`This is not an number: ${imm}`);
    }
    return extractedNum;
  }

  extractFlagAndCondition(
    flagToExtract: string,
    flag: string,
  ): { extractedFlag: number; condition: number } {
    let conditionCode: number | undefined = Condition.AL;
    let extractedFlag = 0;
    if (flag.length === 0) {
      return {
        extractedFlag: extractedFlag,
        condition: conditionCode,
      };
    }
    if (flag.length === 1) {
      if (flag != flagToExtract) {
        throw new Error(`Unknown flag: reading ${flag}`);
      }
      extractedFlag = 1;
    } else if (flag.length === 2) {
      conditionCode = getValueIfKeyExists(Condition, flag);
      if (conditionCode == undefined) {
        throw new Error(`Unknown conditional flag ${flag}`);
      }
    } else if (flag.length === 3) {
      conditionCode = getValueIfKeyExists(Condition, flag.slice(1));
      if (flag[0] != flagToExtract || conditionCode == undefined) {
        throw new Error(`Unknown flag ${flag}`);
      }
      extractedFlag = 1;
    } else {
      throw new Error(`Unknown flag ${flag}`);
    }

    return {
      extractedFlag: extractedFlag,
      condition: conditionCode,
    };
  }
}
