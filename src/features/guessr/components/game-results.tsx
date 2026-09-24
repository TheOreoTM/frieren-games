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

function episodeLabel(episode: { season: number; episodeNumber: number }) {
  return `S${episode.season}E${String(episode.episodeNumber).padStart(2, "0")}`;
}

export function GameResults({
  results,
  modeLabel,
  action,
  actionLabel,
  progressionNote,
}: {
  results: GameResultsData;
  modeLabel: string;
  action: () => Promise<void>;
  actionLabel: string;
  progressionNote?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <section className="rounded-[2rem] border border-border bg-surface p-6 shadow-[0_30px_90px_-55px_var(--shadow)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">{modeLabel}</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-serif text-5xl tracking-tight sm:text-6xl">Your journey</h1>
          <p className="font-mono text-3xl font-semibold">
            {results.totalScore.toLocaleString()} <span className="text-base text-muted">/ 25,000</span>
          </p>
        </div>
        {progressionNote ? (
          <p className="mt-4 rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm font-medium text-sage">
            {progressionNote}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3">
          {results.rounds.map((round) => (
            <article
              key={round.roundNumber}
              className={`grid gap-3 rounded-xl border p-4 sm:grid-cols-[4rem_1fr_auto] sm:items-center ${round.distance === 0 ? "border-gold bg-gold/10" : "border-border bg-background/60"}`}
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
              <p className="font-mono text-lg font-semibold">{round.score.toLocaleString()}</p>
            </article>
          ))}
        </div>

        <form action={action} className="mt-8">
          <button type="submit" className="w-full rounded-xl bg-sage px-6 py-4 font-semibold text-white transition hover:brightness-105">
            {actionLabel}
          </button>
        </form>
      </section>
    </div>
  );
}
