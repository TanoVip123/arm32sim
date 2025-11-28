import { createContext } from "react";
import type { ArmAssembler } from "../interface/Assembler";
import type { ArmSimulator } from "../interface/simulator";
import type { RegisterFile } from "../interface/registerFile";
import type { Memory } from "../interface/memory";
import type { ArmALU } from "../interface/ALU";

export interface Machine {
  code: string;
  assembler: ArmAssembler;
  simulator: ArmSimulator;
  registerFile: RegisterFile;
  memory: Memory;
  alu: ArmALU;
}

interface MachineContextType {
  machine: Machine | undefined;
  setMachine: React.Dispatch<React.SetStateAction<Machine>> | undefined;
}

export const MachineContext = createContext<MachineContextType>({
  machine: undefined,
  setMachine: undefined,
});
