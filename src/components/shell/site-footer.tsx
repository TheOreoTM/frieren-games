import Link from "next/link";

import { resolveSiteBrand } from "@/lib/site-brand";

export function SiteFooter() {
  const brand = resolveSiteBrand();

  return (
    <footer className="mt-auto border-t border-border bg-surface/60 px-5 py-7 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {brand.name} is an unofficial fan project. Frieren and related properties belong to
          their respective rights holders.
        </p>
        <nav className="flex shrink-0 gap-5 font-medium" aria-label="Project information">
          <Link href="/legal" className="transition hover:text-sage">
            Project notice
          </Link>
          <a
            href="https://github.com/TheOreoTM/frieren-games/issues"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-sage"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
