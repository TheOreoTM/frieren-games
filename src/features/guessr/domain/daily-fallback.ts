export type DailyFallbackRepository<T> = {
  find(dateKey: string): Promise<T | null>;
  create(dateKey: string): Promise<T>;
  isDateConflict(error: unknown): boolean;
};

export async function ensurePersistedDaily<T>(
  dateKey: string,
  repository: DailyFallbackRepository<T>,
): Promise<T> {
  const existing = await repository.find(dateKey);
  if (existing) return existing;

  try {
    return await repository.create(dateKey);
  } catch (error) {
    if (!repository.isDateConflict(error)) throw error;
    const winner = await repository.find(dateKey);
    if (!winner) throw error;
    return winner;
  }
}
