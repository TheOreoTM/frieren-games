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
      <section className="border-border bg-surface mx-auto max-w-2xl rounded-[2rem] border p-8 text-center">
        <p className="text-sage text-xs font-semibold tracking-[0.22em] uppercase">
          Daily {results.dateKey}
        </p>
        <h1 className="mt-3 font-serif text-4xl">This Daily was voided</h1>
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
      <aside className="border-border bg-surface rounded-2xl border p-5 xl:sticky xl:top-20 xl:self-start">
        <p className="text-sage text-xs font-semibold tracking-[0.18em] uppercase">
          Current streak
        </p>
        <p className="mt-2 font-serif text-4xl">
          {streak} day{streak === 1 ? "" : "s"}
        </p>
        <h2 className="border-border mt-7 border-t pt-5 font-semibold">
          Today&apos;s leaderboard
        </h2>
        <ol className="mt-3 grid gap-2">
          {leaderboard.entries.slice(0, 10).map((entry) => (
            <li
              key={entry.attemptId}
              className="bg-background/70 grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-lg px-3 py-2 text-sm"
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
          className="text-sage mt-5 inline-block text-sm font-semibold"
        >
          View full leaderboard →
        </Link>
      </aside>
    </div>
  );
}
