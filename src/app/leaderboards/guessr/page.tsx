import type { Metadata } from "next";
import Link from "next/link";

import {
  getDailyLeaderboard,
  getDailyLeaderboardNavigation,
} from "@/features/guessr/server/daily";
import {
  parseUtcDateKey,
  startOfUtcDate,
  utcDateKey,
} from "@/features/guessr/domain/utc-date";

export const metadata: Metadata = {
  title: "Daily Leaderboard",
};

export default async function GuessrLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const requested = (await searchParams).date;
  let date = startOfUtcDate(new Date());
  if (requested) {
    try {
      date = parseUtcDateKey(requested);
    } catch {
      date = startOfUtcDate(new Date());
    }
  }
  const dateKey = utcDateKey(date);
  const [leaderboard, navigation] = await Promise.all([
    getDailyLeaderboard(date),
    getDailyLeaderboardNavigation(date),
  ]);

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sage text-xs font-semibold tracking-[0.22em] uppercase">
              Daily competition
            </p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">
              Leaderboard
            </h1>
            <p className="text-muted mt-2">
              {dateKey} · ties share rank · speed is not a tiebreaker
            </p>
          </div>
          <Link
            href="/guessr/daily"
            className="text-sage text-sm font-semibold"
          >
            Play today&apos;s Daily →
          </Link>
        </div>

        <nav className="border-border mt-7 flex items-center justify-between border-y py-3 text-sm font-semibold">
          {navigation.previousDateKey ? (
            <Link
              href={`/leaderboards/guessr?date=${navigation.previousDateKey}`}
            >
              ← {navigation.previousDateKey}
            </Link>
          ) : (
            <span className="text-muted">No earlier Daily</span>
          )}
          {navigation.nextDateKey ? (
            <Link href={`/leaderboards/guessr?date=${navigation.nextDateKey}`}>
              {navigation.nextDateKey} →
            </Link>
          ) : (
            <span className="text-muted">Latest Daily</span>
          )}
        </nav>

        {!leaderboard.challenge ? (
          <div className="border-border bg-surface text-muted mt-8 rounded-2xl border border-dashed p-10 text-center">
            No Daily was saved for this date.
          </div>
        ) : leaderboard.challenge.status === "VOID" ? (
          <div className="border-gold/40 bg-gold/10 mt-8 rounded-2xl border p-10 text-center">
            This Daily was voided. Its scores are not ranked.
          </div>
        ) : (
          <ol className="border-border bg-surface mt-8 overflow-hidden rounded-2xl border">
            {leaderboard.entries.map((entry) => (
              <li
                key={entry.attemptId}
                className="border-border grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b px-4 py-4 last:border-0 sm:px-6"
              >
                <span className="text-muted font-mono text-lg">
                  #{entry.rank}
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  {entry.avatarUrl ? (
                    // Same-origin proxy keeps Discord provider identifiers private.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="bg-border size-9 rounded-full object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {entry.displayName}
                    </p>
                    {entry.username ? (
                      <Link
                        href={`/user/${entry.username}`}
                        className="text-muted hover:text-sage truncate text-xs"
                      >
                        @{entry.username}
                      </Link>
                    ) : null}
                  </div>
                </div>
                <span className="font-mono text-lg font-semibold">
                  {entry.totalScore.toLocaleString()}
                </span>
              </li>
            ))}
            {leaderboard.entries.length === 0 ? (
              <li className="text-muted p-10 text-center">
                No ranked finishes yet. The first score could be yours.
              </li>
            ) : null}
          </ol>
        )}
      </section>
    </main>
  );
}
