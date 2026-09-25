import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { utcDateKey } from "@/features/guessr/domain/utc-date";
import { getPublicProfile } from "@/features/profiles/server/public-profile";

export const metadata: Metadata = { title: "Player Profile" };

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-border bg-background/60 rounded-xl border p-4">
      <p className="text-muted text-xs font-semibold tracking-[0.14em] uppercase">
        {label}
      </p>
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
        <section className="border-border bg-surface overflow-hidden rounded-[2rem] border shadow-[0_30px_100px_-55px_var(--shadow)]">
          <div className="relative p-7 sm:p-10">
            <div className="magic-glow opacity-40" aria-hidden="true" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
              {profile.avatarUrl ? (
                // Same-origin proxy keeps provider identifiers out of public markup.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="border-background bg-border size-24 rounded-full border-4 object-cover"
                />
              ) : (
                <div className="border-background bg-sage/20 text-sage flex size-24 items-center justify-center rounded-full border-4 font-serif text-4xl">
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sage text-xs font-semibold tracking-[0.22em] uppercase">
                  Traveler profile
                </p>
                <h1 className="mt-2 truncate font-serif text-4xl tracking-tight sm:text-5xl">
                  {profile.displayName}
                </h1>
                <p className="text-muted mt-1">@{profile.username}</p>
              </div>
              <div className="border-gold/35 bg-gold/10 rounded-2xl border px-6 py-4 text-center">
                <p className="text-muted text-xs font-semibold tracking-[0.16em] uppercase">
                  Level
                </p>
                <p className="text-gold font-serif text-5xl">
                  {profile.level.level}
                </p>
              </div>
            </div>
            <div className="relative mt-7">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">
                  {profile.totalXp.toLocaleString()} XP
                </span>
                <span className="text-muted">
                  Next level at {profile.level.nextLevelXp.toLocaleString()} XP
                </span>
              </div>
              <div
                className="bg-border mt-2 h-2 overflow-hidden rounded-full"
                role="progressbar"
                aria-label={`Level ${profile.level.level} progress`}
                aria-valuemin={profile.level.levelStartXp}
                aria-valuemax={profile.level.nextLevelXp}
                aria-valuenow={profile.totalXp}
              >
                <div
                  className="bg-sage h-full rounded-full"
                  style={{ width: `${levelPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Games played" value={profile.stats.gamesPlayed} />
          <StatCard label="Exact guesses" value={profile.stats.exactGuesses} />
          <StatCard
            label="Average distance"
            value={profile.stats.averageDistance.toFixed(1)}
          />
          <StatCard
            label="Best Daily"
            value={profile.stats.bestDailyScore.toLocaleString()}
          />
          <StatCard
            label="Daily streak"
            value={profile.stats.currentDailyStreak}
          />
          <StatCard
            label="Ranked Dailies"
            value={profile.stats.dailyGamesPlayed}
          />
          <StatCard
            label="Unlimited games"
            value={profile.stats.unlimitedGamesPlayed}
          />
          <StatCard label="Total guesses" value={profile.stats.guesses} />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <section className="border-border bg-surface rounded-2xl border p-6">
            <h2 className="font-serif text-2xl">Recent Dailies</h2>
            <div className="mt-4 grid gap-2">
              {profile.recentDailies.map((attempt) => (
                <Link
                  key={utcDateKey(attempt.challenge.dateUtc)}
                  href={`/leaderboards/guessr?date=${utcDateKey(attempt.challenge.dateUtc)}`}
                  className="border-border bg-background/60 hover:border-sage flex items-center justify-between rounded-xl border px-4 py-3 transition"
                >
                  <span className="font-medium">
                    {utcDateKey(attempt.challenge.dateUtc)}
                  </span>
                  <span className="font-mono font-semibold">
                    {attempt.totalScore.toLocaleString()}
                  </span>
                </Link>
              ))}
              {profile.recentDailies.length === 0 ? (
                <p className="text-muted py-6 text-sm">
                  No ranked Daily results yet.
                </p>
              ) : null}
            </div>
          </section>

          <section className="border-border bg-surface rounded-2xl border p-6">
            <h2 className="font-serif text-2xl">Achievements</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {profile.achievements.map((achievement) => (
                <article
                  key={achievement.id}
                  className="border-gold/30 bg-gold/10 rounded-xl border p-4"
                >
                  <p className="font-semibold">{achievement.name}</p>
                  <p className="text-muted mt-1 text-sm leading-6">
                    {achievement.description}
                  </p>
                  <p className="text-gold mt-3 text-xs font-bold tracking-wide uppercase">
                    +{achievement.xp} XP
                  </p>
                </article>
              ))}
              {profile.achievements.length === 0 ? (
                <p className="text-muted py-6 text-sm">
                  No achievements unlocked yet.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
