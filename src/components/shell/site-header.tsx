import Link from "next/link";

import { auth, signIn, signOut } from "@/auth";
import { UserRole } from "@/generated/prisma/client";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-8">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="font-serif text-lg font-semibold tracking-tight">
          Frieren Games
        </Link>

        <nav className="flex items-center gap-2 text-sm" aria-label="Account navigation">
          <Link href="/guessr" className="rounded-lg px-3 py-2 font-medium text-muted transition hover:text-foreground">
            Guessr
          </Link>
          <Link href="/guessr/daily" className="hidden rounded-lg px-3 py-2 font-medium text-muted transition hover:text-foreground md:block">
            Daily
          </Link>
          {session?.user ? (
            <>
              {session.user.role === UserRole.ADMIN ? (
                <Link href="/admin/frames" className="rounded-lg px-3 py-2 font-medium text-muted transition hover:text-foreground">
                  Admin
                </Link>
              ) : null}
              <Link
                href={session.user.username ? `/user/${session.user.username}` : "/onboarding"}
                aria-label="View your profile"
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-sage/10"
              >
                {session.user.image ? (
                  // The same-origin endpoint prevents the Discord account ID in the CDN URL from reaching the browser.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 rounded-full bg-border object-cover"
                  />
                ) : null}
                <span className="font-medium sm:hidden">Profile</span>
                <span className="hidden max-w-40 truncate font-medium sm:block">
                  {session.user.displayName ?? session.user.name ?? session.user.username}
                </span>
              </Link>
              {!session.user.onboardedAt ? (
                <Link href="/onboarding" className="rounded-lg bg-gold/20 px-3 py-2 font-semibold text-foreground">
                  Finish setup
                </Link>
              ) : null}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="rounded-lg border border-border px-3 py-2 font-semibold transition hover:border-sage">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("discord", { redirectTo: "/guessr" });
              }}
            >
              <button type="submit" className="rounded-lg bg-[#5865f2] px-3.5 py-2 font-semibold text-white transition hover:brightness-110">
                Sign in with Discord
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
