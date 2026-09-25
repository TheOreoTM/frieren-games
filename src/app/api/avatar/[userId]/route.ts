import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";

const allowedAvatarHosts = new Set([
  "cdn.discordapp.com",
  "media.discordapp.net",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;
  if (!/^[a-z0-9]{20,32}$/.test(userId))
    return new NextResponse(null, { status: 404 });

  const user = await getDb().user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  if (!user?.image) return new NextResponse(null, { status: 404 });

  const upstreamUrl = new URL(user.image);
  if (
    upstreamUrl.protocol !== "https:" ||
    !allowedAvatarHosts.has(upstreamUrl.hostname)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      redirect: "error",
      next: { revalidate: 86_400 },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
  const contentType = upstream.headers.get("content-type");
  if (!upstream.ok || !contentType?.startsWith("image/")) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control":
        "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
