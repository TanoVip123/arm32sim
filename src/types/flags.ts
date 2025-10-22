export type Flag = 0 | 1;

export type NZCV = { N: Flag; Z: Flag; C: Flag; V: Flag };

export function toFlag(n: number): Flag {
  if (n === 0 || n === 1) {
    return n;
  }
  throw new Error("flag must be between 0 and 1");
}
