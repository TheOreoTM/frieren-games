import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { DailyResults } from "@/features/guessr/components/daily-results";
import { GameRound } from "@/features/guessr/components/game-round";
import {
  getDailyAttemptPageData,
  getDailyLeaderboard,
  getDailyResults,
  getTodayDailyOverview,
  getUserDailyStreak,
} from "@/features/guessr/server/daily";
import { getDailyGameProgression } from "@/features/progression/server/progression";

import { advanceDailyRound, startDailyGame, submitDailyGuess } from "./actions";

export const metadata: Metadata = {
  title: "Daily FrierenGuessr",
};

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id)
    redirect("/api/auth/signin?callbackUrl=/guessr/daily");
  const { attempt: attemptId } = await searchParams;

  if (attemptId) {
    const pageData = await getDailyAttemptPageData(session.user.id, attemptId);
    if (!pageData) redirect("/guessr/daily");
    if (pageData.kind === "void" || pageData.kind === "expired") {
      return (
        <main className="min-h-screen px-5 py-12">
          <section className="border-border bg-surface mx-auto max-w-2xl rounded-[2rem] border p-8 text-center">
            <p className="text-sage text-xs font-semibold tracking-[0.2em] uppercase">
              Daily unavailable
            </p>
            <h1 className="mt-3 font-serif text-4xl">
              {pageData.kind === "void"
                ? "This challenge was voided"
                : "This ranked attempt expired"}
            </h1>
            <p className="text-muted mt-4">
              {pageData.kind === "void"
                ? "The run is unranked and will not affect your streak."
                : "Ranked runs close at the 00:00 UTC reset. Today's challenge is ready when you are."}
            </p>
            <Link
              href="/guessr/daily"
              className="text-sage mt-6 inline-block font-semibold"
            >
              Go to today&apos;s Daily →
            </Link>
          </section>
        </main>
      );
    }
    if (pageData.kind === "complete") {
      const results = await getDailyResults(session.user.id, attemptId);
      if (!results) redirect("/guessr/daily");
      const [leaderboard, streak, progression] = await Promise.all([
        getDailyLeaderboard(pageData.attempt.challenge.dateUtc),
        getUserDailyStreak(
          session.user.id,
          new Date(),
          pageData.attempt.challenge.id,
        ),
        getDailyGameProgression(session.user.id, attemptId),
      ]);
      if (!progression) redirect("/guessr/daily");
      return (
        <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
          <DailyResults
            results={results}
            leaderboard={leaderboard}
            streak={streak}
            progression={progression}
          />
        </main>
      );
    }

    return (
      <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
        <GameRound
          key={`${pageData.attemptId}-${pageData.roundNumber}`}
          gameId={pageData.attemptId}
          {...pageData}
          initialReveal={pageData.reveal}
          modeLabel={`${pageData.ranked ? "Ranked Daily" : "Practice"} · ${pageData.dateKey}`}
          submitGuess={submitDailyGuess.bind(null, pageData.attemptId)}
          advanceRound={advanceDailyRound.bind(null, pageData.attemptId)}
        />
      </main>
    );
  }

  const overview = await getTodayDailyOverview(session.user.id);
  if (overview.rankedAttempt && !overview.rankedAttempt.completedAt) {
    redirect(`/guessr/daily?attempt=${overview.rankedAttempt.id}`);
  }

  const isVoid = overview.challenge.status === "VOID";
  return (
    <main className="px-5 py-10 sm:px-8 sm:py-16">
      <section className="mx-auto w-full max-w-4xl">
        <Link href="/guessr" className="text-muted text-sm font-medium">
          ← FrierenGuessr
        </Link>
        <h1 className="mt-12 text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">
          Today&apos;s five frames
        </h1>
        <p className="text-muted mt-5 max-w-xl text-lg leading-8">
          Everyone receives the same five frames. Your first run is ranked;
          later runs are practice.
        </p>
        <div className="border-border mt-9 grid max-w-xl grid-cols-2 border-y text-sm">
          <div className="border-border border-r py-4 pr-5">
            <p className="text-muted">Current streak</p>
            <p className="mt-1 font-mono text-xl">{overview.streak}</p>
          </div>
          <div className="py-4 pl-5">
            <p className="text-muted">Ranked run</p>
            <p className="mt-1 font-medium">
              {overview.rankedAttempt?.completedAt
                ? overview.rankedAttempt.totalScore.toLocaleString()
                : "Available"}
            </p>
          </div>
        </div>
        {isVoid ? (
          <p className="border-gold bg-gold/10 mt-8 border-l-2 p-4">
            Today&apos;s challenge has been voided.
          </p>
        ) : (
          <form action={startDailyGame} className="mt-8">
            <SubmitButton
              pendingLabel="Preparing Daily…"
              className="bg-foreground text-background px-7 py-4 font-semibold transition hover:opacity-80 disabled:cursor-wait disabled:opacity-60"
            >
              {overview.rankedAttempt?.completedAt
                ? "Start practice run"
                : "Start ranked Daily"}
            </SubmitButton>
          </form>
        )}
        <Link
          href="/leaderboards/guessr"
          className="border-foreground/30 hover:border-foreground mt-7 inline-block border-b pb-1 text-sm font-semibold transition"
        >
          View leaderboard →
        </Link>
      </section>
    </main>
  );
}
