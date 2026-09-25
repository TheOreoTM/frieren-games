import Link from "next/link";

import { resolveSiteBrand } from "@/lib/site-brand";

export function SiteFooter() {
  const brand = resolveSiteBrand();

  return (
    <footer className="border-border bg-surface/60 mt-auto border-t px-5 py-7 sm:px-8">
      <div className="text-muted mx-auto flex max-w-7xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          {brand.name} is an unofficial fan project. Frieren and related
          properties belong to their respective rights holders.
        </p>
        <nav
          className="flex shrink-0 gap-5 font-medium"
          aria-label="Project information"
        >
          <Link href="/legal" className="hover:text-sage transition">
            Project notice
          </Link>
          <a
            href="https://github.com/TheOreoTM/frieren-games/issues"
            target="_blank"
            rel="noreferrer"
            className="hover:text-sage transition"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
