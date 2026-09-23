import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";

const r2EnvironmentSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
});

let cached:
  | {
      client: S3Client;
      bucket: string;
    }
  | undefined;

function getR2() {
  if (cached) return cached;
  const environment = r2EnvironmentSchema.parse(process.env);
  cached = {
    client: new S3Client({
      region: "auto",
      endpoint: `https://${environment.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: environment.R2_ACCESS_KEY_ID,
        secretAccessKey: environment.R2_SECRET_ACCESS_KEY,
      },
    }),
    bucket: environment.R2_BUCKET,
  };
  return cached;
}

export function validateR2Environment() {
  getR2();
}

export async function putFrameObject(objectKey: string, bytes: Uint8Array) {
  const { client, bucket } = getR2();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: bytes,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}
