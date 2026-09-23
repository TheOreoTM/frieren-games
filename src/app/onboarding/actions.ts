"use server";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { onboardingSchema } from "@/features/profiles/domain/onboarding";
import { getDb } from "@/lib/db";

export type OnboardingActionState = {
  errors?: {
    username?: string[];
    displayName?: string[];
  };
  message?: string;
};

export async function completeOnboarding(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const session = await auth();
  if (!session?.user?.id) return { message: "Your session expired. Sign in again." };

  const parsed = onboardingSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await getDb().user.update({
      where: { id: session.user.id },
      data: {
        ...parsed.data,
        name: parsed.data.displayName,
        onboardedAt: new Date(),
      },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { errors: { username: ["That username is already taken."] } };
    }
    return { message: "Your profile could not be saved. Please try again." };
  }

  redirect("/guessr");
}
