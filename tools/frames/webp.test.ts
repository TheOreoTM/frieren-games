import { describe, expect, it } from "vitest";

import { inspectWebp } from "./webp";

function chunk(tag: string, data: number[]) {
  const bytes = Buffer.alloc(8 + data.length + (data.length % 2));
  bytes.write(tag, 0, 4, "ascii");
  bytes.writeUInt32LE(data.length, 4);
  Buffer.from(data).copy(bytes, 8);
  return bytes;
}

function webp(...chunks: Buffer[]) {
  const body = Buffer.concat([Buffer.from("WEBP"), ...chunks]);
  const header = Buffer.alloc(8);
  header.write("RIFF", 0, 4, "ascii");
  header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}

function vp8x(width: number, height: number, flags = 0) {
  const data = Array<number>(10).fill(0);
  data[0] = flags;
  const encodedWidth = width - 1;
  const encodedHeight = height - 1;
  data[4] = encodedWidth & 0xff;
  data[5] = (encodedWidth >> 8) & 0xff;
  data[6] = (encodedWidth >> 16) & 0xff;
  data[7] = encodedHeight & 0xff;
  data[8] = (encodedHeight >> 8) & 0xff;
  data[9] = (encodedHeight >> 16) & 0xff;
  return chunk("VP8X", data);
}

describe("inspectWebp", () => {
  it("reads still-image dimensions", () => {
    expect(inspectWebp(webp(vp8x(1280, 720)))).toEqual({
      width: 1280,
      height: 720,
      chunks: ["VP8X"],
    });
  });

  it.each(["EXIF", "XMP ", "ICCP", "ANIM", "ANMF"])(
    "rejects %s chunks",
    (tag) => {
      expect(() => inspectWebp(webp(vp8x(1280, 720), chunk(tag, [])))).toThrow(
        /forbidden/,
      );
    },
  );

  it("rejects metadata declared in VP8X flags", () => {
    expect(() => inspectWebp(webp(vp8x(1280, 720, 0x08)))).toThrow(
      /declares animation or EXIF/,
    );
  });

  it("rejects a mismatched RIFF length", () => {
    const bytes = webp(vp8x(1280, 720));
    bytes.writeUInt32LE(1, 4);
    expect(() => inspectWebp(bytes)).toThrow(/length/);
  });
});
