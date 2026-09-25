import { startOfUtcDate, utcDateKey } from "./utc-date";

export type DailyStatus = "DRAFT" | "APPROVED" | "VOID";

export type DailyDisplayState =
  "DRAFT" | "APPROVED" | "ACTIVE" | "COMPLETED" | "VOID";

export function dailyDisplayState(
  dateUtc: Date,
  status: DailyStatus,
  now = new Date(),
): DailyDisplayState {
  if (status === "VOID") return "VOID";
  const date = startOfUtcDate(dateUtc);
  const today = startOfUtcDate(now);
  if (date < today) return "COMPLETED";
  if (date.getTime() === today.getTime()) return "ACTIVE";
  return status;
}

export function canEditDailyComposition(
  dateUtc: Date,
  status: DailyStatus,
  now = new Date(),
): boolean {
  return status !== "VOID" && startOfUtcDate(dateUtc) > startOfUtcDate(now);
}

export function isReservedForUnlimited(
  reservations: Array<{ dateUtc: Date; status: DailyStatus }>,
  now = new Date(),
): boolean {
  const todayKey = utcDateKey(now);
  return reservations.some(
    (reservation) =>
      reservation.status !== "VOID" &&
      utcDateKey(reservation.dateUtc) >= todayKey,
  );
}

export type DailyAttemptPlan =
  "CREATE_RANKED" | "RESUME_RANKED" | "CREATE_PRACTICE";

export function dailyAttemptPlan(
  rankedAttempt: { completed: boolean } | null,
): DailyAttemptPlan {
  if (!rankedAttempt) return "CREATE_RANKED";
  return rankedAttempt.completed ? "CREATE_PRACTICE" : "RESUME_RANKED";
}
