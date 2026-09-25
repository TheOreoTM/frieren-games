import Link from "next/link";

import { SiteMark } from "@/components/shell/site-mark";
import { resolveSiteBrand } from "@/lib/site-brand";

export default function Home() {
  const brand = resolveSiteBrand();

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden px-6 py-16 sm:px-10">
      <div className="magic-glow" aria-hidden="true" />
      <section className="border-border bg-surface/90 relative mx-auto w-full max-w-5xl rounded-[2rem] border p-8 shadow-[0_30px_100px_-48px_var(--shadow)] backdrop-blur-sm sm:p-14">
        <div className="text-sage mb-7 flex items-center gap-3">
          <SiteMark brand={brand} className="size-12" />
          <p className="text-xs font-semibold tracking-[0.28em] uppercase">
            An unofficial Frieren fan-game collection
          </p>
        </div>
        <h1 className="text-foreground max-w-3xl font-serif text-5xl leading-[1.05] tracking-[-0.035em] sm:text-7xl">
          {brand.name}
          <span className="text-sage mt-2 block">{brand.tagline}</span>
        </h1>
        <p className="text-muted mt-7 max-w-2xl text-lg leading-8">
          Revisit the moments that stayed with you. Identify carefully curated
          frames, challenge the shared Daily, and build a quiet record of how
          far your memory carries.
        </p>
        <div className="text-muted mt-12 flex items-center gap-3 text-sm">
          <span className="bg-gold h-px w-10" aria-hidden="true" />
          Unlimited, Daily competition, profiles, and progression are ready.
        </div>
        <Link
          href="/guessr"
          className="bg-sage mt-8 inline-flex rounded-xl px-6 py-3.5 font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-105"
        >
          Play FrierenGuessr
        </Link>
      </section>
    </main>
  );
}
