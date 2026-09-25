import type { Metadata } from "next";
import Link from "next/link";

import { SubmitButton } from "@/components/ui/submit-button";
import { resolveSiteBrand } from "@/lib/site-brand";

import { startUnlimitedGame } from "./actions";

export const metadata: Metadata = {
  title: "FrierenGuessr",
  description: "Identify a Frieren episode from a single still frame.",
};

export default function GuessrLandingPage() {
  const brand = resolveSiteBrand();

  return (
    <main className="px-5 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-7xl">
        <section>
          <Link
            href="/"
            className="text-muted hover:text-sage text-sm font-medium transition"
          >
            ← {brand.name}
          </Link>
          <h1 className="mt-12 max-w-3xl text-5xl leading-[1] font-semibold tracking-[-0.05em] sm:text-7xl">
            Name the episode.
          </h1>
          <p className="text-muted mt-6 max-w-2xl text-lg leading-8">
            You get five frames from Frieren: Beyond Journey&apos;s End. Pick a
            season and episode for each one. Exact answers earn 5,000 points;
            nearby episodes still earn credit.
          </p>
        </section>

        <div className="border-border mt-12 grid border-y lg:grid-cols-2">
          <section className="border-border py-8 lg:border-r lg:pr-12">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold">Unlimited</p>
                <p className="text-muted mt-2 max-w-md text-sm leading-6">
                  A fresh set of frames every time. Play anonymously and as
                  often as you like.
                </p>
              </div>
              <span className="text-muted font-mono text-sm">01</span>
            </div>
            <form action={startUnlimitedGame}>
              <SubmitButton
                pendingLabel="Preparing game…"
                className="bg-foreground text-background mt-7 px-6 py-3.5 font-semibold transition hover:opacity-80 disabled:cursor-wait disabled:opacity-60"
              >
                Start a game
              </SubmitButton>
            </form>
          </section>

          <section className="border-border border-t py-8 lg:border-t-0 lg:pl-12">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold">Daily</p>
                <p className="text-muted mt-2 max-w-md text-sm leading-6">
                  The same five frames for everyone. Your first attempt each day
                  counts toward the leaderboard.
                </p>
              </div>
              <span className="text-muted font-mono text-sm">02</span>
            </div>
            <Link
              href="/guessr/daily"
              className="border-foreground/40 hover:border-foreground mt-7 inline-flex border px-6 py-3.5 font-semibold transition"
            >
              Play today&apos;s Daily
            </Link>
          </section>
        </div>

        <p className="text-muted mt-5 max-w-2xl text-xs leading-5">
          Scores are based on distance in the full episode order, including the
          transition between seasons. Frame difficulty does not affect scoring.
        </p>
      </div>
    </main>
  );
}
