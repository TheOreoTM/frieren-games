"use client";

import { useActionState, useMemo, useState } from "react";

import type {
  EpisodeOption,
  RoundReveal,
} from "@/features/guessr/server/game";

export type GuessActionState = {
  reveal: RoundReveal | null;
  error: string | null;
};

type GameRoundProps = {
  gameId: string;
  roundNumber: number;
  roundCount: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  episodes: EpisodeOption[];
  runningTotal: number;
  initialReveal: RoundReveal | null;
  modeLabel: string;
  submitGuess: (
    previousState: GuessActionState,
    formData: FormData,
  ) => Promise<GuessActionState>;
  advanceRound: () => Promise<void>;
};

function episodeLabel(episode: { season: number; episodeNumber: number }) {
  return `S${episode.season}E${String(episode.episodeNumber).padStart(2, "0")}`;
}

function timestampLabel(timestampMs: number) {
  const minutes = Math.floor(timestampMs / 60_000);
  const seconds = Math.floor((timestampMs % 60_000) / 1_000);
  const milliseconds = timestampMs % 1_000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function RevealTimeline({ reveal }: { reveal: RoundReveal }) {
  const range = Math.max(
    1,
    reveal.sequence.lastGlobalOrder - reveal.sequence.firstGlobalOrder,
  );
  const guessPosition =
    ((reveal.guessed.globalOrder - reveal.sequence.firstGlobalOrder) / range) * 100;
  const correctPosition =
    ((reveal.correct.globalOrder - reveal.sequence.firstGlobalOrder) / range) * 100;
  const lineStart = Math.min(guessPosition, correctPosition);
  const lineWidth = Math.abs(correctPosition - guessPosition);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-background/70 p-4">
      <div className="relative mx-4 h-16" aria-label="Chronological distance between guess and answer">
        <div className="absolute inset-x-0 top-7 h-px bg-border" />
        <div
          className="absolute top-[1.625rem] h-1 rounded-full bg-gold"
          style={{ left: `${lineStart}%`, width: `${Math.max(lineWidth, 0.6)}%` }}
        />
        <div className="timeline-marker bg-muted" style={{ left: `${guessPosition}%` }}>
          <span>Your guess</span>
        </div>
        <div className="timeline-marker bg-sage" style={{ left: `${correctPosition}%` }}>
          <span>Answer</span>
        </div>
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>Beginning</span>
        <strong className="text-foreground">
          {reveal.distance === 0 ? "Exact episode" : `${reveal.distance} episode${reveal.distance === 1 ? "" : "s"} away`}
        </strong>
        <span>Latest</span>
      </div>
    </div>
  );
}

export function GameRound(props: GameRoundProps) {
  const seasons = useMemo(
    () => [...new Set(props.episodes.map((episode) => episode.season))],
    [props.episodes],
  );
  const initiallyGuessed = props.initialReveal
    ? props.episodes.find(
        (episode) =>
          episode.season === props.initialReveal?.guessed.season &&
          episode.episodeNumber === props.initialReveal.guessed.episodeNumber,
      )
    : undefined;
  const [season, setSeason] = useState(
    props.initialReveal?.guessed.season ?? seasons[0] ?? 1,
  );
  const [episodeId, setEpisodeId] = useState<number | null>(initiallyGuessed?.id ?? null);
  const initialState: GuessActionState = {
    reveal: props.initialReveal,
    error: null,
  };
  const [state, submitAction, pending] = useActionState(
    props.submitGuess,
    initialState,
  );
  const reveal = state.reveal;
  const visibleEpisodes = props.episodes.filter((episode) => episode.season === season);

  function changeSeason(nextSeason: number) {
    if (reveal) return;
    setSeason(nextSeason);
    setEpisodeId(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">{props.modeLabel}</p>
          <h1 className="mt-1 font-serif text-3xl tracking-tight sm:text-4xl">
            Round {props.roundNumber} <span className="text-muted">/ {props.roundCount}</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted">Running score</p>
          <p className="mt-1 font-mono text-xl font-semibold">{props.runningTotal.toLocaleString()}</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.8fr)]">
        <section>
          <div className="overflow-hidden rounded-2xl border border-border bg-[#111411] shadow-[0_24px_70px_-40px_var(--shadow)]">
            {/* Runtime-configured R2 domain; answer-safe object names are enforced during push. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={props.imageUrl}
              alt="Frame to identify"
              width={props.imageWidth}
              height={props.imageHeight}
              className="aspect-video h-auto w-full object-contain"
              fetchPriority="high"
            />
          </div>

          {reveal ? (
            <section className="reveal-enter mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">Round result</p>
                  <p className="mt-2 font-serif text-4xl tracking-tight">{reveal.score.toLocaleString()} pts</p>
                </div>
                <div className="grid grid-cols-2 gap-x-7 gap-y-2 text-sm">
                  <span className="text-muted">Your guess</span><strong>{episodeLabel(reveal.guessed)}</strong>
                  <span className="text-muted">Answer</span><strong>{episodeLabel(reveal.correct)}</strong>
                  <span className="text-muted">Timestamp</span><strong className="font-mono">{timestampLabel(reveal.timestampMs)}</strong>
                </div>
              </div>
              <p className="mt-5 border-t border-border pt-4 text-lg font-medium">{reveal.correct.title}</p>
              <RevealTimeline reveal={reveal} />
              <form action={props.advanceRound} className="mt-5">
                <button className="w-full rounded-xl bg-sage px-5 py-3.5 font-semibold text-white transition hover:brightness-105" type="submit">
                  {props.roundNumber === props.roundCount ? "View results" : "Next round"}
                </button>
              </form>
            </section>
          ) : null}
        </section>

        <aside className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-6 lg:self-start">
          <p className="text-sm font-semibold">Which episode is this?</p>
          <div className="mt-4 flex gap-2" role="tablist" aria-label="Season">
            {seasons.map((seasonNumber) => (
              <button
                key={seasonNumber}
                type="button"
                role="tab"
                aria-selected={season === seasonNumber}
                disabled={Boolean(reveal)}
                onClick={() => changeSeason(seasonNumber)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${season === seasonNumber ? "border-sage bg-sage/15 text-sage" : "border-border hover:border-sage/60"}`}
              >
                Season {seasonNumber}
              </button>
            ))}
          </div>

          <form action={submitAction} className="mt-4">
            <input type="hidden" name="episodeId" value={episodeId ?? ""} />
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-5">
              {visibleEpisodes.map((episode) => (
                <button
                  key={episode.id}
                  type="button"
                  disabled={Boolean(reveal)}
                  aria-pressed={episodeId === episode.id}
                  onClick={() => setEpisodeId(episode.id)}
                  className={`aspect-square min-h-11 rounded-lg border text-sm font-semibold transition ${episodeId === episode.id ? "border-sage bg-sage text-white shadow-sm" : "border-border bg-background hover:border-sage hover:bg-sage/10"}`}
                >
                  {episode.episodeNumber}
                </button>
              ))}
            </div>
            {state.error ? <p className="mt-3 text-sm text-red-700 dark:text-red-300">{state.error}</p> : null}
            <button
              type="submit"
              disabled={episodeId === null || pending || Boolean(reveal)}
              className="mt-5 w-full rounded-xl bg-foreground px-5 py-3.5 font-semibold text-background transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Scoring…" : reveal ? "Guess locked" : "Lock in"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs leading-5 text-muted">
            Distance follows the complete chronological episode order across seasons.
          </p>
        </aside>
      </div>
    </div>
  );
}
