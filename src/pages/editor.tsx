import { createEditor, type PrismEditor } from "prism-code-editor";
import { indentGuides } from "prism-code-editor/guides";
import { matchBrackets } from "prism-code-editor/match-brackets";
import "prism-code-editor/prism/languages/armasm";
import "prism-code-editor/layout.css";
import "prism-code-editor/scrollbar.css";
import "prism-code-editor/guides.css";
import "prism-code-editor/themes/night-owl.css";

import "prism-code-editor/prism/languages/javascript";
import "react";
import { useContext, useEffect, useRef, useState } from "react";
import { MachineContext } from "./context.ts";
import { CODE_SEGMENT } from "../constants/SegmentPosition.ts";
import { Word } from "../types/binType.ts";

function ArmEditor() {
  const { machine, setMachine } = useContext(MachineContext);
  const [consoleMessage, setConsoleMessage] = useState("");
  const [isAssembling, setIsAssembling] = useState(false);

  useEffect(() => {
    const editor = (editorRef.current = createEditor(
      divRef.current!,
      {
        value: machine!.code,
        tabSize: 2,
        language: "armasm",
        insertSpaces: false,
      },
      indentGuides(),
      matchBrackets(),
    ));
    editorRef.current.container.style.setProperty("height", "100%");
    import("./extensions.ts").then((module) => module.addExtensions(editor));
    return () => {
      setMachine!({ ...machine!, code: editor.value });
      editor.remove();
    };
  }, []);

  const assemble = async () => {
    setIsAssembling(true);
    try {
      const { data, instructions } = machine!.assembler.assemble(
        editorRef.current!.value,
      );
      const dataStartPoint = CODE_SEGMENT - data.length;

      // Start with a fresh memory
      machine!.memory.reset()
      machine!.memory.writeBuffer(
        new Word(dataStartPoint),
        new Uint8Array(data).buffer,
      );

      const u8 = new Uint8Array(instructions.size * 4)
      const instructionsList = Array.from(instructions.entries()) 
      instructionsList.forEach((value, index) => {
        const v = value[1].encode
        u8[index * 4 + 0] = (v >>> 24) & 0xFF;
        u8[index * 4 + 1] = (v >>> 16) & 0xFF;
        u8[index * 4 + 2] = (v >>> 8)  & 0xFF;
        u8[index * 4 + 3] = (v >>> 0)  & 0xFF;
      })
      machine!.memory.writeBuffer(
        new Word(CODE_SEGMENT),
        u8.buffer,
      );
      machine!.memory.createCheckpoint();
      // reset everything else
      machine!.simulator.reset()
      machine!.registerFile.reset()
      machine!.simulator.setProgramEnd(instructionsList[instructionsList.length-1][0])
      setConsoleMessage("Assembled Successfully");
    } catch (e) {
      setConsoleMessage((e as Error).message);
    } finally {
      setIsAssembling(false);
    }
  };

  const divRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<PrismEditor>(null);
  return (
    <div className="flex flex-row gap-4 p-2 h-9/10">
      <div ref={divRef} className="grow-8 rounded-md" />
      <div className="grow-2 flex flex-col gap-2">
        <div className="bg-gray-600 text-center rounded-md h-4/10">
          <div className="panel-header">Console </div>
          <div className="text-left pl-2 pt-2 text-lg">{consoleMessage}</div>
        </div>
        <button className="nav-btn text-center bg-green-800" onClick={assemble}>
          {isAssembling ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-300 border-t-transparent"></div>
            </div>
          ) : (
            "ASSEMBLE"
          )}
        </button>
      </div>
    </div>
  );
}
export default ArmEditor;
