import type { InstructionDoc } from "../constants/functionDocumentation"

export interface InstructionDocumentationProps {
  instructionsDoc : InstructionDoc[]
}

export function InstructionDocumentation(props: InstructionDocumentationProps)
{
    const {instructionsDoc} = props
    return (
        <div>
            <table className="custom-table">
                <thead className="bg-gray-600">
                    <tr>
                        <th className="header-cell">Name</th>
                        <th className="header-cell">Syntax</th>
                        <th className="header-cell">Example</th>
                    </tr>
                </thead>
                <tbody>
                {instructionsDoc.map((value, index) => {
                    return (
                        <tr key={index}>
                            <td className="cell">{value.name}</td>
                            <td className="cell">{value.syntax}</td>
                            <td className="cell">{value.example}</td>
                        </tr>
                    )
                })}
                </tbody>
            </table>
        </div>
    )

}

