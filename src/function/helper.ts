export function getValueIfKeyExists<T extends object>(
  obj: T,
  key: string,
): T[keyof T] | undefined {
  return Object.prototype.hasOwnProperty.call(obj, key)
    ? (obj as any)[key]
    : undefined;
}

export function encodeImm12(value: number): { imm8: number; rotate: number } {
  // Ensure unsigned 32-bit
  value >>>= 0;

  // Try all 16 rotation values (0, 2, 4, ..., 30)
  for (let rotate = 0; rotate < 32; rotate += 2) {
    // Rotate left by `rotate` and see if fits in 8 bits
    const rotated = ((value << rotate) | (value >>> (32 - rotate))) >>> 0;
    if ((rotated & 0xffffff00) === 0) {
      return {
        imm8: rotated & 0xff,
        rotate: rotate / 2, // encoded form: rotation divided by 2
      };
    }
  }

  return {
    imm8: 0,
    rotate: -1,
  };
}
