export type Flag = 0 | 1;

export type NZCV = { N: Flag; Z: Flag; C: Flag; V: Flag };

export function toFlag(n: number): Flag {
  if (n === 0 || n === 1) {
    return n;
  }
  throw new Error("flag must be between 0 and 1");
}

export function numToNZCV(value: number): NZCV {
  return {
    N: toFlag((value >>> 4) & 1),
    Z: toFlag((value >>> 3) & 1),
    C: toFlag((value >>> 2) & 1),
    V: toFlag((value >>> 1) & 1),
  };
}

export function nzcvToNum(nzcv: NZCV): number {
  return (nzcv.N << 4) | (nzcv.Z << 3) | (nzcv.C << 2) | nzcv.V;
}
