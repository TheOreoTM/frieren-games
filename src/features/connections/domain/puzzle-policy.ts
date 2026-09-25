import { startOfUtcDate } from "../../../lib/utc-date";

export type ConnectionsPuzzleStatus = "DRAFT" | "APPROVED" | "VOID";

export type ConnectionsPuzzleDisplayState =
  ConnectionsPuzzleStatus | "ACTIVE" | "COMPLETED";

export function connectionsPuzzleDisplayState(
  dateUtc: Date,
  status: ConnectionsPuzzleStatus,
  now = new Date(),
): ConnectionsPuzzleDisplayState {
  if (status !== "APPROVED") return status;

  const date = startOfUtcDate(dateUtc);
  const today = startOfUtcDate(now);
  if (date < today) return "COMPLETED";
  if (date.getTime() === today.getTime()) return "ACTIVE";
  return "APPROVED";
}

export function canEditConnectionsPuzzle(
  dateUtc: Date,
  status: ConnectionsPuzzleStatus,
  now = new Date(),
): boolean {
  return status === "DRAFT" && startOfUtcDate(dateUtc) > startOfUtcDate(now);
}

export function canApproveConnectionsPuzzle(
  dateUtc: Date,
  status: ConnectionsPuzzleStatus,
  now = new Date(),
): boolean {
  return canEditConnectionsPuzzle(dateUtc, status, now);
}

export function canReturnConnectionsPuzzleToDraft(
  dateUtc: Date,
  status: ConnectionsPuzzleStatus,
  now = new Date(),
): boolean {
  return status === "APPROVED" && startOfUtcDate(dateUtc) > startOfUtcDate(now);
}
