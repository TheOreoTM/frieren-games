import { z } from "zod";

export const FRAME_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export const FRAME_STATUSES = ["LOCAL_APPROVED", "PUSHED", "FAILED"] as const;

export const manifestFrameSchema = z
  .object({
    localId: z
      .string()
      .regex(/^[a-f0-9]{32}$/, "must be 32 lowercase hexadecimal characters"),
    season: z.number().int().positive(),
    episode: z.number().int().positive(),
    timestampMs: z.number().int().nonnegative(),
    difficulty: z.enum(FRAME_DIFFICULTIES),
    sourceFile: z.string().min(1),
    outputFile: z.string().min(1),
    width: z.number().int().positive().max(8_192),
    height: z.number().int().positive().max(8_192),
    sha256: z
      .string()
      .regex(/^[a-f0-9]{64}$/, "must be a lowercase SHA-256 digest"),
    status: z.enum(FRAME_STATUSES),
    createdAt: z.string().datetime({ offset: true }),
    objectKey: z.string().optional(),
    pushedAt: z.string().datetime({ offset: true }).optional(),
    lastError: z.string().max(2_000).optional(),
  })
  .superRefine((record, context) => {
    if (record.outputFile !== `output/${record.localId}.webp`) {
      context.addIssue({
        code: "custom",
        path: ["outputFile"],
        message: "must point to output/<localId>.webp",
      });
    }

    if (record.status === "PUSHED") {
      if (!record.objectKey) {
        context.addIssue({
          code: "custom",
          path: ["objectKey"],
          message: "is required when pushed",
        });
      }
      if (!record.pushedAt) {
        context.addIssue({
          code: "custom",
          path: ["pushedAt"],
          message: "is required when pushed",
        });
      }
    }
  });

export const curatorManifestSchema = z
  .object({
    version: z.literal(1),
    frames: z.array(manifestFrameSchema),
  })
  .superRefine((manifest, context) => {
    const seen = new Set<string>();
    manifest.frames.forEach((frame, index) => {
      if (seen.has(frame.localId)) {
        context.addIssue({
          code: "custom",
          path: ["frames", index, "localId"],
          message: "duplicates an earlier localId",
        });
      }
      seen.add(frame.localId);
    });
  });

export type ManifestFrame = z.infer<typeof manifestFrameSchema>;
export type CuratorManifest = z.infer<typeof curatorManifestSchema>;

export function formatManifestError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "manifest"}: ${issue.message}`)
    .join("\n");
}
