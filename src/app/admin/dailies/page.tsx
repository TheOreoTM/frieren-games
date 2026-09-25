import type { Metadata } from "next";
import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { addUtcDays, enumerateUtcDates, parseUtcDateKey, utcDateKey } from "@/features/guessr/domain/utc-date";
import { listAdminDailies } from "@/features/guessr/server/daily-admin";
import { requireAdmin } from "@/lib/authorization";

import {
  approveDailyAction,
  generateDailies,
  regenerateDailyAction,
  replaceDailyRoundAction,
  voidDailyAction,
} from "./actions";

export const metadata: Metadata = { title: "Daily Admin | Frieren Games" };

function monthBounds(month: string) {
  const first = parseUtcDateKey(`${month}-01`);
  const next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1));
  return { first, last: addUtcDays(next, -1) };
}

function shiftMonth(month: string, offset: number) {
  const first = parseUtcDateKey(`${month}-01`);
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + offset, 1))
    .toISOString()
    .slice(0, 7);
}

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(value);
}

export default async function DailyAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; notice?: string }>;
}) {
  await requireAdmin("/admin/dailies");
  const params = await searchParams;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "") ? params.month! : currentMonth;
  let bounds: ReturnType<typeof monthBounds>;
  try {
    bounds = monthBounds(month);
  } catch {
    bounds = monthBounds(currentMonth);
  }
  const challenges = await listAdminDailies(bounds.first, bounds.last);
  const byDate = new Map(challenges.map((challenge) => [challenge.dateKey, challenge]));
  const dates = enumerateUtcDates(bounds.first, bounds.last);
  const tomorrow = addUtcDays(new Date(), 1);
  const defaultEnd = addUtcDays(tomorrow, 29);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage">Daily administration</p>
            <h1 className="mt-2 font-serif text-4xl tracking-tight">Schedule challenges</h1>
          </div>
          <div className="flex gap-3 text-sm font-semibold">
            <Link href="/admin/frames" className="rounded-lg border border-border px-4 py-2">Frames</Link>
            <Link href="/leaderboards/guessr" className="rounded-lg border border-border px-4 py-2">Leaderboards</Link>
          </div>
        </header>

        <form action={generateDailies} className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            First UTC date
            <input className="admin-input" type="date" name="start" min={utcDateKey(tomorrow)} defaultValue={utcDateKey(tomorrow)} required />
          </label>
          <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Last UTC date
            <input className="admin-input" type="date" name="end" min={utcDateKey(tomorrow)} defaultValue={utcDateKey(defaultEnd)} required />
          </label>
          <SubmitButton pendingLabel="Generating…" className="self-end rounded-lg bg-sage px-5 py-3 font-semibold text-white disabled:cursor-wait disabled:opacity-60">Generate range</SubmitButton>
        </form>

        {params.notice ? (
          <p
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${params.notice.startsWith("Error:") ? "border-red-300 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200" : "border-sage/30 bg-sage/10"}`}
            role={params.notice.startsWith("Error:") ? "alert" : "status"}
          >
            {params.notice}
          </p>
        ) : null}

        <nav className="my-7 flex items-center justify-between">
          <Link href={`/admin/dailies?month=${shiftMonth(month, -1)}`} className="font-semibold">← Previous month</Link>
          <h2 className="font-serif text-2xl">{bounds.first.toLocaleDateString("en", { timeZone: "UTC", month: "long", year: "numeric" })}</h2>
          <Link href={`/admin/dailies?month=${shiftMonth(month, 1)}`} className="font-semibold">Next month →</Link>
        </nav>

        <div className="grid gap-5 xl:grid-cols-2">
          {dates.map((date) => {
            const dateKey = utcDateKey(date);
            const challenge = byDate.get(dateKey);
            if (!challenge) {
              return (
                <article key={dateKey} className="rounded-2xl border border-dashed border-border p-5 text-muted">
                  <p className="font-semibold text-foreground">{dateLabel(date)}</p>
                  <p className="mt-2 text-sm">No challenge scheduled.</p>
                </article>
              );
            }

            return (
              <article key={challenge.id} className="overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold">{dateLabel(challenge.dateUtc)}</p>
                    <p className="mt-1 text-xs text-muted">{challenge._count.attempts} attempt{challenge._count.attempts === 1 ? "" : "s"}</p>
                  </div>
                  <span className="rounded-full bg-sage/15 px-3 py-1 text-xs font-bold text-sage">{challenge.displayState}</span>
                </div>
                <div className="grid grid-cols-5 gap-px bg-border">
                  {challenge.rounds.map((round) => (
                    <div key={round.id} className="bg-surface">
                      {/* Runtime R2 host; admin-only answer-aware preview. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={round.imageUrl} alt={`Round ${round.roundNumber}`} width={round.frame.width} height={round.frame.height} className="aspect-video w-full object-cover" loading="lazy" />
                      <div className="p-2 text-[11px]">
                        <p className="font-bold">R{round.roundNumber} · S{round.frame.episode.season}E{round.frame.episode.episodeNumber}</p>
                        <p className="mt-1 truncate text-muted">{round.frame.difficulty}</p>
                        {challenge.editable ? (
                          <form action={replaceDailyRoundAction} className="mt-2">
                            <input type="hidden" name="challengeId" value={challenge.id} />
                            <input type="hidden" name="roundNumber" value={round.roundNumber} />
                            <input type="hidden" name="month" value={month} />
                            <SubmitButton pendingLabel="Replacing…" className="font-semibold text-sage disabled:cursor-wait disabled:opacity-60">Replace</SubmitButton>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 p-5">
                  {challenge.editable ? (
                    <>
                      <form action={regenerateDailyAction}>
                        <input type="hidden" name="challengeId" value={challenge.id} />
                        <input type="hidden" name="month" value={month} />
                        <SubmitButton pendingLabel="Regenerating…" className="rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:cursor-wait disabled:opacity-60">Regenerate</SubmitButton>
                      </form>
                      {challenge.status !== "APPROVED" ? (
                        <form action={approveDailyAction}>
                          <input type="hidden" name="challengeId" value={challenge.id} />
                          <input type="hidden" name="month" value={month} />
                          <SubmitButton pendingLabel="Approving…" className="rounded-lg bg-sage px-3 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">Approve</SubmitButton>
                        </form>
                      ) : null}
                    </>
                  ) : <p className="mr-auto text-sm text-muted">Composition is locked at 00:00 UTC.</p>}
                  {challenge.status !== "VOID" ? (
                    <form action={voidDailyAction} className="ml-auto flex flex-wrap items-center justify-end gap-2">
                      <input type="hidden" name="challengeId" value={challenge.id} />
                      <input type="hidden" name="month" value={month} />
                      <label className="flex items-center gap-2 text-xs text-muted">
                        <input type="checkbox" name="confirmVoid" value="yes" required />
                        Invalidate ranked results
                      </label>
                      <SubmitButton pendingLabel="Voiding…" className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-wait disabled:opacity-60 dark:text-red-300">VOID DAILY</SubmitButton>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
