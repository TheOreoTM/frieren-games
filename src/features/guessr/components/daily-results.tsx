import Link from "next/link";

import { startDailyGame } from "@/app/guessr/daily/actions";
import type { getDailyLeaderboard, getDailyResults } from "@/features/guessr/server/daily";
import type { getDailyGameProgression } from "@/features/progression/server/progression";

import { GameResults } from "./game-results";

type Results = NonNullable<Awaited<ReturnType<typeof getDailyResults>>>;
type Leaderboard = Awaited<ReturnType<typeof getDailyLeaderboard>>;
type Progression = NonNullable<Awaited<ReturnType<typeof getDailyGameProgression>>>;

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
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-surface p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">Daily {results.dateKey}</p>
        <h1 className="mt-3 font-serif text-4xl">This Daily was voided</h1>
        <p className="mt-4 text-muted">Its scores are unranked and it does not count against your streak.</p>
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
      <aside className="rounded-2xl border border-border bg-surface p-5 xl:sticky xl:top-20 xl:self-start">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">Current streak</p>
        <p className="mt-2 font-serif text-4xl">{streak} day{streak === 1 ? "" : "s"}</p>
        <h2 className="mt-7 border-t border-border pt-5 font-semibold">Today&apos;s leaderboard</h2>
        <ol className="mt-3 grid gap-2">
          {leaderboard.entries.slice(0, 10).map((entry) => (
            <li key={entry.attemptId} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-lg bg-background/70 px-3 py-2 text-sm">
              <span className="font-mono text-muted">{entry.rank}</span>
              <span className="truncate font-medium">{entry.displayName}</span>
              <span className="font-mono">{entry.totalScore.toLocaleString()}</span>
            </li>
          ))}
          {leaderboard.entries.length === 0 ? <li className="text-sm text-muted">No ranked finishes yet.</li> : null}
        </ol>
        <Link href={`/leaderboards/guessr?date=${results.dateKey}`} className="mt-5 inline-block text-sm font-semibold text-sage">
          View full leaderboard →
        </Link>
      </aside>
    </div>
  );
}
