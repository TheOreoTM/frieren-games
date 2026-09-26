import type { Metadata } from "next";

import { resolveSiteBrand } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Project Notice",
  description:
    "Unofficial fan-project, copyright, privacy, and contact information.",
};

export default function LegalPage() {
  const brand = resolveSiteBrand();

  return (
    <main className="min-h-screen px-5 py-10 sm:px-8">
      <article className="border-border bg-surface mx-auto max-w-3xl rounded-[2rem] border p-7 sm:p-10">
        <p className="text-sage text-xs font-semibold tracking-[0.22em] uppercase">
          Project information
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
          Unofficial fan-project notice
        </h1>
        <div className="text-muted mt-7 grid gap-7 leading-7">
          <section>
            <h2 className="text-foreground font-serif text-2xl">
              Rights and attribution
            </h2>
            <p className="mt-2">
              {brand.name} is a non-commercial, unofficial fan project. Frieren:
              Beyond Journey&apos;s End, its characters, animation, and related
              properties belong to their respective authors, publishers,
              studios, and license holders. This site is not endorsed by or
              affiliated with them.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-serif text-2xl">
              Game imagery
            </h2>
            <p className="mt-2">
              Still frames are used only as necessary game prompts. Original
              episode video files are never served/distributed by this website.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-serif text-2xl">Privacy</h2>
            <p className="mt-2">
              Discord sign-in supplies account identity and avatar information.
              The site does not request or store your Discord email address.
              Public profiles show only the chosen username, display name,
              avatar, and game activity. Discord IDs, OAuth tokens, and session
              data are not public.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-serif text-2xl">
              Takedown or contact
            </h2>
            <p className="mt-2">
              For copyright, takedown, privacy, or technical requests, use the
              project&apos;s{" "}
              <a
                className="text-sage font-semibold underline underline-offset-4"
                href="https://github.com/TheOreoTM/frieren-games/issues"
                target="_blank"
                rel="noreferrer"
              >
                GitHub contact page
              </a>{" "}
              to request a suitable contact channel. Do not post private
              personal information in a public issue.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
