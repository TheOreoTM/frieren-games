export default function GuessrLeaderboardLoading() {
  return (
    <main
      className="min-h-screen px-5 py-10 sm:px-8"
      role="status"
      aria-label="Loading Daily leaderboard"
    >
      <section className="mx-auto max-w-4xl animate-pulse">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-lg">
            <div className="bg-border h-3 w-32" />
            <div className="bg-border mt-3 h-11 w-64 sm:h-12" />
            <div className="bg-border mt-3 h-4 w-full" />
          </div>
          <div className="bg-border h-4 w-44" />
        </div>

        <div className="border-border mt-7 flex items-center justify-between border-y py-3">
          <div className="bg-border h-4 w-28" />
          <div className="bg-border h-4 w-24" />
        </div>

        <div className="border-border mt-8 overflow-hidden rounded-2xl border">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="border-border grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b px-4 py-4 last:border-0 sm:px-6"
            >
              <div className="bg-border h-5 w-8" />
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-border size-9 shrink-0 rounded-full" />
                <div className="grid w-full max-w-44 gap-2">
                  <div className="bg-border h-4 w-4/5" />
                  <div className="bg-border h-3 w-3/5" />
                </div>
              </div>
              <div className="bg-border h-5 w-16" />
            </div>
          ))}
        </div>
      </section>
      <span className="sr-only">Loading leaderboard…</span>
    </main>
  );
}
