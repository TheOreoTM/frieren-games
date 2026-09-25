const FORBIDDEN_CHUNKS = new Set(["ANIM", "ANMF", "EXIF", "ICCP", "XMP "]);

export type WebpInspection = {
  width: number;
  height: number;
  chunks: string[];
};

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

function uint24le(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function dimensionsFromChunk(
  tag: string,
  bytes: Uint8Array,
  dataOffset: number,
  size: number,
): { width: number; height: number } | null {
  if (tag === "VP8X") {
    if (size < 10) throw new Error("VP8X chunk is truncated.");
    const forbiddenFlags = bytes[dataOffset] & 0x2e;
    if (forbiddenFlags !== 0) {
      throw new Error("WebP declares animation or EXIF/XMP/ICC metadata.");
    }
    return {
      width: uint24le(bytes, dataOffset + 4) + 1,
      height: uint24le(bytes, dataOffset + 7) + 1,
    };
  }

  if (tag === "VP8 ") {
    if (
      size < 10 ||
      bytes[dataOffset + 3] !== 0x9d ||
      bytes[dataOffset + 4] !== 0x01 ||
      bytes[dataOffset + 5] !== 0x2a
    ) {
      throw new Error("VP8 frame header is invalid.");
    }
    return {
      width: (bytes[dataOffset + 6] | (bytes[dataOffset + 7] << 8)) & 0x3fff,
      height: (bytes[dataOffset + 8] | (bytes[dataOffset + 9] << 8)) & 0x3fff,
    };
  }

  if (tag === "VP8L") {
    if (size < 5 || bytes[dataOffset] !== 0x2f) {
      throw new Error("VP8L frame header is invalid.");
    }
    const bits =
      bytes[dataOffset + 1] |
      (bytes[dataOffset + 2] << 8) |
      (bytes[dataOffset + 3] << 16) |
      (bytes[dataOffset + 4] << 24);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >>> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

export function inspectWebp(bytes: Uint8Array): WebpInspection {
  if (
    bytes.length < 20 ||
    ascii(bytes, 0, 4) !== "RIFF" ||
    ascii(bytes, 8, 4) !== "WEBP"
  ) {
    throw new Error("File is not a RIFF WebP image.");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const declaredLength = view.getUint32(4, true) + 8;
  if (declaredLength !== bytes.length) {
    throw new Error("WebP RIFF length does not match the file size.");
  }

  const chunks: string[] = [];
  let dimensions: { width: number; height: number } | null = null;
  let offset = 12;

  while (offset < bytes.length) {
    if (offset + 8 > bytes.length)
      throw new Error("WebP chunk header is truncated.");
    const tag = ascii(bytes, offset, 4);
    const size = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;
    const nextOffset = dataOffset + size + (size % 2);
    if (nextOffset > bytes.length)
      throw new Error(`${tag.trim()} chunk exceeds the file size.`);
    if (FORBIDDEN_CHUNKS.has(tag)) {
      throw new Error(
        `WebP contains forbidden ${tag.trim()} metadata/animation chunk.`,
      );
    }

    chunks.push(tag.trim());
    dimensions ??= dimensionsFromChunk(tag, bytes, dataOffset, size);
    offset = nextOffset;
  }

  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) {
    throw new Error("WebP does not contain valid still-image dimensions.");
  }

  return { ...dimensions, chunks };
}
