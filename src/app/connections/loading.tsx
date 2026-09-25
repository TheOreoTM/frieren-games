export default function ConnectionsLoading() {
  return (
    <main className="px-5 py-12 sm:px-8 sm:py-20" aria-hidden="true">
      <div className="mx-auto max-w-3xl animate-pulse text-center">
        <div className="bg-border mx-auto h-4 w-36 rounded" />
        <div className="bg-border mx-auto mt-5 h-12 w-full max-w-xl rounded" />
        <div className="mt-10 grid grid-cols-4 gap-2">
          {Array.from({ length: 16 }, (_, index) => (
            <div
              key={index}
              className="bg-border/60 min-h-20 rounded-md sm:min-h-24"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
