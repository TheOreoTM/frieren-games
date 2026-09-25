import Link from "next/link";

import { SiteMark } from "@/components/shell/site-mark";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden px-6 py-16 sm:px-10">
      <div className="magic-glow" aria-hidden="true" />
      <section className="relative mx-auto w-full max-w-5xl rounded-[2rem] border border-border bg-surface/90 p-8 shadow-[0_30px_100px_-48px_var(--shadow)] backdrop-blur-sm sm:p-14">
        <div className="mb-7 flex items-center gap-3 text-sage">
          <SiteMark className="size-12" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em]">
            An unofficial Frieren fan-game collection
          </p>
        </div>
        <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] tracking-[-0.035em] text-foreground sm:text-7xl">
          Magic in Passing
          <span className="mt-2 block text-sage">Small games from a long journey.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
          Revisit the moments that stayed with you. Identify carefully curated frames,
          challenge the shared Daily, and build a quiet record of how far your memory carries.
        </p>
        <div className="mt-12 flex items-center gap-3 text-sm text-muted">
          <span className="h-px w-10 bg-gold" aria-hidden="true" />
          Unlimited, Daily competition, profiles, and progression are ready.
        </div>
        <Link
          href="/guessr"
          className="mt-8 inline-flex rounded-xl bg-sage px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
        >
          Play FrierenGuessr
        </Link>
      </section>
    </main>
  );
}
