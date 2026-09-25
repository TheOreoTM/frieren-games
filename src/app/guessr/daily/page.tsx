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

import { advanceDailyRound, startDailyGame, submitDailyGuess } from "./actions";

export const metadata: Metadata = {
  title: "Daily FrierenGuessr | Frieren Games",
};

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin?callbackUrl=/guessr/daily");
  const { attempt: attemptId } = await searchParams;

  if (attemptId) {
    const pageData = await getDailyAttemptPageData(session.user.id, attemptId);
    if (!pageData) redirect("/guessr/daily");
    if (pageData.kind === "void" || pageData.kind === "expired") {
      return (
        <main className="min-h-screen px-5 py-12">
          <section className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-surface p-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">Daily unavailable</p>
            <h1 className="mt-3 font-serif text-4xl">
              {pageData.kind === "void" ? "This challenge was voided" : "This ranked attempt expired"}
            </h1>
            <p className="mt-4 text-muted">
              {pageData.kind === "void"
                ? "The run is unranked and will not affect your streak."
                : "Ranked runs close at the 00:00 UTC reset. Today's challenge is ready when you are."}
            </p>
            <Link href="/guessr/daily" className="mt-6 inline-block font-semibold text-sage">Go to today&apos;s Daily →</Link>
          </section>
        </main>
      );
    }
    if (pageData.kind === "complete") {
      const results = await getDailyResults(session.user.id, attemptId);
      if (!results) redirect("/guessr/daily");
      const [leaderboard, streak] = await Promise.all([
        getDailyLeaderboard(pageData.attempt.challenge.dateUtc),
        getUserDailyStreak(session.user.id, new Date(), pageData.attempt.challenge.id),
      ]);
      return (
        <main className="min-h-screen px-4 py-8 sm:px-8 sm:py-12">
          <DailyResults results={results} leaderboard={leaderboard} streak={streak} />
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
    <main className="relative flex min-h-screen items-center overflow-hidden px-5 py-12">
      <div className="magic-glow" aria-hidden="true" />
      <section className="relative mx-auto w-full max-w-3xl rounded-[2rem] border border-border bg-surface/95 p-8 shadow-[0_30px_100px_-55px_var(--shadow)] sm:p-12">
        <Link href="/guessr" className="text-sm font-medium text-muted">← FrierenGuessr</Link>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.22em] text-sage">Shared worldwide · resets 00:00 UTC</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight">Today&apos;s Daily</h1>
        <p className="mt-4 max-w-xl leading-7 text-muted">
          Everyone receives the same five frames. Your first run is ranked; later runs are practice.
        </p>
        <div className="mt-7 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-border px-3 py-1.5">Streak: {overview.streak}</span>
          <span className="rounded-full border border-border px-3 py-1.5">
            {overview.rankedAttempt?.completedAt ? `Ranked score: ${overview.rankedAttempt.totalScore.toLocaleString()}` : "Ranked attempt available"}
          </span>
        </div>
        {isVoid ? (
          <p className="mt-8 rounded-xl border border-gold/40 bg-gold/10 p-4">Today&apos;s challenge has been voided.</p>
        ) : (
          <form action={startDailyGame} className="mt-8">
            <SubmitButton pendingLabel="Preparing Daily…" className="rounded-xl bg-sage px-7 py-4 font-semibold text-white transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60">
              {overview.rankedAttempt?.completedAt ? "Start practice run" : "Start ranked Daily"}
            </SubmitButton>
          </form>
        )}
        <Link href="/leaderboards/guessr" className="mt-6 inline-block text-sm font-semibold text-sage">
          View Daily leaderboards →
        </Link>
      </section>
    </main>
  );
}
