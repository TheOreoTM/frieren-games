import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Discord, { type DiscordProfile } from "next-auth/providers/discord";

import { UserRole } from "@/generated/prisma/client";
import { isBootstrapAdmin } from "@/features/auth/domain/admin-bootstrap";
import { findAvailableUsername } from "@/features/profiles/server/usernames";
import { getDb } from "@/lib/db";

function discordAvatarUrl(profile: DiscordProfile): string {
  if (profile.avatar) {
    const extension = profile.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${extension}`;
  }

  const avatarNumber =
    profile.discriminator === "0"
      ? Number(BigInt(profile.id) >> BigInt(22)) % 6
      : Number.parseInt(profile.discriminator, 10) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${avatarNumber}.png`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(getDb()),
  providers: [
    Discord({
      async profile(profile) {
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image: discordAvatarUrl(profile),
          username: await findAvailableUsername(profile.username, profile.id),
          displayName: profile.global_name ?? profile.username,
          onboardedAt: null,
          role: isBootstrapAdmin(profile.id, process.env.ADMIN_DISCORD_ID)
            ? UserRole.ADMIN
            : UserRole.USER,
        };
      },
    }),
  ],
  pages: {
    newUser: "/onboarding",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.username = user.username;
      session.user.displayName = user.displayName;
      session.user.onboardedAt = user.onboardedAt;
      session.user.role = user.role;
      session.user.image = user.image ? `/api/avatar/${user.id}` : null;
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (
        account?.provider === "discord" &&
        isBootstrapAdmin(account.providerAccountId, process.env.ADMIN_DISCORD_ID)
      ) {
        await getDb().user.updateMany({
          where: { id: user.id, role: { not: UserRole.ADMIN } },
          data: { role: UserRole.ADMIN },
        });
      }
    },
  },
});
