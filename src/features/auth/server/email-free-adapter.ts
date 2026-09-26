import type { Adapter, AdapterUser } from "@auth/core/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";

export function emailFreePrismaAdapter(db: PrismaClient): Adapter {
  const adapter = PrismaAdapter(db);

  return {
    ...adapter,
    async createUser(user) {
      const { id, ...data } = withoutAuthEmailFields(user);
      void id;

      return db.user.create({
        data: data as Prisma.UserCreateInput,
      }) as unknown as AdapterUser;
    },
    getUserByEmail: async () => null,
    async updateUser(user) {
      const { id, ...data } = withoutAuthEmailFields(user);

      return db.user.update({
        where: { id },
        data: data as Prisma.UserUpdateInput,
      }) as unknown as AdapterUser;
    },
  };
}

function withoutAuthEmailFields<T extends Partial<AdapterUser>>(user: T) {
  const { email, emailVerified, ...data } = user;
  void email;
  void emailVerified;
  return data;
}
