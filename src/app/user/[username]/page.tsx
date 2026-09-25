import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { utcDateKey } from "@/features/guessr/domain/utc-date";
import { getPublicProfile } from "@/features/profiles/server/public-profile";

export const metadata: Metadata = { title: "Player Profile" };

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfile(username);
  if (!profile) notFound();
  const levelPercent = Math.min(
    100,
    (profile.level.earnedThisLevel / profile.level.neededThisLevel) * 100,
  );

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-[0_30px_100px_-55px_var(--shadow)]">
          <div className="relative p-7 sm:p-10">
            <div className="magic-glow opacity-40" aria-hidden="true" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              {profile.avatarUrl ? (
                // Same-origin proxy keeps provider identifiers out of public markup.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" width={96} height={96} className="size-24 rounded-full border-4 border-background bg-border object-cover" />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-full border-4 border-background bg-sage/20 font-serif text-4xl text-sage">
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">Traveler profile</p>
                <h1 className="mt-2 truncate font-serif text-4xl tracking-tight sm:text-5xl">{profile.displayName}</h1>
                <p className="mt-1 text-muted">@{profile.username}</p>
              </div>
              <div className="rounded-2xl border border-gold/35 bg-gold/10 px-6 py-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Level</p>
                <p className="font-serif text-5xl text-gold">{profile.level.level}</p>
              </div>
            </div>
            <div className="relative mt-7">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{profile.totalXp.toLocaleString()} XP</span>
                <span className="text-muted">Next level at {profile.level.nextLevelXp.toLocaleString()} XP</span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-border"
                role="progressbar"
                aria-label={`Level ${profile.level.level} progress`}
                aria-valuemin={profile.level.levelStartXp}
                aria-valuemax={profile.level.nextLevelXp}
                aria-valuenow={profile.totalXp}
              >
                <div className="h-full rounded-full bg-sage" style={{ width: `${levelPercent}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Games played" value={profile.stats.gamesPlayed} />
          <StatCard label="Exact guesses" value={profile.stats.exactGuesses} />
          <StatCard label="Average distance" value={profile.stats.averageDistance.toFixed(1)} />
          <StatCard label="Best Daily" value={profile.stats.bestDailyScore.toLocaleString()} />
          <StatCard label="Daily streak" value={profile.stats.currentDailyStreak} />
          <StatCard label="Ranked Dailies" value={profile.stats.dailyGamesPlayed} />
          <StatCard label="Unlimited games" value={profile.stats.unlimitedGamesPlayed} />
          <StatCard label="Total guesses" value={profile.stats.guesses} />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-serif text-2xl">Recent Dailies</h2>
            <div className="mt-4 grid gap-2">
              {profile.recentDailies.map((attempt) => (
                <Link
                  key={utcDateKey(attempt.challenge.dateUtc)}
                  href={`/leaderboards/guessr?date=${utcDateKey(attempt.challenge.dateUtc)}`}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-4 py-3 transition hover:border-sage"
                >
                  <span className="font-medium">{utcDateKey(attempt.challenge.dateUtc)}</span>
                  <span className="font-mono font-semibold">{attempt.totalScore.toLocaleString()}</span>
                </Link>
              ))}
              {profile.recentDailies.length === 0 ? <p className="py-6 text-sm text-muted">No ranked Daily results yet.</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-serif text-2xl">Achievements</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {profile.achievements.map((achievement) => (
                <article key={achievement.id} className="rounded-xl border border-gold/30 bg-gold/10 p-4">
                  <p className="font-semibold">{achievement.name}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{achievement.description}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-gold">+{achievement.xp} XP</p>
                </article>
              ))}
              {profile.achievements.length === 0 ? <p className="py-6 text-sm text-muted">No achievements unlocked yet.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
