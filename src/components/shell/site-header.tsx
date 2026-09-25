import Link from "next/link";

import { auth, signIn, signOut } from "@/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { UserRole } from "@/generated/prisma/client";
import { resolveSiteBrand } from "@/lib/site-brand";

import { SiteMark } from "./site-mark";

export async function SiteHeader() {
  const session = await auth();
  const brand = resolveSiteBrand();

  return (
    <header className="border-border bg-background/90 sticky top-0 z-50 border-b px-4 backdrop-blur-md sm:px-8">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 py-2 sm:gap-4">
        <Link
          href="/"
          aria-label={`${brand.name} home`}
          className="flex shrink-0 items-center gap-2 font-serif text-lg font-semibold tracking-tight"
        >
          <SiteMark brand={brand} />
          <span className="hidden sm:inline">{brand.name}</span>
          <span className="sm:hidden">{brand.shortName}</span>
        </Link>

        <nav
          className="flex min-w-0 items-center gap-0 text-sm sm:gap-2"
          aria-label="Account navigation"
        >
          <Link
            href="/guessr"
            className="text-muted hover:text-foreground hidden rounded-lg px-3 py-2 font-medium transition sm:block"
          >
            Guessr
          </Link>
          <Link
            href="/guessr/daily"
            className="text-muted hover:text-foreground hidden rounded-lg px-3 py-2 font-medium transition md:block"
          >
            Daily
          </Link>
          {session?.user ? (
            <>
              {session.user.role === UserRole.ADMIN ? (
                <Link
                  href="/admin/frames"
                  className="text-muted hover:text-foreground rounded-lg px-2 py-2 font-medium transition sm:px-3"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href={
                  session.user.username
                    ? `/user/${session.user.username}`
                    : "/onboarding"
                }
                aria-label="View your profile"
                className="hover:bg-sage/10 flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 transition"
              >
                {session.user.image ? (
                  // The same-origin endpoint prevents the Discord account ID in the CDN URL from reaching the browser.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    width={28}
                    height={28}
                    className="bg-border size-7 rounded-full object-cover"
                  />
                ) : null}
                <span className="hidden font-medium min-[390px]:inline sm:hidden">
                  Profile
                </span>
                <span className="hidden max-w-40 truncate font-medium sm:block">
                  {session.user.displayName ??
                    session.user.name ??
                    session.user.username}
                </span>
              </Link>
              {!session.user.onboardedAt ? (
                <Link
                  href="/onboarding"
                  className="bg-gold/20 text-foreground rounded-lg px-3 py-2 font-semibold"
                >
                  Finish setup
                </Link>
              ) : null}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <SubmitButton
                  pendingLabel="Signing out…"
                  className="border-border hover:border-sage rounded-lg border px-2 py-2 font-semibold transition sm:px-3"
                >
                  Sign out
                </SubmitButton>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("discord", { redirectTo: "/guessr" });
              }}
            >
              <SubmitButton
                pendingLabel="Signing in…"
                className="rounded-lg bg-[#5865f2] px-3 py-2 font-semibold text-white transition hover:brightness-110 sm:px-3.5"
              >
                Sign in with Discord
              </SubmitButton>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
