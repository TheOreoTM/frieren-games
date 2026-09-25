import Link from "next/link";

import { startDailyGame } from "@/app/guessr/daily/actions";
import type {
  getDailyLeaderboard,
  getDailyResults,
} from "@/features/guessr/server/daily";
import type { getDailyGameProgression } from "@/features/progression/server/progression";

import { GameResults } from "./game-results";

type Results = NonNullable<Awaited<ReturnType<typeof getDailyResults>>>;
type Leaderboard = Awaited<ReturnType<typeof getDailyLeaderboard>>;
type Progression = NonNullable<
  Awaited<ReturnType<typeof getDailyGameProgression>>
>;

export function DailyResults({
  results,
  leaderboard,
  streak,
  progression,
}: {
  results: Results;
  leaderboard: Leaderboard;
  streak: number;
  progression: Progression;
}) {
  if (results.void) {
    return (
      <section className="border-border mx-auto max-w-2xl border-y py-8 text-center">
        <p className="text-muted text-sm font-medium">
          Daily {results.dateKey}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          This Daily was voided
        </h1>
        <p className="text-muted mt-4">
          Its scores are unranked and it does not count against your streak.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <GameResults
        results={results}
        modeLabel={`${results.ranked ? "Ranked Daily" : "Daily practice"} · ${results.dateKey}`}
        action={startDailyGame}
        actionLabel="Play practice run"
        progression={progression}
      />
      <aside className="border-border border p-5 xl:sticky xl:top-20 xl:self-start">
        <p className="text-muted text-sm">Current streak</p>
        <p className="mt-2 text-4xl font-semibold tracking-tight">
          {streak} day{streak === 1 ? "" : "s"}
        </p>
        <h2 className="border-border mt-7 border-t pt-5 font-semibold">
          Today&apos;s leaderboard
        </h2>
        <ol className="mt-3 grid gap-2">
          {leaderboard.entries.slice(0, 10).map((entry) => (
            <li
              key={entry.attemptId}
              className="border-border grid grid-cols-[2rem_1fr_auto] items-center gap-2 border-t px-1 py-2.5 text-sm"
            >
              <span className="text-muted font-mono">{entry.rank}</span>
              <span className="truncate font-medium">{entry.displayName}</span>
              <span className="font-mono">
                {entry.totalScore.toLocaleString()}
              </span>
            </li>
          ))}
          {leaderboard.entries.length === 0 ? (
            <li className="text-muted text-sm">No ranked finishes yet.</li>
          ) : null}
        </ol>
        <Link
          href={`/leaderboards/guessr?date=${results.dateKey}`}
          className="border-foreground/30 hover:border-foreground mt-5 inline-block border-b pb-1 text-sm font-semibold transition"
        >
          View full leaderboard →
        </Link>
      </aside>
    </div>
  );
}
