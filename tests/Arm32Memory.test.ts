import { expect, it, describe, beforeEach } from "vitest";
import { Arm32Memory } from "../src/components/arm32Memory";
import { Word } from "../src/types/binType";

let memoryMap = new Arm32Memory();
beforeEach(() => {
  memoryMap = new Arm32Memory();
});

describe("Check valid address", () => {
  it("Error case", () => {
    expect(() =>
      memoryMap.checkValidAddress(new Word(0xffffffff), 2),
    ).toThrowError();
    expect(() =>
      memoryMap.checkValidAddress(new Word(0xffffffff), 1),
    ).not.toThrowError();
  });
});

describe("Offset to page address", () => {
  it("Error case", () => {
    let { page_number, page_offset } = memoryMap.offsetToPageAddress(
      new Word(0xffff1234),
    );
    expect(page_number >>> 0).toBe(0xffff);
    expect(page_offset >>> 0).toBe(0x1234);

    ({ page_number, page_offset } = memoryMap.offsetToPageAddress(
      new Word(0x00125701),
    ));
    expect(page_number >>> 0).toBe(0x0012);
    expect(page_offset >>> 0).toBe(0x5701);
  });
});

describe("Read and Write word into Memory", () => {
  // Write normal
  // Write cross page
  // Write to the end of one page
  it("Normal write", () => {
    // Should be initially 0
    expect(memoryMap.readWord(new Word(0x00000000)).view.getUint32(0)).toBe(0);

    // Write something to that position
    memoryMap.writeWord(new Word(0x00000000), new Word(0xff00ff00));
    expect(memoryMap.readWord(new Word(0x00000000)).view.getUint32(0)).toBe(
      0xff00ff00,
    );

    // Over write that position with something else
    memoryMap.writeWord(new Word(0x00000000), new Word(0xcc123456));
    expect(memoryMap.readWord(new Word(0x00000000)).view.getUint32(0)).toBe(
      0xcc123456,
    );

    // write to a different page
    memoryMap.writeWord(new Word(0xccaa0000), new Word(0xcc123456));
    expect(memoryMap.readWord(new Word(0xccaa0000)).view.getUint32(0)).toBe(
      0xcc123456,
    );

    // write to a different page
    memoryMap.writeWord(new Word(0xffffff00), new Word(0xcc123456));
    expect(memoryMap.readWord(new Word(0xffffff00)).view.getUint32(0)).toBe(
      0xcc123456,
    );

    // write to a different page
    memoryMap.writeWord(new Word(0xff001234), new Word(0xffffffff));
    expect(memoryMap.readWord(new Word(0xff001234)).view.getUint32(0)).toBe(
      0xffffffff,
    );

    // Overlap write
    memoryMap.writeWord(new Word(0x00000004), new Word(0x12345678));
    expect(memoryMap.readWord(new Word(0x00000004)).view.getUint32(0)).toBe(
      0x12345678,
    );

    memoryMap.writeWord(new Word(0x00000006), new Word(0x87654321));
    expect(memoryMap.readWord(new Word(0x00000004)).view.getUint32(0)).toBe(
      0x12348765,
    );

    memoryMap.writeWord(new Word(0x00000007), new Word(0xffffffff));
    expect(memoryMap.readWord(new Word(0x00000004)).view.getUint32(0)).toBe(
      0x123487ff,
    );
  });

  it("Crosspage write", () => {
    // Should be initially 0
    expect(memoryMap.readWord(new Word(0x0000ffff)).view.getUint32(0)).toBe(0);

    // Write something to that position 1 byte in the first page and 3 bytes in the second page
    memoryMap.writeWord(new Word(0x0000ffff), new Word(0xff00ff00));
    expect(memoryMap.readWord(new Word(0x0000ffff)).view.getUint32(0)).toBe(
      0xff00ff00,
    );

    // Over write that position with something else 1 byte in the first page and 3 bytes in the second page
    memoryMap.writeWord(new Word(0x0000ffff), new Word(0xcc123456));
    expect(memoryMap.readWord(new Word(0x0000ffff)).view.getUint32(0)).toBe(
      0xcc123456,
    );

    // write to a different page 2 byte in the first page and 2 bytes in the second page
    memoryMap.writeWord(new Word(0xccaafffe), new Word(0xcc123456));
    expect(memoryMap.readWord(new Word(0xccaafffe)).view.getUint32(0)).toBe(
      0xcc123456,
    );

    // write to a different page 3 byte in the first page and 1 bytes in the second page
    memoryMap.writeWord(new Word(0xccaafffd), new Word(0xcc123456));
    expect(memoryMap.readWord(new Word(0xccaafffd)).view.getUint32(0)).toBe(
      0xcc123456,
    );

    // write to a different page 1 byte in the first page and 3 bytes in the second page
    memoryMap.writeWord(new Word(0x0001ffff), new Word(0xffffffff));
    expect(memoryMap.readWord(new Word(0x0001ffff)).view.getUint32(0)).toBe(
      0xffffffff,
    );

    // write to a different page 4 byte in the first page and 03 bytes in the second page. since ending is exclusive, our ending is the first byte of
    // the next page but we are not actually writing anything there
    memoryMap.writeWord(new Word(0x12345fffc), new Word(0x22334115));
    expect(memoryMap.readWord(new Word(0x12345fffc)).view.getUint32(0)).toBe(
      0x22334115,
    );

    // Writing to the very end of the memory
    memoryMap.writeWord(new Word(0xfffffffc), new Word(0x22334115));
    expect(memoryMap.readWord(new Word(0xfffffffc)).view.getUint32(0)).toBe(
      0x22334115,
    );
  });
});

describe("Read and Write buffer into Memory", () => {
  // buffer size = 1
  // write within 1 page
  // write cross 2 pages
  // write cross multiple page
  // write to the limit of the memory
  // write that touch the beginning of the other page but not cross over
  it("Error case", () => {
    const writeBuffer = new ArrayBuffer(100);
    expect(() =>
      memoryMap.writeBuffer(new Word(0xfffffffc), writeBuffer),
    ).toThrowError();
    expect(() =>
      memoryMap.writeBuffer(new Word(0xffffff9c), writeBuffer),
    ).not.toThrowError();
    expect(() =>
      memoryMap.readBuffer(new Word(0xfffffffc), 100),
    ).toThrowError();
    expect(() =>
      memoryMap.readBuffer(new Word(0xffffff9c), 100),
    ).not.toThrowError();
  });

  it("Read and Write a buffer of length 0", () => {
    const writeBuffer = new ArrayBuffer(0);
    memoryMap.writeBuffer(new Word(0x00000000), writeBuffer);
    expect(memoryMap.readBuffer(new Word(0x00000000), 0).byteLength).toBe(0);

    memoryMap.writeBuffer(new Word(0x10000000), writeBuffer);
    expect(memoryMap.readBuffer(new Word(0x10000000), 0).byteLength).toBe(0);
  });

  it("Read and Write a buffer of length 1", () => {
    const writeBuffer = new Uint8Array([10]);
    memoryMap.writeBuffer(new Word(0x00000000), writeBuffer.buffer);
    expect(memoryMap.readBuffer(new Word(0x00000000), 1).byteLength).toBe(1);
    expect(
      new Uint8Array(memoryMap.readBuffer(new Word(0x00000000), 1))[0],
    ).toBe(10);

    memoryMap.writeBuffer(new Word(0x10000000), writeBuffer.buffer);
    expect(memoryMap.readBuffer(new Word(0x10000000), 1).byteLength).toBe(1);
    expect(
      new Uint8Array(memoryMap.readBuffer(new Word(0x10000000), 1))[0],
    ).toBe(10);
  });

  it("Read and Write within 1 page", () => {
    // write to one page
    let writeBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    memoryMap.writeBuffer(new Word(0x00000000), writeBuffer.buffer);
    let readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0x00000000), writeBuffer.length),
    );
    expect(readBuffer).toStrictEqual(writeBuffer);

    // Suppose we update write buffer, the read should still be the same since data is copied over to memory
    writeBuffer[0] = 10;
    readBuffer = new Uint8Array(memoryMap.readBuffer(new Word(0x00000000), 1));
    expect(readBuffer[0]).toBe(1);

    // Another write
    writeBuffer = new Uint8Array([9, 9, 9, 9, 9, 9, 9]);
    memoryMap.writeBuffer(new Word(0x00011234), writeBuffer.buffer);
    readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0x00011234), writeBuffer.length),
    );

    expect(readBuffer).toStrictEqual(writeBuffer);

    //Overlapping write
    memoryMap.writeBuffer(
      new Word(0x00020000),
      new Uint8Array([9, 9, 9, 9, 9, 9, 9]).buffer,
    );
    memoryMap.writeBuffer(
      new Word(0x00020001),
      new Uint8Array([8, 8, 8, 8, 8, 8, 8]).buffer,
    );
    memoryMap.writeBuffer(new Word(0x00020002), new Uint8Array([7, 7]).buffer);
    readBuffer = new Uint8Array(memoryMap.readBuffer(new Word(0x00020000), 5));

    const result = new Uint8Array([9, 8, 7, 7, 8]);
    expect(readBuffer).toStrictEqual(result);

    // Write to the limit of the memory
    writeBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    memoryMap.writeBuffer(new Word(0xfffffff6), writeBuffer.buffer);
    readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0xfffffff6), writeBuffer.length),
    );
    expect(readBuffer).toStrictEqual(writeBuffer);
  });

  it("Read and Write crossing 2 pages", () => {
    // write to 2 page
    let writeBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    memoryMap.writeBuffer(new Word(0x0000fffa), writeBuffer.buffer);
    let readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0x0000fffa), writeBuffer.length),
    );
    expect(readBuffer).toStrictEqual(writeBuffer);

    // Another write
    writeBuffer = new Uint8Array([9, 9, 9, 9, 9, 9, 9]);
    memoryMap.writeBuffer(new Word(0x0001ffff), writeBuffer.buffer);
    readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0x0001ffff), writeBuffer.length),
    );

    expect(readBuffer).toStrictEqual(writeBuffer);

    //Overlapping write
    memoryMap.writeBuffer(
      new Word(0x0002fffd),
      new Uint8Array([9, 9, 9, 9, 9, 9, 9]).buffer,
    );
    memoryMap.writeBuffer(
      new Word(0x0002fffe),
      new Uint8Array([8, 8, 8, 8, 8, 8, 8]).buffer,
    );
    memoryMap.writeBuffer(new Word(0x0002ffff), new Uint8Array([7, 7]).buffer);
    readBuffer = new Uint8Array(memoryMap.readBuffer(new Word(0x0002fffd), 5));

    const result = new Uint8Array([9, 8, 7, 7, 8]);
    expect(readBuffer).toStrictEqual(result);

    // Write to the end of one page but not crossing the other page
    writeBuffer = new Uint8Array([10, 11, 12, 13, 14, 15, 16, 17]);
    memoryMap.writeBuffer(new Word(0x1234fff8), writeBuffer.buffer);
    readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0x1234fff8), writeBuffer.length),
    );
    expect(readBuffer).toStrictEqual(writeBuffer);

    // Write that read the end of the other page
    writeBuffer = new Uint8Array(65544).fill(123);
    memoryMap.writeBuffer(new Word(0xccaafff8), writeBuffer.buffer);
    readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0xccaafff8), writeBuffer.length),
    );
    expect(readBuffer).toStrictEqual(writeBuffer);
  });

  it("Read and Write crossing multiple pages", () => {
    // write to 3 pages
    let writeBuffer = new Uint8Array(2 ** 16 + 16).fill(5);

    // There is 2**16 + 8 element. it write 1 element to the first page, 2**16 element to the second and 7 element to the last one
    memoryMap.writeBuffer(new Word(0x0000fff8), writeBuffer.buffer);
    let readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0x0000fff8), writeBuffer.length),
    );
    expect(readBuffer).toStrictEqual(writeBuffer);
    readBuffer = new Uint8Array(memoryMap.readBuffer(new Word(0x00020000), 8));
    expect(readBuffer).toStrictEqual(new Uint8Array(8).fill(5));

    // write to more than 3 pages
    writeBuffer = new Uint8Array(2 ** 17 + 16).fill(12);
    memoryMap.writeBuffer(new Word(0x0002fff8), writeBuffer.buffer);
    readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0x0002fff8), writeBuffer.length),
    );
    expect(readBuffer).toStrictEqual(writeBuffer);

    // Write 3 page, write to the end but not crossing the third page
    writeBuffer = new Uint8Array(2 ** 16 + 16).fill(123);
    memoryMap.writeBuffer(new Word(0x0003fff0), writeBuffer.buffer);
    readBuffer = new Uint8Array(
      memoryMap.readBuffer(new Word(0x0003fff0), writeBuffer.length),
    );
    expect(readBuffer).toStrictEqual(writeBuffer);
  });
});
