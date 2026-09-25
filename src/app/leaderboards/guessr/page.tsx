import type { Metadata } from "next";
import Link from "next/link";

import {
  getDailyLeaderboard,
  getDailyLeaderboardNavigation,
} from "@/features/guessr/server/daily";
import { parseUtcDateKey, startOfUtcDate, utcDateKey } from "@/lib/utc-date";

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
    <main className="min-h-screen px-5 py-10 sm:px-8 sm:py-16">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Leaderboard
            </h1>
            <p className="text-muted mt-3 text-sm leading-6">
              Daily · {dateKey}. Equal scores share a rank.
            </p>
          </div>
          <Link
            href="/guessr/daily"
            className="border-foreground/30 hover:border-foreground w-fit border-b pb-1 text-sm font-semibold transition"
          >
            Play the Daily →
          </Link>
        </div>

        <nav
          className="mt-10 flex items-center justify-between gap-6 text-sm"
          aria-label="Daily leaderboard dates"
        >
          {navigation.previousDateKey ? (
            <Link
              href={`/leaderboards/guessr?date=${navigation.previousDateKey}`}
              className="text-muted hover:text-foreground transition"
            >
              ← {navigation.previousDateKey}
            </Link>
          ) : (
            <span className="text-muted">No earlier Daily</span>
          )}
          {navigation.nextDateKey ? (
            <Link
              href={`/leaderboards/guessr?date=${navigation.nextDateKey}`}
              className="text-muted hover:text-foreground transition"
            >
              {navigation.nextDateKey} →
            </Link>
          ) : (
            <span className="text-muted">Latest Daily</span>
          )}
        </nav>

        {!leaderboard.challenge ? (
          <div className="text-muted mt-14 py-12 text-center">
            No Daily was saved for this date.
          </div>
        ) : leaderboard.challenge.status === "VOID" ? (
          <div className="bg-gold/10 mt-12 py-12 text-center">
            This Daily was voided. Its scores are not ranked.
          </div>
        ) : (
          <div className="mt-12">
            <div className="text-muted border-border grid grid-cols-[2.5rem_1fr_auto] gap-3 border-b pb-3 text-xs sm:grid-cols-[4rem_1fr_auto]">
              <span>Rank</span>
              <span>Player</span>
              <span className="text-right">Score</span>
            </div>
            <ol className="divide-border divide-y">
              {leaderboard.entries.map((entry) => (
                <li
                  key={entry.attemptId}
                  className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-4 sm:grid-cols-[4rem_1fr_auto] sm:py-5"
                >
                  <span
                    className={`font-mono text-lg ${entry.rank <= 3 ? "text-gold" : "text-muted"}`}
                  >
                    {entry.rank}
                  </span>
                  <div className="flex min-w-0 items-center gap-3">
                    {entry.avatarUrl ? (
                      // Same-origin proxy keeps Discord provider identifiers private.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.avatarUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="bg-border size-10 rounded-full object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {entry.displayName}
                      </p>
                      {entry.username ? (
                        <Link
                          href={`/user/${entry.username}`}
                          className="text-muted hover:text-foreground block truncate text-xs transition"
                        >
                          @{entry.username}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {entry.totalScore.toLocaleString()}
                  </span>
                </li>
              ))}
              {leaderboard.entries.length === 0 ? (
                <li className="text-muted py-12 text-center">
                  No ranked finishes yet. The first score could be yours.
                </li>
              ) : null}
            </ol>
          </div>
        )}
      </section>
    </main>
  );
}
