import "react";
import { InstructionDocumentation } from "../webComponent/instructionDocumentation";
import { BLOCK_DATA_TRANSFER_DOCS, BRANCH_DOCS, CONDITION_DOCS, DATA_PROCESSING_IMM_DOCS, DATA_PROCESSING_REG_SHIFT_IMM_DOCS, DATA_PROCESSING_REG_SHIFT_REG_DOCS, LOAD_STORE_DOCS, MOV_DOCS, MUL_ACC_DOCS, SWAP_DOCS } from "../constants/functionDocumentation";

function Documentation() {
  return (
  <div className="p-4 text-md max-w-3/5">
    <section className="prose mx-auto p-4">
      <h2 className="text-4xl font-bold mb-4">Overview</h2>
        <p>This is an Arm32 Simulator. It basically takes your Arm32 code, assembled it and let you run stuff in a simulator. At a high level, this things has:</p>
        <ul className='marker:text-green list-outside list-disc ml-6'>
          <li>a fully 4GB addressable memory</li>
          <li>An ALU for data processing</li>
          <li>An assembler</li>
          <li>A simulator</li>
          <li>... And some interfaces</li>
        </ul>
        This simulator does not support any <span className="font-bold">interrupts (SWI)</span>, which means that there is currently no way to add breakpoint, receive user input or print anything to the console. The console
        is purely for notifying user about program state and error.
        <h2 className="text-4xl font-bold mb-4">Condition</h2>
        <p>
          Here is a list of conditions flag and what they mean:
        </p>
        <div>
            <table className="custom-table">
                <thead className="bg-gray-600">
                    <tr>
                        <th className="header-cell">Cond</th>
                        <th className="header-cell">Mnemonic</th>
                        <th className="header-cell">Meaning</th>
                        <th className="header-cell">Condition flags</th>
                    </tr>
                </thead>
                <tbody>
                {CONDITION_DOCS.map((value, index) => {
                    return (
                        <tr key={index}>
                            <td className="cell">{value.cond}</td>
                            <td className="cell">{value.mnemonic}</td>
                            <td className="cell">{value.meaning}</td>
                            <td className="cell">{value.condition_flag}</td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
        
        <h2 className="text-4xl font-bold mb-4">Instructions</h2>
        <p>
          Below is a list of all instruction supported by this simulator. An S flag in the instructions means that the instruction will update the PSR register. A cond flag is a condition. This is because Arm32 has conditional execution,
          the simulator will check if the current flag in the PSR satisfy the condition and only after that, execute the instruction.
        </p>

        <h2 className="doc-section">Data Processing Register (Shift Immediate)</h2>
        <InstructionDocumentation instructionsDoc={DATA_PROCESSING_REG_SHIFT_IMM_DOCS} />
        <h2 className="doc-section">Data Processing Register (Shift Reg)</h2>
        <InstructionDocumentation instructionsDoc={DATA_PROCESSING_REG_SHIFT_REG_DOCS} />
        <h2 className="doc-section">Data Processing Immediate</h2>
        <InstructionDocumentation instructionsDoc={DATA_PROCESSING_IMM_DOCS} />
        <h2 className="doc-section">Multiply and multiply accumulate</h2>
        <InstructionDocumentation instructionsDoc={MUL_ACC_DOCS} />
        <h2 className="doc-section">Block data transfer</h2>
        <InstructionDocumentation instructionsDoc={BLOCK_DATA_TRANSFER_DOCS} />
        <h2 className="doc-section">Load store</h2>
        <p>
          Note that if you add a B flag to make LDRB and STRB, the instruction works on Byte instead of Word.
        </p>
        <InstructionDocumentation instructionsDoc={LOAD_STORE_DOCS} />
        <h2 className="doc-section">Branch</h2>
        <InstructionDocumentation instructionsDoc={BRANCH_DOCS} />

        <h2 className="doc-section">SWAP</h2>
        <p>
          Note if you add a B flag to make SWPB, the instruction works on Byte instead of Word.
        </p>
        <InstructionDocumentation instructionsDoc={SWAP_DOCS} />

        <h2 className="doc-section">Other instructions</h2>
        <InstructionDocumentation instructionsDoc={MOV_DOCS} />
      </section>
    </div>
  );
}

export default Documentation;
