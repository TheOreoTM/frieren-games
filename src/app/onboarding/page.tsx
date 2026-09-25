import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
  title: "Choose your name | Magic in Passing",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/onboarding");
  if (session.user.onboardedAt) redirect("/guessr");

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden px-5 py-12">
      <div className="magic-glow" aria-hidden="true" />
      <section className="relative mx-auto w-full max-w-xl rounded-[2rem] border border-border bg-surface/95 p-7 shadow-[0_30px_100px_-55px_var(--shadow)] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage">First login</p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">What should we call you?</h1>
        <p className="mt-4 leading-7 text-muted">
          Discord gave us a starting point. Review both names before continuing—you can make them feel like yours.
        </p>
        <OnboardingForm
          defaultUsername={session.user.username ?? ""}
          defaultDisplayName={session.user.displayName ?? session.user.name ?? ""}
        />
      </section>
    </main>
  );
}
