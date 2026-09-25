export default function Loading() {
  return (
    <main
      className="min-h-[calc(100vh-4rem)] px-5 py-10 sm:px-8"
      role="status"
      aria-label="Loading page"
    >
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="bg-border h-5 w-32 rounded-full" />
        <div className="bg-border mt-5 h-12 max-w-xl rounded-xl" />
        <div className="bg-border mt-4 h-5 max-w-2xl rounded-full" />
        <div className="border-border bg-surface mt-10 aspect-video max-w-4xl rounded-[2rem] border" />
      </div>
      <span className="sr-only">Loading…</span>
    </main>
  );
}
