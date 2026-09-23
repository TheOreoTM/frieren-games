import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((request) => {
  const user = request.auth?.user;
  const isOnboarding = request.nextUrl.pathname === "/onboarding";

  if (user && !user.onboardedAt && !isOnboarding) {
    return NextResponse.redirect(new URL("/onboarding", request.nextUrl));
  }

  if (user?.onboardedAt && isOnboarding) {
    return NextResponse.redirect(new URL("/guessr", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
