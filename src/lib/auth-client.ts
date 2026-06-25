// Better-Auth React client — the browser-side counterpart to
// `src/server/auth.ts`. Use it from client components for sign-up,
// sign-in, sign-out, session reads, and password reset.
//
// The base URL is computed at module load so it works in dev (relative
// to localhost:3000) and in production (relative to the deployed
// origin). For server-side calls, use `auth.api.*` from `@/server/auth`
// directly.

"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same-origin in browser — no baseURL needed. Better-Auth picks up
  // the current location and posts to `/api/auth/*`.
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
