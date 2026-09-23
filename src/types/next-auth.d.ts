import type { DefaultSession } from "next-auth";

import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      username: string | null;
      displayName: string | null;
      onboardedAt: Date | null;
      role: UserRole;
    };
  }

  interface User {
    username: string | null;
    displayName: string | null;
    onboardedAt: Date | null;
    role: UserRole;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    username: string | null;
    displayName: string | null;
    onboardedAt: Date | null;
    role: UserRole;
  }
}
