import "react";
import "./App.css";
import { Navigate, NavLink, Route, Routes } from "react-router";
import ArmEditor from "./pages/editor";
import Simulator from "./pages/simulator";
import Documentation from "./pages/documentation";
import type { Machine } from "./pages/context";
import { MachineContext } from "./pages/context";
import { Arm32RegisterFile } from "./components/arm32RegisterFile";
import { Arm32Memory } from "./components/arm32Memory";
import { Arm32ALU } from "./components/arm32ALU";
import { Arm32Simulator } from "./components/arm32Simulator";
import { Arm32Assembler } from "./components/arm32Assembler";
import { useState } from "react";
import { DEFAULT_CODE } from "./constants/defaultCode";

function createMachine(): Machine {
  const registerFile = new Arm32RegisterFile();
  const memory = new Arm32Memory();
  const alu = new Arm32ALU();
  const simulator = new Arm32Simulator(alu, registerFile, memory);
  const assembler = new Arm32Assembler();
  const code = DEFAULT_CODE;
  return {
    code,
    assembler,
    simulator,
    registerFile,
    memory,
    alu,
  };
}

function App() {
  const [machine, setMachine] = useState(createMachine());

  return (
    <MachineContext value={{ machine, setMachine }}>
      <div className="h-screen">
        <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="grid grid-cols-3 gap-3">
            <button className="nav-btn">
              <NavLink className="w-full block" to="/editor">
                Editor
              </NavLink>
            </button>

            <button className="nav-btn">
              <NavLink className="w-full block" to="/simulator">
                Simulator
              </NavLink>
            </button>

            <button className="nav-btn">
              <NavLink className="w-full block" to="/doc">
                Documentation
              </NavLink>
            </button>
          </div>
          <div className="text-xl font-semibold">Arm32 Simulator</div>
        </nav>
        <Routes>
          <Route path="editor" element={<ArmEditor />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="doc" element={<Documentation />} />
          <Route path="*" element={<Navigate to="editor" replace />} />
        </Routes>
      </div>
    </MachineContext>
  );
}

export default App;
