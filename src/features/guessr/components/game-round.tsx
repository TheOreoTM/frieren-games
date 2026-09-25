"use client";

import { useActionState, useMemo, useState } from "react";

import { SubmitButton } from "@/components/ui/submit-button";
import type { EpisodeOption, RoundReveal } from "@/features/guessr/server/game";

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
    ((reveal.guessed.globalOrder - reveal.sequence.firstGlobalOrder) / range) *
    100;
  const correctPosition =
    ((reveal.correct.globalOrder - reveal.sequence.firstGlobalOrder) / range) *
    100;
  const lineStart = Math.min(guessPosition, correctPosition);
  const lineWidth = Math.abs(correctPosition - guessPosition);
  const exactMatch = reveal.distance === 0;

  return (
    <div className="border-border mt-6 border-y py-4">
      <div
        className="relative mx-4 h-16"
        role="img"
        aria-label={
          reveal.distance === 0
            ? "Your guess exactly matches the answer on the episode timeline."
            : `Your guess is ${reveal.distance} episodes away from the answer on the chronological timeline.`
        }
      >
        <div className="bg-border absolute inset-x-0 top-7 h-px" />
        <div
          className="bg-gold absolute top-[1.625rem] h-1 rounded-full"
          style={{
            left: `${lineStart}%`,
            width: `${Math.max(lineWidth, 0.6)}%`,
          }}
        />
        {exactMatch ? (
          <div
            className="timeline-marker bg-sage"
            style={{ left: `${correctPosition}%` }}
          >
            <span className="timeline-marker-label-above">
              Your guess &amp; answer
            </span>
          </div>
        ) : (
          <>
            <div
              className="timeline-marker bg-muted"
              style={{ left: `${guessPosition}%` }}
            >
              <span>Your guess</span>
            </div>
            <div
              className="timeline-marker bg-sage"
              style={{ left: `${correctPosition}%` }}
            >
              <span className="timeline-marker-label-above">Answer</span>
            </div>
          </>
        )}
      </div>
      <div className="text-muted mt-2 flex justify-between text-xs">
        <span>Beginning</span>
        <strong className="text-foreground">
          {reveal.distance === 0
            ? "Exact episode"
            : `${reveal.distance} episode${reveal.distance === 1 ? "" : "s"} away`}
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
  const [episodeId, setEpisodeId] = useState<number | null>(
    initiallyGuessed?.id ?? null,
  );
  const [previewEpisodeId, setPreviewEpisodeId] = useState<number | null>(null);
  const initialState: GuessActionState = {
    reveal: props.initialReveal,
    error: null,
  };
  const [state, submitAction, pending] = useActionState(
    props.submitGuess,
    initialState,
  );
  const reveal = state.reveal;
  const visibleEpisodes = props.episodes.filter(
    (episode) => episode.season === season,
  );
  const previewEpisode = props.episodes.find(
    (episode) => episode.id === (previewEpisodeId ?? episodeId),
  );

  function changeSeason(nextSeason: number) {
    if (reveal) return;
    setSeason(nextSeason);
    setEpisodeId(null);
    setPreviewEpisodeId(null);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-muted text-sm font-medium">{props.modeLabel}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Round {props.roundNumber}{" "}
            <span className="text-muted">/ {props.roundCount}</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-muted text-xs">Running score</p>
          <p className="mt-1 font-mono text-xl font-semibold">
            {props.runningTotal.toLocaleString()}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.8fr)]">
        <section>
          <div className="border-border overflow-hidden border bg-[#111411]">
            {/* Runtime-configured R2 domain; answer-safe object names are enforced during push. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={props.imageUrl}
              alt="Frame to identify"
              width={props.imageWidth}
              height={props.imageHeight}
              className="aspect-video h-auto w-full object-contain"
              fetchPriority="high"
              decoding="async"
            />
          </div>

          {reveal ? (
            <section
              className="reveal-enter border-border mt-5 border-y py-5 sm:py-6"
              aria-live="polite"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-muted text-sm font-medium">Round result</p>
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
                    {reveal.score.toLocaleString()} pts
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-x-7 gap-y-2 text-sm">
                  <span className="text-muted">Your guess</span>
                  <strong>{episodeLabel(reveal.guessed)}</strong>
                  <span className="text-muted">Answer</span>
                  <strong>{episodeLabel(reveal.correct)}</strong>
                  <span className="text-muted">Timestamp</span>
                  <strong className="font-mono">
                    {timestampLabel(reveal.timestampMs)}
                  </strong>
                </div>
              </div>
              <p className="border-border mt-5 border-t pt-4 text-lg font-medium">
                {reveal.correct.title}
              </p>
              <RevealTimeline reveal={reveal} />
              <form action={props.advanceRound} className="mt-5">
                <SubmitButton
                  pendingLabel="Continuing…"
                  className="bg-foreground text-background w-full px-5 py-3.5 font-semibold transition hover:opacity-80 disabled:cursor-wait disabled:opacity-60"
                >
                  {props.roundNumber === props.roundCount
                    ? "View results"
                    : "Next round"}
                </SubmitButton>
              </form>
            </section>
          ) : null}
        </section>

        <aside className="border-border border p-5 lg:sticky lg:top-20 lg:self-start">
          <p className="text-sm font-semibold">Which episode is this?</p>
          <div
            className="mt-4 flex gap-2"
            role="group"
            aria-label="Choose a season"
          >
            {seasons.map((seasonNumber) => (
              <button
                key={seasonNumber}
                type="button"
                aria-pressed={season === seasonNumber}
                disabled={Boolean(reveal)}
                onClick={() => changeSeason(seasonNumber)}
                className={`flex-1 border px-3 py-2 text-sm font-semibold transition ${season === seasonNumber ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/60"}`}
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
                  aria-label={`${episodeLabel(episode)}: ${episode.title}`}
                  onClick={() => setEpisodeId(episode.id)}
                  onMouseEnter={() => setPreviewEpisodeId(episode.id)}
                  onMouseLeave={() => setPreviewEpisodeId(null)}
                  onFocus={() => setPreviewEpisodeId(episode.id)}
                  onBlur={() => setPreviewEpisodeId(null)}
                  className={`aspect-square min-h-11 rounded-sm border text-sm font-semibold transition ${episodeId === episode.id ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground"}`}
                >
                  {episode.episodeNumber}
                </button>
              ))}
            </div>
            <p className="text-muted mt-3 flex min-h-10 items-center justify-center text-center text-sm leading-5">
              {previewEpisode
                ? `${episodeLabel(previewEpisode)} · ${previewEpisode.title}`
                : "Hover, focus, or select an episode to see its title."}
            </p>
            {state.error ? (
              <p
                className="mt-3 text-sm text-red-700 dark:text-red-300"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={episodeId === null || pending || Boolean(reveal)}
              className="bg-foreground text-background mt-5 w-full px-5 py-3.5 font-semibold transition enabled:hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Scoring…" : reveal ? "Guess locked" : "Lock in"}
            </button>
          </form>
          <p className="text-muted mt-4 text-center text-xs leading-5">
            Distance follows the complete chronological episode order across
            seasons.
          </p>
        </aside>
      </div>
    </div>
  );
}
