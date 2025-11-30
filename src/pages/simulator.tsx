import "react";
import { useContext, useEffect, useRef, useState } from "react";
import { Word } from "../types/binType";
import { getValueIfKeyExists } from "../function/helper";
import { registerDisplayName } from "../types/registerName";
import { numToNZCV } from "../types/flags";
import MemoryView from "../webComponent/memoryView";
import { MachineContext } from "./context";
import { CODE_SEGMENT } from "../constants/SegmentPosition";
import { extractBits } from "../function/bitManip";

const MEMORY_DISPLAY_LENGTH: number = 512;
function Simulator() {
  const { machine } = useContext(MachineContext);
  const [tab, setTab] = useState(1);
  const [nzcv, setNZCV] = useState({"N": 0, "Z": 0, "C": 0, "V": 0})
  const [registerFiles, setRegisterFiles] = useState<string[]>(
    machine!.registerFile.getAllregisters().map((value) => value.view.getInt32(0).toString()),
  );

  useEffect(() => {
   return () => {
    isRun.current = false
    if(timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = null
   } 
  }, [])

  const [isRunDisplay, setIsRunDisplay] = useState<boolean>(false)
  const isRun = useRef<boolean>(false)
  const timer = useRef<number | null>(null)

  const memPosRef = useRef<number>(CODE_SEGMENT - machine!.assembler.getAssembledData().length)
  const [memPos, setMemPos] = useState<string>(
    "0x" + memPosRef.current.toString(16).toUpperCase().padStart(8, '0'),
  );
  const [memory, setMemory] = useState<Uint8Array>(
    new Uint8Array(
      machine!.memory.readBuffer(new Word(memPosRef.current), MEMORY_DISPLAY_LENGTH),
    ),
  );

  const instructions = useRef<Map<number, string>>(
    new Map<number, string>(
      Array.from(machine!.assembler.getAssembledCode()).map((value) => [
        value[0],
        value[1].origin,
      ]),
    ),
  );
  const [pcPos, setPcPos] = useState<number>(
    machine!.registerFile.readRegister(15).view.getUint32(0),
  );

  const stackPosRef = useRef<number>(machine!.registerFile.readRegister(13).view.getUint32(0))
  const [stackPos, setStackPos] = useState<string>(
    "0x" + stackPosRef.current.toString(16).toUpperCase().padStart(8, '0'),
  );
  const [stack, setStack] = useState<Uint8Array>(
    new Uint8Array(
      machine!.memory.readBuffer(new Word(stackPosRef.current), MEMORY_DISPLAY_LENGTH),
    ),
  );

  const [consoleMessage, setConsoleMessage] = useState("")

  const updateRegister = (index: number, value: string) => {
    const num = parseInt(value)
    if (!isNaN(num))
    {
      machine!.registerFile.writeRegister(index, new Word(num))
      registerFiles[index] = num.toString()
      setRegisterFiles([...registerFiles])
      if(index == 15) {
        setPcPos(num)
      } else if(index == 13) {
        stackPosRef.current = num
        setStackPos("0x" + stackPosRef.current.toString(16).toUpperCase().padStart(8, '0'))
      }
      return
    }  
    else 
    {
      registerFiles[index] =  machine!.registerFile.readRegister(index).view.getUint32(0).toString()
      setRegisterFiles([...registerFiles])
    }
  }

  const updateMemPos = (value: string, setMemFunction : React.Dispatch<React.SetStateAction<Uint8Array<ArrayBufferLike>>>, setDisplay : React.Dispatch<React.SetStateAction<string>>, ref: React.RefObject<number>) => {
    const num = parseInt(value)
    if(!isNaN(num)){
      setMemFunction(new Uint8Array(
      machine!.memory.readBuffer(new Word(num), MEMORY_DISPLAY_LENGTH),
    ))
      ref.current = num
      setDisplay("0x" + num.toString(16).toUpperCase().padStart(8, '0'))
    }
    else {
      setDisplay("0x" + ref.current.toString(16).toUpperCase().padStart(8, '0'))
    }
  }

  const updateDisplay = () => {
    setRegisterFiles([...machine!.registerFile.getAllregisters().map((value) => value.view.getInt32(0).toString())])
    const newPcPos = machine!.registerFile.readRegister(15).view.getUint32(0)
    const newStackPos = machine!.registerFile.readRegister(13).view.getUint32(0)
    stackPosRef.current = newStackPos
    setPcPos(newPcPos)
    setStackPos("0x" + stackPosRef.current.toString(16).toUpperCase().padStart(8, '0'))
    setMemory(new Uint8Array(
      machine!.memory.readBuffer(new Word(memPosRef.current), MEMORY_DISPLAY_LENGTH),
    ))
    setStack(new Uint8Array(
      machine!.memory.readBuffer(new Word(newStackPos), MEMORY_DISPLAY_LENGTH),
    ))
  }

  const runOnce = () => {
    try {
      machine!.simulator.runOnce()
      updateDisplay()
      if(machine!.simulator.isSimulationDone())
      {
        setConsoleMessage("Program Finished")
      }
    } catch(e)
    {
      setConsoleMessage((e as Error).message)
    }
  }

  const run = () => {
    // Do not start if something has already started or the program has ended
    if(isRun.current || machine!.simulator.isSimulationDone())
    {
      return
    }
    
    isRun.current = true
    setIsRunDisplay(true)
    const tick = () => {
      if(!isRun.current || machine!.simulator.isSimulationDone())
      {
        isRun.current = false
        setIsRunDisplay(false)
        if(timer.current) {
          clearTimeout(timer.current)
        }
        timer.current = null    
        updateDisplay()    
        return
      }
      runOnce()
      timer.current = setTimeout(tick, 50)
    }

    // Start a timer. This timer should check for isRun and
    tick()
  }

  const pause = () => {
    isRun.current = false
    setIsRunDisplay(false)
    if(timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = null
    updateDisplay()
  }

  const reset = () => {
    setIsRunDisplay(false)
    if(timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = null
    machine!.simulator.reset()
    machine!.registerFile.reset()
    machine!.memory.goBackToCheckpoint()
    setConsoleMessage("")
    updateDisplay()
  }

  return (
    <div className="flex flex-col h-9/10">
      <div className="flex flex-row justify-center gap-10 m-[5px]">
        <button className="sim-btn" onClick={reset}>↻ Reset</button>
        {isRunDisplay ? <button className="sim-btn bg-lime-800" onClick={pause}>|| Pause</button> : <button className="sim-btn" onClick={run}>▶︎ Run</button>}
        <button className="sim-btn" onClick={runOnce}>⏭ Next</button>
      </div>
      <div className="grow-9 flex flex-row gap-2">
        <div className="grow-2 flex flex-col gap-2">
          <div className="h-8/10 panel-bg overflow-auto">
            <div className="panel-header">Register File</div>
            <table className="min-w-full table-fixed border-collapse border border-gray-400">
              <thead className="bg-gray-600">
                <tr>
                  <th className="w-2/10 header-cell">Reg</th>
                  <th className="w-4/10 header-cell">Hex</th>
                  <th className="w-4/10 header-cell">Dec</th>
                </tr>
              </thead>
              <tbody>
                {registerFiles.map((value, index) => {
                  const regName = getValueIfKeyExists(
                    registerDisplayName,
                    index.toString(),
                  );

                  let hexValue = value
                  let dec = value
                  const num = parseInt(value)
                  if(!isNaN(num))
                  {
                    hexValue =
                    "0x" +
                    (parseInt(value) >>> 0)
                      .toString(16)
                      .toUpperCase()
                      .padStart(8, "0");
                    dec = parseInt(value).toString();
                  }

                  return (
                    <tr key={index}>
                      <td className="cell">{regName}</td>
                      <td className="cell">
                        <input
                          value={hexValue}
                          onChange={(e) => {registerFiles[index] = e.target.value; setRegisterFiles([...registerFiles])}}
                          onBlur={(e) => {updateRegister(index, e.target.value)}}
                          onKeyDown={(e) => {
                        if(e.key === "Enter") {
                          e.currentTarget.blur()
                        }
                      }}
                        />
                      </td>
                      <td className="cell">
                        <input
                          value={dec}
                          onChange={(e) => {registerFiles[index] = e.target.value; setRegisterFiles([...registerFiles])}}
                          onBlur={(e) => {updateRegister(index, e.target.value)}}
                         onKeyDown={(e) => {
                        if(e.key === "Enter") {
                          e.currentTarget.blur()
                        }
                      }}  
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(() => {
              const flagValue = numToNZCV(extractBits(machine!.registerFile.readRegister(16), 28, 32));
              return (
                <table className="custom-table">
                  <thead className="bg-gray-600">
                    <tr>
                      <th className="header-cell">N</th>
                      <th className="header-cell">Z</th>
                      <th className="header-cell">C</th>
                      <th className="header-cell">V</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="cell">{flagValue.N}</td>
                      <td className="cell">{flagValue.Z}</td>
                      <td className="cell">{flagValue.C}</td>
                      <td className="cell">{flagValue.V}</td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
          </div>
          <div className="h-2/10 panel-bg">
            <div className="panel-header">Console</div>
            <div>
              {consoleMessage}
            </div>
          </div>
        </div>
        <div className="grow-8 panel-bg">
          <div className="panel-header">Code and Memory</div>
          <div className="w-full">
            {/* Tabs */}
            <div className="w-full flex border-b border-gray-300">
              <button
                onClick={() => setTab(1)}
                className={`flex-1 py-2 text-center ${
                  tab === 1 ? "border-b-4 border-blue-500 font-semibold" : ""
                }`}
              >
                Code
              </button>

              <button
                onClick={() => setTab(2)}
                className={`flex-1 py-2 text-center ${
                  tab === 2 ? "border-b-4 border-blue-500 font-semibold" : ""
                }`}
              >
                Memory
              </button>

              <button
                onClick={() => setTab(3)}
                className={`flex-1 py-2 text-center ${
                  tab === 3 ? "border-b-4 border-blue-500 font-semibold" : ""
                }`}
              >
                Stack
              </button>
            </div>

            <div className="p-4">
              {tab === 1 && (
                <div className="lg:h-[1024px] md:h-[768px] overflow-auto w-full">
                  <table className="table-fixed p-4">
                    <thead>
                      <tr>
                        <th className="w-1/20 header-cell">PC</th>
                        <th className="w-19/20 header-cell">Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(instructions.current.entries()).map(([pc, code]) => {
                        return (
                          <tr key={pc}>
                            <td className={pcPos === pc ? "cell bg-amber-800" : "cell"}>
                              {" "}
                              0x{pc.toString(16).toUpperCase().padStart(8, "0")}
                            </td>
                            <td className={pcPos === pc ? "cell bg-amber-800" : "cell"}> {code}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {(tab === 2 || tab === 3) && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row">
                    <div className="text-lg font-bold w-20 text-right mr-2">
                      {tab === 2 ? "Memory" : "Stack"}:
                    </div>
                    <input
                      className="bg-gray-700 px-2"
                      value={
                        tab === 2
                          ? memPos
                          : stackPos
                      }
                      onChange={(e) => {
                        if (tab === 2) {
                          setMemPos(e.target.value)
                         }
                         else {
                          setStackPos(e.target.value)
                        }
                      }}
                        onKeyDown={(e) => {
                        if(e.key === "Enter") {
                          e.currentTarget.blur()
                        }
                      }}
                      onBlur={(e) => {
                        if(tab === 2) {
                          updateMemPos(e.target.value, setMemory, setMemPos, memPosRef)
                        } else {
                          updateMemPos(e.target.value, setStack, setStackPos, stackPosRef)
                        }
                        
                      }}
                    />
                    <button className="bg-green-800 px-1 mx-1 hover:bg-green-500 border" onClick= {() => {
                      if (tab === 2) {
                        updateMemPos((memPosRef.current - MEMORY_DISPLAY_LENGTH).toString(), setMemory, setMemPos, memPosRef)
                      } else {
                        updateMemPos((stackPosRef.current - MEMORY_DISPLAY_LENGTH).toString(), setStack, setStackPos, stackPosRef)
                      }
                    }}>
                      ◀
                    </button>
                    <button className="bg-green-800 px-1 mx-1 hover:bg-green-500 border" onClick={() => {
                      if (tab === 2) {
                        updateMemPos((memPosRef.current + MEMORY_DISPLAY_LENGTH).toString(), setMemory, setMemPos, memPosRef)
                      } else {
                        updateMemPos((stackPosRef.current + MEMORY_DISPLAY_LENGTH).toString(), setStack, setStackPos, stackPosRef)
                      }
                    }}>
                      ▶︎
                    </button>
                  </div>
                  <div className="lg:h-[1024px] md:h-[768px] overflow-auto w-full">
                    <MemoryView
                      memory={tab === 2 ? memory : stack}
                      memPos={tab === 2 ? memPosRef.current : stackPosRef.current}
                    ></MemoryView>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Simulator;
