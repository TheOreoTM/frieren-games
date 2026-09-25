import "server-only";

import { z } from "zod";

export function publicFrameUrl(objectKey: string): string {
  if (!/^frames\/[a-f0-9]{32}\.webp$/.test(objectKey)) {
    throw new Error("Frame has an invalid opaque object key.");
  }
  const baseUrl = z
    .string()
    .url()
    .parse(process.env.R2_PUBLIC_BASE_URL)
    .replace(/\/$/, "");
  return `${baseUrl}/${objectKey}`;
}
