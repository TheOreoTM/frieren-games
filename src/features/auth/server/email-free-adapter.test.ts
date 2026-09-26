import type { AdapterUser } from "@auth/core/adapters";
import { describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/generated/prisma/client";

import { emailFreePrismaAdapter } from "./email-free-adapter";

describe("emailFreePrismaAdapter", () => {
  it("removes Auth.js email fields when creating a user", async () => {
    const create = vi.fn().mockResolvedValue({ id: "generated-user-id" });
    const db = { user: { create } } as unknown as PrismaClient;
    const adapter = emailFreePrismaAdapter(db);

    await adapter.createUser?.({
      id: "discord-profile-id",
      name: "Frieren",
      email: "not-stored@example.com",
      emailVerified: null,
    } as AdapterUser);

    expect(create).toHaveBeenCalledWith({ data: { name: "Frieren" } });
  });

  it("never looks users up by email", async () => {
    const db = { user: {} } as unknown as PrismaClient;
    const adapter = emailFreePrismaAdapter(db);

    await expect(
      adapter.getUserByEmail?.("not-stored@example.com"),
    ).resolves.toBeNull();
  });
});
