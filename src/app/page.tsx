import Link from "next/link";

import { SiteMark } from "@/components/shell/site-mark";
import { resolveSiteBrand } from "@/lib/site-brand";

export default function Home() {
  const brand = resolveSiteBrand();

  return (
    <main className="px-5 py-12 sm:px-8 sm:py-20">
      <section className="mx-auto w-full max-w-7xl">
        <p className="text-muted border-border border-b pb-3 text-sm">
          An <span className="font-bold">unofficial</span> Frieren fan project{" "}
          <span className="text-[8px]">Please no copyright strike</span>
        </p>

        <div className="grid gap-14 py-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:gap-20 lg:py-20">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <SiteMark brand={brand} className="size-11" />
              <p className="font-serif text-lg font-semibold">{brand.name}</p>
            </div>
            <h1 className="max-w-4xl text-5xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">
              How well do you remember the journey?
            </h1>
            <p className="text-muted mt-7 max-w-2xl text-lg leading-8">
              FrierenGuessr gives you five stills from the anime. Name the
              episode, see how close you were, and come back for the same Daily
              as everyone else.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Link
                href="/guessr"
                className="bg-foreground text-background inline-flex px-6 py-3.5 font-semibold transition hover:opacity-80"
              >
                Play FrierenGuessr
              </Link>
              <Link
                href="/guessr/daily"
                className="border-foreground/40 hover:border-foreground border-b py-1 text-sm font-semibold transition"
              >
                Today&apos;s Daily →
              </Link>
            </div>
          </div>

          <aside className="border-border self-end pt-5">
            <p className="text-muted text-sm">How it works</p>
            <dl className="divide-border mt-3 divide-y">
              <div className="flex items-baseline justify-between py-4">
                <dt>Frames</dt>
                <dd className="font-mono text-2xl">5</dd>
              </div>
              <div className="flex items-baseline justify-between py-4">
                <dt>Points per frame</dt>
                <dd className="font-mono text-2xl">5,000</dd>
              </div>
              <div className="flex items-baseline justify-between py-4">
                <dt>Daily reset</dt>
                <dd className="font-mono text-base">00:00 UTC</dd>
              </div>
            </dl>
            <p className="text-muted border-border border-t pt-5 text-sm leading-6">
              No account needed for Unlimited. Sign in only if you want a ranked
              Daily, stats, and XP.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
