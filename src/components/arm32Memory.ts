import type { Memory } from "../interface/memory";
import { Word } from "../types/binType";

const TOTAL_PAGE_COUNT = 2 ** 16;
const BYTES_IN_ONE_PAGE = 2 ** 16;
const MEM_SIZE = 2 ** 32;
export class Arm32Memory implements Memory {
  private memoryMap: ArrayBuffer[];

  constructor() {
    this.memoryMap = new Array<ArrayBuffer>(TOTAL_PAGE_COUNT);
  }

  readWord(offset: Word): Word {
    this.checkValidAddress(offset, 4);
    const { page_number: start_page, page_offset: start_page_offset } =
      this.offsetToPageAddress(offset);
    const end_page =
      start_page + Math.floor((start_page_offset + 4) / BYTES_IN_ONE_PAGE);
    const end_page_offset = (start_page_offset + 4) % BYTES_IN_ONE_PAGE;

    // If this Word lives on the same page, simply extract byte from that page
    if (start_page === end_page) {
      if (this.memoryMap[start_page] == undefined) {
        return new Word(0);
      }
      return new Word(
        new DataView(this.memoryMap[start_page]).getUint32(start_page_offset),
      );
    }

    // Otherwise, we need to combine bytes from 2 pages to make a Word
    else {
      const extractedByte: Uint8Array<ArrayBuffer> = new Uint8Array(4);
      extractedByte.set(
        new Uint8Array(
          this.readBytesFromPage(
            start_page,
            start_page_offset,
            BYTES_IN_ONE_PAGE - start_page_offset,
          ),
        ),
        0,
      );
      extractedByte.set(
        new Uint8Array(this.readBytesFromPage(end_page, 0, end_page_offset)),
        BYTES_IN_ONE_PAGE - start_page_offset,
      );
      // This is because the data is stored in big endian
      const value =
        (extractedByte[0] << 24) |
        (extractedByte[1] << 16) |
        (extractedByte[2] << 8) |
        extractedByte[3];
      return new Word(value);
    }
  }

  writeWord(offset: Word, content: Word): void {
    this.checkValidAddress(offset, 4);
    const { page_number: start_page, page_offset: start_page_offset } =
      this.offsetToPageAddress(offset);
    const end_page =
      start_page + Math.floor((start_page_offset + 4) / BYTES_IN_ONE_PAGE);
    if (start_page === end_page) {
      // ??= asign only if this.memoryMap[start_page] is undefined or null
      this.memoryMap[start_page] ??= new ArrayBuffer(BYTES_IN_ONE_PAGE);
      const view = new DataView(this.memoryMap[start_page]);
      view.setUint32(start_page_offset, content.view.getUint32(0));
    } else {
      this.memoryMap[start_page] ??= new ArrayBuffer(BYTES_IN_ONE_PAGE);
      this.memoryMap[end_page] ??= new ArrayBuffer(BYTES_IN_ONE_PAGE);
      const writeBytes = new Uint8Array(content.raw);
      new Uint8Array(this.memoryMap[start_page]).set(
        writeBytes.slice(0, BYTES_IN_ONE_PAGE - start_page_offset),
        start_page_offset,
      );
      new Uint8Array(this.memoryMap[end_page]).set(
        writeBytes.slice(BYTES_IN_ONE_PAGE - start_page_offset, 4),
      );
    }
  }

  readBuffer(offset: Word, length: number): ArrayBuffer {
    this.checkValidAddress(offset, length);
    const { page_number: start_page, page_offset: start_page_offset } =
      this.offsetToPageAddress(offset);
    const end_page =
      start_page + Math.floor((start_page_offset + length) / BYTES_IN_ONE_PAGE);
    const end_page_offset = (start_page_offset + length) % BYTES_IN_ONE_PAGE;

    const extractedByte: Uint8Array<ArrayBuffer> = new Uint8Array(length);
    if (start_page == end_page) {
      extractedByte.set(
        new Uint8Array(
          this.readBytesFromPage(start_page, start_page_offset, length),
        ),
        0,
      );
      return extractedByte.buffer;
    } else {
      // extract from the first page
      extractedByte.set(
        new Uint8Array(
          this.readBytesFromPage(
            start_page,
            start_page_offset,
            BYTES_IN_ONE_PAGE - start_page_offset,
          ),
        ),
        0,
      );

      // extract from other page
      let currOffset = BYTES_IN_ONE_PAGE - start_page_offset;
      for (let i = start_page + 1; i < end_page; i++) {
        extractedByte.set(
          new Uint8Array(this.readBytesFromPage(i, 0, BYTES_IN_ONE_PAGE)),
          currOffset,
        );
        currOffset += BYTES_IN_ONE_PAGE;
      }

      // This end_page_offset is exclusive
      // If the final end_page_offset is 0, then readBytesFromPage return an empty Array so   would not cause a out of bounds
      extractedByte.set(
        new Uint8Array(this.readBytesFromPage(end_page, 0, end_page_offset)),
        currOffset,
      );
      return extractedByte.buffer;
    }
  }

  writeBuffer(offset: Word, content: ArrayBuffer): void {
    const length = content.byteLength;
    this.checkValidAddress(offset, length);
    const { page_number: start_page, page_offset: start_page_offset } =
      this.offsetToPageAddress(offset);
    const end_page =
      start_page + Math.floor((start_page_offset + length) / BYTES_IN_ONE_PAGE);
    const end_page_offset = (start_page_offset + length) % BYTES_IN_ONE_PAGE;

    if (start_page == end_page) {
      this.memoryMap[start_page] ??= new ArrayBuffer(BYTES_IN_ONE_PAGE);
      new Uint8Array(this.memoryMap[start_page]).set(
        new Uint8Array(content),
        start_page_offset,
      );
    } else {
      // Write to the start page
      const contentUint8 = new Uint8Array(content);
      this.memoryMap[start_page] ??= new ArrayBuffer(BYTES_IN_ONE_PAGE);
      new Uint8Array(this.memoryMap[start_page]).set(
        contentUint8.slice(0, BYTES_IN_ONE_PAGE - start_page_offset),
        start_page_offset,
      );

      let currOffset = BYTES_IN_ONE_PAGE - start_page_offset;
      for (let i = start_page + 1; i < end_page; i++) {
        // Create new page as needed
        this.memoryMap[i] ??= new ArrayBuffer(BYTES_IN_ONE_PAGE);
        new Uint8Array(this.memoryMap[i]).set(
          contentUint8.slice(currOffset, currOffset + BYTES_IN_ONE_PAGE),
          0,
        );
        currOffset += BYTES_IN_ONE_PAGE;
      }

      this.memoryMap[end_page] ??= new ArrayBuffer(BYTES_IN_ONE_PAGE);
      new Uint8Array(this.memoryMap[end_page]).set(
        contentUint8.slice(currOffset, currOffset + end_page_offset),
        0,
      );
    }
  }

  readBytesFromPage(
    pageIndex: number,
    offset: number,
    length: number,
  ): ArrayBuffer {
    if (offset >= BYTES_IN_ONE_PAGE) {
      throw new Error(`Starting address ${offset} exceed the page limit`);
    }
    if (offset + length > BYTES_IN_ONE_PAGE) {
      throw new Error(
        `Ending address ${offset + length} exceed the page limit`,
      );
    }

    // If the page is not defined, just return bytes of 0
    if (this.memoryMap[pageIndex] == undefined) {
      return new ArrayBuffer(length);
    }

    return this.memoryMap[pageIndex].slice(offset, offset + length);
  }

  checkValidAddress(offset: Word, length: number) {
    // Start is inclusive
    if (offset.view.getUint32(0) >= MEM_SIZE) {
      throw new Error(
        `Starting address ${offset.view.getUint32(0).toString(2)} is not valid`,
      );
    }

    // End is exclusive
    if (offset.view.getUint32(0) + length > MEM_SIZE) {
      throw new Error(
        `Ending address ${(offset.view.getUint32(0) + length).toString(2)} is not valid`,
      );
    }
  }

  offsetToPageAddress(offset: Word): {
    page_number: number;
    page_offset: number;
  } {
    const page_number = offset.view.getUint16(0);
    const page_offset = offset.view.getUint16(2);
    return { page_number, page_offset };
  }
}
