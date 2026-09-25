import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";

export type GameResultsData = {
  totalScore: number;
  rounds: Array<{
    roundNumber: number;
    score: number;
    distance: number;
    guessed: { season: number; episodeNumber: number };
    correct: { season: number; episodeNumber: number; title: string };
  }>;
};

export type GameProgressionData = {
  totalXp: number;
  xpGained: number;
  leveledUp: boolean;
  level: {
    level: number;
    earnedThisLevel: number;
    neededThisLevel: number;
    nextLevelXp: number;
  };
  rewards: Array<{ label: string; amount: number }>;
  dailyCap?: { earned: number; cap: number };
};

function episodeLabel(episode: { season: number; episodeNumber: number }) {
  return `S${episode.season}E${String(episode.episodeNumber).padStart(2, "0")}`;
}

function resultTitle(totalScore: number) {
  if (totalScore === 25_000) return "A perfect memory";
  if (totalScore >= 20_000) return "An exceptional journey";
  if (totalScore >= 15_000) return "A keen eye";
  if (totalScore >= 10_000) return "A steady journey";
  return "The journey continues";
}

function ProgressionPanel({ progression }: { progression?: GameProgressionData }) {
  if (!progression) {
    return (
      <section className="flex flex-col gap-3 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Want to keep your progress?</p>
          <p className="mt-1 text-sm text-muted">Sign in before your next run to earn XP and achievements.</p>
        </div>
        <Link href="/api/auth/signin?callbackUrl=/guessr" className="text-sm font-semibold text-sage">
          Sign in →
        </Link>
      </section>
    );
  }

  const levelPercent = Math.min(
    100,
    (progression.level.earnedThisLevel / progression.level.neededThisLevel) * 100,
  );
  const xpToNextLevel = progression.level.nextLevelXp - progression.totalXp;
  const zeroXpMessage = progression.dailyCap
    ? "Daily Unlimited XP cap reached"
    : "Practice runs do not award XP";

  return (
    <section className="border-y border-border py-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{progression.leveledUp ? "Level up" : "XP earned"}</p>
          <p className="mt-1 font-mono text-2xl font-semibold">+{progression.xpGained.toLocaleString()} XP</p>
        </div>
        <p className="text-sm font-semibold">Level {progression.level.level}</p>
      </div>
      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-label={`Level ${progression.level.level} progress`}
        aria-valuemin={0}
        aria-valuemax={progression.level.neededThisLevel}
        aria-valuenow={progression.level.earnedThisLevel}
      >
        <div className="h-full rounded-full bg-gold" style={{ width: `${levelPercent}%` }} />
      </div>
      <div className="mt-2 flex justify-between gap-4 text-xs text-muted">
        <span>{progression.totalXp.toLocaleString()} total XP</span>
        <span>{xpToNextLevel.toLocaleString()} XP to level {progression.level.level + 1}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {progression.rewards.length > 0
          ? progression.rewards.map((reward) => (
              <p key={reward.label}>
                <span className="text-muted">{reward.label}</span>{" "}
                <strong className="font-mono text-gold">+{reward.amount}</strong>
              </p>
            ))
          : <p className="text-muted">{zeroXpMessage}</p>}
        {progression.dailyCap ? (
          <p className="text-muted">Daily Unlimited XP {progression.dailyCap.earned}/{progression.dailyCap.cap}</p>
        ) : null}
      </div>
    </section>
  );
}

export function GameResults({
  results,
  modeLabel,
  action,
  actionLabel,
  progression,
}: {
  results: GameResultsData;
  modeLabel: string;
  action: () => Promise<void>;
  actionLabel: string;
  progression?: GameProgressionData;
}) {
  const exactGuesses = results.rounds.filter((round) => round.distance === 0).length;
  const averageDistance =
    results.rounds.reduce((total, round) => total + round.distance, 0) / results.rounds.length;
  const scorePercent = (results.totalScore / 25_000) * 100;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <section className="reveal-enter rounded-3xl border border-border bg-surface p-6 shadow-[0_24px_70px_-50px_var(--shadow)] sm:p-10">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">{modeLabel}</p>
          <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">Game complete</h1>
          <p className="mt-2 text-sm text-muted">{resultTitle(results.totalScore)}</p>
          <p className="mt-6 font-mono text-4xl font-semibold sm:text-5xl">{results.totalScore.toLocaleString()}</p>
          <p className="mt-1 text-sm text-muted">out of 25,000</p>
          <div
            className="mx-auto mt-5 h-1.5 max-w-md overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-label="Final score"
            aria-valuemin={0}
            aria-valuemax={25_000}
            aria-valuenow={results.totalScore}
          >
            <div className="h-full rounded-full bg-sage" style={{ width: `${scorePercent}%` }} />
          </div>
        </header>

        <div className="mt-7 flex justify-center divide-x divide-border text-center">
          <div className="px-6">
            <p className="font-mono text-xl font-semibold">{exactGuesses}/5</p>
            <p className="mt-1 text-xs text-muted">Exact guesses</p>
          </div>
          <div className="px-6">
            <p className="font-mono text-xl font-semibold">{averageDistance.toFixed(1)}</p>
            <p className="mt-1 text-xs text-muted">Average distance</p>
          </div>
        </div>

        <div className="mt-8 grid gap-7">
          <ProgressionPanel progression={progression} />

          <section>
            <h2 className="font-serif text-xl">Round recap</h2>
            <div className="mt-2 divide-y divide-border">
              {results.rounds.map((round) => (
                <article
                  key={round.roundNumber}
                  className="grid gap-2 py-4 sm:grid-cols-[4rem_1fr_auto] sm:items-center"
                >
                  <p className="text-sm font-semibold text-muted">Round {round.roundNumber}</p>
                  <div>
                    <p className="font-medium">
                      {episodeLabel(round.guessed)} → {episodeLabel(round.correct)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {round.distance === 0 ? "Exact episode" : `${round.distance} episode${round.distance === 1 ? "" : "s"} away`} · {round.correct.title}
                    </p>
                  </div>
                  <p className={`font-mono font-semibold ${round.distance === 0 ? "text-gold" : ""}`}>
                    {round.score.toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <form action={action}>
            <SubmitButton pendingLabel="Preparing your next journey…" className="w-full rounded-xl bg-sage px-6 py-4 font-semibold text-white transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60">
              {actionLabel}
            </SubmitButton>
          </form>
        </div>
      </section>
    </div>
  );
}
