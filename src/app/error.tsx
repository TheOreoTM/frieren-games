"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center px-5 py-12">
      <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-border bg-surface p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">The path faded</p>
        <h1 className="mt-3 font-serif text-4xl">Something went wrong</h1>
        <p className="mt-4 leading-7 text-muted">
          This may be a temporary connection problem. Your saved Daily progress remains on the server.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-xl bg-sage px-5 py-3 font-semibold text-white">
            Try again
          </button>
          <Link href="/guessr" className="rounded-xl border border-border px-5 py-3 font-semibold">
            Return to Guessr
          </Link>
        </div>
        {error.digest ? <p className="mt-5 font-mono text-xs text-muted">Reference: {error.digest}</p> : null}
      </section>
    </main>
  );
}
