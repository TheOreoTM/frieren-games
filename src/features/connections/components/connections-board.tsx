"use client";

import { useActionState, useMemo, useState } from "react";

import type { ConnectionsPlayerPuzzle } from "../domain/attempt";

type ConnectionsFeedback = {
  kind: "CORRECT" | "INCORRECT" | "ONE_AWAY" | "DUPLICATE";
  message: string;
};

export type ConnectionsActionState = {
  puzzle: ConnectionsPlayerPuzzle;
  feedback: ConnectionsFeedback | null;
  error: string | null;
};

type ConnectionsBoardProps = {
  initialState: ConnectionsActionState;
  submitSelection: (
    previousState: ConnectionsActionState,
    formData: FormData,
  ) => Promise<ConnectionsActionState>;
};

const groupStyles = [
  "border-sage/40 bg-sage/15",
  "border-gold/45 bg-gold/15",
  "border-magic/50 bg-magic/15",
  "border-violet-400/40 bg-violet-400/10",
] as const;

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function ConnectionsBoard({
  initialState,
  submitSelection,
}: ConnectionsBoardProps) {
  const [state, formAction, pending] = useActionState(
    submitSelection,
    initialState,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [manualOrder, setManualOrder] = useState<string[]>(
    initialState.puzzle.tiles.map((tile) => tile.id),
  );
  const orderedTiles = useMemo(() => {
    const tilesById = new Map(
      state.puzzle.tiles.map((tile) => [tile.id, tile]),
    );
    const retained = manualOrder.filter((tileId) => tilesById.has(tileId));
    const retainedIds = new Set(retained);
    return [
      ...retained,
      ...state.puzzle.tiles
        .map((tile) => tile.id)
        .filter((tileId) => !retainedIds.has(tileId)),
    ].map((tileId) => tilesById.get(tileId)!);
  }, [manualOrder, state.puzzle.tiles]);

  function toggleTile(tileId: string) {
    if (pending || state.puzzle.status !== "IN_PROGRESS") return;
    setSelectedIds((current) =>
      current.includes(tileId)
        ? current.filter((id) => id !== tileId)
        : current.length < 4
          ? [...current, tileId]
          : current,
    );
  }

  const ended = state.puzzle.status !== "IN_PROGRESS";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="text-center">
        <p className="text-muted text-sm font-medium">
          Today&apos;s Connections
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          Find four groups of four.
        </h1>
        <p className="text-muted mt-4 text-sm leading-6">
          Select four Frieren-related terms that share a connection.
        </p>
      </header>

      <section className="mt-8" aria-label="Solved groups">
        <div className="grid gap-2">
          {state.puzzle.revealedGroups.map((group) => (
            <article
              key={group.id}
              className={`reveal-enter rounded-lg border px-4 py-4 text-center ${groupStyles[(group.position - 1) % groupStyles.length]}`}
            >
              <h2 className="font-semibold tracking-wide uppercase">
                {group.label}
              </h2>
              <p className="mt-1 text-sm font-medium">
                {group.tiles.map((tile) => tile.text).join(", ")}
              </p>
              {group.explanation ? (
                <p className="text-muted mt-2 text-xs leading-5">
                  {group.explanation}
                </p>
              ) : null}
            </article>
          ))}
        </div>

        {orderedTiles.length > 0 ? (
          <div
            className="mt-2 grid grid-cols-4 gap-2"
            role="group"
            aria-label="Puzzle tiles"
          >
            {orderedTiles.map((tile) => {
              const selected = selectedIds.includes(tile.id);
              return (
                <button
                  key={tile.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={pending}
                  onClick={() => toggleTile(tile.id)}
                  className={`flex min-h-20 items-center justify-center rounded-md border px-2 py-3 text-center text-xs leading-4 font-semibold break-words transition sm:min-h-24 sm:px-3 sm:text-sm ${selected ? "border-foreground bg-foreground text-background -translate-y-0.5" : "border-border bg-surface hover:border-foreground/60"} disabled:cursor-wait disabled:opacity-60`}
                >
                  {tile.text}
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      <div className="mt-6 min-h-14 text-center" aria-live="polite">
        {ended ? (
          <div>
            <p className="text-xl font-semibold">
              {state.puzzle.status === "SOLVED"
                ? "All connections found."
                : "That was the last mistake."}
            </p>
            <p className="text-muted mt-1 text-sm">
              {state.puzzle.status === "SOLVED"
                ? "Come back tomorrow for a new puzzle."
                : "The remaining groups have been revealed."}
            </p>
          </div>
        ) : state.error ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {state.error}
          </p>
        ) : state.feedback ? (
          <p
            className={`text-sm font-semibold ${state.feedback.kind === "CORRECT" ? "text-sage" : "text-foreground"}`}
          >
            {state.feedback.message}
          </p>
        ) : (
          <p className="text-muted text-sm">{selectedIds.length}/4 selected</p>
        )}
      </div>

      {!ended ? (
        <>
          <div
            className="mt-1 flex items-center justify-center gap-2"
            aria-label={`${state.puzzle.mistakesRemaining} mistakes remaining`}
          >
            <span className="text-muted mr-1 text-xs font-medium">
              Mistakes remaining
            </span>
            {Array.from({ length: 4 }, (_, index) => (
              <span
                key={index}
                className={`size-2.5 rounded-full border ${index < state.puzzle.mistakesRemaining ? "border-foreground bg-foreground" : "border-border"}`}
                aria-hidden="true"
              />
            ))}
          </div>

          <form
            action={(formData) => {
              setSelectedIds([]);
              formAction(formData);
            }}
            className="mt-6"
          >
            {selectedIds.map((tileId) => (
              <input key={tileId} type="hidden" name="tileId" value={tileId} />
            ))}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  setManualOrder(shuffled(orderedTiles).map((tile) => tile.id))
                }
                className="border-border hover:border-foreground min-h-11 rounded-full border px-5 text-sm font-semibold transition disabled:opacity-50"
              >
                Shuffle
              </button>
              <button
                type="button"
                disabled={pending || selectedIds.length === 0}
                onClick={() => setSelectedIds([])}
                className="border-border hover:border-foreground min-h-11 rounded-full border px-5 text-sm font-semibold transition disabled:opacity-40"
              >
                Deselect all
              </button>
              <button
                type="submit"
                disabled={pending || selectedIds.length !== 4}
                className="bg-foreground text-background min-h-11 rounded-full px-6 text-sm font-semibold transition enabled:hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {pending ? "Checking…" : "Submit"}
              </button>
            </div>
          </form>
        </>
      ) : null}
    </div>
  );
}
