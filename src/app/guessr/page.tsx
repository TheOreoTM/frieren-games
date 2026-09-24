import type { Metadata } from "next";
import Link from "next/link";

import { startUnlimitedGame } from "./actions";

export const metadata: Metadata = {
  title: "FrierenGuessr | Frieren Games",
  description: "Identify a Frieren episode from a single still frame.",
};

export default function GuessrLandingPage() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden px-5 py-12 sm:px-8">
      <div className="magic-glow" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-border bg-surface/95 p-7 shadow-[0_30px_100px_-55px_var(--shadow)] sm:p-12">
          <Link href="/" className="text-sm font-medium text-muted transition hover:text-sage">← Frieren Games</Link>
          <p className="mt-12 text-xs font-semibold uppercase tracking-[0.24em] text-sage">Five frames · Twenty-five thousand points</p>
          <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-[1.02] tracking-[-0.04em] sm:text-7xl">
            How far does your memory reach?
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            Study a still from the anime, choose its season and episode, then trace how close your guess landed in the journey.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <form action={startUnlimitedGame}>
              <button type="submit" className="rounded-xl bg-sage px-7 py-4 text-base font-semibold text-white shadow-lg shadow-sage/15 transition hover:-translate-y-0.5 hover:brightness-105">
                Start Unlimited
              </button>
            </form>
            <Link href="/guessr/daily" className="rounded-xl border border-border bg-background px-7 py-4 text-base font-semibold transition hover:border-gold">
              Play Daily
            </Link>
          </div>
        </section>

        <aside className="grid content-between rounded-[2rem] border border-border bg-foreground p-7 text-background sm:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-magic">How it works</p>
            <ol className="mt-7 grid gap-6">
              {[
                ["01", "Observe", "Look closely at one approved frame."],
                ["02", "Remember", "Choose a season, then tap an episode."],
                ["03", "Reveal", "See the answer, distance, and score."],
              ].map(([number, title, copy]) => (
                <li key={number} className="grid grid-cols-[2.5rem_1fr] gap-3">
                  <span className="font-mono text-sm text-gold">{number}</span>
                  <div><strong>{title}</strong><p className="mt-1 text-sm leading-6 opacity-65">{copy}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <p className="mt-12 border-t border-background/15 pt-6 text-sm leading-6 opacity-65">
            Unlimited is anonymous and replayable. Difficulty never changes your score—the episode distance does.
          </p>
        </aside>
      </div>
    </main>
  );
}
