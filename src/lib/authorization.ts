import "server-only";

import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

export async function requireAdmin(callbackUrl = "/admin/frames") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const user = await getDb().user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!user || user.role !== UserRole.ADMIN) notFound();
  return user;
}
