export const DEFAULT_CODE = `.data
  data1: .int 1
  data2: .int 2
.text
  LDR R1, data1
  LDR R2, data2
Loops:
  ADD R3, R1, R2
    ADD R4, R4, R1, LSL #2
  SUBS R1, R1, R1
    ADD R7, R7, #1
  MOVEQ R5, #1
  MOVNE R6, #1
    MOV R9, #-2147483648
    MOV R8, #1073741904
    STR R7, [R8]
B Loops`