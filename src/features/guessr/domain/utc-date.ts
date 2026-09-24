const UTC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfUtcDate(date: Date): Date {
  return new Date(`${utcDateKey(date)}T00:00:00.000Z`);
}

export function parseUtcDateKey(value: string): Date {
  if (!UTC_DATE_PATTERN.test(value)) throw new Error("Date must use YYYY-MM-DD.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || utcDateKey(date) !== value) {
    throw new Error("Date is not a valid UTC calendar date.");
  }
  return date;
}

export function addUtcDays(date: Date, days: number): Date {
  if (!Number.isInteger(days)) throw new Error("Day offset must be an integer.");
  const result = startOfUtcDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function enumerateUtcDates(first: Date, last: Date): Date[] {
  const start = startOfUtcDate(first);
  const end = startOfUtcDate(last);
  if (start > end) throw new Error("Start date must not be after end date.");

  const dates: Date[] = [];
  for (let date = start; date <= end; date = addUtcDays(date, 1)) dates.push(date);
  return dates;
}
