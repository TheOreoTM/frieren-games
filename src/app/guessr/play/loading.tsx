export default function GuessrPlayLoading() {
  return (
    <main
      className="min-h-screen px-4 py-6 sm:px-8 sm:py-10"
      role="status"
      aria-label="Loading game round"
    >
      <div className="mx-auto w-full max-w-6xl animate-pulse">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="bg-border h-4 w-20" />
            <div className="bg-border mt-2 h-9 w-40 sm:h-10" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="bg-border h-3 w-20" />
            <div className="bg-border h-6 w-16" />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.8fr)]">
          <div className="border-border bg-surface aspect-video border" />

          <aside className="border-border border p-5 lg:self-start">
            <div className="bg-border h-4 w-40" />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-border h-10" />
              <div className="bg-border h-10" />
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {Array.from({ length: 20 }, (_, index) => (
                <div
                  key={index}
                  className="border-border bg-surface aspect-square min-h-11 rounded-sm border"
                />
              ))}
            </div>
            <div className="bg-border mx-auto mt-4 h-3 w-4/5" />
            <div className="bg-border mt-9 h-12 w-full" />
            <div className="mx-auto mt-4 grid w-11/12 gap-2">
              <div className="bg-border h-3 w-full" />
              <div className="bg-border mx-auto h-3 w-2/3" />
            </div>
          </aside>
        </div>
      </div>
      <span className="sr-only">Loading game round…</span>
    </main>
  );
}
