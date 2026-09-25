import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center px-5 py-12">
      <section className="mx-auto max-w-xl text-center">
        <p className="text-gold font-mono text-sm font-semibold">404</p>
        <h1 className="mt-3 font-serif text-5xl">
          This path has passed into myth
        </h1>
        <p className="text-muted mt-5 leading-7">
          The page may have moved, or it may never have existed.
        </p>
        <Link
          href="/"
          className="bg-sage mt-7 inline-flex rounded-xl px-5 py-3 font-semibold text-white"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
