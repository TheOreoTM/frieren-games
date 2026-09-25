import { objectKeyForLocalId } from "./frame-input";
import type { ManifestFrame } from "./manifest-schema";

export type ExistingProductionFrame = {
  id: string;
  timestampMs: number;
  difficulty: string;
  objectKey: string;
  width: number;
  height: number;
  episode: {
    season: number;
    episodeNumber: number;
  };
};

export type FramePromotionPlan = {
  creates: number;
  difficultyUpdates: number;
  unchanged: number;
};

export function planFramePromotion(
  records: readonly ManifestFrame[],
  existingFrames: readonly ExistingProductionFrame[],
): FramePromotionPlan {
  const existingById = new Map(
    existingFrames.map((frame) => [frame.id, frame]),
  );
  const existingByObjectKey = new Map(
    existingFrames.map((frame) => [frame.objectKey, frame]),
  );
  const plan: FramePromotionPlan = {
    creates: 0,
    difficultyUpdates: 0,
    unchanged: 0,
  };

  for (const record of records) {
    const expectedObjectKey = objectKeyForLocalId(record.localId);
    const objectOwner = existingByObjectKey.get(expectedObjectKey);
    if (objectOwner && objectOwner.id !== record.localId) {
      throw new Error(
        `Object key ${expectedObjectKey} already belongs to a different production Frame.`,
      );
    }

    const existing = existingById.get(record.localId);
    if (!existing) {
      plan.creates += 1;
      continue;
    }
    if (
      existing.episode.season !== record.season ||
      existing.episode.episodeNumber !== record.episode ||
      existing.timestampMs !== record.timestampMs ||
      existing.objectKey !== expectedObjectKey ||
      existing.width !== record.width ||
      existing.height !== record.height
    ) {
      throw new Error(
        `Production Frame ${record.localId} has conflicting immutable metadata.`,
      );
    }

    if (existing.difficulty === record.difficulty) plan.unchanged += 1;
    else plan.difficultyUpdates += 1;
  }

  return plan;
}
