export interface ByteType {
  size: number;
  get view(): DataView;
  get raw(): ArrayBuffer;
}
