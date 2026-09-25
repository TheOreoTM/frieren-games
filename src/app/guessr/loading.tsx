export default function GuessrLoading() {
  return (
    <main
      className="px-5 py-10 sm:px-8 sm:py-16"
      role="status"
      aria-label="Loading FrierenGuessr"
    >
      <div className="mx-auto w-full max-w-7xl animate-pulse">
        <div className="bg-border h-4 w-32" />

        <div className="mt-12 max-w-3xl">
          <div className="bg-border h-12 w-4/5 sm:h-16 sm:w-3/4" />
          <div className="mt-7 grid max-w-2xl gap-3">
            <div className="bg-border h-4 w-full" />
            <div className="bg-border h-4 w-11/12" />
            <div className="bg-border h-4 w-2/3" />
          </div>
        </div>

        <div className="border-border mt-12 grid border-y lg:grid-cols-2">
          {["unlimited", "daily"].map((mode, index) => (
            <section
              key={mode}
              className={`border-border py-8 ${
                index === 0
                  ? "lg:border-r lg:pr-12"
                  : "border-t lg:border-t-0 lg:pl-12"
              }`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="w-full max-w-md">
                  <div className="bg-border h-4 w-24" />
                  <div className="mt-4 grid gap-2.5">
                    <div className="bg-border h-3 w-full" />
                    <div className="bg-border h-3 w-4/5" />
                  </div>
                </div>
                <div className="bg-border h-3 w-5 shrink-0" />
              </div>
              <div className="bg-border mt-7 h-12 w-40" />
            </section>
          ))}
        </div>

        <div className="mt-5 grid max-w-2xl gap-2">
          <div className="bg-border h-3 w-full" />
          <div className="bg-border h-3 w-3/5" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </main>
  );
}
