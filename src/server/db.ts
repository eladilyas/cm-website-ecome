// Prisma client singleton.
//
// Next.js hot-reloads modules in dev, which would normally spawn a new
// PrismaClient on every reload — exhausting connections and triggering
// Neon's pool guards. Cache the instance on `globalThis` so HMR reuses
// the same client.
//
// In production the module is loaded once, so the cache is a no-op.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  __prisma__?: PrismaClient;
};

export const db: PrismaClient =
  globalForPrisma.__prisma__ ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma__ = db;
}
