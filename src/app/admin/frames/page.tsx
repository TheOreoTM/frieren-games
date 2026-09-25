import Link from "next/link";

import {
  listAdminFrames,
  listFrameFilterOptions,
  parseAdminFrameFilters,
} from "@/data/frames";
import { SubmitButton } from "@/components/ui/submit-button";
import { isReservedForUnlimited } from "@/features/guessr/domain/daily-policy";
import { requireAdmin } from "@/lib/authorization";

import { updateFrameDifficulty, updateFrameEnabled } from "./actions";

function timestampLabel(timestampMs: number) {
  const totalSeconds = Math.floor(timestampMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = timestampMs % 1000;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

export default async function FrameAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  const filters = parseAdminFrameFilters(await searchParams);
  const [frames, episodeOptions] = await Promise.all([
    listAdminFrames(filters),
    listFrameFilterOptions(),
  ]);
  const seasons = [...new Set(episodeOptions.map((episode) => episode.season))];

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-border flex flex-col gap-3 border-b pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sage text-xs font-semibold tracking-[0.2em] uppercase">
              Frame administration
            </p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight">
              Uploaded frames
            </h1>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-muted max-w-md text-sm leading-6">
              Only authenticated administrators can review or change uploaded
              frames.
            </p>
            <div className="text-sage flex gap-4 text-sm font-semibold">
              <Link href="/admin/dailies">Manage Dailies →</Link>
              <Link href="/admin/connections">Connections →</Link>
            </div>
          </div>
        </header>

        <form className="border-border bg-surface my-6 grid gap-3 rounded-2xl border p-4 sm:grid-cols-5">
          <label className="text-muted grid gap-1 text-xs font-semibold tracking-wide uppercase">
            Season
            <select
              name="season"
              defaultValue={filters.season ?? ""}
              className="admin-input"
            >
              <option value="">All seasons</option>
              {seasons.map((season) => (
                <option key={season} value={season}>
                  Season {season}
                </option>
              ))}
            </select>
          </label>
          <label className="text-muted grid gap-1 text-xs font-semibold tracking-wide uppercase">
            Episode
            <input
              className="admin-input"
              type="number"
              min="1"
              name="episode"
              defaultValue={filters.episode ?? ""}
              placeholder="All episodes"
            />
          </label>
          <label className="text-muted grid gap-1 text-xs font-semibold tracking-wide uppercase">
            Difficulty
            <select
              name="difficulty"
              defaultValue={filters.difficulty ?? ""}
              className="admin-input"
            >
              <option value="">All difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
          <label className="text-muted grid gap-1 text-xs font-semibold tracking-wide uppercase">
            Status
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="admin-input"
            >
              <option value="">Any status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <button
            className="bg-sage self-end rounded-lg px-4 py-3 font-semibold text-white"
            type="submit"
          >
            Apply filters
          </button>
        </form>

        <p className="text-muted mb-4 text-sm">
          Showing {frames.length} frame{frames.length === 1 ? "" : "s"}
          {frames.length === 250 ? " (limit reached)" : ""}.
        </p>

        {frames.length === 0 ? (
          <div className="border-border bg-surface text-muted rounded-2xl border border-dashed p-12 text-center">
            No uploaded frames match these filters.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {frames.map((frame) => (
              <article
                key={frame.id}
                className="border-border bg-surface overflow-hidden rounded-2xl border shadow-sm"
              >
                {/* R2 host is runtime configuration, so this admin preview intentionally bypasses next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.imageUrl}
                  alt={`Curated frame from season ${frame.episode.season}, episode ${frame.episode.episodeNumber}`}
                  className="bg-background aspect-video w-full object-contain"
                  loading="lazy"
                  width={frame.width}
                  height={frame.height}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        S{frame.episode.season}E
                        {String(frame.episode.episodeNumber).padStart(2, "0")}
                      </p>
                      <p className="text-muted mt-1 text-sm">
                        {frame.episode.title}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${frame.enabled ? "bg-sage/15 text-sage" : "bg-border text-muted"}`}
                    >
                      {frame.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <dl className="border-border mt-4 grid grid-cols-2 gap-3 border-y py-3 text-sm">
                    <div>
                      <dt className="text-muted text-xs uppercase">
                        Timestamp
                      </dt>
                      <dd className="mt-1 font-mono">
                        {timestampLabel(frame.timestampMs)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted text-xs uppercase">
                        Dimensions
                      </dt>
                      <dd className="mt-1">
                        {frame.width}×{frame.height}
                      </dd>
                    </div>
                  </dl>
                  {frame.dailyRounds.length > 0 ? (
                    <p className="text-muted mt-3 text-xs">
                      Daily use:{" "}
                      {frame.dailyRounds
                        .map(
                          (round) =>
                            `${round.challenge.dateUtc.toISOString().slice(0, 10)} R${round.roundNumber} (${round.challenge.status})`,
                        )
                        .join(", ")}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form
                      action={updateFrameDifficulty}
                      className="flex flex-1 gap-2"
                    >
                      <input type="hidden" name="id" value={frame.id} />
                      <select
                        name="difficulty"
                        defaultValue={frame.difficulty}
                        className="admin-input min-w-0 flex-1"
                        aria-label="Difficulty"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                      <SubmitButton
                        pendingLabel="Saving…"
                        className="border-border rounded-lg border px-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
                      >
                        Save
                      </SubmitButton>
                    </form>
                    <form action={updateFrameEnabled}>
                      <input type="hidden" name="id" value={frame.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={String(!frame.enabled)}
                      />
                      <SubmitButton
                        pendingLabel="Saving…"
                        disabled={
                          frame.enabled &&
                          isReservedForUnlimited(
                            frame.dailyRounds.map((round) => round.challenge),
                          )
                        }
                        title={
                          frame.enabled &&
                          isReservedForUnlimited(
                            frame.dailyRounds.map((round) => round.challenge),
                          )
                            ? "Replace or void the current/future Daily reservation first."
                            : undefined
                        }
                        className="border-border rounded-lg border px-3 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {frame.enabled ? "Disable" : "Enable"}
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
