export type InstructionDoc = {name: string, syntax: string, example: string}
export type ConditionDoc = {cond: string, mnemonic: string, meaning: string, condition_flag: string}


export const DATA_PROCESSING_REG_SHIFT_IMM_DOCS : InstructionDoc[] = [
    {name: "AND", syntax: "AND{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "ANDSEQ R1, R2, R3, LSL #1"},
    {name: "EOR", syntax: "EOR{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "EOREQ R1, R2, R3, LSL #1"},
    {name: "SUB", syntax: "SUB{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "SUBSEQ R1, R2, R3, LSL #1"},
    {name: "RSB", syntax: "RSB{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "RSBSEQ R1, R2, R3, LSL #1"},
    {name: "ADD", syntax: "ADD{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "ADDSEQ R1, R2, R3, LSL #1"},
    {name: "ADC", syntax: "ADC{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "ADCSEQ R1, R2, R3, LSL #1"},
    {name: "SBC", syntax: "SBC{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "SBCSEQ R1, R2, R3, LSL #1"},
    {name: "RSC", syntax: "RSC{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "RSCSEQ R1, R2, R3, LSL #1"},
    {name: "TST", syntax: "TST<c> <Rn>, <Rm>{, <shift>}", example: "TSTEQ R2, R3, LSL #1"},
    {name: "TEQ", syntax: "TEQ<c> <Rn>, <Rm>{, <shift>}", example: "TEQEQ R2, R3, LSL #1"},
    {name: "CMP", syntax: "CMP<c> <Rn>, <Rm>{, <shift>}", example: "CMPEQ R2, R3, LSL #1"},
    {name: "CMN", syntax: "CMN<c> <Rn>, <Rm>{, <shift>}", example: "CMNEQ R2, R3, LSL #1"},
    {name: "ORR", syntax: "ORR{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "ORRSEQ R1, R2, R3, LSL #1"},
    {name: "MOV", syntax: "MOV{S}<c> <Rd> <Rm>", example: "MOVSEQ R1, R2"},
    {name: "LSL", syntax: "LSL{S}<c> <Rd>, <Rm>, #<imm5>", example: "LSLSEQ R2, R3, #1"},
    {name: "LSR", syntax: "LSR{S}<c> <Rd>, <Rm>, #<imm5>", example: "LSRSEQ R2, R3, #1"},
    {name: "ASR", syntax: "ASR{S}<c> <Rd>, <Rm>, #<imm5>", example: "ASRSEQ R2, R3, #1"},
    {name: "RRX", syntax: "RRX{S}<c> <Rd>, <Rm>", example: "RRXSEQ R1, R2"},
    {name: "ROR", syntax: "ROR{S}<c> <Rd>, <Rm>, #<imm5>", example: "RORSEQ R1, R3, #1"},
    {name: "BIC", syntax: "BIC{S}<c> <Rd>, <Rn>, <Rm>{, <shift>}", example: "BICSEQ R1, R2, R3, LSL #1"},
    {name: "MVN", syntax: "MVN{S}<c> <Rd>, <Rm>{, <shift>}", example: "MVNSEQ R2, R3, LSL #1"},
]

export const DATA_PROCESSING_REG_SHIFT_REG_DOCS : InstructionDoc[] = [
    {name: "AND", syntax: "AND{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "ANDSEQ R1, R2, R3, LSL R4"},
    {name: "EOR", syntax: "EOR{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "EOREQ R1, R2, R3, LSL R4"},
    {name: "SUB", syntax: "SUB{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "SUBSEQ R1, R2, R3, LSL R4"},
    {name: "RSB", syntax: "RSB{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "RSBSEQ R1, R2, R3, LSL R4"},
    {name: "ADD", syntax: "ADD{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "ADDSEQ R1, R2, R3, LSL R4"},
    {name: "ADC", syntax: "ADC{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "ADCSEQ R1, R2, R3, LSL R4"},
    {name: "SBC", syntax: "SBC{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "SBCSEQ R1, R2, R3, LSL R4"},
    {name: "RSC", syntax: "RSC{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "RSCSEQ R1, R2, R3, LSL R4"},
    {name: "TST", syntax: "TST<c> <Rn>, <Rm>, <type> <Rs>", example: "TSTEQ R2, R3, LSL R4"},
    {name: "TEQ", syntax: "TEQ<c> <Rn>, <Rm>, <type> <Rs>", example: "TEQEQ R2, R3, LSL R4"},
    {name: "CMP", syntax: "CMP<c> <Rn>, <Rm>, <type> <Rs>", example: "CMPEQ R2, R3, LSL R4"},
    {name: "CMN", syntax: "CMN<c> <Rn>, <Rm>, <type> <Rs>", example: "CMNEQ R2, R3, LSL R4"},
    {name: "ORR", syntax: "ORR{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "ORRSEQ R1, R2, R3, LSL R4"},
    {name: "LSL", syntax: "LSL{S}<c> <Rd>, <Rn>, <Rm>", example: "LSLSEQ R2, R3, R4"},
    {name: "LSR", syntax: "LSR{S}<c> <Rd>, <Rm>, <Rm>", example: "LSRSEQ R2, R3, R4"},
    {name: "ASR", syntax: "ASR{S}<c> <Rd>, <Rm>, <Rm>", example: "ASRSEQ R2, R3, R4"},
    {name: "ROR", syntax: "ROR{S}<c> <Rd>, <Rm>, <Rm>", example: "RORSEQ R1, R3, R4"},
    {name: "BIC", syntax: "BIC{S}<c> <Rd>, <Rn>, <Rm>, <type> <Rs>", example: "BICSEQ R1, R2, R3, LSL R4"},
    {name: "MVN", syntax: "MVN{S}<c> <Rd>, <Rm>, <type> <Rs>", example: "MVNSEQ R2, R3, LSL R4"},
]

export const DATA_PROCESSING_IMM_DOCS : InstructionDoc[] = [
    {name: "AND", syntax: "AND{S}<c> <Rd>, <Rn>, #<const>", example: "ANDSEQ R1, R2, #8"},
    {name: "EOR", syntax: "EOR{S}<c> <Rd>, <Rn>, #<const>", example: "EOREQ R1, R2, #8"},
    {name: "SUB", syntax: "SUB{S}<c> <Rd>, <Rn>, #<const>", example: "SUBSEQ R1, R2, #8"},
    {name: "RSB", syntax: "RSB{S}<c> <Rd>, <Rn>, #<const>", example: "RSBSEQ R1, R2, #8"},
    {name: "ADD", syntax: "ADD{S}<c> <Rd>, <Rn>, #<const>", example: "ADDSEQ R1, R2, #8"},
    {name: "ADC", syntax: "ADC{S}<c> <Rd>, <Rn>, #<const>", example: "ADCSEQ R1, R2, #8"},
    {name: "SBC", syntax: "SBC{S}<c> <Rd>, <Rn>, #<const>", example: "SBCSEQ R1, R2, #8"},
    {name: "RSC", syntax: "RSC{S}<c> <Rd>, <Rn>, #<const>", example: "RSCSEQ R1, R2, #8"},
    {name: "TST", syntax: "TST<c> <Rn>, #<const>", example: "TSTEQ R2, #8"},
    {name: "TEQ", syntax: "TEQ<c> <Rn>, #<const>", example: "TEQEQ R2, #8"},
    {name: "CMP", syntax: "CMP<c> <Rn>, #<const>", example: "CMPEQ R2, #8"},
    {name: "CMN", syntax: "CMN<c> <Rn>, #<const>", example: "CMNSEQ R2, #8"},
    {name: "ORR", syntax: "ORR{S}<c> <Rd>, #<const>", example: "ORRSEQ R1, #8"},
    {name: "MOV", syntax: "MOV{S}<c> <Rd>, #<const>", example: "MOVSEQ R2, #8"},
    {name: "BIC", syntax: "BIC{S}<c> <Rd>, <Rn>, #<const>", example: "BICSEQ R1, R2, #8"},
    {name: "MVN", syntax: "MVN{S}<c> <Rd>, #<const>", example: "MVNSEQ R2, #8"},
]

export const MUL_ACC_DOCS : InstructionDoc[] = [
    {name: "MUL", syntax: "MUL{S}<c> <Rd>, <Rn>, <Rm>", example: "MULSEQ R1, R2, R3"},
    {name: "MLA", syntax: "MLA{S}<c> <Rd>, <Rn>, <Rm>, <Ra>", example: "MLASEQ R1, R2, R3, R4"},
    {name: "UMAAL", syntax: "UMAAL<c> <RdLo>, <RdHi>, <Rn>, <Rm>", example: "UMAALEQ R1, R2, R3, R4"},
    {name: "MLS", syntax: "MLS<c> <Rd>, <Rn>, <Rm>, <Ra>", example: "MLSEQ R1, R2, R3, R4"},
    {name: "UMULL", syntax: "UMULL{S}<c> <RdLo>, <RdHi>, <Rn>, <Rm>", example: "UMULLSEQ R1, R2, R3, R4"},
    {name: "UMLAL", syntax: "UMLAL{S}<c> <RdLo>, <RdHi>, <Rn>, <Rm>", example: "UMLALSEQ R1, R2, R3, R4"},
    {name: "SMULL", syntax: "SMULL{S}<c> <RdLo>, <RdHi>, <Rn>, <Rm>", example: "SMULLSEQ R1, R2, R3, R4"},
    {name: "SMLAL", syntax: "SMLAL{S}<c> <RdLo>, <RdHi>, <Rn>, <Rm>", example: "SMLALSEQ R1, R2, R3, R4"},
]

export const BLOCK_DATA_TRANSFER_DOCS : InstructionDoc[] = [
    {name: "STMDA", syntax: "STMDA<c> <Rn>{!}, <registers>", example: "STMDAEQ R1!, {R2, R3}"},
    {name: "STM/STMIA", syntax: "STM/STMIA<c> <Rn>{!}, <registers>", example: "STMEQ R1!, {R2, R3}"},
    {name: "STMDB", syntax: "STMDB<c> <Rn>{!}, <registers>", example: "STMDBEQ R1!, {R2, R3}"},
    {name: "STMIB ", syntax: "STMIB<c> <Rn>{!}, <registers>", example: "STMIBEQ R1!, {R2, R3}"},
    {name: "LDMDA", syntax: "LDMDA<c> <Rn>{!}, <registers>", example: "LDMDAEQ R1!, {R2, R3}"},
    {name: "LDM/LDMIA", syntax: "LDM/LDMIA<c> <Rn>{!}, <registers>", example: "LDMEQ R1!, {R2, R3}"},
    {name: "LDMDB", syntax: "LDMDB<c> <Rn>{!}, <registers>", example: "LDMDBEQ R1!, {R2, R3}"},
    {name: "LDMIB", syntax: "LDMIB<c> <Rn>{!}, <registers>", example: "LDMIBEQ R1!, {R2, R3}"},
    {name: "POP", syntax: "POP<c> <registers>", example: "POPEQ {R2, R3}"},
    {name: "PUSH", syntax: "PUSH<c> <registers>", example: "PUSHEQ {R2, R3}"},
]

export const LOAD_STORE_DOCS : InstructionDoc[] = [
    {name: "STR", syntax: "STR<c> <Rt>, [<Rn>{, #+/-<imm12>}]", example: "STREQ R1, [R0, #10]"},
    {name: "STR", syntax: "STR<c> <Rt>, [<Rn>], #+/-<imm12>", example: "STREQ R1, [R0], #10"},
    {name: "STR", syntax: "STR<c> <Rt>, [<Rn>, #+/-<imm12>]!", example: "STREQ R1, [R0, #10]!"},
    {name: "STR", syntax: "STR<c> <Rt>, [<Rn>, <Rm>{, <shift>}]", example: "STREQ R1, [R0, R2, LSL #10]"},
    {name: "STR", syntax: "STR<c> <Rt>, [<Rn>, <Rm>{, <shift>}]!", example: "STREQ R1, [R0, R2, ASR #10]!"},
    {name: "STR", syntax: "STR<c> <Rt>, [<Rn>], <Rm>{, <shift>}", example: "STREQ R1, [R0], R2, ROR #10"},
    {name: "LDR", syntax: "LDR<c> <Rt>, [<Rn>{, #+/-<imm12>}]", example: "LDREQ R1, [R0, #10]"},
    {name: "LDR", syntax: "LDR<c> <Rt>, [<Rn>], #+/-<imm12>", example: "LDREQ R1, [R0], #10"},
    {name: "LDR", syntax: "LDR<c> <Rt>, [<Rn>, #+/-<imm12>]!", example: "LDREQ R1, [R0, #10]!"},
    {name: "LDR", syntax: "LDR<c> <Rt>, [<Rn>, <Rm>{, <shift>}]", example: "LDREQ R1, [R0, R2, LSL #10]"},
    {name: "LDR", syntax: "LDR<c> <Rt>, [<Rn>, <Rm>{, <shift>}]!", example: "LDREQ R1, [R0, R2, ASR #10]!"},
    {name: "LDR", syntax: "LDR<c> <Rt>, [<Rn>], <Rm>{, <shift>}", example: "LDREQ R1, [R0], R2, ROR #10"},
    {name: "LDR", syntax: "LDR<c> <Rt>, <label>", example: "LDREQ R0, label"},
]

export const BRANCH_DOCS : InstructionDoc[] = [
    {name: "B", syntax: "B<c> <label>", example: "BEQ label"},
    {name: "BL", syntax: "BL<c> <label>", example: "BLEQ label"},
    {name: "BX", syntax: "BX<c> <Rm>", example: "BX R0"},
    {name: "BLX ", syntax: "BLX<c> <Rm>", example: "BLX R0"},
]

export const SWAP_DOCS : InstructionDoc[] = [
    {name: "SWP", syntax: "SWP{B}<c> <Rt>, <Rt2>, [<Rn>]", example: "SWP R1, R2, [R3]"},
]

export const CONDITION_DOCS : ConditionDoc[]  = [
    {cond: "0000", mnemonic: "EQ", meaning: "Equal", condition_flag:"Z==1"},
    {cond: "0001", mnemonic: "NE", meaning: "Not equal", condition_flag:"Z==0"},
    {cond: "0010", mnemonic: "CS", meaning: "Carry set", condition_flag:"C==1"},
    {cond: "0011", mnemonic: "CC", meaning: "Carry clear", condition_flag:"C==0"},
    {cond: "0100", mnemonic: "MI", meaning: "Minus, negative", condition_flag:"N==1"},
    {cond: "0101", mnemonic: "PL", meaning: "Plus, positive or zero", condition_flag:"N==0"},
    {cond: "0110", mnemonic: "VS", meaning: "Overflow", condition_flag:"V==1"},
    {cond: "0111", mnemonic: "VC", meaning: "No overflow", condition_flag:"V==0"},
    {cond: "1000", mnemonic: "HI", meaning: "Unsigned higher", condition_flag:"C==1 and Z==0"},
    {cond: "1001", mnemonic: "LS", meaning: "Unsigned lower or same", condition_flag:"C==0 or Z==1"},
    {cond: "1010", mnemonic: "GE", meaning: "Signed greater than or equal", condition_flag:"N==V"},
    {cond: "1011", mnemonic: "LT", meaning: "Signed less than", condition_flag:"N!=V"},
    {cond: "1100", mnemonic: "GT", meaning: "Signed greater than", condition_flag:"Z==0 and N== V"},
    {cond: "1101", mnemonic: "LE", meaning: "Signed less than or equal", condition_flag:"Z==1 or N!=V"},
    {cond: "1110", mnemonic: "AL", meaning: "Always (unconditional)", condition_flag:"Any"},
]