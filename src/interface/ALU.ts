import type { NZCV } from "../types/flags";
import type { ShiftType } from "../types/shiftType";
import { Imm12, Word } from "../types/binType";

// ALU only does calculation and spit out the result
// It is not suppose to write to any memory, that is handled somewhere else
export interface ArmALU {
  nzcv: NZCV;

  //register version
  and(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  eor(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  sub(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  rsb(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  add(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  adc(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  sbc(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  rsc(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  orr(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  bic(
    rn: Word,
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  mvn(
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };
  shift(
    rm: Word,
    shift: number,
    shiftType: ShiftType,
  ): { result: Word; nzcv: NZCV };

  // Have immediate version
  i_and(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_eor(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_sub(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_rsb(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_add(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_adc(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_sbc(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_rsc(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_orr(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_mov(imm12: Imm12): { result: Word; nzcv: NZCV };
  i_bic(rn: Word, imm12: Imm12): { result: Word; nzcv: NZCV };
  i_mvn(imm12: Imm12): { result: Word; nzcv: NZCV };

  updateNZCV(NZCV: NZCV): void;
}
