import type { InstructionBlob } from "../types/instructions";

export interface ArmAssembler {
  assemble(code: string): {
    data: number[];
    instructions: Map<number, InstructionBlob>;
  };
}
