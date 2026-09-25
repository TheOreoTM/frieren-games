export default function DailyLoading() {
  return (
    <main
      className="px-5 py-10 sm:px-8 sm:py-16"
      role="status"
      aria-label="Loading Daily challenge"
    >
      <section className="mx-auto w-full max-w-4xl animate-pulse">
        <div className="bg-border h-4 w-28" />

        <div className="bg-border mt-12 h-12 w-full max-w-lg sm:h-14" />
        <div className="mt-6 grid max-w-xl gap-3">
          <div className="bg-border h-4 w-full" />
          <div className="bg-border h-4 w-4/5" />
        </div>

        <div className="border-border mt-9 grid max-w-xl grid-cols-2 border-y">
          <div className="border-border border-r py-4 pr-5">
            <div className="bg-border h-3 w-24" />
            <div className="bg-border mt-2 h-6 w-10" />
          </div>
          <div className="py-4 pl-5">
            <div className="bg-border h-3 w-20" />
            <div className="bg-border mt-2 h-5 w-24" />
          </div>
        </div>

        <div className="bg-border mt-8 h-14 w-48" />
        <div className="bg-border mt-7 h-4 w-32" />
      </section>
      <span className="sr-only">Loading Daily challenge…</span>
    </main>
  );
}
