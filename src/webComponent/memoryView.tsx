export interface MemoryProps {
  memory: Uint8Array;
  memPos: number;
}

function MemoryView(props: MemoryProps) {
  const { memory, memPos } = props;
  const bytesPerLine = 16;
  // Convert Uint8Array → array of rows
  const lines = [];
  for (let addr = 0; addr < memory.length; addr += bytesPerLine) {
    const slice = memory.slice(addr, addr + bytesPerLine);
    lines.push({
      addr: memPos + addr,
      bytes: Array.from(slice),
    });
  }

  return (
    <div className="font-mono text-sm overflow-auto h-full">
      {lines.map(({ addr, bytes }) => (
        <div key={addr} className="flex gap-10 text-lg">
          {/* Address */}
          <div className="text-gray-400">
            0x{addr.toString(16).padStart(8, "0").toUpperCase()}:
          </div>

          {/* Bytes */}
          <div className="grid grid-cols-16 gap-2">
            {bytes.map((b, i) => (
              <div key={i}>{b.toString(16).padStart(2, "0").toUpperCase()}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MemoryView;
