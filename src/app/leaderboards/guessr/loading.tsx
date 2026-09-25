export default function GuessrLeaderboardLoading() {
  return (
    <main
      className="min-h-screen px-5 py-10 sm:px-8 sm:py-16"
      role="status"
      aria-label="Loading Daily leaderboard"
    >
      <section className="mx-auto max-w-5xl animate-pulse">
        <div className="bg-border h-4 w-28" />

        <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-lg">
            <div className="bg-border h-4 w-32" />
            <div className="bg-border mt-3 h-12 w-4/5 sm:h-14" />
            <div className="bg-border mt-4 h-4 w-full" />
          </div>
          <div className="bg-border h-4 w-44" />
        </div>

        <div className="border-border mt-10 flex items-center justify-between border-y py-4">
          <div className="bg-border h-4 w-28" />
          <div className="bg-border h-4 w-24" />
        </div>

        <div className="border-border mt-8 border-y">
          <div className="grid grid-cols-[2.5rem_1fr_auto] gap-3 py-3 sm:grid-cols-[4rem_1fr_auto]">
            <div className="bg-border h-3 w-7" />
            <div className="bg-border h-3 w-12" />
            <div className="bg-border h-3 w-10" />
          </div>
          <div className="border-border border-t">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="border-border grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b py-4 last:border-0 sm:grid-cols-[4rem_1fr_auto] sm:py-5"
              >
                <div className="bg-border h-5 w-6" />
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-border size-10 shrink-0 rounded-full" />
                  <div className="grid w-full max-w-44 gap-2">
                    <div className="bg-border h-4 w-4/5" />
                    <div className="bg-border h-3 w-3/5" />
                  </div>
                </div>
                <div className="bg-border h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <span className="sr-only">Loading leaderboard…</span>
    </main>
  );
}
