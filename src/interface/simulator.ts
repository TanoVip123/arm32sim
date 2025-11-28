import type { Word } from "../types/binType";

export interface ArmSimulator {
  isSimulationDone(): boolean;
  reset(): void;
  runOnce(): void;
  execInstruction(instruction: Word): void;
}
